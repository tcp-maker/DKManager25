import { Team } from '../types/teams';

export interface League {
  id: string;
  name: string;
  color: string;
  teams: Team[];
}

export const LEAGUES: League[] = [
  {
    id: 'superligaen',
    name: 'Superligaen',
    color: 'from-blue-500 to-blue-600',
    teams: [
      { id: 'fckoebenhavn', name: 'FC København', logo: '🔵' },
      { id: 'broendby', name: 'Brøndby IF', logo: '🟡' },
      { id: 'midtjylland', name: 'FC Midtjylland', logo: '🔴' },
      { id: 'aalborg', name: 'AaB Aalborg', logo: '⚫' },
    ],
  },
  {
    id: 'first-division',
    name: '1. Division',
    color: 'from-orange-500 to-orange-600',
    teams: [
      { id: 'silkeborg', name: 'Silkeborg IF', logo: '🔶' },
      { id: 'randers', name: 'Randers FC', logo: '🟠' },
      { id: 'ob', name: 'OB Odense', logo: '🔵' },
      { id: 'lolland', name: 'Lolland-Falster Alliancen', logo: '🟣' },
    ],
  },
  {
    id: 'nordsjaelland-serien',
    name: 'Nordsjaelland Serien',
    color: 'from-green-500 to-green-600',
    teams: [
      { id: 'frem', name: 'BK FREM', logo: '🟢' },
      { id: 'nordsjaelland', name: 'Nordsjælland FC', logo: '⚪' },
      { id: 'fredriksberg', name: 'Fredriksberg IF', logo: '🔴' },
      { id: 'ballerup', name: 'Ballerup IF', logo: '🟡' },
    ],
  },
  {
    id: 'regionsmesterskaberne',
    name: 'Regionsmesterskaberne',
    color: 'from-purple-500 to-purple-600',
    teams: [
      { id: 'kastrup', name: 'Kastrup BK', logo: '🟣' },
      { id: 'glostrup', name: 'Glostrup FK', logo: '⚪' },
      { id: 'taarnby', name: 'Tårnby FF', logo: '🟠' },
      { id: 'virum', name: 'Virum-Skovlunde IF', logo: '🔵' },
    ],
  },
];

export const ALL_TEAMS = LEAGUES.flatMap((league) => league.teams);

export const TEAM_BY_ID: Record<string, Team> = ALL_TEAMS.reduce((acc, team) => {
  acc[team.id] = team;
  return acc;
}, {} as Record<string, Team>);

export const findTeamByName = (name: string): Team | undefined => {
  const normalizedName = name.trim().toLowerCase();
  return ALL_TEAMS.find((team) => team.name.toLowerCase() === normalizedName);
};
