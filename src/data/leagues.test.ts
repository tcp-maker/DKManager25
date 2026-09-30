import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  LEAGUES,
  archiveSeason,
  buildSeasonArchiveEntry,
  getAvailableSeasons,
  getLeagueSeasonSchedule,
  getSeasonFixtures,
  normalizeLeagueMatches,
  normalizeSeasonHistory,
  type LeagueMatchRecord,
} from './leagues';

const selectedTeam = LEAGUES[0].teams[0];

const playSeason = (season: number): LeagueMatchRecord[] =>
  getLeagueSeasonSchedule(selectedTeam).map(fixture => {
    const isUserHome = fixture.homeTeamId === selectedTeam.id;
    const isUserAway = fixture.awayTeamId === selectedTeam.id;
    return {
      fixtureId: fixture.id,
      season,
      week: fixture.week,
      homeTeamId: fixture.homeTeamId,
      homeTeamName: fixture.homeTeamName,
      awayTeamId: fixture.awayTeamId,
      awayTeamName: fixture.awayTeamName,
      homeGoals: isUserHome ? 2 : 1,
      awayGoals: isUserAway ? 2 : 0,
      isUserMatch: isUserHome || isUserAway,
    };
  });

describe('season schedule', () => {
  it('gives every club 22 league matches (home and away against 11 opponents)', () => {
    const fixtures = getSeasonFixtures(selectedTeam);
    assert.equal(fixtures.length, 22);

    const opponents = new Map<string, { home: number; away: number }>();
    fixtures.forEach(fixture => {
      const counts = opponents.get(fixture.opponentId) ?? { home: 0, away: 0 };
      if (fixture.isHome) counts.home += 1;
      else counts.away += 1;
      opponents.set(fixture.opponentId, counts);
    });

    assert.equal(opponents.size, 11);
    opponents.forEach(counts => assert.deepEqual(counts, { home: 1, away: 1 }));
  });
});

describe('season history', () => {
  it('builds an archive entry with final standings and placement', () => {
    const matches = playSeason(1);
    const entry = buildSeasonArchiveEntry(selectedTeam, 1, matches);

    assert.ok(entry);
    assert.equal(entry.season, 1);
    assert.equal(entry.teamId, selectedTeam.id);
    assert.equal(entry.leagueName, LEAGUES[0].name);
    assert.equal(entry.standings.length, 12);
    assert.equal(entry.finalPosition, 1);
    assert.equal(entry.matchesPlayed, 22);
    assert.equal(entry.standings[0].points, 66);
  });

  it('archives each season only once and keeps entries sorted', () => {
    const matches = [...playSeason(1), ...playSeason(2)];
    const afterSecond = archiveSeason([], selectedTeam, 2, matches);
    const afterFirst = archiveSeason(afterSecond, selectedTeam, 1, matches);
    const duplicate = archiveSeason(afterFirst, selectedTeam, 1, matches);

    assert.deepEqual(afterFirst.map(entry => entry.season), [1, 2]);
    assert.equal(duplicate, afterFirst);
  });

  it('backfills archives for completed seasons in older saves without seasonHistory', () => {
    const matches = [...playSeason(1), ...playSeason(2), ...playSeason(3).slice(0, 6)];
    const history = normalizeSeasonHistory(undefined, selectedTeam, 3, matches);

    assert.deepEqual(history.map(entry => entry.season), [1, 2]);
    assert.ok(history.every(entry => entry.matchesPlayed === 22));
  });

  it('keeps valid persisted archives and drops invalid ones', () => {
    const stored = buildSeasonArchiveEntry(selectedTeam, 1, playSeason(1));
    const history = normalizeSeasonHistory(
      [stored, { season: 'x' }, null, { season: 2, teamId: selectedTeam.id, standings: [] }],
      selectedTeam,
      3,
      [],
    );

    assert.equal(history.length, 1);
    assert.deepEqual(history[0], stored);
  });

  it('lists the current season first followed by archived seasons', () => {
    const matches = [...playSeason(1), ...playSeason(2)];
    const history = normalizeSeasonHistory(undefined, selectedTeam, 3, matches);

    assert.deepEqual(getAvailableSeasons(3, history), [3, 2, 1]);
    assert.deepEqual(getAvailableSeasons(1, []), [1]);
  });

  it('filters out malformed match records', () => {
    const [valid] = playSeason(1);
    assert.deepEqual(normalizeLeagueMatches([valid, { fixtureId: 'broken' }, 42]), [valid]);
    assert.deepEqual(normalizeLeagueMatches(undefined), []);
  });
});
