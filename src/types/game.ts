export type MatchResult = 'WIN' | 'DRAW' | 'LOSS';

export interface LeagueStandingEntry {
  teamId: string;
  teamName: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export interface LeagueFixture {
  id: string;
  leagueId: string;
  week: number;
  homeTeamId: string;
  awayTeamId: string;
}

export interface PlayedMatch {
  id: string;
  fixtureId: string;
  week: number;
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName: string;
  awayTeamName: string;
  homeGoals: number;
  awayGoals: number;
  selectedTeamId: string;
  opponentTeamId: string;
  selectedTeamGoals: number;
  opponentGoals: number;
  isHome: boolean;
  result: MatchResult;
}
