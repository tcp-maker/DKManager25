import { getLeagueTransferShortlist, getTeamRosterPlayers } from '../data/players';
import { getLeagueTeams, getTeamById } from '../data/teams';
import { LeagueMatchResult, LeagueStandingEntry, MatchResult, PlayedMatch } from '../types/game';
import { GameState } from '../types/gameState';
import { Player, PlayerPosition } from '../types/players';
import { Team } from '../types/teams';
import { applyMatchToStandings, createInitialStandings, sortStandings } from './leagueUtils';
import { normalizePlayer } from './playerUtils';

const isPlayerPosition = (value: unknown): value is PlayerPosition => (
  value === 'GK' || value === 'DF' || value === 'MF' || value === 'FW'
);

interface NormalizablePlayerRecord extends Record<string, unknown> {
  id: string;
  name: string;
  age: number;
  position: PlayerPosition;
  value: number;
}

interface NormalizableLeagueResultRecord extends Record<string, unknown> {
  id: string;
  fixtureId: string;
  week: number;
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName: string;
  awayTeamName: string;
  homeGoals: number;
  awayGoals: number;
}

interface NormalizableMatchRecord extends NormalizableLeagueResultRecord {
  selectedTeamId: string;
  opponentTeamId: string;
  selectedTeamGoals: number;
  opponentGoals: number;
  isHome: boolean;
  result: MatchResult;
}

const createPlayerRecord = (players: Player[]): Record<string, Player> => (
  players.reduce<Record<string, Player>>((accumulator, player) => {
    accumulator[player.id] = player;
    return accumulator;
  }, {})
);

const normalizeSelectedTeam = (selectedTeam: unknown): Team | null => {
  const teamId = typeof selectedTeam === 'object' && selectedTeam !== null && 'id' in selectedTeam
    ? String((selectedTeam as { id: string }).id)
    : null;

  return getTeamById(teamId);
};

const normalizePlayerRecord = (players: unknown, fallbackTeamId: string): Record<string, Player> => {
  if (typeof players !== 'object' || players === null) {
    return {};
  }

  const normalizedPlayers = Object.values(players)
    .filter((player): player is Record<string, unknown> => typeof player === 'object' && player !== null)
    .filter((player): player is NormalizablePlayerRecord => (
      typeof player.id === 'string'
      && typeof player.name === 'string'
      && typeof player.age === 'number'
      && typeof player.value === 'number'
      && isPlayerPosition(player.position)
    ))
    .map((player) => {
      const position = player.position;
      return normalizePlayer({
        id: player.id,
        teamId: typeof player.teamId === 'string' ? player.teamId : fallbackTeamId,
        name: player.name,
        age: player.age,
        position,
        rating: typeof player.rating === 'number' ? player.rating : undefined,
        value: player.value,
        attributes: typeof player.attributes === 'object' && player.attributes !== null ? player.attributes as Player['attributes'] : undefined,
        isForSale: typeof player.isForSale === 'boolean' ? player.isForSale : false,
        askingPrice: typeof player.askingPrice === 'number' ? player.askingPrice : undefined,
      }, fallbackTeamId);
    });

  return createPlayerRecord(normalizedPlayers);
};

const normalizePlayers = (players: unknown, selectedTeam: Team | null): Record<string, Player> => {
  if (!selectedTeam) {
    return {};
  }

  const normalizedPlayers = normalizePlayerRecord(players, selectedTeam.id);
  return Object.keys(normalizedPlayers).length > 0
    ? normalizedPlayers
    : createPlayerRecord(getTeamRosterPlayers(selectedTeam.id));
};

const normalizeMarketPlayers = (marketPlayers: unknown, selectedTeam: Team | null): Record<string, Player> => {
  if (!selectedTeam) {
    return {};
  }

  const normalizedMarketPlayers = normalizePlayerRecord(marketPlayers, 'transfer-market');
  if (Object.keys(normalizedMarketPlayers).length > 0) {
    return normalizedMarketPlayers;
  }

  return createPlayerRecord(getLeagueTransferShortlist(selectedTeam.leagueId, selectedTeam.id));
};

const normalizeStandingNumber = (value: unknown): number => (
  typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0
);

const isMatchResult = (value: unknown): value is MatchResult => (
  value === 'WIN' || value === 'DRAW' || value === 'LOSS'
);

const normalizeLeagueResults = (leagueResults: unknown): LeagueMatchResult[] => {
  if (!Array.isArray(leagueResults)) {
    return [];
  }

  return leagueResults
    .filter((entry): entry is Record<string, unknown> => typeof entry === 'object' && entry !== null)
    .filter((entry): entry is NormalizableLeagueResultRecord => (
      typeof entry.id === 'string'
      && typeof entry.fixtureId === 'string'
      && typeof entry.week === 'number'
      && typeof entry.homeTeamId === 'string'
      && typeof entry.awayTeamId === 'string'
      && typeof entry.homeTeamName === 'string'
      && typeof entry.awayTeamName === 'string'
      && typeof entry.homeGoals === 'number'
      && typeof entry.awayGoals === 'number'
    ))
    .map((entry) => ({
      id: entry.id,
      fixtureId: entry.fixtureId,
      week: Math.max(1, Math.round(entry.week)),
      homeTeamId: entry.homeTeamId,
      awayTeamId: entry.awayTeamId,
      homeTeamName: entry.homeTeamName,
      awayTeamName: entry.awayTeamName,
      homeGoals: Math.max(0, Math.round(entry.homeGoals)),
      awayGoals: Math.max(0, Math.round(entry.awayGoals)),
    }));
};

const normalizeMatchHistory = (matchHistory: unknown): PlayedMatch[] => {
  if (!Array.isArray(matchHistory)) {
    return [];
  }

  return matchHistory
    .filter((entry): entry is Record<string, unknown> => typeof entry === 'object' && entry !== null)
    .filter((entry): entry is NormalizableMatchRecord => (
      typeof entry.id === 'string'
      && typeof entry.fixtureId === 'string'
      && typeof entry.week === 'number'
      && typeof entry.homeTeamId === 'string'
      && typeof entry.awayTeamId === 'string'
      && typeof entry.homeTeamName === 'string'
      && typeof entry.awayTeamName === 'string'
      && typeof entry.homeGoals === 'number'
      && typeof entry.awayGoals === 'number'
      && typeof entry.selectedTeamId === 'string'
      && typeof entry.opponentTeamId === 'string'
      && typeof entry.selectedTeamGoals === 'number'
      && typeof entry.opponentGoals === 'number'
      && typeof entry.isHome === 'boolean'
      && isMatchResult(entry.result)
    ))
    .map((entry) => ({
      id: entry.id,
      fixtureId: entry.fixtureId,
      week: Math.max(1, Math.round(entry.week)),
      homeTeamId: entry.homeTeamId,
      awayTeamId: entry.awayTeamId,
      homeTeamName: entry.homeTeamName,
      awayTeamName: entry.awayTeamName,
      homeGoals: Math.max(0, Math.round(entry.homeGoals)),
      awayGoals: Math.max(0, Math.round(entry.awayGoals)),
      selectedTeamId: entry.selectedTeamId,
      opponentTeamId: entry.opponentTeamId,
      selectedTeamGoals: Math.max(0, Math.round(entry.selectedTeamGoals)),
      opponentGoals: Math.max(0, Math.round(entry.opponentGoals)),
      isHome: entry.isHome,
      result: entry.result,
    }));
};

const normalizeStandings = (
  standings: unknown,
  leagueResults: LeagueMatchResult[],
  selectedTeam: Team | null,
): LeagueStandingEntry[] => {
  if (!selectedTeam) {
    return [];
  }

  const baseStandings = createInitialStandings(getLeagueTeams(selectedTeam.leagueId));
  if (leagueResults.length > 0) {
    return leagueResults.reduce((currentStandings, result) => (
      applyMatchToStandings(currentStandings, result.homeTeamId, result.awayTeamId, result.homeGoals, result.awayGoals)
    ), baseStandings);
  }

  if (!Array.isArray(standings)) {
    return baseStandings;
  }

  const merged = new Map(baseStandings.map((entry) => [entry.teamId, entry]));
  standings.forEach((entry) => {
    if (typeof entry !== 'object' || entry === null || !('teamId' in entry)) {
      return;
    }

    const teamId = String(entry.teamId);
    const baseEntry = merged.get(teamId);
    if (!baseEntry) {
      return;
    }

    const wins = normalizeStandingNumber((entry as Record<string, unknown>).wins);
    const draws = normalizeStandingNumber((entry as Record<string, unknown>).draws);
    const losses = normalizeStandingNumber((entry as Record<string, unknown>).losses);
    const goalsFor = normalizeStandingNumber((entry as Record<string, unknown>).goalsFor);
    const goalsAgainst = normalizeStandingNumber((entry as Record<string, unknown>).goalsAgainst);

    merged.set(teamId, {
      ...baseEntry,
      played: wins + draws + losses,
      wins,
      draws,
      losses,
      goalsFor,
      goalsAgainst,
      goalDifference: goalsFor - goalsAgainst,
      points: wins * 3 + draws,
    });
  });

  return sortStandings([...merged.values()]);
};

const normalizeCompletedFixtureIds = (fixtureIds: unknown): string[] => (
  Array.isArray(fixtureIds)
    ? fixtureIds.filter((fixtureId): fixtureId is string => typeof fixtureId === 'string')
    : []
);

export const initialGameState: GameState = {
  selectedTeam: null,
  budget: 1000000,
  players: {},
  marketPlayers: {},
  fanCount: 1200,
  stadiumCapacity: 3000,
  fanMood: 50,
  week: 1,
  leagueStandings: [],
  matchHistory: [],
  latestMatchResult: null,
  leagueResults: [],
  completedFixtureIds: [],
};

export const normalizeGameState = (savedState: unknown): GameState => {
  if (typeof savedState !== 'object' || savedState === null) {
    return initialGameState;
  }

  const state = savedState as Record<string, unknown>;
  const selectedTeam = normalizeSelectedTeam(state.selectedTeam);
  const matchHistory = normalizeMatchHistory(state.matchHistory);
  const leagueResults = normalizeLeagueResults(state.leagueResults);

  return {
    selectedTeam,
    budget: typeof state.budget === 'number' ? Math.max(0, Math.round(state.budget)) : initialGameState.budget,
    players: normalizePlayers(state.players, selectedTeam),
    marketPlayers: normalizeMarketPlayers(state.marketPlayers, selectedTeam),
    fanCount: typeof state.fanCount === 'number' ? Math.max(0, Math.round(state.fanCount)) : initialGameState.fanCount,
    stadiumCapacity: typeof state.stadiumCapacity === 'number' ? Math.max(1000, Math.round(state.stadiumCapacity)) : initialGameState.stadiumCapacity,
    fanMood: typeof state.fanMood === 'number' ? Math.min(100, Math.max(0, Math.round(state.fanMood))) : initialGameState.fanMood,
    week: typeof state.week === 'number' ? Math.max(1, Math.round(state.week)) : initialGameState.week,
    leagueStandings: normalizeStandings(state.leagueStandings, leagueResults, selectedTeam),
    matchHistory,
    latestMatchResult: matchHistory[0] ?? null,
    leagueResults,
    completedFixtureIds: normalizeCompletedFixtureIds(state.completedFixtureIds),
  };
};
