import { Match } from '../types/matches';
import { Player, PlayerPosition } from '../types/player';
import { League, Team } from '../types/teams';

const FIRST_NAMES = [
  'Andreas', 'Mads', 'Kasper', 'Oliver', 'Frederik', 'Emil', 'Jonas', 'Viktor',
  'Lucas', 'Mathias', 'Rasmus', 'Magnus', 'Mikkel', 'Nikolaj', 'Jakob', 'Sebastian',
  'Alexander', 'Gustav', 'Noah', 'William', 'Tobias', 'Patrick', 'Lasse', 'Anton',
  'Jeppe', 'Sander', 'Philip', 'Valdemar', 'Malthe', 'Victor', 'August', 'Christian'
];

const LAST_NAMES = [
  'Jensen', 'Nielsen', 'Hansen', 'Pedersen', 'Andersen', 'Christensen', 'Larsen', 'Sørensen',
  'Rasmussen', 'Jørgensen', 'Madsen', 'Kristensen', 'Olsen', 'Thomsen', 'Poulsen', 'Knudsen',
  'Møller', 'Mortensen', 'Johansen', 'Lund', 'Holm', 'Jepsen', 'Friis', 'Skov', 'Bertelsen',
  'Laursen', 'Vestergaard', 'Damgaard', 'Buch', 'Bonde', 'Kjær', 'Winther'
];

const SQUAD_BLUEPRINT: Array<{ position: PlayerPosition; adjustments: number[] }> = [
  { position: 'GK', adjustments: [1, -4] },
  { position: 'DF', adjustments: [2, 1, 0, -1, -3, -5] },
  { position: 'MF', adjustments: [2, 1, 0, -1, -2, -4] },
  { position: 'FW', adjustments: [2, 0, -2, -4] },
];

const TEAM_DEFINITIONS: Array<{ id: string; name: string; logo: string; leagueId: string; leagueName: string; divisionLevel: number; baseRating: number }> = [
  { id: 'agf-aarhus', name: 'AGF Aarhus', logo: '🔵', leagueId: 'superliga', leagueName: 'Superliga', divisionLevel: 1, baseRating: 80 },
  { id: 'brondby-if', name: 'Brøndby IF', logo: '🟡', leagueId: 'superliga', leagueName: 'Superliga', divisionLevel: 1, baseRating: 81 },
  { id: 'fc-kobenhavn', name: 'FC København', logo: '⚪', leagueId: 'superliga', leagueName: 'Superliga', divisionLevel: 1, baseRating: 82 },
  { id: 'fc-fredericia', name: 'FC Fredericia', logo: '🔴', leagueId: 'superliga', leagueName: 'Superliga', divisionLevel: 1, baseRating: 74 },
  { id: 'fc-midtjylland', name: 'FC Midtjylland', logo: '⚫', leagueId: 'superliga', leagueName: 'Superliga', divisionLevel: 1, baseRating: 81 },
  { id: 'fc-nordsjaelland', name: 'FC Nordsjælland', logo: '🟠', leagueId: 'superliga', leagueName: 'Superliga', divisionLevel: 1, baseRating: 79 },
  { id: 'ob', name: 'OB', logo: '🔷', leagueId: 'superliga', leagueName: 'Superliga', divisionLevel: 1, baseRating: 76 },
  { id: 'randers-fc', name: 'Randers FC', logo: '🔵', leagueId: 'superliga', leagueName: 'Superliga', divisionLevel: 1, baseRating: 77 },
  { id: 'silkeborg-if', name: 'Silkeborg IF', logo: '🔴', leagueId: 'superliga', leagueName: 'Superliga', divisionLevel: 1, baseRating: 78 },
  { id: 'sonderjyske', name: 'Sønderjyske', logo: '🩵', leagueId: 'superliga', leagueName: 'Superliga', divisionLevel: 1, baseRating: 75 },
  { id: 'viborg-ff', name: 'Viborg FF', logo: '🟢', leagueId: 'superliga', leagueName: 'Superliga', divisionLevel: 1, baseRating: 77 },
  { id: 'vejle-boldklub', name: 'Vejle Boldklub', logo: '🔴', leagueId: 'superliga', leagueName: 'Superliga', divisionLevel: 1, baseRating: 75 },

  { id: 'lyngby-bk', name: 'Lyngby BK', logo: '🔵', leagueId: 'first-division', leagueName: '1. division', divisionLevel: 2, baseRating: 74 },
  { id: 'ac-horsens', name: 'AC Horsens', logo: '🟡', leagueId: 'first-division', leagueName: '1. division', divisionLevel: 2, baseRating: 73 },
  { id: 'esbjerg-fb', name: 'Esbjerg fB', logo: '🔵', leagueId: 'first-division', leagueName: '1. division', divisionLevel: 2, baseRating: 72 },
  { id: 'hillerod-if', name: 'Hillerød IF', logo: '🟠', leagueId: 'first-division', leagueName: '1. division', divisionLevel: 2, baseRating: 71 },
  { id: 'hvidovre-if', name: 'Hvidovre IF', logo: '🔴', leagueId: 'first-division', leagueName: '1. division', divisionLevel: 2, baseRating: 72 },
  { id: 'kolding-if', name: 'Kolding IF', logo: '🔵', leagueId: 'first-division', leagueName: '1. division', divisionLevel: 2, baseRating: 71 },
  { id: 'aab', name: 'AaB', logo: '🔴', leagueId: 'first-division', leagueName: '1. division', divisionLevel: 2, baseRating: 75 },
  { id: 'aarhus-fremad', name: 'Aarhus Fremad', logo: '🟠', leagueId: 'first-division', leagueName: '1. division', divisionLevel: 2, baseRating: 69 },
  { id: 'hobro-ik', name: 'Hobro IK', logo: '🟡', leagueId: 'first-division', leagueName: '1. division', divisionLevel: 2, baseRating: 70 },
  { id: 'hb-koge', name: 'HB Køge', logo: '🟦', leagueId: 'first-division', leagueName: '1. division', divisionLevel: 2, baseRating: 68 },
  { id: 'b93-kobenhavn', name: 'B.93 København', logo: '🟣', leagueId: 'first-division', leagueName: '1. division', divisionLevel: 2, baseRating: 69 },
  { id: 'middelfart-gbk', name: 'Middelfart G&BK', logo: '⚪', leagueId: 'first-division', leagueName: '1. division', divisionLevel: 2, baseRating: 68 },

  { id: 'ab-gladsaxe', name: 'AB Gladsaxe', logo: '🟢', leagueId: 'second-division', leagueName: '2. division', divisionLevel: 3, baseRating: 66 },
  { id: 'vendsyssel-ff', name: 'Vendsyssel FF', logo: '🔵', leagueId: 'second-division', leagueName: '2. division', divisionLevel: 3, baseRating: 67 },
  { id: 'naestved-bk', name: 'Næstved BK', logo: '🟢', leagueId: 'second-division', leagueName: '2. division', divisionLevel: 3, baseRating: 65 },
  { id: 'fc-roskilde', name: 'FC Roskilde', logo: '⚪', leagueId: 'second-division', leagueName: '2. division', divisionLevel: 3, baseRating: 64 },
  { id: 'thisted-fc', name: 'Thisted FC', logo: '🔵', leagueId: 'second-division', leagueName: '2. division', divisionLevel: 3, baseRating: 64 },
  { id: 'hellerup-ik', name: 'Hellerup IK', logo: '🟡', leagueId: 'second-division', leagueName: '2. division', divisionLevel: 3, baseRating: 63 },
  { id: 'fremad-amager', name: 'Fremad Amager', logo: '🔵', leagueId: 'second-division', leagueName: '2. division', divisionLevel: 3, baseRating: 66 },
  { id: 'vsk-aarhus', name: 'VSK Aarhus', logo: '🟢', leagueId: 'second-division', leagueName: '2. division', divisionLevel: 3, baseRating: 63 },
  { id: 'skive-ik', name: 'Skive IK', logo: '🔵', leagueId: 'second-division', leagueName: '2. division', divisionLevel: 3, baseRating: 62 },
  { id: 'brabrand-if', name: 'Brabrand IF', logo: '🟠', leagueId: 'second-division', leagueName: '2. division', divisionLevel: 3, baseRating: 62 },
  { id: 'ishoj-if', name: 'Ishøj IF', logo: '🟤', leagueId: 'second-division', leagueName: '2. division', divisionLevel: 3, baseRating: 61 },
  { id: 'fc-helsingor', name: 'FC Helsingør', logo: '⚫', leagueId: 'second-division', leagueName: '2. division', divisionLevel: 3, baseRating: 65 },

  { id: 'nykobing-fc', name: 'Nykøbing FC', logo: '🔵', leagueId: 'third-division', leagueName: '3. division', divisionLevel: 4, baseRating: 60 },
  { id: 'fa-2000', name: 'FA 2000', logo: '⚪', leagueId: 'third-division', leagueName: '3. division', divisionLevel: 4, baseRating: 59 },
  { id: 'naesby-bk', name: 'Næsby BK', logo: '🟡', leagueId: 'third-division', leagueName: '3. division', divisionLevel: 4, baseRating: 58 },
  { id: 'bronshoj-bk', name: 'Brønshøj BK', logo: '🟡', leagueId: 'third-division', leagueName: '3. division', divisionLevel: 4, baseRating: 60 },
  { id: 'vanlose-if', name: 'Vanløse IF', logo: '🔵', leagueId: 'third-division', leagueName: '3. division', divisionLevel: 4, baseRating: 58 },
  { id: 'horsholm-usserod-ik', name: 'Hørsholm-Usserød IK', logo: '🟢', leagueId: 'third-division', leagueName: '3. division', divisionLevel: 4, baseRating: 57 },
  { id: 'holbaek-bi', name: 'Holbæk B&I', logo: '🔵', leagueId: 'third-division', leagueName: '3. division', divisionLevel: 4, baseRating: 59 },
  { id: 'sundby-bk', name: 'Sundby BK', logo: '🔴', leagueId: 'third-division', leagueName: '3. division', divisionLevel: 4, baseRating: 57 },
  { id: 'frem-kobenhavn', name: 'Frem', logo: '⚪', leagueId: 'third-division', leagueName: '3. division', divisionLevel: 4, baseRating: 60 },
  { id: 'vejgaard-bk', name: 'Vejgaard BK', logo: '🟢', leagueId: 'third-division', leagueName: '3. division', divisionLevel: 4, baseRating: 56 },
  { id: 'odder-igf', name: 'Odder IGF', logo: '🔵', leagueId: 'third-division', leagueName: '3. division', divisionLevel: 4, baseRating: 56 },
  { id: 'if-lyseng', name: 'IF Lyseng', logo: '🟣', leagueId: 'third-division', leagueName: '3. division', divisionLevel: 4, baseRating: 57 },
];

export const SEASON_MATCH_COUNT = 22;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const hashString = (value: string) => {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
};

const buildPlayerSkills = (position: PlayerPosition, rating: number, seed: number) => {
  const variance = ((seed % 7) - 3);

  switch (position) {
    case 'GK':
      return {
        goalkeeping: clamp(rating + 8 + variance, 45, 95),
        defending: clamp(Math.round(rating * 0.55) + variance, 28, 72),
        playmaking: clamp(Math.round(rating * 0.45) + variance, 24, 68),
        finishing: clamp(Math.round(rating * 0.25) + variance, 10, 48),
      };
    case 'DF':
      return {
        goalkeeping: clamp(Math.round(rating * 0.2) + variance, 8, 38),
        defending: clamp(rating + 6 + variance, 38, 92),
        playmaking: clamp(Math.round(rating * 0.6) + variance, 26, 78),
        finishing: clamp(Math.round(rating * 0.35) + variance, 14, 60),
      };
    case 'MF':
      return {
        goalkeeping: clamp(Math.round(rating * 0.15) + variance, 8, 32),
        defending: clamp(Math.round(rating * 0.6) + variance, 24, 78),
        playmaking: clamp(rating + 7 + variance, 36, 93),
        finishing: clamp(Math.round(rating * 0.7) + variance, 24, 84),
      };
    case 'FW':
    default:
      return {
        goalkeeping: clamp(Math.round(rating * 0.1) + variance, 8, 28),
        defending: clamp(Math.round(rating * 0.35) + variance, 16, 58),
        playmaking: clamp(Math.round(rating * 0.65) + variance, 24, 82),
        finishing: clamp(rating + 8 + variance, 36, 95),
      };
  }
};

const createPlayer = (team: Omit<Team, 'players'>, position: PlayerPosition, squadIndex: number, adjustment: number): Player => {
  const seed = hashString(`${team.id}-${position}-${squadIndex}`);
  const name = `${FIRST_NAMES[seed % FIRST_NAMES.length]} ${LAST_NAMES[(seed >> 3) % LAST_NAMES.length]}`;
  const age = 18 + (seed % 17);
  const rating = clamp(team.baseRating + adjustment + ((seed % 5) - 2), 48, 85);
  const isForSale = squadIndex >= (position === 'GK' ? 1 : position === 'FW' ? 2 : 4);
  const skills = buildPlayerSkills(position, rating, seed);
  const ageFactor = age <= 22 ? 1.18 : age >= 31 ? 0.82 : 1;
  const divisionFactor = 1 + (5 - team.divisionLevel) * 0.08;
  const value = Math.round((rating * rating * 1450 * ageFactor * divisionFactor) / 1000) * 1000;

  return {
    id: `${team.id}-${position.toLowerCase()}-${squadIndex + 1}`,
    name,
    age,
    position,
    rating,
    value,
    isForSale,
    askingPrice: isForSale ? Math.round(value * 1.08 / 1000) * 1000 : undefined,
    ...skills,
  };
};

const createTeam = (teamDefinition: Omit<Team, 'players'>): Team => ({
  ...teamDefinition,
  players: SQUAD_BLUEPRINT.flatMap(({ position, adjustments }) =>
    adjustments.map((adjustment, index) => createPlayer(teamDefinition, position, index, adjustment))
  ),
});

const LEAGUE_META = {
  superliga: { name: 'Superliga', color: 'from-blue-500 to-blue-700' },
  'first-division': { name: '1. division', color: 'from-orange-500 to-orange-700' },
  'second-division': { name: '2. division', color: 'from-green-500 to-green-700' },
  'third-division': { name: '3. division', color: 'from-purple-500 to-purple-700' },
} as const;

const allTeams = TEAM_DEFINITIONS.map(createTeam);

export const leagues: League[] = Object.entries(LEAGUE_META).map(([leagueId, meta]) => ({
  id: leagueId,
  name: meta.name,
  color: meta.color,
  teams: allTeams.filter(team => team.leagueId === leagueId),
}));

export const getAllTeams = () => allTeams;

export const getTeamById = (teamId: string) => allTeams.find(team => team.id === teamId) ?? null;

export const createPlayerRecord = (players: Player[]) => players.reduce<Record<string, Player>>((acc, player) => {
  acc[player.id] = player;
  return acc;
}, {});

export const getTransferMarketPlayers = (selectedTeamId?: string, limit = 24): Player[] => allTeams
  .filter(team => team.id !== selectedTeamId)
  .flatMap(team => team.players)
  .filter(player => player.isForSale)
  .sort((a, b) => b.rating - a.rating || a.age - b.age)
  .slice(0, limit);

const getDifficulty = (selectedTeamRating: number, opponentRating: number): Match['difficulty'] => {
  const diff = opponentRating - selectedTeamRating;
  if (diff >= 4) return 'Svær';
  if (diff <= -4) return 'Nem';
  return 'Moderat';
};

export const createSeasonSchedule = (selectedTeam: Team, season: number): Match[] => {
  const league = leagues.find(entry => entry.id === selectedTeam.leagueId);
  if (!league) return [];

  const opponents = league.teams
    .filter(team => team.id !== selectedTeam.id)
    .sort((a, b) => hashString(`${selectedTeam.id}-${a.id}`) - hashString(`${selectedTeam.id}-${b.id}`));

  return opponents.flatMap((opponent, index) => {
    const firstLegHome = hashString(`${selectedTeam.id}-${opponent.id}`) % 2 === 0;
    const firstLeg: Match = {
      id: `${season}-${selectedTeam.id}-${opponent.id}-1`,
      opponentId: opponent.id,
      opponent: opponent.name,
      isHome: firstLegHome,
      difficulty: getDifficulty(selectedTeam.baseRating, opponent.baseRating),
      opponentRating: opponent.baseRating,
      round: index + 1,
      season,
    };

    const secondLeg: Match = {
      id: `${season}-${selectedTeam.id}-${opponent.id}-2`,
      opponentId: opponent.id,
      opponent: opponent.name,
      isHome: !firstLegHome,
      difficulty: getDifficulty(selectedTeam.baseRating, opponent.baseRating),
      opponentRating: opponent.baseRating,
      round: index + 1 + opponents.length,
      season,
    };

    return [firstLeg, secondLeg];
  }).sort((a, b) => a.round - b.round);
};
