import { LeagueFixture, LeagueStandingEntry } from '../types/game';
import { Team } from '../types/teams';

export const createStandingEntry = (team: Team): LeagueStandingEntry => ({
  teamId: team.id,
  teamName: team.name,
  played: 0,
  wins: 0,
  draws: 0,
  losses: 0,
  goalsFor: 0,
  goalsAgainst: 0,
  goalDifference: 0,
  points: 0,
});

export const sortStandings = (standings: LeagueStandingEntry[]): LeagueStandingEntry[] => (
  [...standings].sort((left, right) => {
    if (right.points !== left.points) {
      return right.points - left.points;
    }
    if (right.goalDifference !== left.goalDifference) {
      return right.goalDifference - left.goalDifference;
    }
    if (right.goalsFor !== left.goalsFor) {
      return right.goalsFor - left.goalsFor;
    }
    return left.teamName.localeCompare(right.teamName, 'da');
  })
);

export const createInitialStandings = (teams: Team[]): LeagueStandingEntry[] => (
  sortStandings(teams.map(createStandingEntry))
);

export const applyMatchToStandings = (
  standings: LeagueStandingEntry[],
  homeTeamId: string,
  awayTeamId: string,
  homeGoals: number,
  awayGoals: number,
): LeagueStandingEntry[] => {
  const updatedStandings = standings.map((entry) => {
    if (entry.teamId !== homeTeamId && entry.teamId !== awayTeamId) {
      return entry;
    }

    const isHome = entry.teamId === homeTeamId;
    const goalsFor = isHome ? homeGoals : awayGoals;
    const goalsAgainst = isHome ? awayGoals : homeGoals;
    const didWin = goalsFor > goalsAgainst;
    const didDraw = goalsFor === goalsAgainst;

    const nextEntry: LeagueStandingEntry = {
      ...entry,
      played: entry.played + 1,
      wins: entry.wins + (didWin ? 1 : 0),
      draws: entry.draws + (didDraw ? 1 : 0),
      losses: entry.losses + (!didWin && !didDraw ? 1 : 0),
      goalsFor: entry.goalsFor + goalsFor,
      goalsAgainst: entry.goalsAgainst + goalsAgainst,
      goalDifference: entry.goalDifference + goalsFor - goalsAgainst,
      points: entry.points + (didWin ? 3 : didDraw ? 1 : 0),
    };

    return nextEntry;
  });

  return sortStandings(updatedStandings);
};

export const generateLeagueFixtures = (teams: Team[]): LeagueFixture[] => {
  if (teams.length !== 4) {
    return [];
  }

  const [teamA, teamB, teamC, teamD] = teams;
  const firstRound = [
    [
      { homeTeamId: teamA.id, awayTeamId: teamD.id },
      { homeTeamId: teamB.id, awayTeamId: teamC.id },
    ],
    [
      { homeTeamId: teamC.id, awayTeamId: teamA.id },
      { homeTeamId: teamB.id, awayTeamId: teamD.id },
    ],
    [
      { homeTeamId: teamA.id, awayTeamId: teamB.id },
      { homeTeamId: teamC.id, awayTeamId: teamD.id },
    ],
  ];

  const reverseRound = firstRound.map((fixtures) => (
    fixtures.map((fixture) => ({ homeTeamId: fixture.awayTeamId, awayTeamId: fixture.homeTeamId }))
  ));

  return [...firstRound, ...reverseRound].flatMap((fixtures, weekIndex) => (
    fixtures.map((fixture, matchIndex) => ({
      id: `${teams[0].leagueId}-uge-${weekIndex + 1}-kamp-${matchIndex + 1}`,
      leagueId: teams[0].leagueId,
      week: weekIndex + 1,
      homeTeamId: fixture.homeTeamId,
      awayTeamId: fixture.awayTeamId,
    }))
  ));
};

export const getFixtureForTeamAndWeek = (
  fixtures: LeagueFixture[],
  teamId: string,
  week: number,
): LeagueFixture | null => (
  fixtures.find((fixture) => fixture.week === week && (fixture.homeTeamId === teamId || fixture.awayTeamId === teamId)) ?? null
);

export const getFixturesForWeek = (fixtures: LeagueFixture[], week: number): LeagueFixture[] => (
  fixtures.filter((fixture) => fixture.week === week)
);

export const getUpcomingFixtures = (
  fixtures: LeagueFixture[],
  teamId: string,
  startWeek: number,
  count: number,
): LeagueFixture[] => {
  const upcoming: LeagueFixture[] = [];

  for (let week = startWeek; upcoming.length < count; week += 1) {
    const fixture = getFixtureForTeamAndWeek(fixtures, teamId, week);
    if (!fixture) {
      break;
    }
    upcoming.push(fixture);
  }

  return upcoming;
};
