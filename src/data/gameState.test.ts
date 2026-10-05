import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { GameProvider, loadGameState, purchasePlayer, sellOwnedPlayer, updateOwnedPlayer, useGame } from '../context/GameContext';
import { createDefaultEconomyState, createEconomyTransaction } from '../lib/economy';
import { buildRoundMatchRecords, buildSeasonArchiveEntry, getLeagueSeasonSchedule, getSeasonFixtures, LEAGUES, normalizeLeagueMatchRecords } from './leagues';
import { getCurrentTeamSquad, getTeamSquadRecord, normalizePlayerRecord, TRANSFER_MARKET_PLAYERS } from './players';

const club = LEAGUES[0].teams[0];
const otherClub = LEAGUES[0].teams[1];
const storageDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
let saved: string | null;

beforeEach(() => {
  saved = null;
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: { getItem: () => saved },
  });
});

afterEach(() => {
  if (storageDescriptor) {
    Object.defineProperty(globalThis, 'localStorage', storageDescriptor);
  } else {
    Reflect.deleteProperty(globalThis, 'localStorage');
  }
});

describe('club and squad save migration', () => {
  it('returns actual loan and week results through stale provider callbacks', () => {
    let actions!: ReturnType<typeof useGame>;
    const Capture = () => {
      actions = useGame();
      return null;
    };
    renderToString(createElement(GameProvider, { children: createElement(Capture) }));
    assert.notEqual(actions.takeLoan(), null);
    assert.equal(actions.handleNextWeek(), null);
    actions.selectClub(club);
    assert.equal(actions.takeLoan(), null);
    assert.match(actions.takeLoan()!, /ét nyt lån/);
    assert.equal(actions.handleNextWeek(), null);
    const fixture = getSeasonFixtures(club)[0];
    actions.recordMatchResult(fixture, 2, 0);
    assert.equal(actions.handleNextWeek(), 1250 * 150);
    assert.equal(actions.handleNextWeek(), null);
    assert.equal(actions.takeLoan(), null);
    assert.match(actions.takeLoan()!, /ét nyt lån/);
  });

  it('rejects non-finite game, economy, transaction and summary fields', () => {
    for (const value of [NaN, Infinity, -Infinity]) {
      const state = loadGameState({
        selectedClub: club, budget: value, season: value, week: value,
        fanCount: value, fanMood: value, stadiumCapacity: value,
        economy: {
          debt: value, stadiumBookValue: value, consecutiveCrisisWeeks: value,
          transactionSequence: value,
          transactions: [
            { ...createEconomyTransaction(1, 1, 1, 'income', 'loan', 10, 'Loan'), amount: value },
            createEconomyTransaction(2, value, 1, 'income', 'loan', 10, 'Loan'),
            createEconomyTransaction(3, 1, value, 'income', 'loan', 10, 'Loan'),
          ],
          lastWeekSummary: { season: 1, week: 1, income: value, expenses: 0, net: value },
        },
      })!;
      assert.equal(state.budget, 1000000);
      assert.equal(state.season, 1);
      assert.equal(state.week, 1);
      assert.equal(state.fanCount, 1200);
      assert.equal(state.fanMood, 50);
      assert.equal(state.stadiumCapacity, 3000);
      assert.equal(state.economy.debt, 0);
      assert.equal(state.economy.consecutiveCrisisWeeks, 0);
      assert.equal(state.economy.transactionSequence, 0);
      assert.equal(state.economy.lastWeekSummary, null);
      assert.deepEqual(state.economy.transactions, []);
      assert.ok(Number.isFinite(state.economy.stadiumBookValue));
      assert.ok(Number.isFinite(state.economy.weeklyInterestRate));
    }
  });

  it('normalizes finite but invalid save ranges before gameplay calculations', () => {
    const state = loadGameState({
      selectedClub: club,
      budget: Number.MAX_VALUE,
      fanCount: -10,
      fanMood: 150,
      stadiumCapacity: 0,
      season: 0,
      week: -2,
    })!;
    assert.equal(state.budget, 1000000);
    assert.equal(state.fanCount, 1200);
    assert.equal(state.fanMood, 100);
    assert.equal(state.stadiumCapacity, 3000);
    assert.equal(state.season, 1);
    assert.equal(state.week, 1);
  });

  it('keeps transaction IDs unique beyond the ledger limit and across reloads', () => {
    let state = loadGameState({ selectedClub: club, budget: 100000000 })!;
    const ids = new Set<string>();
    for (let index = 0; index < 200; index += 1) {
      state = purchasePlayer(state, 'buy1');
      ids.add(state.economy.transactions[state.economy.transactions.length - 1]!.id);
      state = sellOwnedPlayer(state, 'buy1');
      ids.add(state.economy.transactions[state.economy.transactions.length - 1]!.id);
    }
    assert.equal(ids.size, 400);
    assert.equal(state.economy.transactions.length, 180);
    assert.equal(state.economy.transactionSequence, 400);
    saved = JSON.stringify(state);
    state = purchasePlayer(loadGameState()!, 'buy1');
    assert.equal(state.economy.transactionSequence, 401);
    assert.equal(ids.has(state.economy.transactions[state.economy.transactions.length - 1]!.id), false);
  });

  it('migrates missing or stale counters and repairs legacy duplicate ledger IDs', () => {
    const transaction = createEconomyTransaction(900, 1, 1, 'income', 'loan', 10, 'Loan');
    for (const transactionSequence of [undefined, 1, NaN, Infinity]) {
      const state = loadGameState({
        selectedClub: club, budget: 100000000,
        economy: { transactionSequence, transactions: [transaction, transaction] },
      })!;
      assert.equal(state.economy.transactionSequence, 900);
      assert.equal(new Set(state.economy.transactions.map(entry => entry.id)).size, 2);
      const next = purchasePlayer(state, 'buy1');
      assert.equal(next.economy.transactionSequence, 901);
      saved = JSON.stringify(next);
      assert.deepEqual(loadGameState(), next);
    }
  });

  it('makes rapid calls through the same stale provider callbacks authoritative', () => {
    const [first, second] = TRANSFER_MARKET_PLAYERS;
    saved = JSON.stringify({ selectedClub: club, budget: first.value + second.value - 1 });
    let actions!: ReturnType<typeof useGame>;
    const Capture = () => {
      actions = useGame();
      return null;
    };
    renderToString(createElement(GameProvider, { children: createElement(Capture) }));
    assert.equal(actions.addPlayer({ ...first, value: 0 }), true);
    assert.equal(actions.addPlayer(first), false);
    assert.equal(actions.addPlayer({ ...first, id: 'own_buy1_1_1_2' }), false);
    assert.equal(actions.addPlayer(second), false);
    actions.sellPlayer(first.id);
    actions.sellPlayer(first.id);
    assert.equal(actions.addPlayer(second), true);
    assert.equal(actions.addPlayer(first), false);
  });

  it('migrates owned market clones, preserves finances, and gives ownership priority over market copies', () => {
    const source = TRANSFER_MARKET_PLAYERS[0];
    saved = JSON.stringify({
      selectedClub: club, budget: 456789, season: 3, week: 8,
      squad: { clubId: club.id, players: {
        own_buy1_1_1_1: { ...source, id: 'own_buy1_1_1_1', age: 34, asi: 888 },
        duplicateKey: { ...source, id: 'own_buy1_1_1_1', age: 20 },
      } },
      transferMarket: { buy1: source, alias: { ...TRANSFER_MARKET_PLAYERS[1], id: 'buy2' } },
    });
    const state = loadGameState()!;
    assert.deepEqual(Object.keys(state.squad.players), ['buy1']);
    assert.equal(state.squad.players.buy1.age, 34);
    assert.equal(state.squad.players.buy1.asi, 888);
    assert.equal(state.budget, 456789);
    assert.equal(state.season, 3);
    assert.equal(state.week, 8);
    assert.deepEqual(Object.keys(state.transferMarket), ['buy2']);
    saved = JSON.stringify(state);
    assert.deepEqual(loadGameState(), state);
  });

  it('removes migrated owned identities from a legacy static market', () => {
    saved = JSON.stringify({
      selectedTeam: club,
      players: { own_buy1_1_1_1: { ...TRANSFER_MARKET_PLAYERS[0], id: 'own_buy1_1_1_1' } },
    });
    const state = loadGameState()!;
    assert.equal(state.transferMarket.buy1, undefined);
    assert.equal(Object.keys(state.transferMarket).length, 4);
    assert.equal(purchasePlayer(state, 'buy1'), state);
  });

  it('transfers one stable identity, charges once, and rejects repeated/stale or unavailable purchases', () => {
    saved = JSON.stringify({ selectedClub: club, budget: 100000000 });
    const initial = loadGameState()!;
    const player = initial.transferMarket.buy1;
    const purchased = purchasePlayer(initial, player.id);
    assert.equal(purchased.budget, initial.budget - player.value);
    assert.equal(purchased.squad.players.buy1.id, 'buy1');
    assert.equal(purchased.transferMarket.buy1, undefined);
    assert.equal(purchased.economy.transactions.length, 1);
    assert.equal(purchasePlayer(purchased, 'buy1'), purchased);
    assert.equal(purchasePlayer(purchased, 'own_buy1_1_1_2'), purchased);
    assert.equal(purchasePlayer(purchased, 'unknown'), purchased);
    saved = JSON.stringify(purchased);
    const reloaded = loadGameState()!;
    assert.deepEqual(reloaded, purchased);
    assert.equal(purchasePlayer(reloaded, 'buy1'), reloaded);
    const sold = sellOwnedPlayer(reloaded, 'buy1');
    assert.equal(sold.budget, initial.budget);
    assert.equal(sold.squad.players.buy1, undefined);
    assert.equal(sold.transferMarket.buy1.id, 'buy1');
    assert.equal(sellOwnedPlayer(sold, 'buy1'), sold);
    saved = JSON.stringify(sold);
    assert.deepEqual(loadGameState(), sold);
    const boughtAgain = purchasePlayer(loadGameState()!, 'buy1');
    assert.equal(boughtAgain.squad.players.buy1.id, 'buy1');
    assert.equal(boughtAgain.economy.transactions.length, 3);
  });

  it('rejects insufficient funds, bankruptcy, and invalid prices without charging', () => {
    saved = JSON.stringify({ selectedClub: club, budget: 0 });
    const state = loadGameState()!;
    assert.equal(purchasePlayer(state, 'buy1'), state);
    const bankrupt = { ...state, budget: 100000000, economy: { ...state.economy, isBankrupt: true } };
    assert.equal(purchasePlayer(bankrupt, 'buy1'), bankrupt);
    for (const price of [-1, NaN, Infinity]) {
      const invalid = {
        ...state, budget: 100000000,
        transferMarket: { ...state.transferMarket, buy1: { ...state.transferMarket.buy1, askingPrice: price } },
      };
      assert.equal(purchasePlayer(invalid, 'buy1'), invalid);
    }
  });

  it('uses the market asking price consistently for purchase validation and accounting', () => {
    const initial = loadGameState({ selectedClub: club, budget: 100000000 })!;
    const player = initial.transferMarket.buy1;
    const askingPrice = player.value + 50000;
    const priced = {
      ...initial,
      budget: askingPrice,
      transferMarket: {
        ...initial.transferMarket,
        buy1: { ...player, askingPrice },
      },
    };
    const purchased = purchasePlayer(priced, player.id);
    assert.equal(purchased.budget, 0);
    assert.equal(purchased.economy.transactions[0].amount, askingPrice);
  });

  it('preserves progression and immutable IDs through sale, repurchase and global ownership views', () => {
    saved = JSON.stringify({ selectedClub: club, budget: 100000000 });
    const initial = loadGameState()!;
    const player = Object.values(initial.squad.players)[0];
    const progressed = updateOwnedPlayer(initial, player.id, { id: 'changed-id', asi: 999, age: 34 });
    assert.equal(progressed.squad.players[player.id].id, player.id);
    assert.equal(progressed.squad.players['changed-id'], undefined);
    const sold = sellOwnedPlayer(progressed, player.id);
    assert.equal(getCurrentTeamSquad(club, sold.squad, sold.transferMarket).some(p => p.id === player.id), false);
    const purchased = purchasePlayer(sold, player.id);
    assert.equal(purchased.squad.players[player.id].asi, 999);
    assert.equal(purchased.squad.players[player.id].age, 34);
    const otherPlayer = Object.values(getTeamSquadRecord(otherClub))[0];
    const relocated = purchasePlayer({
      ...purchased, transferMarket: { ...purchased.transferMarket, [otherPlayer.id]: otherPlayer },
    }, otherPlayer.id);
    assert.equal(getCurrentTeamSquad(otherClub, relocated.squad, relocated.transferMarket)
      .some(p => p.id === otherPlayer.id), false);
    const world = LEAGUES.flatMap(league => league.teams.flatMap(team =>
      getCurrentTeamSquad(team, relocated.squad, relocated.transferMarket)));
    const ids = [...world, ...Object.values(relocated.transferMarket)].map(p => p.id);
    assert.equal(ids.length, 869);
    assert.equal(new Set(ids).size, ids.length);
    for (const record of [relocated.squad.players, relocated.transferMarket]) {
      for (const [key, currentPlayer] of Object.entries(record)) {
        assert.equal(key, currentPlayer.id);
      }
    }
  });

  it('migrates a legacy save without losing transfers, finances or season progress', () => {
    const player = { ...Object.values(getTeamSquadRecord(club))[0], isForSale: true, askingPrice: 123456 };
    const players = normalizePlayerRecord({ [player.id]: player });
    const economy = { ...createDefaultEconomyState(club, 5500), debt: 400000, lastLoanWeekKey: '2-7' };
    saved = JSON.stringify({
      selectedTeam: club, players, budget: 765432, fanCount: 1500,
      fanMood: 65, stadiumCapacity: 5500, season: 2, week: 7, economy,
    });

    const state = loadGameState();
    assert.ok(state);
    assert.deepEqual(state.selectedClub, club);
    assert.deepEqual(state.squad, { clubId: club.id, players });
    assert.equal(state.budget, 765432);
    assert.equal(state.fanCount, 1500);
    assert.equal(state.fanMood, 65);
    assert.equal(state.stadiumCapacity, 5500);
    assert.equal(state.season, 2);
    assert.equal(state.week, 7);
    assert.equal(state.economy.debt, 400000);
    assert.equal(state.economy.lastLoanWeekKey, '2-7');
    assert.equal('selectedTeam' in state, false);
    assert.equal('players' in state, false);

    saved = JSON.stringify(state);
    assert.deepEqual(loadGameState(), state);
  });

  it('prefers the new club and squad fields over obsolete legacy fields', () => {
    const players = normalizePlayerRecord(getTeamSquadRecord(club));
    saved = JSON.stringify({
      selectedClub: club, squad: { clubId: club.id, players },
      selectedTeam: otherClub, players: getTeamSquadRecord(otherClub),
    });
    assert.deepEqual(loadGameState()?.squad, { clubId: club.id, players });
    assert.deepEqual(loadGameState()?.selectedClub, club);
  });

  it('backfills missing player data using the selected club', () => {
    saved = JSON.stringify({ selectedTeam: club });
    assert.deepEqual(loadGameState()?.squad, { clubId: club.id, players: getTeamSquadRecord(club) });
  });

  it('preserves recorded matches, season archives and economy transactions', () => {
    const fixture = getSeasonFixtures(club)[0];
    const leagueMatches = buildRoundMatchRecords(
      getLeagueSeasonSchedule(club), 1, club.id, fixture.id, { homeGoals: 2, awayGoals: 1 }, [],
    );
    const entry = buildSeasonArchiveEntry(club, 1, leagueMatches);
    assert.ok(entry);
    const transaction = {
      id: 'saved-sale', season: 1, week: 1, type: 'income', category: 'player_sale',
      amount: 250000, description: 'Salg af spiller',
    };
    saved = JSON.stringify({
      selectedTeam: club, players: getTeamSquadRecord(club), season: 2, week: 1,
      leagueMatches, seasonHistory: [entry],
      economy: { ...createDefaultEconomyState(club, 3000), transactions: [transaction] },
    });
    const state = loadGameState();
    assert.ok(state);
    assert.deepEqual(state.leagueMatches, normalizeLeagueMatchRecords(leagueMatches));
    assert.deepEqual(state.seasonHistory, [entry]);
    assert.deepEqual(state.economy.transactions, [transaction]);
  });

  it('backfills invalid player data using the selected club', () => {
    saved = JSON.stringify({ selectedClub: club, squad: { clubId: club.id, players: { invalid: {} } } });
    assert.deepEqual(loadGameState()?.squad, { clubId: club.id, players: getTeamSquadRecord(club) });
  });

  it('preserves intentionally empty legacy and new squads', () => {
    for (const fields of [
      { selectedTeam: club, players: {} },
      { selectedClub: club, squad: { clubId: club.id, players: {} } },
    ]) {
      saved = JSON.stringify(fields);
      assert.deepEqual(loadGameState()?.squad, { clubId: club.id, players: {} });
    }
  });

  it('never attaches another club’s saved squad to the selected club', () => {
    saved = JSON.stringify({
      selectedClub: club,
      squad: { clubId: otherClub.id, players: getTeamSquadRecord(otherClub) },
    });
    assert.deepEqual(loadGameState()?.squad, { clubId: club.id, players: getTeamSquadRecord(club) });
  });

  it('does not restore an obsolete club when the new selected club is explicitly null', () => {
    saved = JSON.stringify({ selectedClub: null, selectedTeam: club, players: getTeamSquadRecord(club) });
    assert.equal(loadGameState()?.selectedClub, null);
    assert.deepEqual(loadGameState()?.squad, { clubId: '', players: {} });
  });

  it('returns null when there is no saved game', () => {
    assert.equal(loadGameState(), null);
  });
});
