import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { loadGameState, purchasePlayer, sellOwnedPlayer, updateOwnedPlayer } from '../context/GameContext';
import { createDefaultEconomyState } from '../lib/economy';
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
