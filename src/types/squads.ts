import type { Player } from './player';

export interface Squad {
  clubId: string;
  players: Player[];
}

export interface SquadState {
  clubId: Squad['clubId'];
  players: Record<string, Player>;
}
