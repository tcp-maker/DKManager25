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

export interface LeagueFixture {
  id: string;
  week: number;
  homeTeamId: string;
  homeTeamName: string;
  awayTeamId: string;
  awayTeamName: string;
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

interface TeamSeed {
  id: string;
  name: string;
  logo: string;
  baseRating: number;
}

const createLeagueTeams = (league: string, teams: TeamSeed[]): Team[] =>
  teams.map(team => ({
    ...team,
    league,
  }));

const LEGACY_TEAM_ID_ALIASES: Record<string, string> = {
  lolland: 'nykoebing',
  fredriksberg: 'fa-2000',
  ballerup: 'ab',
  kastrup: 'sundby',
  glostrup: 'vanloese',
  'tårnby': 'fremad-amager',
  virum: 'hik',
};

export const LEAGUES: LeagueDefinition[] = [
  {
    name: 'Superligaen',
    color: 'from-blue-500 to-blue-600',
    teams: createLeagueTeams('Superligaen', [
      { id: 'fckoebenhavn', name: 'FC København', logo: '🔵', baseRating: 82 },
      { id: 'broendby', name: 'Brøndby IF', logo: '🟡', baseRating: 81 },
      { id: 'midtjylland', name: 'FC Midtjylland', logo: '🔴', baseRating: 81 },
      { id: 'nordsjælland', name: 'FC Nordsjælland', logo: '⚪', baseRating: 79 },
      { id: 'agf', name: 'AGF', logo: '🔷', baseRating: 78 },
      { id: 'silkeborg', name: 'Silkeborg IF', logo: '🔶', baseRating: 77 },
      { id: 'randers', name: 'Randers FC', logo: '🟠', baseRating: 76 },
      { id: 'viborg', name: 'Viborg FF', logo: '🟢', baseRating: 75 },
      { id: 'ob', name: 'OB', logo: '⚪', baseRating: 75 },
      { id: 'soenderjyske', name: 'Sønderjyske', logo: '🔹', baseRating: 74 },
      { id: 'lyngby', name: 'Lyngby BK', logo: '🔵', baseRating: 73 },
      { id: 'horsens', name: 'AC Horsens', logo: '🟡', baseRating: 72 },
    ]),
  },
  {
    name: '1. Division',
    color: 'from-orange-500 to-orange-600',
    teams: createLeagueTeams('1. Division', [
      { id: 'aalborg', name: 'AaB', logo: '⚫', baseRating: 71 },
      { id: 'vejle', name: 'Vejle BK', logo: '🔴', baseRating: 71 },
      { id: 'fredericia', name: 'FC Fredericia', logo: '⚪', baseRating: 70 },
      { id: 'hvidovre', name: 'Hvidovre IF', logo: '🔴', baseRating: 69 },
      { id: 'hilleroed', name: 'Hillerød Fodbold', logo: '🟠', baseRating: 69 },
      { id: 'kolding', name: 'Kolding IF', logo: '🔴', baseRating: 68 },
      { id: 'esbjerg', name: 'Esbjerg fB', logo: '🔵', baseRating: 68 },
      { id: 'hobro', name: 'Hobro IK', logo: '🟡', baseRating: 67 },
      { id: 'hb-koege', name: 'HB Køge', logo: '🔷', baseRating: 67 },
      { id: 'vendsyssel', name: 'Vendsyssel FF', logo: '🔵', baseRating: 66 },
      { id: 'aarhus-fremad', name: 'Aarhus Fremad', logo: '🟣', baseRating: 66 },
      { id: 'ab', name: 'AB', logo: '🟢', baseRating: 65 },
    ]),
  },
  {
    name: '2. Division',
    color: 'from-green-500 to-green-600',
    teams: createLeagueTeams('2. Division', [
      { id: 'naestved', name: 'Næstved BK', logo: '🟢', baseRating: 64 },
      { id: 'roskilde', name: 'FC Roskilde', logo: '🟡', baseRating: 64 },
      { id: 'fremad-amager', name: 'Fremad Amager', logo: '🔵', baseRating: 63 },
      { id: 'b93', name: 'B.93', logo: '⚪', baseRating: 63 },
      { id: 'thisted', name: 'Thisted FC', logo: '🔵', baseRating: 63 },
      { id: 'middelfart', name: 'Middelfart BK', logo: '⚪', baseRating: 62 },
      { id: 'skive', name: 'Skive IK', logo: '🔵', baseRating: 62 },
      { id: 'brabrand', name: 'Brabrand IF', logo: '🟡', baseRating: 61 },
      { id: 'vsk-aarhus', name: 'VSK Aarhus', logo: '🔷', baseRating: 61 },
      { id: 'fa-2000', name: 'FA 2000', logo: '🟣', baseRating: 60 },
      { id: 'hik', name: 'HIK', logo: '⚫', baseRating: 60 },
      { id: 'nykoebing', name: 'Nykøbing FC', logo: '🟠', baseRating: 59 },
    ]),
  },
  {
    name: '3. Division',
    color: 'from-purple-500 to-purple-600',
    teams: createLeagueTeams('3. Division', [
      { id: 'fc-helsingoer', name: 'FC Helsingør', logo: '🔴', baseRating: 58 },
      { id: 'frem', name: 'BK Frem', logo: '🟠', baseRating: 58 },
      { id: 'holbaek', name: 'Holbæk B&I', logo: '🔵', baseRating: 57 },
      { id: 'broenshoej', name: 'Brønshøj', logo: '🟡', baseRating: 57 },
      { id: 'ishoej', name: 'Ishøj IF', logo: '🔴', baseRating: 56 },
      { id: 'vanloese', name: 'Vanløse IF', logo: '⚪', baseRating: 56 },
      { id: 'naesby', name: 'Næsby BK', logo: '🟢', baseRating: 55 },
      { id: 'holstebro', name: 'Holstebro BK', logo: '🔵', baseRating: 55 },
      { id: 'asa-aarhus', name: 'ASA Aarhus', logo: '🔷', baseRating: 54 },
      { id: 'sundby', name: 'Sundby BK', logo: '🟡', baseRating: 54 },
      { id: 'ringsted', name: 'Ringsted IF', logo: '🟣', baseRating: 53 },
      { id: 'hoersholm-usseroed', name: 'Hørsholm-Usserød IK', logo: '⚪', baseRating: 53 },
    ]),
  },
];

const getDifficulty = (rating: number): MatchDifficulty => {
  if (rating > 78) return 'Svær';
  if (rating > 66) return 'Moderat';
  return 'Nem';
};

export const getTeamById = (teamId?: string | null): Team | null => {
  if (!teamId) return null;

  const resolvedTeamId = LEGACY_TEAM_ID_ALIASES[teamId] ?? teamId;

  for (const league of LEAGUES) {
    const team = league.teams.find(candidate => candidate.id === resolvedTeamId);
    if (team) {
      return team;
    }
  }

  return null;
};

export const getLeagueByTeamId = (teamId?: string | null): LeagueDefinition | null => {
  if (!teamId) return null;

  const resolvedTeamId = LEGACY_TEAM_ID_ALIASES[teamId] ?? teamId;
  return LEAGUES.find(league => league.teams.some(team => team.id === resolvedTeamId)) ?? null;
};

const buildRoundRobinFixtures = (teams: Team[]): LeagueFixture[] => {
  if (teams.length < 2 || teams.length % 2 !== 0) {
    return [];
  }

  const rounds = teams.length - 1;
  const halfSize = teams.length / 2;
  let rotation = [...teams];
  const firstHalf: LeagueFixture[] = [];

  for (let round = 0; round < rounds; round += 1) {
    for (let index = 0; index < halfSize; index += 1) {
      const homeCandidate = rotation[index];
      const awayCandidate = rotation[rotation.length - 1 - index];
      const shouldSwap = (round + index) % 2 === 1;
      const homeTeam = shouldSwap ? awayCandidate : homeCandidate;
      const awayTeam = shouldSwap ? homeCandidate : awayCandidate;

      firstHalf.push({
        id: `fixture-${round + 1}-${homeTeam.id}-${awayTeam.id}`,
        week: round + 1,
        homeTeamId: homeTeam.id,
        homeTeamName: homeTeam.name,
        awayTeamId: awayTeam.id,
        awayTeamName: awayTeam.name,
      });
    }

    rotation = [rotation[0], rotation[rotation.length - 1], ...rotation.slice(1, -1)];
  }

  const secondHalf = firstHalf.map(fixture => ({
    id: `fixture-${fixture.week + rounds}-${fixture.awayTeamId}-${fixture.homeTeamId}`,
    week: fixture.week + rounds,
    homeTeamId: fixture.awayTeamId,
    homeTeamName: fixture.awayTeamName,
    awayTeamId: fixture.homeTeamId,
    awayTeamName: fixture.homeTeamName,
  }));

  return [...firstHalf, ...secondHalf];
};

export const getLeagueSeasonSchedule = (selectedTeam: Team | null): LeagueFixture[] => {
  if (!selectedTeam) return [];

  const league = getLeagueByTeamId(selectedTeam.id);
  if (!league) return [];

  return buildRoundRobinFixtures(league.teams).sort((a, b) => a.week - b.week);
};

export const getSeasonFixtures = (selectedTeam: Team | null): ScheduledMatch[] => {
  if (!selectedTeam) return [];

  const currentTeam = getTeamById(selectedTeam.id) ?? selectedTeam;

  return getLeagueSeasonSchedule(currentTeam)
    .filter(fixture => fixture.homeTeamId === currentTeam.id || fixture.awayTeamId === currentTeam.id)
    .map(fixture => {
      const isHome = fixture.homeTeamId === currentTeam.id;
      const opponentId = isHome ? fixture.awayTeamId : fixture.homeTeamId;
      const opponent = getTeamById(opponentId);

      return {
        id: fixture.id,
        week: fixture.week,
        opponentId,
        opponent: opponent?.name ?? (isHome ? fixture.awayTeamName : fixture.homeTeamName),
        isHome,
        difficulty: getDifficulty(opponent?.baseRating ?? 70),
        opponentRating: opponent?.baseRating ?? 70,
      };
    });
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
