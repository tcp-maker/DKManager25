import { League, Team } from '../types/teams';

export const LEAGUES: League[] = [
  { id: 'superligaen', name: 'Superligaen', color: 'from-blue-500 to-blue-600' },
  { id: 'first-division', name: '1. Division', color: 'from-orange-500 to-orange-600' },
  { id: 'nordsjaelland-serien', name: 'Nordsjælland Serien', color: 'from-green-500 to-green-600' },
  { id: 'regionsmesterskaberne', name: 'Regionsmesterskaberne', color: 'from-purple-500 to-purple-600' },
];

export const TEAMS: Team[] = [
  { id: 'fckoebenhavn', leagueId: 'superligaen', name: 'FC København', logo: '🔵', strength: 81 },
  { id: 'broendby', leagueId: 'superligaen', name: 'Brøndby IF', logo: '🟡', strength: 79 },
  { id: 'midtjylland', leagueId: 'superligaen', name: 'FC Midtjylland', logo: '🔴', strength: 80 },
  { id: 'aalborg', leagueId: 'superligaen', name: 'AaB Aalborg', logo: '⚫', strength: 75 },
  { id: 'silkeborg', leagueId: 'first-division', name: 'Silkeborg IF', logo: '🔶', strength: 74 },
  { id: 'randers', leagueId: 'first-division', name: 'Randers FC', logo: '🟠', strength: 73 },
  { id: 'ob', leagueId: 'first-division', name: 'OB Odense', logo: '🔵', strength: 72 },
  { id: 'lolland', leagueId: 'first-division', name: 'Lolland-Falster Alliancen', logo: '🟣', strength: 69 },
  { id: 'frem', leagueId: 'nordsjaelland-serien', name: 'BK FREM', logo: '🟢', strength: 68 },
  { id: 'nordsjælland', leagueId: 'nordsjaelland-serien', name: 'Nordsjælland FC', logo: '⚪', strength: 71 },
  { id: 'fredriksberg', leagueId: 'nordsjaelland-serien', name: 'Fredriksberg IF', logo: '🔴', strength: 66 },
  { id: 'ballerup', leagueId: 'nordsjaelland-serien', name: 'Ballerup IF', logo: '🟡', strength: 65 },
  { id: 'kastrup', leagueId: 'regionsmesterskaberne', name: 'Kastrup BK', logo: '🟣', strength: 64 },
  { id: 'glostrup', leagueId: 'regionsmesterskaberne', name: 'Glostrup FK', logo: '⚪', strength: 63 },
  { id: 'tårnby', leagueId: 'regionsmesterskaberne', name: 'Tårnby FF', logo: '🟠', strength: 62 },
  { id: 'virum', leagueId: 'regionsmesterskaberne', name: 'Virum-Skovlunde IF', logo: '🔵', strength: 61 },
];

export const TEAMS_BY_ID = TEAMS.reduce<Record<string, Team>>((accumulator, team) => {
  accumulator[team.id] = team;
  return accumulator;
}, {});

export const LEAGUES_BY_ID = LEAGUES.reduce<Record<string, League>>((accumulator, league) => {
  accumulator[league.id] = league;
  return accumulator;
}, {});

export const getTeamById = (teamId?: string | null): Team | null => {
  if (!teamId) {
    return null;
  }

  return TEAMS_BY_ID[teamId] ?? null;
};

export const getLeagueById = (leagueId?: string | null): League | null => {
  if (!leagueId) {
    return null;
  }

  return LEAGUES_BY_ID[leagueId] ?? null;
};

export const getLeagueTeams = (leagueId: string): Team[] => (
  TEAMS.filter((team) => team.leagueId === leagueId)
);
