import { MatchResult, PlayedMatch } from '../types/game';
import { Player } from '../types/players';
import { Team } from '../types/teams';

const seededFraction = (seedKey: string, salt: number): number => {
  const hash = [...seedKey].reduce((value, character, index) => (
    (value * 31 + character.charCodeAt(0) + salt + index) % 1000003
  ), 17 + salt);

  return (hash % 1000) / 1000;
};

const clampGoals = (value: number): number => Math.max(0, Math.min(6, Math.round(value)));

export const calculateSquadRating = (players: Player[]): number => {
  if (players.length === 0) {
    return 70;
  }

  const total = players.reduce((sum, player) => sum + player.rating, 0);
  return Number((total / players.length).toFixed(1));
};

export const simulateFixtureScore = (
  homeRating: number,
  awayRating: number,
  seedKey: string,
): { homeGoals: number; awayGoals: number } => {
  const adjustedHomeRating = homeRating + 3;
  const strengthDiff = adjustedHomeRating - awayRating;
  const homeBase = 1.1 + strengthDiff / 24;
  const awayBase = 0.9 - strengthDiff / 28;
  const homeGoals = clampGoals(homeBase + seededFraction(seedKey, 1) * 2.2 + seededFraction(seedKey, 3) * 0.8);
  const awayGoals = clampGoals(awayBase + seededFraction(seedKey, 2) * 2 + seededFraction(seedKey, 4) * 0.6);
  return { homeGoals, awayGoals };
};

export const getSelectedMatchResult = (selectedTeamId: string, homeTeamId: string, homeGoals: number, awayGoals: number): MatchResult => {
  const selectedGoals = selectedTeamId === homeTeamId ? homeGoals : awayGoals;
  const opponentGoals = selectedTeamId === homeTeamId ? awayGoals : homeGoals;

  if (selectedGoals > opponentGoals) {
    return 'WIN';
  }
  if (selectedGoals < opponentGoals) {
    return 'LOSS';
  }
  return 'DRAW';
};

export const createPlayedMatch = (
  fixtureId: string,
  week: number,
  homeTeam: Team,
  awayTeam: Team,
  selectedTeamId: string,
  homeGoals: number,
  awayGoals: number,
): PlayedMatch => {
  const isHome = selectedTeamId === homeTeam.id;
  return {
    id: `${fixtureId}-result`,
    fixtureId,
    week,
    homeTeamId: homeTeam.id,
    awayTeamId: awayTeam.id,
    homeTeamName: homeTeam.name,
    awayTeamName: awayTeam.name,
    homeGoals,
    awayGoals,
    selectedTeamId,
    opponentTeamId: isHome ? awayTeam.id : homeTeam.id,
    selectedTeamGoals: isHome ? homeGoals : awayGoals,
    opponentGoals: isHome ? awayGoals : homeGoals,
    isHome,
    result: getSelectedMatchResult(selectedTeamId, homeTeam.id, homeGoals, awayGoals),
  };
};
