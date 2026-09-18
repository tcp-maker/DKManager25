export type PlayerPosition = 'GK' | 'DF' | 'MF' | 'FW';

export interface PlayerAttributes {
  pace: number;
  shooting: number;
  passing: number;
  defending: number;
  dribbling: number;
  physical: number;
  goalkeeping: number;
}

export interface Player {
  id: string;
  teamId: string;
  name: string;
  age: number;
  position: PlayerPosition;
  rating: number;
  value: number;
  attributes: PlayerAttributes;
  isForSale: boolean;
  askingPrice?: number;
}

export interface SeedPlayer {
  id: string;
  teamId: string;
  name: string;
  age: number;
  position: PlayerPosition;
  value: number;
  attributes: PlayerAttributes;
}

export const ATTRIBUTE_KEYS: Array<keyof PlayerAttributes> = [
  'pace',
  'shooting',
  'passing',
  'defending',
  'dribbling',
  'physical',
  'goalkeeping',
];
