export type PlayerPosition = 'GK' | 'DF' | 'MF' | 'FW';

export interface Player {
  id: string;
  name: string;
  age: number;
  position: PlayerPosition;
  rating: number;
  value: number;
  isForSale: boolean;
  askingPrice?: number;
  goalkeeping: number;
  defending: number;
  playmaking: number;
  finishing: number;
}
