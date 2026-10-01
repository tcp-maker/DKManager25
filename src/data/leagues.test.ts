import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  LEAGUES,
  MATCH_TIMELINE,
  archiveSeason,
  buildLeagueStandings,
  buildRoundMatchRecords,
  buildSeasonArchiveEntry,
  getAvailableSeasons,
  getLeagueSeasonSchedule,
  getSeasonFixtures,
  normalizeLeagueMatchRecords,
  normalizeSeasonHistory,
  simulateDetailedMatch,
  type LeagueFixture,
  type LeagueMatchRecord,
  type MatchScoreSimulator,
} from './leagues';
import type { Team } from '../types/teams';

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

const fixedScore: MatchScoreSimulator = () => ({ homeGoals: 1, awayGoals: 0 });

const createFixture = (week: number, home: Team, away: Team): LeagueFixture => ({
  id: `fixture-${week}-${home.id}-${away.id}`,
  week,
  homeTeamId: home.id,
  homeTeamName: home.name,
  awayTeamId: away.id,
  awayTeamName: away.name,
});

// Builds a schedule where each round only uses `matchesPerRound[i] * 2` teams (always including the first team).
const createUnevenSchedule = (teams: Team[], matchesPerRound: number[]): LeagueFixture[] =>
  matchesPerRound.flatMap((matchCount, roundIndex) => {
    const others = teams.slice(1);
    const rotated = [teams[0], ...others.slice(roundIndex), ...others.slice(0, roundIndex)];
    return Array.from({ length: matchCount }, (_, index) =>
      createFixture(roundIndex + 1, rotated[index * 2], rotated[index * 2 + 1]));
  });

const countScheduledMatches = (schedule: LeagueFixture[], teamId: string, throughWeek: number) =>
  schedule.filter(fixture =>
    fixture.week <= throughWeek && (fixture.homeTeamId === teamId || fixture.awayTeamId === teamId)).length;

const getUserFixture = (schedule: LeagueFixture[], teamId: string, week: number) =>
  schedule.find(fixture => fixture.week === week && (fixture.homeTeamId === teamId || fixture.awayTeamId === teamId));

const getPlayedByTeam = (team: Team, season: number, matches: LeagueMatchRecord[]) =>
  new Map(buildLeagueStandings(team, season, matches).map(standing => [standing.teamId, standing.played]));

const playWeekByWeek = (
  schedule: LeagueFixture[],
  season: number,
  userTeam: Team,
  existingMatches: LeagueMatchRecord[],
  onWeekPlayed: (week: number, matches: LeagueMatchRecord[]) => void,
) => {
  let matches = existingMatches;
  const weeks = Array.from(new Set(schedule.map(fixture => fixture.week))).sort((a, b) => a - b);

  for (const week of weeks) {
    const userFixture = getUserFixture(schedule, userTeam.id, week);
    assert.ok(userFixture, `expected user fixture in week ${week}`);
    matches = [
      ...matches,
      ...buildRoundMatchRecords(schedule, season, userTeam.id, userFixture.id, { homeGoals: 2, awayGoals: 2 }, matches, fixedScore),
    ];
    onWeekPlayed(week, matches);
  }

  return matches;
};

describe('league standings matches played', () => {
  it('uses the actual number of matches per round for seasons with different round sizes', () => {
    const teams = LEAGUES[0].teams;
    const userTeam = teams[0];
    const seasonOneSchedule = createUnevenSchedule(teams, [6, 4, 5]);
    const seasonTwoSchedule = createUnevenSchedule(teams, [3, 6, 2, 6]);
    const scheduledRoundSizes = (schedule: LeagueFixture[]) =>
      Array.from(new Set(schedule.map(fixture => fixture.week)))
        .map(week => schedule.filter(fixture => fixture.week === week).length);

    let matches: LeagueMatchRecord[] = [];
    for (const [season, schedule] of [[1, seasonOneSchedule], [2, seasonTwoSchedule]] as const) {
      matches = playWeekByWeek(schedule, season, userTeam, matches, (week, currentMatches) => {
        const seasonMatches = currentMatches.filter(match => match.season === season);
        const weekMatches = seasonMatches.filter(match => match.week === week);
        assert.equal(weekMatches.length, scheduledRoundSizes(schedule)[week - 1]);

        const playedByTeam = getPlayedByTeam(userTeam, season, currentMatches);
        for (const team of teams) {
          assert.equal(
            playedByTeam.get(team.id),
            countScheduledMatches(schedule, team.id, week),
            `season ${season}, week ${week}, ${team.id}`,
          );
        }
      });
    }

    const seasonTotals = [1, 2].map(season =>
      buildLeagueStandings(userTeam, season, matches).reduce((sum, standing) => sum + standing.played, 0));
    assert.deepEqual(seasonTotals, [(6 + 4 + 5) * 2, (3 + 6 + 2 + 6) * 2]);
  });

  it('keeps cumulative matches played correct week after week in multiple leagues', () => {
    for (const league of LEAGUES.slice(0, 2)) {
      const userTeam = league.teams[3];
      const schedule = getLeagueSeasonSchedule(userTeam);
      const rounds = Math.max(...schedule.map(fixture => fixture.week));
      assert.equal(rounds, (league.teams.length - 1) * 2);

      playWeekByWeek(schedule, 1, userTeam, [], (week, matches) => {
        const standings = buildLeagueStandings(userTeam, 1, matches);
        assert.equal(standings.length, league.teams.length);
        for (const standing of standings) {
          assert.equal(standing.played, week, `${league.name} week ${week}, ${standing.teamId}`);
          assert.equal(standing.won + standing.drawn + standing.lost, standing.played);
        }
      });
    }
  });

  it('only counts completed matches when a round is not fully played', () => {
    const teams = LEAGUES[1].teams;
    const userTeam = teams[0];
    const schedule = getLeagueSeasonSchedule(userTeam);
    const roundOne = schedule.filter(fixture => fixture.week === 1);
    const completed = roundOne.slice(0, 4);
    assert.ok(completed.length < roundOne.length);

    const matches = completed.map(fixture => ({
      fixtureId: fixture.id,
      season: 1,
      week: fixture.week,
      homeTeamId: fixture.homeTeamId,
      homeTeamName: fixture.homeTeamName,
      awayTeamId: fixture.awayTeamId,
      awayTeamName: fixture.awayTeamName,
      homeGoals: 1,
      awayGoals: 1,
      isUserMatch: false,
    }));

    const playedByTeam = getPlayedByTeam(userTeam, 1, matches);
    const teamsInCompletedMatches = new Set(completed.flatMap(fixture => [fixture.homeTeamId, fixture.awayTeamId]));
    for (const team of teams) {
      assert.equal(playedByTeam.get(team.id), teamsInCompletedMatches.has(team.id) ? 1 : 0);
    }
  });

  it('records the fixture round and completes skipped rounds instead of using the current week', () => {
    const teams = LEAGUES[0].teams;
    const userTeam = teams[0];
    const schedule = getLeagueSeasonSchedule(userTeam);
    const roundOneUserFixture = getUserFixture(schedule, userTeam.id, 1);
    const roundTwoUserFixture = getUserFixture(schedule, userTeam.id, 2);
    assert.ok(roundOneUserFixture && roundTwoUserFixture);

    // Legacy/buggy save: only the user's match was stored for round 1.
    const [legacyUserMatch] = buildRoundMatchRecords(
      schedule.filter(fixture => fixture.id === roundOneUserFixture.id),
      1,
      userTeam.id,
      roundOneUserFixture.id,
      { homeGoals: 0, awayGoals: 0 },
      [],
      fixedScore,
    );
    const newMatches = buildRoundMatchRecords(
      schedule,
      1,
      userTeam.id,
      roundTwoUserFixture.id,
      { homeGoals: 3, awayGoals: 1 },
      [legacyUserMatch],
      fixedScore,
    );

    assert.equal(newMatches.filter(match => match.week === 1).length, 5);
    assert.equal(newMatches.filter(match => match.week === 2).length, 6);
    assert.equal(newMatches.filter(match => match.isUserMatch).length, 1);
    assert.equal(newMatches.find(match => match.isUserMatch)?.week, 2);

    for (const standing of buildLeagueStandings(userTeam, 1, [legacyUserMatch, ...newMatches])) {
      assert.equal(standing.played, 2, standing.teamId);
    }
  });

  it('never auto-simulates an earlier unplayed fixture of the user team', () => {
    const userTeam = LEAGUES[0].teams[0];
    const schedule = getLeagueSeasonSchedule(userTeam);
    const roundTwoUserFixture = getUserFixture(schedule, userTeam.id, 2);
    assert.ok(roundTwoUserFixture);

    const newMatches = buildRoundMatchRecords(schedule, 1, userTeam.id, roundTwoUserFixture.id, { homeGoals: 1, awayGoals: 1 }, [], fixedScore);
    const userTeamMatches = newMatches.filter(match => match.homeTeamId === userTeam.id || match.awayTeamId === userTeam.id);

    assert.deepEqual(userTeamMatches.map(match => [match.fixtureId, match.isUserMatch]), [[roundTwoUserFixture.id, true]]);
    assert.equal(newMatches.filter(match => match.week === 1).length, 5);
  });

  it('preserves detailed reports only on the played user fixture', () => {
    const userTeam = LEAGUES[0].teams[0];
    const schedule = getLeagueSeasonSchedule(userTeam);
    const userFixture = getUserFixture(schedule, userTeam.id, 1);
    assert.ok(userFixture);
    const result = simulateDetailedMatch(
      80,
      75,
      userFixture.homeTeamName,
      userFixture.awayTeamName,
      createSequenceRng(Array.from({ length: 100 }, (_, index) => (index + 0.5) / 100)),
    );

    const matches = buildRoundMatchRecords(
      schedule,
      1,
      userTeam.id,
      userFixture.id,
      { homeGoals: result.homeGoals, awayGoals: result.awayGoals, details: result.details },
      [],
      fixedScore,
    );

    assert.equal(matches.find(match => match.isUserMatch)?.details, result.details);
    assert.equal(matches.filter(match => !match.isUserMatch).every(match => match.details === undefined), true);
  });

  it('scopes matches played to the season and ignores duplicate records', () => {
    const teams = LEAGUES[0].teams;
    const userTeam = teams[0];
    const schedule = getLeagueSeasonSchedule(userTeam);
    const userFixture = getUserFixture(schedule, userTeam.id, 1);
    assert.ok(userFixture);

    const seasonOne = buildRoundMatchRecords(schedule, 1, userTeam.id, userFixture.id, { homeGoals: 1, awayGoals: 0 }, [], fixedScore);
    const seasonTwo = buildRoundMatchRecords(schedule, 2, userTeam.id, userFixture.id, { homeGoals: 1, awayGoals: 0 }, seasonOne, fixedScore);
    assert.equal(seasonTwo.length, 6);
    assert.deepEqual(
      buildRoundMatchRecords(schedule, 2, userTeam.id, userFixture.id, { homeGoals: 1, awayGoals: 0 }, [...seasonOne, ...seasonTwo], fixedScore),
      [],
    );

    const matches = [...seasonOne, ...seasonTwo, ...seasonTwo];
    for (const season of [1, 2, 3]) {
      const expectedPlayed = season === 3 ? 0 : 1;
      for (const standing of buildLeagueStandings(userTeam, season, matches)) {
        assert.equal(standing.played, expectedPlayed, `season ${season}, ${standing.teamId}`);
        assert.equal(standing.points, season === 3 ? 0 : standing.won * 3);
      }
    }
  });
});
