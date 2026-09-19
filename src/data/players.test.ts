import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { LEAGUES } from './leagues';
import {
  SKILL_KEYS,
  TEAM_PLAYER_SEEDS,
  TRANSFER_MARKET_PLAYERS,
  calculateASI,
  getDeterministicPlayerName,
  getTeamSquad,
  normalizePlayer,
  normalizePlayerRecord,
} from './players';

const allTeams = LEAGUES.flatMap(league => league.teams);
const normalizeSeedName = (name: string) =>
  name
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleLowerCase('da-DK');

describe('team-specific squad generation', () => {
  it('uses each club-specific pool when a seed list exists', () => {
    const seededClubIds = ['fckoebenhavn', 'broendby', 'midtjylland'];

    for (const teamId of seededClubIds) {
      const team = allTeams.find(candidate => candidate.id === teamId);
      assert.ok(team);
      const squad = getTeamSquad(team);
      const allowed = new Set((TEAM_PLAYER_SEEDS[teamId] ?? []).map(seed => seed.name));

      for (const player of squad) {
        if (allowed.has(player.name)) {
          continue;
        }

        assert.equal(
          player.name,
          getDeterministicPlayerName(player.id),
          `${teamId} generated fallback name does not match deterministic ID mapping: ${player.name}`,
        );
      }
    }
  });

  describe('player name normalization', () => {
    it('replaces multiple talent placeholder names through record normalization', () => {
      const normalized = normalizePlayerRecord({
        talentA: { name: 'Talent 1', position: 'MF' },
        talentB: { name: 'Talent 2', position: 'FW' },
        talentC: { name: 'Talent 10', position: 'DF' },
      });

      assert.equal(normalized.talentA.name, getDeterministicPlayerName('talentA'));
      assert.equal(normalized.talentB.name, getDeterministicPlayerName('talentB'));
      assert.equal(normalized.talentC.name, getDeterministicPlayerName('talentC'));
    });

    it('normalizes whitespace around real player names without changing them', () => {
      const normalized = normalizePlayer({ id: 'custom-player-1', name: '  Kasper   Dolberg  ', position: 'MF' });
      assert.ok(normalized);
      assert.equal(normalized.name, 'Kasper Dolberg');
    });

    it('uses a deterministic fallback name when a save entry is missing a usable name', () => {
      const normalized = normalizePlayer({ id: 'custom-player-2', name: '   ', position: 'FW' });
      assert.ok(normalized);
      assert.equal(normalized.name, getDeterministicPlayerName('custom-player-2'));
    });
  });

  it('returns deterministic squads for repeated calls', () => {
    const team = allTeams.find(candidate => candidate.id === 'fckoebenhavn');
    assert.ok(team);

    const first = getTeamSquad(team);
    const second = getTeamSquad(team);
    assert.deepEqual(first, second);
  });

  it('does not create duplicate names within a squad', () => {
    for (const team of allTeams) {
      const squad = getTeamSquad(team);
      const names = squad.map(player => player.name);
      const uniqueNames = new Set(names.map(name => name.toLocaleLowerCase('da-DK')));
      assert.equal(uniqueNames.size, names.length, `Duplicate names found in ${team.id}`);
    }
  });

  it('does not reuse normalized seeded player names across clubs', () => {
    const seenByClub = new Map<string, string>();

    for (const [teamId, seeds] of Object.entries(TEAM_PLAYER_SEEDS)) {
      for (const seed of seeds) {
        const normalizedName = normalizeSeedName(seed.name);
        const existingTeamId = seenByClub.get(normalizedName);
        assert.equal(
          existingTeamId,
          undefined,
          `Seeded player ${seed.name} is duplicated across ${existingTeamId} and ${teamId}`,
        );
        seenByClub.set(normalizedName, teamId);
      }
    }
  });

  it('keeps only the currently verified Brøndby seeds and preserves the corrected Midtjylland strikers', () => {
    const broendbySeeds = TEAM_PLAYER_SEEDS.broendby.map(seed => seed.name);
    const midtjyllandSeeds = TEAM_PLAYER_SEEDS.midtjylland.map(seed => seed.name);

    assert.deepEqual(broendbySeeds, ['Patrick Pentz', 'Frederik Alves', 'Daniel Wass', 'Marko Divković']);

    for (const removedName of [
      'Mads Hermansen',
      'Sebastian Sebulonsen',
      'Kevin Mensah',
      'Sigurd Rosted',
      'Jacob Rasmussen',
      'Anis Ben Slimane',
      'Håkon Evjen',
      'Mathias Greve',
      'Nicolai Vallys',
      'Yuito Suzuki',
      'Oskar Fallenius',
      'Mathias Kvistgaarden',
      'Andreas Maxsø',
    ]) {
      assert.equal(broendbySeeds.includes(removedName), false, `${removedName} should no longer be seeded for Brøndby`);
    }

    assert.equal(midtjyllandSeeds.includes('Mikael Uhre'), true);
    assert.equal(midtjyllandSeeds.includes('Mileta Rajović'), true);
  });

  it('supports legacy team-id aliases through canonical lookup', () => {
    const canonicalTeam = allTeams.find(candidate => candidate.id === 'nykoebing');
    assert.ok(canonicalTeam);
    const aliasTeam = { ...canonicalTeam, id: 'lolland' };

    assert.deepEqual(getTeamSquad(aliasTeam), getTeamSquad(canonicalTeam));
  });

  it('keeps player fields and value/salary-driving calculations intact', () => {
    const team = allTeams.find(candidate => candidate.id === 'fckoebenhavn');
    assert.ok(team);

    const player = getTeamSquad(team)[0];
    assert.ok(player.id.length > 0);
    assert.ok(player.name.length > 0);
    assert.ok(player.age > 0);
    assert.ok(player.value > 0);
    assert.ok(player.salary > 0);
    assert.equal(calculateASI(player.skills), player.asi);

    for (const skill of SKILL_KEYS) {
      assert.equal(typeof player.skills[skill], 'number');
    }
  });

  it('keeps transfer market players separate from club squad generation', () => {
    const team = allTeams.find(candidate => candidate.id === 'fckoebenhavn');
    assert.ok(team);

    const squadNames = new Set(getTeamSquad(team).map(player => player.name));
    for (const transferPlayer of TRANSFER_MARKET_PLAYERS) {
      assert.equal(squadNames.has(transferPlayer.name), false);
    }
  });

  it('gives transfer market players deterministic human-readable names by player id', () => {
    for (const transferPlayer of TRANSFER_MARKET_PLAYERS) {
      assert.equal(transferPlayer.name, getDeterministicPlayerName(transferPlayer.id));
      assert.equal(/(^transferm[aå]l\b|^buy\b|\[fallback\])/i.test(transferPlayer.name), false);
    }
  });
});
