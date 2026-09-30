import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  LEAGUES,
  buildLeagueStandings,
  buildRoundMatchRecords,
  getLeagueSeasonSchedule,
  type LeagueFixture,
  type LeagueMatchRecord,
  type MatchScoreSimulator,
} from './leagues';
import type { Team } from '../types/teams';

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
      ...buildRoundMatchRecords(schedule, season, userFixture.id, { homeGoals: 2, awayGoals: 2 }, matches, fixedScore),
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
      roundOneUserFixture.id,
      { homeGoals: 0, awayGoals: 0 },
      [],
      fixedScore,
    );
    const newMatches = buildRoundMatchRecords(
      schedule,
      1,
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

  it('scopes matches played to the season and ignores duplicate records', () => {
    const teams = LEAGUES[0].teams;
    const userTeam = teams[0];
    const schedule = getLeagueSeasonSchedule(userTeam);
    const userFixture = getUserFixture(schedule, userTeam.id, 1);
    assert.ok(userFixture);

    const seasonOne = buildRoundMatchRecords(schedule, 1, userFixture.id, { homeGoals: 1, awayGoals: 0 }, [], fixedScore);
    const seasonTwo = buildRoundMatchRecords(schedule, 2, userFixture.id, { homeGoals: 1, awayGoals: 0 }, seasonOne, fixedScore);
    assert.equal(seasonTwo.length, 6);
    assert.deepEqual(
      buildRoundMatchRecords(schedule, 2, userFixture.id, { homeGoals: 1, awayGoals: 0 }, [...seasonOne, ...seasonTwo], fixedScore),
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
