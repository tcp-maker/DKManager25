export interface Team {
  id: string;
  name: string;
  logo: string;
}

export interface LeagueTeam extends Team {
  rating: number;
}

export interface League {
  id: string;
  name: string;
  color: string;
  teams: LeagueTeam[];
}

export interface LeagueFixture {
  id: string;
  leagueId: string;
  season: number;
  week: number;
  homeTeam: LeagueTeam;
  awayTeam: LeagueTeam;
}

export interface LeagueMatchResult {
  id: string;
  leagueId: string;
  season: number;
  week: number;
  homeTeamId: string;
  awayTeamId: string;
  homeGoals: number;
  awayGoals: number;
}

export interface LeagueStanding {
  position: number;
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
