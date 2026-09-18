import { LeagueMatchResult, PlayedMatch, LeagueStandingEntry } from './game';
import { Player } from './players';
import { Team } from './teams';

export interface GameState {
  selectedTeam: Team | null;
  budget: number;
  players: Record<string, Player>;
  marketPlayers: Record<string, Player>;
  fanCount: number;
  stadiumCapacity: number;
  fanMood: number;
  week: number;
  leagueStandings: LeagueStandingEntry[];
  matchHistory: PlayedMatch[];
  latestMatchResult: PlayedMatch | null;
  leagueResults: LeagueMatchResult[];
  completedFixtureIds: string[];
}
