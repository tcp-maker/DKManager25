import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { LEAGUES } from './leagues';
import {
  SKILL_KEYS,
  TEAM_PLAYER_SEEDS,
  TRANSFER_MARKET_PLAYERS,
  calculateASI,
  getTeamSquad,
  normalizePlayer,
  normalizePlayerRecord,
} from './players';

const allTeams = LEAGUES.flatMap(league => league.teams);
const normalizeSeedName = (name: string) =>
  name.normalize('NFC').replace(/\s+/g, ' ').trim().toLocaleLowerCase('da-DK');

describe('team-specific squad generation', () => {
  it('uses each club-specific pool when a seed list exists', () => {
    const seededClubIds = ['fckoebenhavn', 'broendby', 'midtjylland'];

    for (const teamId of seededClubIds) {
      const team = allTeams.find(candidate => candidate.id === teamId);
      assert.ok(team);
      const squad = getTeamSquad(team);
      const allowed = new Set((TEAM_PLAYER_SEEDS[teamId] ?? []).map(seed => seed.name));

      for (const player of squad) {
        if (!player.name.includes('[fallback]')) {
          assert.equal(allowed.has(player.name), true, `${teamId} includes player outside own seed pool: ${player.name}`);
        }
      }
    }
  });

  describe('player name normalization', () => {
    it('keeps multiple talent placeholder names through record normalization', () => {
      const normalized = normalizePlayerRecord({
        talentA: { name: 'Talent 1', position: 'MF' },
        talentB: { name: 'Talent 2', position: 'FW' },
        talentC: { name: 'Talent 10', position: 'DF' },
      });

      assert.equal(normalized.talentA.name, 'Talent 1');
      assert.equal(normalized.talentB.name, 'Talent 2');
      assert.equal(normalized.talentC.name, 'Talent 10');
    });

    it('normalizes whitespace around talent names without filtering them out', () => {
      const normalized = normalizePlayer({ name: '  Talent   2  ', position: 'MF' });
      assert.ok(normalized);
      assert.equal(normalized.name, 'Talent 2');
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

  it('keeps the verified Midtjylland attackers and removes stale Brøndby seeds', () => {
    const broendbySeeds = new Set((TEAM_PLAYER_SEEDS.broendby ?? []).map(seed => normalizeSeedName(seed.name)));
    const midtjyllandSeeds = new Set((TEAM_PLAYER_SEEDS.midtjylland ?? []).map(seed => normalizeSeedName(seed.name)));

    assert.equal(midtjyllandSeeds.has(normalizeSeedName('Mikael Uhre')), true);
    assert.equal(midtjyllandSeeds.has(normalizeSeedName('Mileta Rajović')), true);

    for (const staleName of ['Mads Hermansen', 'Mathias Kvistgaarden', 'Yuito Suzuki', 'Andreas Maxsø']) {
      assert.equal(broendbySeeds.has(normalizeSeedName(staleName)), false, `${staleName} should not stay in Brøndby's 2026 seed list`);
    }

    for (const currentName of ['Gavin Beavers', 'Bartosz Slisz', 'Patrick Mortensen']) {
      assert.equal(broendbySeeds.has(normalizeSeedName(currentName)), true, `${currentName} should be seeded for Brøndby`);
    }
  });

  it('does not duplicate seeded names across clubs after normalization', () => {
    const ownerBySeed = new Map<string, string>();

    for (const [teamId, seeds] of Object.entries(TEAM_PLAYER_SEEDS)) {
      for (const seed of seeds) {
        const normalizedName = normalizeSeedName(seed.name);
        const existingOwner = ownerBySeed.get(normalizedName);

        assert.equal(
          existingOwner,
          undefined,
          `Seeded player ${seed.name} is duplicated across ${existingOwner} and ${teamId}`
        );

        ownerBySeed.set(normalizedName, teamId);
      }
    }
  });
});
