import { Player } from './player';

export interface Team {
  id: string;
  name: string;
  logo: string;
  leagueId: string;
  leagueName: string;
  divisionLevel: number;
  baseRating: number;
  players: Player[];
}

export interface League {
  id: string;
  name: string;
  color: string;
  teams: Team[];
}
