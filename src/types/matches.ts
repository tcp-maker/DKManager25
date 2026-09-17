export interface Match {
  id: string;
  opponentId: string;
  opponent: string;
  isHome: boolean;
  difficulty: 'Nem' | 'Moderat' | 'Svær';
  opponentRating: number;
  round: number;
  season: number;
}

export interface PlayedMatch extends Match {
  result: 'WIN' | 'DRAW' | 'LOSS';
  homeGoals: number;
  awayGoals: number;
  date: number;
}
