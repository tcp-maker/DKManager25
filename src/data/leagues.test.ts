import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  LEAGUES,
  MATCH_TIMELINE,
  archiveSeason,
  buildSeasonArchiveEntry,
  getAvailableSeasons,
  getLeagueSeasonSchedule,
  getSeasonFixtures,
  normalizeLeagueMatchRecords,
  normalizeSeasonHistory,
  simulateDetailedMatch,
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
    const normalized = normalizeLeagueMatchRecords([valid, { fixtureId: 'broken' }, 42]);
    assert.equal(normalized.length, 1);
    assert.equal(normalized[0].fixtureId, valid.fixtureId);
    assert.deepEqual(normalizeLeagueMatchRecords(undefined), []);
  });
});

const createSequenceRng = (values: number[]) => {
  let index = 0;
  return () => {
    const value = values[index % values.length];
    index += 1;
    return value;
  };
};

describe('match simulation details', () => {
  it('builds a 2x15 minute match with halftime, live stats and report highlights', () => {
    const rng = createSequenceRng([
      0.12, 0.45, 0.78, 0.22, 0.61, 0.34, 0.89, 0.17, 0.53, 0.68,
      0.27, 0.74, 0.39, 0.95, 0.08, 0.57, 0.31, 0.83, 0.14, 0.49,
      0.7, 0.25, 0.92, 0.36, 0.63, 0.19, 0.86, 0.41, 0.58, 0.03,
      0.97, 0.11, 0.52, 0.29, 0.66, 0.44, 0.72, 0.21, 0.84, 0.16,
    ]);
    const result = simulateDetailedMatch(81, 74, 'FC København', 'AGF', rng);

    assert.equal(result.details.timeline.firstHalfMinutes, MATCH_TIMELINE.firstHalfMinutes);
    assert.equal(result.details.timeline.halftimeMinutes, MATCH_TIMELINE.halftimeMinutes);
    assert.equal(result.details.timeline.secondHalfMinutes, MATCH_TIMELINE.secondHalfMinutes);
    assert.equal(result.details.stats.possessionHome + result.details.stats.possessionAway, 100);
    assert.ok(result.details.stats.chancesHome >= result.homeGoals);
    assert.ok(result.details.stats.chancesAway >= result.awayGoals);
    assert.equal(result.details.events.some(event => event.type === 'halftime'), true);
    assert.equal(result.details.events.some(event => event.type === 'second_half'), true);
    assert.equal(result.details.events.some(event => event.type === 'full_time'), true);
    assert.match(result.details.report.summary, /2x15 minutter/);
    assert.equal(result.details.report.highlights.some(entry => entry.includes('Boldbesiddelse')), true);
    assert.equal(result.details.report.highlights.some(entry => entry.includes('Chancer')), true);
  });

  it('normalizes saved match records defensively and preserves valid detailed reports', () => {
    const validDetails = simulateDetailedMatch(76, 76, 'Brøndby IF', 'OB', createSequenceRng([
      0.3, 0.5, 0.7, 0.2, 0.8, 0.4, 0.6, 0.1, 0.9, 0.35,
      0.55, 0.75, 0.15, 0.85, 0.25, 0.45, 0.65, 0.05, 0.95, 0.32,
    ])).details;

    const normalized = normalizeLeagueMatchRecords([
      {
        fixtureId: 'legacy-match',
        season: 2,
        week: 4,
        homeTeamId: 'broendby',
        homeTeamName: 'Brøndby IF',
        awayTeamId: 'ob',
        awayTeamName: 'OB',
        homeGoals: 1,
        awayGoals: 1,
        isUserMatch: true,
      },
      {
        fixtureId: 'detailed-match',
        season: 2,
        week: 5,
        homeTeamId: 'broendby',
        homeTeamName: 'Brøndby IF',
        awayTeamId: 'ob',
        awayTeamName: 'OB',
        homeGoals: validDetails.events.filter(event => event.type === 'goal' && event.team === 'home').length,
        awayGoals: validDetails.events.filter(event => event.type === 'goal' && event.team === 'away').length,
        isUserMatch: true,
        details: validDetails,
      },
      {
        fixtureId: 'broken-details',
        season: 2,
        week: 6,
        homeTeamId: 'broendby',
        homeTeamName: 'Brøndby IF',
        awayTeamId: 'ob',
        awayTeamName: 'OB',
        homeGoals: 0,
        awayGoals: 2,
        isUserMatch: true,
        details: {
          timeline: { firstHalfMinutes: 15 },
          stats: { chancesHome: 'many' },
        },
      },
      null,
    ]);

    assert.equal(normalized.length, 3);
    assert.equal(normalized[0].details, undefined);
    assert.ok(normalized[1].details);
    assert.equal(normalized[1].details?.timeline.halftimeMinutes, MATCH_TIMELINE.halftimeMinutes);
    assert.equal(normalized[1].details?.events.some(event => event.type === 'full_time'), true);
    assert.equal(normalized[2].details, undefined);
  });
});
