import { Team } from '../types/teams';

export interface LeagueDefinition {
  id: string;
  name: string;
  color: string;
  teams: Team[];
}

export interface LeagueFixture {
  id: string;
  round: number;
  homeTeamId: string;
  awayTeamId: string;
}

export interface LeagueResult {
  fixtureId: string;
  round: number;
  homeTeamId: string;
  awayTeamId: string;
  homeGoals: number;
  awayGoals: number;
}

export interface LeagueStanding {
  teamId: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export const LEAGUES: LeagueDefinition[] = [
  {
    id: 'superligaen',
    name: 'Superligaen',
    color: 'from-blue-500 to-blue-600',
    teams: [
      { id: 'fckoebenhavn', name: 'FC København', logo: '🔵', leagueId: 'superligaen', leagueName: 'Superligaen', strength: 82 },
      { id: 'broendby', name: 'Brøndby IF', logo: '🟡', leagueId: 'superligaen', leagueName: 'Superligaen', strength: 79 },
      { id: 'midtjylland', name: 'FC Midtjylland', logo: '🔴', leagueId: 'superligaen', leagueName: 'Superligaen', strength: 80 },
      { id: 'aalborg', name: 'AaB Aalborg', logo: '⚫', leagueId: 'superligaen', leagueName: 'Superligaen', strength: 76 },
    ],
  },
  {
    id: 'division1',
    name: '1. Division',
    color: 'from-orange-500 to-orange-600',
    teams: [
      { id: 'silkeborg', name: 'Silkeborg IF', logo: '🔶', leagueId: 'division1', leagueName: '1. Division', strength: 74 },
      { id: 'randers', name: 'Randers FC', logo: '🟠', leagueId: 'division1', leagueName: '1. Division', strength: 75 },
      { id: 'ob', name: 'OB Odense', logo: '🔵', leagueId: 'division1', leagueName: '1. Division', strength: 73 },
      { id: 'lolland', name: 'Lolland-Falster Alliancen', logo: '🟣', leagueId: 'division1', leagueName: '1. Division', strength: 70 },
    ],
  },
  {
    id: 'nordsjaelland-serien',
    name: 'Nordsjaelland Serien',
    color: 'from-green-500 to-green-600',
    teams: [
      { id: 'frem', name: 'BK FREM', logo: '🟢', leagueId: 'nordsjaelland-serien', leagueName: 'Nordsjaelland Serien', strength: 69 },
      { id: 'nordsjælland', name: 'Nordsjælland FC', logo: '⚪', leagueId: 'nordsjaelland-serien', leagueName: 'Nordsjaelland Serien', strength: 77 },
      { id: 'fredriksberg', name: 'Fredriksberg IF', logo: '🔴', leagueId: 'nordsjaelland-serien', leagueName: 'Nordsjaelland Serien', strength: 67 },
      { id: 'ballerup', name: 'Ballerup IF', logo: '🟡', leagueId: 'nordsjaelland-serien', leagueName: 'Nordsjaelland Serien', strength: 66 },
    ],
  },
  {
    id: 'regionsmesterskaberne',
    name: 'Regionsmesterskaberne',
    color: 'from-purple-500 to-purple-600',
    teams: [
      { id: 'kastrup', name: 'Kastrup BK', logo: '🟣', leagueId: 'regionsmesterskaberne', leagueName: 'Regionsmesterskaberne', strength: 64 },
      { id: 'glostrup', name: 'Glostrup FK', logo: '⚪', leagueId: 'regionsmesterskaberne', leagueName: 'Regionsmesterskaberne', strength: 63 },
      { id: 'tårnby', name: 'Tårnby FF', logo: '🟠', leagueId: 'regionsmesterskaberne', leagueName: 'Regionsmesterskaberne', strength: 62 },
      { id: 'virum', name: 'Virum-Skovlunde IF', logo: '🔵', leagueId: 'regionsmesterskaberne', leagueName: 'Regionsmesterskaberne', strength: 61 },
    ],
  },
];

export const getLeagueById = (leagueId?: string | null) =>
  LEAGUES.find((league) => league.id === leagueId) ?? null;

export const getLeagueByTeamId = (teamId?: string | null) =>
  LEAGUES.find((league) => league.teams.some((team) => team.id === teamId)) ?? null;

export const getTeamById = (teamId?: string | null) =>
  LEAGUES.flatMap((league) => league.teams).find((team) => team.id === teamId) ?? null;

export const createLeagueFixtures = (league: LeagueDefinition): LeagueFixture[] => {
  const [team1, team2, team3, team4] = league.teams;

  return [
    { id: `${league.id}_1`, round: 1, homeTeamId: team1.id, awayTeamId: team4.id },
    { id: `${league.id}_2`, round: 1, homeTeamId: team2.id, awayTeamId: team3.id },
    { id: `${league.id}_3`, round: 2, homeTeamId: team4.id, awayTeamId: team3.id },
    { id: `${league.id}_4`, round: 2, homeTeamId: team1.id, awayTeamId: team2.id },
    { id: `${league.id}_5`, round: 3, homeTeamId: team2.id, awayTeamId: team4.id },
    { id: `${league.id}_6`, round: 3, homeTeamId: team3.id, awayTeamId: team1.id },
    { id: `${league.id}_7`, round: 4, homeTeamId: team4.id, awayTeamId: team1.id },
    { id: `${league.id}_8`, round: 4, homeTeamId: team3.id, awayTeamId: team2.id },
    { id: `${league.id}_9`, round: 5, homeTeamId: team3.id, awayTeamId: team4.id },
    { id: `${league.id}_10`, round: 5, homeTeamId: team2.id, awayTeamId: team1.id },
    { id: `${league.id}_11`, round: 6, homeTeamId: team4.id, awayTeamId: team2.id },
    { id: `${league.id}_12`, round: 6, homeTeamId: team1.id, awayTeamId: team3.id },
  ];
};

export const getLeagueStandings = (
  league: LeagueDefinition,
  results: LeagueResult[],
): LeagueStanding[] => {
  const standings = league.teams.reduce((acc, team) => {
    acc[team.id] = {
      teamId: team.id,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
    };

    return acc;
  }, {} as Record<string, LeagueStanding>);

  results.forEach((result) => {
    const home = standings[result.homeTeamId];
    const away = standings[result.awayTeamId];

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
      away.losses += 1;
      home.points += 3;
    } else if (result.homeGoals < result.awayGoals) {
      away.wins += 1;
      home.losses += 1;
      away.points += 3;
    } else {
      home.draws += 1;
      away.draws += 1;
      home.points += 1;
      away.points += 1;
    }

    home.goalDifference = home.goalsFor - home.goalsAgainst;
    away.goalDifference = away.goalsFor - away.goalsAgainst;
  });

  return Object.values(standings).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;

    const teamA = getTeamById(a.teamId)?.name ?? a.teamId;
    const teamB = getTeamById(b.teamId)?.name ?? b.teamId;
    return teamA.localeCompare(teamB, 'da-DK');
  });
};
