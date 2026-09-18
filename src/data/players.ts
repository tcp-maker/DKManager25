import { TEAMS } from './teams';
import { Player, PlayerAttributes, PlayerPosition, SeedPlayer } from '../types/players';
import { hydrateSeedPlayer, clampAttributeValue } from '../utils/playerUtils';

const FIRST_NAMES = [
  'Mikkel', 'Andreas', 'Jonas', 'Magnus', 'Rasmus', 'Emil', 'Mathias', 'Lucas', 'Frederik', 'Oliver',
  'Noah', 'Victor', 'Tobias', 'Malthe', 'Anton', 'Oscar', 'August', 'William', 'Sebastian', 'Nikolaj',
  'Kasper', 'Patrick', 'Simon', 'Kristian', 'Jesper', 'Mads', 'Lasse', 'Alexander', 'Filip', 'Gustav',
];

const LAST_NAMES = [
  'Jensen', 'Nielsen', 'Hansen', 'Pedersen', 'Andersen', 'Christensen', 'Larsen', 'Sørensen', 'Rasmussen', 'Jørgensen',
  'Madsen', 'Kristensen', 'Olsen', 'Thomsen', 'Poulsen', 'Knudsen', 'Mortensen', 'Bach', 'Holm', 'Frandsen',
  'Møller', 'Bundgaard', 'Winther', 'Lund', 'Iversen', 'Schmidt', 'Bruun', 'Mikkelsen', 'Bertelsen', 'Kjær',
];

const ROSTER_TEMPLATE: Array<{ position: PlayerPosition; age: number; qualityModifier: number; profile: PlayerAttributes }> = [
  { position: 'GK', age: 29, qualityModifier: 2, profile: { pace: 34, shooting: 18, passing: 51, defending: 26, dribbling: 31, physical: 66, goalkeeping: 82 } },
  { position: 'GK', age: 22, qualityModifier: -5, profile: { pace: 37, shooting: 20, passing: 45, defending: 23, dribbling: 35, physical: 62, goalkeeping: 73 } },
  { position: 'DF', age: 30, qualityModifier: 3, profile: { pace: 64, shooting: 32, passing: 58, defending: 81, dribbling: 50, physical: 77, goalkeeping: 10 } },
  { position: 'DF', age: 28, qualityModifier: 1, profile: { pace: 67, shooting: 34, passing: 61, defending: 77, dribbling: 53, physical: 74, goalkeeping: 9 } },
  { position: 'DF', age: 25, qualityModifier: 0, profile: { pace: 70, shooting: 35, passing: 56, defending: 74, dribbling: 58, physical: 73, goalkeeping: 11 } },
  { position: 'DF', age: 21, qualityModifier: -3, profile: { pace: 69, shooting: 31, passing: 54, defending: 71, dribbling: 55, physical: 68, goalkeeping: 8 } },
  { position: 'MF', age: 29, qualityModifier: 3, profile: { pace: 68, shooting: 63, passing: 80, defending: 61, dribbling: 76, physical: 70, goalkeeping: 8 } },
  { position: 'MF', age: 27, qualityModifier: 1, profile: { pace: 71, shooting: 60, passing: 75, defending: 57, dribbling: 73, physical: 67, goalkeeping: 8 } },
  { position: 'MF', age: 24, qualityModifier: 0, profile: { pace: 72, shooting: 58, passing: 72, defending: 55, dribbling: 71, physical: 65, goalkeeping: 7 } },
  { position: 'MF', age: 20, qualityModifier: -4, profile: { pace: 74, shooting: 54, passing: 68, defending: 50, dribbling: 69, physical: 62, goalkeeping: 6 } },
  { position: 'FW', age: 28, qualityModifier: 4, profile: { pace: 79, shooting: 83, passing: 63, defending: 31, dribbling: 79, physical: 74, goalkeeping: 5 } },
  { position: 'FW', age: 25, qualityModifier: 1, profile: { pace: 81, shooting: 78, passing: 61, defending: 30, dribbling: 76, physical: 70, goalkeeping: 5 } },
  { position: 'FW', age: 21, qualityModifier: -2, profile: { pace: 84, shooting: 72, passing: 58, defending: 28, dribbling: 74, physical: 67, goalkeeping: 4 } },
];

const variation = (teamIndex: number, slotIndex: number, attributeIndex: number): number => (
  ((teamIndex + 1) * 7 + slotIndex * 5 + attributeIndex * 3) % 7
) - 3;

const buildAttributes = (
  baseProfile: PlayerAttributes,
  teamStrength: number,
  qualityModifier: number,
  teamIndex: number,
  slotIndex: number,
): PlayerAttributes => {
  const strengthOffset = teamStrength - 70 + qualityModifier;
  return {
    pace: clampAttributeValue(baseProfile.pace + strengthOffset + variation(teamIndex, slotIndex, 0)),
    shooting: clampAttributeValue(baseProfile.shooting + strengthOffset + variation(teamIndex, slotIndex, 1)),
    passing: clampAttributeValue(baseProfile.passing + strengthOffset + variation(teamIndex, slotIndex, 2)),
    defending: clampAttributeValue(baseProfile.defending + strengthOffset + variation(teamIndex, slotIndex, 3)),
    dribbling: clampAttributeValue(baseProfile.dribbling + strengthOffset + variation(teamIndex, slotIndex, 4)),
    physical: clampAttributeValue(baseProfile.physical + strengthOffset + variation(teamIndex, slotIndex, 5)),
    goalkeeping: clampAttributeValue(baseProfile.goalkeeping + strengthOffset + variation(teamIndex, slotIndex, 6)),
  };
};

const buildName = (teamIndex: number, slotIndex: number): string => {
  const firstName = FIRST_NAMES[(teamIndex * 5 + slotIndex * 2) % FIRST_NAMES.length];
  const lastName = LAST_NAMES[(teamIndex * 7 + slotIndex * 3) % LAST_NAMES.length];
  return `${firstName} ${lastName}`;
};

const buildValue = (teamStrength: number, qualityModifier: number, position: PlayerPosition, age: number): number => {
  const positionMultiplier: Record<PlayerPosition, number> = { GK: 8500, DF: 9300, MF: 9800, FW: 10500 };
  const ageAdjustment = age <= 23 ? 1.08 : age >= 29 ? 0.92 : 1;
  return Math.max(175000, Math.round((teamStrength + qualityModifier + 8) * positionMultiplier[position] * ageAdjustment));
};

const createTeamPlayers = (): SeedPlayer[] => TEAMS.flatMap((team, teamIndex) => (
  ROSTER_TEMPLATE.map((slot, slotIndex) => ({
    id: `${team.id}-${slotIndex + 1}`,
    teamId: team.id,
    name: buildName(teamIndex, slotIndex),
    age: slot.age,
    position: slot.position,
    value: buildValue(team.strength, slot.qualityModifier, slot.position, slot.age),
    attributes: buildAttributes(slot.profile, team.strength, slot.qualityModifier, teamIndex, slotIndex),
  }))
));

const TRANSFER_MARKET_SEEDS: SeedPlayer[] = [
  {
    id: 'transfer-1',
    teamId: 'transfer-market',
    name: 'Pione Sisto',
    age: 29,
    position: 'FW',
    value: 690000,
    attributes: { pace: 84, shooting: 78, passing: 71, defending: 32, dribbling: 86, physical: 67, goalkeeping: 5 },
  },
  {
    id: 'transfer-2',
    teamId: 'transfer-market',
    name: 'Paul Onuachu',
    age: 32,
    position: 'FW',
    value: 820000,
    attributes: { pace: 70, shooting: 84, passing: 60, defending: 35, dribbling: 72, physical: 88, goalkeeping: 4 },
  },
  {
    id: 'transfer-3',
    teamId: 'transfer-market',
    name: 'Magnus Andersen',
    age: 26,
    position: 'MF',
    value: 560000,
    attributes: { pace: 72, shooting: 66, passing: 77, defending: 58, dribbling: 74, physical: 67, goalkeeping: 6 },
  },
  {
    id: 'transfer-4',
    teamId: 'transfer-market',
    name: 'Nicolai Vallys',
    age: 28,
    position: 'MF',
    value: 620000,
    attributes: { pace: 74, shooting: 69, passing: 79, defending: 54, dribbling: 78, physical: 65, goalkeeping: 5 },
  },
  {
    id: 'transfer-5',
    teamId: 'transfer-market',
    name: 'Jesper Hansen',
    age: 39,
    position: 'GK',
    value: 380000,
    attributes: { pace: 36, shooting: 20, passing: 52, defending: 25, dribbling: 37, physical: 61, goalkeeping: 79 },
  },
  {
    id: 'transfer-6',
    teamId: 'transfer-market',
    name: 'Mads Lauritsen',
    age: 24,
    position: 'DF',
    value: 470000,
    attributes: { pace: 68, shooting: 38, passing: 61, defending: 76, dribbling: 57, physical: 75, goalkeeping: 8 },
  },
];

const TEAM_PLAYER_SEEDS = createTeamPlayers();
const ALL_PLAYER_SEEDS = [...TEAM_PLAYER_SEEDS, ...TRANSFER_MARKET_SEEDS];

export const PLAYER_DATABASE = ALL_PLAYER_SEEDS.reduce<Record<string, Player>>((accumulator, player) => {
  accumulator[player.id] = hydrateSeedPlayer(player);
  return accumulator;
}, {});

export const TEAM_ROSTERS = TEAMS.reduce<Record<string, string[]>>((accumulator, team) => {
  accumulator[team.id] = TEAM_PLAYER_SEEDS
    .filter((player) => player.teamId === team.id)
    .map((player) => player.id);
  return accumulator;
}, {});

export const TRANSFER_MARKET_PLAYER_IDS = TRANSFER_MARKET_SEEDS.map((player) => player.id);

export const getPlayerById = (playerId: string): Player | null => PLAYER_DATABASE[playerId] ?? null;

export const getPlayersByIds = (playerIds: string[]): Player[] => (
  playerIds
    .map((playerId) => getPlayerById(playerId))
    .filter((player): player is Player => player !== null)
);

export const getTeamRosterPlayers = (teamId: string): Player[] => getPlayersByIds(TEAM_ROSTERS[teamId] ?? []);

export const getTransferMarketPlayers = (): Player[] => getPlayersByIds(TRANSFER_MARKET_PLAYER_IDS);

export const getLeagueTransferShortlist = (_leagueId: string, _selectedTeamId: string): Player[] => (
  getTransferMarketPlayers()
);
