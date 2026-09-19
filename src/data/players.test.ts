import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { LEAGUES } from './leagues';
import {
  SKILL_KEYS,
  TEAM_PLAYER_SEEDS,
  TRANSFER_MARKET_PLAYERS,
  calculateASI,
  getTeamSquad,
} from './players';

const allTeams = LEAGUES.flatMap(league => league.teams);

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
});
