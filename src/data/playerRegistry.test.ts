import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { loadGameState } from '../context/GameContext';
import { LEAGUES } from './leagues';
import {
  FULL_BACKS_PER_SQUAD,
  PLAYER_POOL_TARGET,
  PLAYER_REGISTRY,
  SQUAD_COMPOSITION,
  SQUAD_SIZE,
  TEAM_PLAYER_SEEDS,
  TRANSFER_MARKET_PLAYERS,
  WINGERS_PER_SQUAD,
  getTeamSquad,
  getTeamSquadRecord,
  normalizePlayerRecord,
} from './players';
import { INTERNET_ROSTERS_2025_26 } from './rosters2526';

const allTeams = LEAGUES.flatMap(league => league.teams);
const entries = PLAYER_REGISTRY.playerOrder.map(id => PLAYER_REGISTRY.playersById[id]);
const normalizeName = (name: string) =>
  name.normalize('NFKD').replace(/\p{Diacritic}/gu, '').replace(/\s+/g, ' ').trim().toLocaleLowerCase('da-DK');

describe('canonical player registry', () => {
  it('represents all 48 clubs with a squad reference list', () => {
    assert.equal(allTeams.length, 48);
    assert.deepEqual(Object.keys(PLAYER_REGISTRY.clubSquadsByClubId).sort(), allTeams.map(team => team.id).sort());
    for (const team of allTeams) {
      assert.deepEqual(getTeamSquad(team).map(player => player.id), PLAYER_REGISTRY.clubSquadsByClubId[team.id]);
    }
  });

  it('gives every club exactly 17 players in a 2 GK / 6 DF / 6 MF / 3 FW shape with 2–3 backs and wingers', () => {
    for (const team of allTeams) {
      const squad = getTeamSquad(team);
      assert.equal(squad.length, SQUAD_SIZE, team.id);
      for (const [position, count] of Object.entries(SQUAD_COMPOSITION)) {
        assert.equal(squad.filter(player => player.position === position).length, count, `${team.id} ${position}`);
      }
      const fullBacks = squad.filter(player => player.position === 'DF' && player.primaryRole === 'full-back').length;
      const wingers = squad.filter(player => player.position === 'MF' && player.primaryRole === 'winger').length;
      assert.ok(fullBacks >= FULL_BACKS_PER_SQUAD[0] && fullBacks <= FULL_BACKS_PER_SQUAD[1], `${team.id} full-backs: ${fullBacks}`);
      assert.ok(wingers >= WINGERS_PER_SQUAD[0] && wingers <= WINGERS_PER_SQUAD[1], `${team.id} wingers: ${wingers}`);
      assert.ok(squad.filter(player => player.position === 'GK').every(player => player.primaryRole === 'goalkeeper'));
    }
  });

  it('keeps every player ID unique and assigns each player to exactly one squad or the transfer pool', () => {
    assert.equal(new Set(PLAYER_REGISTRY.playerOrder).size, PLAYER_REGISTRY.playerOrder.length);
    assert.deepEqual(Object.keys(PLAYER_REGISTRY.playersById).sort(), [...PLAYER_REGISTRY.playerOrder].sort());
    assert.ok(PLAYER_REGISTRY.playerOrder.length >= PLAYER_POOL_TARGET);
    const placements = [
      ...Object.values(PLAYER_REGISTRY.clubSquadsByClubId).flat(),
      ...PLAYER_REGISTRY.transferPlayerIds,
    ];
    assert.equal(placements.length, PLAYER_REGISTRY.playerOrder.length);
    assert.equal(new Set(placements).size, placements.length);

    for (const [id, entry] of Object.entries(PLAYER_REGISTRY.playersById)) {
      assert.equal(entry.player.id, id);
      assert.equal(entry.status === 'squad', entry.clubId !== null);
      if (entry.clubId) {
        assert.ok(PLAYER_REGISTRY.clubSquadsByClubId[entry.clubId].includes(id));
      }
    }
  });

  it('does not duplicate real player identities across clubs, squads and the transfer pool', () => {
    const realNames = entries.filter(entry => entry.source !== 'synthetic' && !/^buy\d+$/.test(entry.player.id))
      .map(entry => normalizeName(entry.player.name));
    assert.equal(new Set(realNames).size, realNames.length);
  });

  it('puts surplus internet-sourced players in the transfer pool and not in any squad', () => {
    const squadIds = new Set(Object.values(PLAYER_REGISTRY.clubSquadsByClubId).flat());
    const transferIds = new Set(PLAYER_REGISTRY.transferPlayerIds);
    const marketIds = new Set(TRANSFER_MARKET_PLAYERS.map(player => player.id));
    for (const entry of entries) {
      if (entry.status === 'transfer') {
        assert.equal(squadIds.has(entry.player.id), false);
        assert.equal(transferIds.has(entry.player.id), true);
        assert.equal(marketIds.has(entry.player.id), true);
      }
    }

    for (const team of allTeams) {
      const imported = entries.filter(entry => entry.source === 'internet-2025-26' && entry.originClubId === team.id);
      const seeded = entries.filter(entry => entry.source === 'repo-seed' && entry.originClubId === team.id);
      const surplus = [...imported, ...seeded].filter(entry => entry.clubId !== team.id);
      assert.equal(imported.length + seeded.length - surplus.length,
        getTeamSquad(team).filter(player => PLAYER_REGISTRY.playersById[player.id].source !== 'synthetic').length);
      assert.ok(surplus.every(entry => entry.status === 'transfer'));
    }
  });

  it('only uses synthetic fallback players where internet data is incomplete', () => {
    for (const team of allTeams) {
      const roster = INTERNET_ROSTERS_2025_26[team.id];
      const imported = entries.filter(entry => entry.source === 'internet-2025-26' && entry.originClubId === team.id);
      assert.equal(PLAYER_REGISTRY.rosterCoverageByClubId[team.id], roster?.status ?? 'not-found');
      if (!roster || roster.status === 'not-found') {
        assert.equal(imported.length, 0, `${team.id} has no internet coverage`);
      } else {
        assert.ok(roster.sources.length > 0, `${team.id} needs citation sources`);
      }
    }

    for (const entry of entries.filter(candidate => candidate.source === 'synthetic')) {
      assert.match(entry.player.id, /^player-did-\d{4}$/);
    }

    const syntheticTransfers = entries.filter(entry => entry.source === 'synthetic' && entry.status === 'transfer');
    const nonSyntheticCount = entries.length - entries.filter(entry => entry.source === 'synthetic').length;
    const squadDummies = entries.filter(entry => entry.source === 'synthetic' && entry.status === 'squad').length;
    assert.equal(syntheticTransfers.length, Math.max(0, PLAYER_POOL_TARGET - nonSyntheticCount - squadDummies));
  });

  it('preserves existing repository players with their legacy IDs', () => {
    for (const [teamId, seeds] of Object.entries(TEAM_PLAYER_SEEDS)) {
      const seeded = entries.filter(entry => entry.source === 'repo-seed' && entry.originClubId === teamId);
      assert.deepEqual(seeded.map(entry => entry.player.name).sort(), seeds.map(seed => seed.name).sort());
      for (const entry of seeded) {
        assert.match(entry.player.id, new RegExp(`^${teamId}-player-([1-9]|1[0-8])$`));
      }
    }
    for (const id of ['buy1', 'buy2', 'buy3', 'buy4', 'buy5']) {
      assert.equal(PLAYER_REGISTRY.playersById[id].source, 'repo-seed');
      assert.equal(PLAYER_REGISTRY.playersById[id].status, 'transfer');
    }
    assert.deepEqual(TRANSFER_MARKET_PLAYERS.slice(0, 5).map(player => player.id), ['buy1', 'buy2', 'buy3', 'buy4', 'buy5']);
  });

  it('quantifies every player with finite ratings, value and salary', () => {
    for (const { player } of entries) {
      assert.ok(Number.isSafeInteger(player.asi) && player.asi > 0, player.id);
      assert.ok(Number.isSafeInteger(player.value) && player.value > 0, player.id);
      assert.ok(Number.isSafeInteger(player.salary) && player.salary > 0, player.id);
      assert.ok(Object.values(player.skills).every(value => Number.isFinite(value)), player.id);
      assert.deepEqual(normalizePlayerRecord({ [player.id]: player })[player.id].id, player.id);
    }
  });
});

describe('save-state compatibility with the registry', () => {
  const club = allTeams[0];

  it('loads legacy 18-player squads and saved markets unchanged', () => {
    const legacySquad = Object.fromEntries(Array.from({ length: 18 }, (_, index) => {
      const id = `${club.id}-player-${index + 1}`;
      return [id, { id, name: `Legacy ${index + 1}`, position: 'MF', rating: 70 }];
    }));
    const savedMarket = { buy2: TRANSFER_MARKET_PLAYERS[1] };
    const state = loadGameState({
      selectedClub: club,
      squad: { clubId: club.id, players: legacySquad },
      transferMarket: savedMarket,
    })!;
    assert.equal(Object.keys(state.squad.players).length, 18);
    assert.deepEqual(Object.keys(state.transferMarket), ['buy2']);
    const reloaded = loadGameState(JSON.parse(JSON.stringify(state)))!;
    assert.deepEqual(Object.keys(reloaded.squad.players), Object.keys(state.squad.players));
    assert.deepEqual(Object.values(reloaded.squad.players).map(player => player.name).sort(), Object.values(legacySquad).map(player => player.name).sort());
    assert.deepEqual(reloaded.transferMarket, state.transferMarket);
  });

  it('backfills new games and market-less saves from the canonical registry without duplicates', () => {
    const state = loadGameState({ selectedClub: club })!;
    assert.deepEqual(state.squad.players, getTeamSquadRecord(club));
    assert.equal(Object.keys(state.squad.players).length, SQUAD_SIZE);
    assert.deepEqual(Object.keys(state.transferMarket).sort(), [...PLAYER_REGISTRY.transferPlayerIds].sort());
    for (const id of Object.keys(state.squad.players)) {
      assert.equal(Object.prototype.hasOwnProperty.call(state.transferMarket, id), false);
    }
    assert.deepEqual(loadGameState(JSON.parse(JSON.stringify(state))), state);
  });
});
