import { getTeamRosterPlayers } from '../data/players';
import { getLeagueTeams, getTeamById } from '../data/teams';
import { LeagueMatchResult, LeagueStandingEntry, MatchResult, PlayedMatch } from '../types/game';
import { GameState } from '../types/gameState';
import { Player, PlayerPosition } from '../types/players';
import { Team } from '../types/teams';
import { createInitialStandings, sortStandings } from './leagueUtils';
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

const normalizePlayers = (players: unknown, selectedTeam: Team | null): Record<string, Player> => {
  if (typeof players !== 'object' || players === null) {
    return selectedTeam ? createPlayerRecord(getTeamRosterPlayers(selectedTeam.id)) : {};
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
      const id = player.id;
      const name = player.name;
      const age = player.age;
      const value = player.value;

      return normalizePlayer({
        id,
        teamId: typeof player.teamId === 'string' ? player.teamId : selectedTeam?.id ?? 'legacy-team',
        name,
        age,
        position,
        rating: typeof player.rating === 'number' ? player.rating : undefined,
        value,
        attributes: typeof player.attributes === 'object' && player.attributes !== null ? player.attributes as Player['attributes'] : undefined,
        isForSale: typeof player.isForSale === 'boolean' ? player.isForSale : false,
        askingPrice: typeof player.askingPrice === 'number' ? player.askingPrice : undefined,
      }, selectedTeam?.id ?? 'legacy-team');
    });

  if (normalizedPlayers.length > 0) {
    return createPlayerRecord(normalizedPlayers);
  }

  return selectedTeam ? createPlayerRecord(getTeamRosterPlayers(selectedTeam.id)) : {};
};

const normalizeStandingNumber = (value: unknown): number => (
  typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0
);

const normalizeStandings = (standings: unknown, selectedTeam: Team | null): LeagueStandingEntry[] => {
  if (!selectedTeam) {
    return [];
  }

  const baseStandings = createInitialStandings(getLeagueTeams(selectedTeam.leagueId));
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

    merged.set(teamId, {
      ...baseEntry,
      played: normalizeStandingNumber((entry as Record<string, unknown>).played),
      wins: normalizeStandingNumber((entry as Record<string, unknown>).wins),
      draws: normalizeStandingNumber((entry as Record<string, unknown>).draws),
      losses: normalizeStandingNumber((entry as Record<string, unknown>).losses),
      goalsFor: normalizeStandingNumber((entry as Record<string, unknown>).goalsFor),
      goalsAgainst: normalizeStandingNumber((entry as Record<string, unknown>).goalsAgainst),
      goalDifference: typeof (entry as Record<string, unknown>).goalDifference === 'number'
        ? Math.round((entry as Record<string, number>).goalDifference)
        : normalizeStandingNumber((entry as Record<string, unknown>).goalsFor) - normalizeStandingNumber((entry as Record<string, unknown>).goalsAgainst),
      points: normalizeStandingNumber((entry as Record<string, unknown>).points),
    });
  });

  return sortStandings([...merged.values()]);
};

const normalizeCompletedFixtureIds = (fixtureIds: unknown): string[] => (
  Array.isArray(fixtureIds)
    ? fixtureIds.filter((fixtureId): fixtureId is string => typeof fixtureId === 'string')
    : []
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

export const initialGameState: GameState = {
  selectedTeam: null,
  budget: 1000000,
  players: {},
  fanCount: 1200,
  stadiumCapacity: 3000,
  fanMood: 50,
  week: 1,
  leagueStandings: [],
  matchHistory: [],
  leagueResults: [],
  completedFixtureIds: [],
};

export const normalizeGameState = (savedState: unknown): GameState => {
  if (typeof savedState !== 'object' || savedState === null) {
    return initialGameState;
  }

  const selectedTeam = normalizeSelectedTeam((savedState as Record<string, unknown>).selectedTeam);
  return {
    selectedTeam,
    budget: typeof (savedState as Record<string, unknown>).budget === 'number' ? Math.max(0, Math.round((savedState as Record<string, number>).budget)) : initialGameState.budget,
    players: normalizePlayers((savedState as Record<string, unknown>).players, selectedTeam),
    fanCount: typeof (savedState as Record<string, unknown>).fanCount === 'number' ? Math.max(0, Math.round((savedState as Record<string, number>).fanCount)) : initialGameState.fanCount,
    stadiumCapacity: typeof (savedState as Record<string, unknown>).stadiumCapacity === 'number' ? Math.max(1000, Math.round((savedState as Record<string, number>).stadiumCapacity)) : initialGameState.stadiumCapacity,
    fanMood: typeof (savedState as Record<string, unknown>).fanMood === 'number' ? Math.min(100, Math.max(0, Math.round((savedState as Record<string, number>).fanMood))) : initialGameState.fanMood,
    week: typeof (savedState as Record<string, unknown>).week === 'number' ? Math.max(1, Math.round((savedState as Record<string, number>).week)) : initialGameState.week,
    leagueStandings: normalizeStandings((savedState as Record<string, unknown>).leagueStandings, selectedTeam),
    matchHistory: normalizeMatchHistory((savedState as Record<string, unknown>).matchHistory),
    leagueResults: normalizeLeagueResults((savedState as Record<string, unknown>).leagueResults),
    completedFixtureIds: normalizeCompletedFixtureIds((savedState as Record<string, unknown>).completedFixtureIds),
  };
};
