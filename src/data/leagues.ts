import { League, LeagueFixture, LeagueMatchResult, LeagueStanding, LeagueTeam } from '../types/teams';

export const LEAGUES: League[] = [
  {
    id: 'superligaen',
    name: 'Superligaen',
    color: 'from-blue-500 to-blue-600',
    teams: [
      { id: 'fckoebenhavn', name: 'FC København', logo: '🔵', rating: 82 },
      { id: 'broendby', name: 'Brøndby IF', logo: '🟡', rating: 79 },
      { id: 'midtjylland', name: 'FC Midtjylland', logo: '🔴', rating: 80 },
      { id: 'aalborg', name: 'AaB Aalborg', logo: '⚫', rating: 76 },
    ],
  },
  {
    id: '1-division',
    name: '1. Division',
    color: 'from-orange-500 to-orange-600',
    teams: [
      { id: 'silkeborg', name: 'Silkeborg IF', logo: '🔶', rating: 74 },
      { id: 'randers', name: 'Randers FC', logo: '🟠', rating: 75 },
      { id: 'ob', name: 'OB Odense', logo: '🔵', rating: 73 },
      { id: 'lolland', name: 'Lolland-Falster Alliancen', logo: '🟣', rating: 70 },
    ],
  },
  {
    id: 'nordsjaelland-serien',
    name: 'Nordsjaelland Serien',
    color: 'from-green-500 to-green-600',
    teams: [
      { id: 'frem', name: 'BK FREM', logo: '🟢', rating: 68 },
      { id: 'nordsjælland', name: 'Nordsjælland FC', logo: '⚪', rating: 72 },
      { id: 'fredriksberg', name: 'Fredriksberg IF', logo: '🔴', rating: 67 },
      { id: 'ballerup', name: 'Ballerup IF', logo: '🟡', rating: 66 },
    ],
  },
  {
    id: 'regionsmesterskaberne',
    name: 'Regionsmesterskaberne',
    color: 'from-purple-500 to-purple-600',
    teams: [
      { id: 'kastrup', name: 'Kastrup BK', logo: '🟣', rating: 65 },
      { id: 'glostrup', name: 'Glostrup FK', logo: '⚪', rating: 64 },
      { id: 'tårnby', name: 'Tårnby FF', logo: '🟠', rating: 63 },
      { id: 'virum', name: 'Virum-Skovlunde IF', logo: '🔵', rating: 62 },
    ],
  },
];

export const LEAGUE_ROUNDS_PER_SEASON = 6;

const ROUND_TEMPLATES: Array<Array<[number, number]>> = [
  [[0, 3], [1, 2]],
  [[3, 2], [0, 1]],
  [[1, 3], [2, 0]],
  [[3, 0], [2, 1]],
  [[2, 3], [1, 0]],
  [[3, 1], [0, 2]],
];

const compareTeamNames = (left: LeagueTeam, right: LeagueTeam) => {
  const nameComparison = left.name.localeCompare(right.name, 'da');
  if (nameComparison !== 0) {
    return nameComparison;
  }

  return left.id.localeCompare(right.id, 'da');
};

export const getLeagueById = (leagueId: string) =>
  LEAGUES.find(league => league.id === leagueId);

export const getLeagueByTeamId = (teamId: string) =>
  LEAGUES.find(league => league.teams.some(team => team.id === teamId));

export const getCurrentSeason = (week: number) =>
  Math.max(1, Math.floor((Math.max(week, 1) - 1) / LEAGUE_ROUNDS_PER_SEASON) + 1);

export const getSeasonWeek = (week: number) =>
  ((Math.max(week, 1) - 1) % LEAGUE_ROUNDS_PER_SEASON) + 1;

export const normalizeLeagueResult = (result: LeagueMatchResult): LeagueMatchResult => ({
  ...result,
  season: result.season ?? getCurrentSeason(result.week),
});

export const getLeagueFixtureSet = (leagueId: string, week: number): LeagueFixture[] => {
  const league = getLeagueById(leagueId);
  if (!league || week < 1) {
    return [];
  }

  const season = getCurrentSeason(week);
  const seasonWeek = getSeasonWeek(week);
  const roundIndex = seasonWeek - 1;

  return ROUND_TEMPLATES[roundIndex].map(([homeIndex, awayIndex], matchIndex) => ({
    id: `${league.id}-saeson-${season}-runde-${seasonWeek}-kamp-${matchIndex + 1}`,
    leagueId: league.id,
    season,
    week,
    homeTeam: league.teams[homeIndex],
    awayTeam: league.teams[awayIndex],
  }));
};

export const calculateLeagueStandings = (
  league: League,
  results: LeagueMatchResult[],
  season: number,
): LeagueStanding[] => {
  const standings = new Map<string, LeagueStanding>();

  league.teams.forEach(team => {
    standings.set(team.id, {
      position: 0,
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
  });

  results
    .map(normalizeLeagueResult)
    .filter(result => result.leagueId === league.id && result.season === season)
    .forEach(result => {
      const home = standings.get(result.homeTeamId);
      const away = standings.get(result.awayTeamId);

      if (!home || !away) {
        return;
      }

      home.played += 1;
      away.played += 1;
      home.goalsFor += result.homeGoals;
      home.goalsAgainst += result.awayGoals;
      away.goalsFor += result.awayGoals;
      away.goalsAgainst += result.homeGoals;

      if (result.homeGoals > result.awayGoals) {
        home.wins += 1;
        home.points += 3;
        away.losses += 1;
      } else if (result.homeGoals < result.awayGoals) {
        away.wins += 1;
        away.points += 3;
        home.losses += 1;
      } else {
        home.draws += 1;
        away.draws += 1;
        home.points += 1;
        away.points += 1;
      }
    });

  return Array.from(standings.values())
    .map(entry => ({
      ...entry,
      goalDifference: entry.goalsFor - entry.goalsAgainst,
    }))
    .sort((left, right) => {
      if (right.points !== left.points) {
        return right.points - left.points;
      }
      if (right.goalDifference !== left.goalDifference) {
        return right.goalDifference - left.goalDifference;
      }
      if (right.goalsFor !== left.goalsFor) {
        return right.goalsFor - left.goalsFor;
      }

      const leftTeam = league.teams.find(team => team.id === left.teamId)!;
      const rightTeam = league.teams.find(team => team.id === right.teamId)!;
      return compareTeamNames(leftTeam, rightTeam);
    })
    .map((entry, index) => ({
      ...entry,
      position: index + 1,
    }));
};
