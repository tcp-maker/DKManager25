import { getTeamRosterPlayers } from '../data/players';
import { getLeagueTeams, getTeamById } from '../data/teams';
import { LeagueStandingEntry } from '../types/game';
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

const normalizeMatchHistory = (matchHistory: unknown) => (
  Array.isArray(matchHistory)
    ? matchHistory.filter((entry): entry is GameState['matchHistory'][number] => typeof entry === 'object' && entry !== null)
    : []
);

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
    completedFixtureIds: normalizeCompletedFixtureIds((savedState as Record<string, unknown>).completedFixtureIds),
  };
};
