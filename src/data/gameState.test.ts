import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { loadGameState } from '../context/GameContext';
import { createDefaultEconomyState } from '../lib/economy';
import { buildRoundMatchRecords, buildSeasonArchiveEntry, getLeagueSeasonSchedule, getSeasonFixtures, LEAGUES, normalizeLeagueMatchRecords } from './leagues';
import { getTeamSquadRecord, normalizePlayerRecord } from './players';

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
