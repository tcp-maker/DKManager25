export interface Team {
  id: string;
  leagueId: string;
  name: string;
  logo: string;
  strength: number;
}

export interface League {
  id: string;
  name: string;
  color: string;
}
