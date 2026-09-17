import { Team } from '../types/teams';

export type MatchDifficulty = 'Nem' | 'Moderat' | 'Svær';

export interface LeagueDefinition {
  name: string;
  color: string;
  teams: Team[];
}

export interface ScheduledMatch {
  id: string;
  week: number;
  opponentId: string;
  opponent: string;
  isHome: boolean;
  difficulty: MatchDifficulty;
  opponentRating: number;
}

export interface LeagueMatchRecord {
  fixtureId: string;
  season: number;
  week: number;
  homeTeamId: string;
  homeTeamName: string;
  awayTeamId: string;
  awayTeamName: string;
  homeGoals: number;
  awayGoals: number;
  isUserMatch: boolean;
}

export interface LeagueStanding {
  teamId: string;
  teamName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export const LEAGUES: LeagueDefinition[] = [
  {
    name: 'Superligaen',
    color: 'from-blue-500 to-blue-600',
    teams: [
      { id: 'fckoebenhavn', name: 'FC København', logo: '🔵', league: 'Superligaen', baseRating: 82 },
      { id: 'broendby', name: 'Brøndby IF', logo: '🟡', league: 'Superligaen', baseRating: 79 },
      { id: 'midtjylland', name: 'FC Midtjylland', logo: '🔴', league: 'Superligaen', baseRating: 78 },
      { id: 'aalborg', name: 'AaB Aalborg', logo: '⚫', league: 'Superligaen', baseRating: 76 },
    ]
  },
  {
    name: '1. Division',
    color: 'from-orange-500 to-orange-600',
    teams: [
      { id: 'silkeborg', name: 'Silkeborg IF', logo: '🔶', league: '1. Division', baseRating: 74 },
      { id: 'randers', name: 'Randers FC', logo: '🟠', league: '1. Division', baseRating: 75 },
      { id: 'ob', name: 'OB Odense', logo: '🔵', league: '1. Division', baseRating: 73 },
      { id: 'lolland', name: 'Lolland-Falster Alliancen', logo: '🟣', league: '1. Division', baseRating: 68 },
    ]
  },
  {
    name: 'Nordsjaelland Serien',
    color: 'from-green-500 to-green-600',
    teams: [
      { id: 'frem', name: 'BK FREM', logo: '🟢', league: 'Nordsjaelland Serien', baseRating: 71 },
      { id: 'nordsjælland', name: 'Nordsjælland FC', logo: '⚪', league: 'Nordsjaelland Serien', baseRating: 77 },
      { id: 'fredriksberg', name: 'Fredriksberg IF', logo: '🔴', league: 'Nordsjaelland Serien', baseRating: 69 },
      { id: 'ballerup', name: 'Ballerup IF', logo: '🟡', league: 'Nordsjaelland Serien', baseRating: 67 },
    ]
  },
  {
    name: 'Regionsmesterskaberne',
    color: 'from-purple-500 to-purple-600',
    teams: [
      { id: 'kastrup', name: 'Kastrup BK', logo: '🟣', league: 'Regionsmesterskaberne', baseRating: 70 },
      { id: 'glostrup', name: 'Glostrup FK', logo: '⚪', league: 'Regionsmesterskaberne', baseRating: 69 },
      { id: 'tårnby', name: 'Tårnby FF', logo: '🟠', league: 'Regionsmesterskaberne', baseRating: 68 },
      { id: 'virum', name: 'Virum-Skovlunde IF', logo: '🔵', league: 'Regionsmesterskaberne', baseRating: 67 },
    ]
  },
];

const getDifficulty = (rating: number): MatchDifficulty => {
  if (rating > 80) return 'Svær';
  if (rating > 75) return 'Moderat';
  return 'Nem';
};

export const getTeamById = (teamId?: string | null): Team | null => {
  if (!teamId) return null;
  for (const league of LEAGUES) {
    const team = league.teams.find(candidate => candidate.id === teamId);
    if (team) {
      return team;
    }
  }
  return null;
};

export const getLeagueByTeamId = (teamId?: string | null): LeagueDefinition | null => {
  if (!teamId) return null;
  return LEAGUES.find(league => league.teams.some(team => team.id === teamId)) ?? null;
};

export const getSeasonFixtures = (selectedTeam: Team | null): ScheduledMatch[] => {
  if (!selectedTeam) return [];

  const league = getLeagueByTeamId(selectedTeam.id);
  if (!league) return [];

  const currentTeam = getTeamById(selectedTeam.id) ?? selectedTeam;
  const opponents = league.teams.filter(team => team.id !== currentTeam.id);

  return opponents
    .flatMap((opponent, index) => ([
      {
        id: `${currentTeam.id}-${opponent.id}-home`,
        week: index + 1,
        opponentId: opponent.id,
        opponent: opponent.name,
        isHome: true,
        difficulty: getDifficulty(opponent.baseRating),
        opponentRating: opponent.baseRating,
      },
      {
        id: `${currentTeam.id}-${opponent.id}-away`,
        week: index + opponents.length + 1,
        opponentId: opponent.id,
        opponent: opponent.name,
        isHome: false,
        difficulty: getDifficulty(opponent.baseRating),
        opponentRating: opponent.baseRating,
      }
    ]))
    .sort((a, b) => a.week - b.week);
};

export const simulateScore = (homeRating: number, awayRating: number) => {
  const diff = homeRating - awayRating;
  const winProb = Math.max(0.15, Math.min(0.75, 0.45 + diff / 200));
  const drawProb = 0.22;
  const roll = Math.random();

  if (roll < winProb) {
    const homeGoals = Math.floor(Math.random() * 3) + 1;
    const awayGoals = Math.floor(Math.random() * homeGoals);
    return { homeGoals, awayGoals };
  }

  if (roll < winProb + drawProb) {
    const homeGoals = Math.floor(Math.random() * 3);
    return { homeGoals, awayGoals: homeGoals };
  }

  const awayGoals = Math.floor(Math.random() * 3) + 1;
  const homeGoals = Math.floor(Math.random() * awayGoals);
  return { homeGoals, awayGoals };
};

export const buildLeagueStandings = (
  selectedTeam: Team | null,
  season: number,
  matches: LeagueMatchRecord[],
): LeagueStanding[] => {
  if (!selectedTeam) return [];

  const league = getLeagueByTeamId(selectedTeam.id);
  if (!league) return [];

  const standings = new Map<string, LeagueStanding>(
    league.teams.map(team => ([
      team.id,
      {
        teamId: team.id,
        teamName: team.name,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0,
      }
    ]))
  );

  matches
    .filter(match => match.season === season)
    .forEach(match => {
      const home = standings.get(match.homeTeamId);
      const away = standings.get(match.awayTeamId);

      if (!home || !away) return;

      home.played += 1;
      away.played += 1;
      home.goalsFor += match.homeGoals;
      home.goalsAgainst += match.awayGoals;
      away.goalsFor += match.awayGoals;
      away.goalsAgainst += match.homeGoals;

      if (match.homeGoals > match.awayGoals) {
        home.won += 1;
        home.points += 3;
        away.lost += 1;
      } else if (match.homeGoals < match.awayGoals) {
        away.won += 1;
        away.points += 3;
        home.lost += 1;
      } else {
        home.drawn += 1;
        away.drawn += 1;
        home.points += 1;
        away.points += 1;
      }
    });

  return Array.from(standings.values())
    .map(team => ({
      ...team,
      goalDifference: team.goalsFor - team.goalsAgainst,
    }))
    .sort((a, b) =>
      b.points - a.points ||
      b.goalDifference - a.goalDifference ||
      b.goalsFor - a.goalsFor ||
      a.teamName.localeCompare(b.teamName, 'da-DK')
    );
};
