import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Team } from '../types/teams';
import { ALL_TEAMS, TEAM_BY_ID } from '../data/leagues';

export interface PlayerAbilities {
  pace: number;
  shooting: number;
  passing: number;
  defending: number;
  physical: number;
  goalkeeping?: number;
}

export interface Player extends PlayerAbilities {
  id: string;
  name: string;
  age: number;
  position: 'GK' | 'DF' | 'MF' | 'FW';
  rating: number;
  value: number;
  isForSale: boolean;
  askingPrice?: number;
}

export interface LeagueTableEntry {
  team: Team;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
}

interface GameState {
  selectedTeam: Team | null;
  budget: number;
  players: Record<string, Player>;
  fanCount: number;
  stadiumCapacity: number;
  fanMood: number;
  week: number;
  leagueTable: Record<string, LeagueTableEntry>;
  registeredMatchIds: string[];
}

interface MatchResultInput {
  matchId: string;
  opponentTeamId: string;
  goalsFor: number;
  goalsAgainst: number;
}

interface GameContextType {
  gameState: GameState;
  selectTeam: (team: Team) => void;
  addPlayer: (player: Player) => boolean;
  sellPlayer: (playerId: string) => void;
  updatePlayer: (playerId: string, updates: Partial<Player>) => void;
  upgradeStadium: () => void;
  handleNextWeek: () => number;
  registerMatchResult: (result: MatchResultInput) => boolean;
  resetGame: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

const clampAbility = (value: number): number => Math.max(1, Math.min(99, Math.round(value)));

const calculateBaseAbility = (rating: number, offset: number): number => clampAbility(rating + offset);

const normalizePlayer = (player: Partial<Player> & Pick<Player, 'id' | 'name' | 'age' | 'position' | 'rating' | 'value' | 'isForSale'>): Player => {
  const abilityDefaults = {
    pace: calculateBaseAbility(player.rating, player.position === 'FW' ? 5 : player.position === 'MF' ? 2 : -2),
    shooting: calculateBaseAbility(player.rating, player.position === 'FW' ? 6 : player.position === 'MF' ? 1 : -7),
    passing: calculateBaseAbility(player.rating, player.position === 'MF' ? 6 : player.position === 'DF' ? 1 : -2),
    defending: calculateBaseAbility(player.rating, player.position === 'DF' ? 7 : player.position === 'MF' ? 1 : -9),
    physical: calculateBaseAbility(player.rating, player.position === 'DF' ? 4 : player.position === 'FW' ? 3 : 1),
    goalkeeping: player.position === 'GK' ? calculateBaseAbility(player.rating, 8) : undefined,
  };

  return {
    ...player,
    pace: clampAbility(player.pace ?? abilityDefaults.pace),
    shooting: clampAbility(player.shooting ?? abilityDefaults.shooting),
    passing: clampAbility(player.passing ?? abilityDefaults.passing),
    defending: clampAbility(player.defending ?? abilityDefaults.defending),
    physical: clampAbility(player.physical ?? abilityDefaults.physical),
    goalkeeping: player.position === 'GK'
      ? clampAbility(player.goalkeeping ?? abilityDefaults.goalkeeping ?? player.rating)
      : undefined,
  };
};

const buildInitialLeagueTable = (): Record<string, LeagueTableEntry> => {
  return ALL_TEAMS.reduce((acc, team) => {
    acc[team.id] = {
      team,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      points: 0,
    };
    return acc;
  }, {} as Record<string, LeagueTableEntry>);
};

const mergeLeagueTable = (stored: unknown): Record<string, LeagueTableEntry> => {
  const merged = buildInitialLeagueTable();

  if (!stored || typeof stored !== 'object') {
    return merged;
  }

  Object.entries(stored as Record<string, unknown>).forEach(([teamId, rawEntry]) => {
    const fallbackTeam = TEAM_BY_ID[teamId];
    if (!fallbackTeam || !rawEntry || typeof rawEntry !== 'object') {
      return;
    }

    const entry = rawEntry as Partial<LeagueTableEntry>;
    merged[teamId] = {
      team: fallbackTeam,
      played: typeof entry.played === 'number' ? entry.played : 0,
      wins: typeof entry.wins === 'number' ? entry.wins : 0,
      draws: typeof entry.draws === 'number' ? entry.draws : 0,
      losses: typeof entry.losses === 'number' ? entry.losses : 0,
      goalsFor: typeof entry.goalsFor === 'number' ? entry.goalsFor : 0,
      goalsAgainst: typeof entry.goalsAgainst === 'number' ? entry.goalsAgainst : 0,
      points: typeof entry.points === 'number' ? entry.points : 0,
    };
  });

  return merged;
};

const migratePlayers = (rawPlayers: unknown): Record<string, Player> => {
  if (!rawPlayers || typeof rawPlayers !== 'object') {
    return {};
  }

  const migratedPlayers: Record<string, Player> = {};

  Object.entries(rawPlayers as Record<string, unknown>).forEach(([id, rawPlayer]) => {
    if (!rawPlayer || typeof rawPlayer !== 'object') {
      return;
    }

    const player = rawPlayer as Partial<Player>;

    if (
      typeof player.name !== 'string' ||
      typeof player.age !== 'number' ||
      (player.position !== 'GK' && player.position !== 'DF' && player.position !== 'MF' && player.position !== 'FW') ||
      typeof player.rating !== 'number' ||
      typeof player.value !== 'number' ||
      typeof player.isForSale !== 'boolean'
    ) {
      return;
    }

    migratedPlayers[id] = normalizePlayer({
      ...player,
      id,
      name: player.name,
      age: player.age,
      position: player.position,
      rating: player.rating,
      value: player.value,
      isForSale: player.isForSale,
      askingPrice: typeof player.askingPrice === 'number' ? player.askingPrice : undefined,
    });
  });

  return migratedPlayers;
};

// Dummy spillere til start
const generateDummyPlayers = (): Record<string, Player> => {
  const players: Player[] = [
    normalizePlayer({ id: '1', name: 'Peter Vindahl', age: 28, position: 'GK', rating: 78, value: 500000, isForSale: false, goalkeeping: 85 }),
    normalizePlayer({ id: '2', name: 'Karl-Johan Johnsson', age: 34, position: 'GK', rating: 75, value: 300000, isForSale: true, askingPrice: 350000, goalkeeping: 82 }),

    normalizePlayer({ id: '3', name: 'Henrik Dalsgaard', age: 31, position: 'DF', rating: 79, value: 600000, isForSale: false }),
    normalizePlayer({ id: '4', name: 'Andreas Bjelland', age: 32, position: 'DF', rating: 76, value: 450000, isForSale: false }),
    normalizePlayer({ id: '5', name: 'Jens Martin Hauge', age: 23, position: 'DF', rating: 71, value: 400000, isForSale: true, askingPrice: 450000 }),
    normalizePlayer({ id: '6', name: 'Markus Halsti', age: 26, position: 'DF', rating: 74, value: 380000, isForSale: false }),

    normalizePlayer({ id: '7', name: 'Kristoffer Olsson', age: 25, position: 'MF', rating: 76, value: 520000, isForSale: false }),
    normalizePlayer({ id: '8', name: 'Rasmus Nissen', age: 27, position: 'MF', rating: 73, value: 420000, isForSale: false }),
    normalizePlayer({ id: '9', name: 'Marcus Ingvartsen', age: 24, position: 'MF', rating: 72, value: 450000, isForSale: true, askingPrice: 500000 }),
    normalizePlayer({ id: '10', name: 'Filip Tronild', age: 22, position: 'MF', rating: 68, value: 280000, isForSale: false }),

    normalizePlayer({ id: '11', name: 'Karlo Bartolec', age: 26, position: 'FW', rating: 80, value: 750000, isForSale: false }),
    normalizePlayer({ id: '12', name: 'Tyrik Wonder', age: 24, position: 'FW', rating: 77, value: 600000, isForSale: false }),
    normalizePlayer({ id: '13', name: 'Samuel Mráz', age: 28, position: 'FW', rating: 74, value: 500000, isForSale: true, askingPrice: 550000 }),
  ];

  return players.reduce((acc, player) => {
    acc[player.id] = player;
    return acc;
  }, {} as Record<string, Player>);
};

const createInitialGameState = (): GameState => ({
  selectedTeam: null,
  budget: 1000000,
  players: {},
  fanCount: 1200,
  stadiumCapacity: 3000,
  fanMood: 50,
  week: 1,
  leagueTable: buildInitialLeagueTable(),
  registeredMatchIds: [],
});

// localStorage nøgler
const STORAGE_KEY = 'dkmanager25_gamestate';

// Gem game state til localStorage
const saveGameState = (state: GameState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Fejl ved gemning af game state:', error);
  }
};

const migrateGameState = (raw: unknown): GameState => {
  const defaults = createInitialGameState();

  if (!raw || typeof raw !== 'object') {
    return defaults;
  }

  const data = raw as Partial<GameState>;
  const selectedTeam =
    data.selectedTeam &&
    typeof data.selectedTeam.id === 'string' &&
    typeof data.selectedTeam.name === 'string' &&
    typeof data.selectedTeam.logo === 'string'
      ? data.selectedTeam
      : null;

  return {
    selectedTeam,
    budget: typeof data.budget === 'number' ? data.budget : defaults.budget,
    players: migratePlayers(data.players),
    fanCount: typeof data.fanCount === 'number' ? data.fanCount : defaults.fanCount,
    stadiumCapacity: typeof data.stadiumCapacity === 'number' ? data.stadiumCapacity : defaults.stadiumCapacity,
    fanMood: typeof data.fanMood === 'number' ? data.fanMood : defaults.fanMood,
    week: typeof data.week === 'number' ? data.week : defaults.week,
    leagueTable: mergeLeagueTable(data.leagueTable),
    registeredMatchIds: Array.isArray(data.registeredMatchIds)
      ? data.registeredMatchIds.filter((id): id is string => typeof id === 'string')
      : [],
  };
};

// Hent game state fra localStorage
const loadGameState = (): GameState | null => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return migrateGameState(JSON.parse(saved));
    }
  } catch (error) {
    console.error('Fejl ved indlæsning af game state:', error);
  }
  return null;
};

// Slet game state fra localStorage
const deleteGameState = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Fejl ved sletning af game state:', error);
  }
};

export const GameProvider = ({ children }: { children: ReactNode }) => {
  const [gameState, setGameState] = useState<GameState>(() => {
    return loadGameState() || createInitialGameState();
  });

  // Auto-save game state når det ændrer sig
  useEffect(() => {
    saveGameState(gameState);
  }, [gameState]);

  const selectTeam = (team: Team) => {
    setGameState((prev) => ({
      ...prev,
      selectedTeam: team,
      players: generateDummyPlayers(),
      leagueTable: buildInitialLeagueTable(),
      registeredMatchIds: [],
    }));
  };

  const addPlayer = (player: Player): boolean => {
    const cost = player.askingPrice ?? player.value;

    if (gameState.players[player.id]) {
      console.warn(`Spiller ${player.name} er allerede i truppen`);
      return false;
    }

    if (gameState.budget < cost) {
      console.warn(`Ikke budget nok til at købe ${player.name}. Mangler: ${cost - gameState.budget} kr`);
      return false;
    }

    const normalizedPlayer = normalizePlayer(player);

    setGameState((prev) => ({
      ...prev,
      budget: prev.budget - cost,
      players: { ...prev.players, [player.id]: normalizedPlayer },
    }));

    return true;
  };

  const sellPlayer = (playerId: string) => {
    setGameState((prev) => {
      const newPlayers = { ...prev.players };
      const price = newPlayers[playerId]?.value || 0;
      delete newPlayers[playerId];
      return {
        ...prev,
        budget: prev.budget + price,
        players: newPlayers,
      };
    });
  };

  const updatePlayer = (playerId: string, updates: Partial<Player>) => {
    setGameState((prev) => {
      const currentPlayer = prev.players[playerId];
      if (!currentPlayer) {
        return prev;
      }

      return {
        ...prev,
        players: {
          ...prev.players,
          [playerId]: normalizePlayer({ ...currentPlayer, ...updates }),
        },
      };
    });
  };

  const upgradeStadium = () => {
    const cost = 500000;
    if (gameState.budget >= cost) {
      setGameState((prev) => ({
        ...prev,
        budget: prev.budget - cost,
        stadiumCapacity: prev.stadiumCapacity + 2500,
      }));
    }
  };

  const handleNextWeek = (): number => {
    const ticketRevenue = Math.min(gameState.fanCount, gameState.stadiumCapacity) * 150;
    setGameState((prev) => ({
      ...prev,
      week: prev.week + 1,
      budget: prev.budget + ticketRevenue,
    }));
    return ticketRevenue;
  };

  const registerMatchResult = (result: MatchResultInput): boolean => {
    const teamId = gameState.selectedTeam?.id;
    if (!teamId || !gameState.leagueTable[teamId] || !gameState.leagueTable[result.opponentTeamId]) {
      return false;
    }

    if (gameState.registeredMatchIds.includes(result.matchId)) {
      return false;
    }

    setGameState((prev) => {
      if (!prev.selectedTeam) {
        return prev;
      }

      if (prev.registeredMatchIds.includes(result.matchId)) {
        return prev;
      }

      const selectedTeamId = prev.selectedTeam.id;
      const currentTeam = prev.leagueTable[selectedTeamId];
      const currentOpponent = prev.leagueTable[result.opponentTeamId];
      if (!currentTeam || !currentOpponent) {
        return prev;
      }

      const didWin = result.goalsFor > result.goalsAgainst;
      const didDraw = result.goalsFor === result.goalsAgainst;

      const nextTeam: LeagueTableEntry = {
        ...currentTeam,
        played: currentTeam.played + 1,
        wins: currentTeam.wins + (didWin ? 1 : 0),
        draws: currentTeam.draws + (didDraw ? 1 : 0),
        losses: currentTeam.losses + (!didWin && !didDraw ? 1 : 0),
        goalsFor: currentTeam.goalsFor + result.goalsFor,
        goalsAgainst: currentTeam.goalsAgainst + result.goalsAgainst,
        points: currentTeam.points + (didWin ? 3 : didDraw ? 1 : 0),
      };

      const nextOpponent: LeagueTableEntry = {
        ...currentOpponent,
        played: currentOpponent.played + 1,
        wins: currentOpponent.wins + (!didWin && !didDraw ? 1 : 0),
        draws: currentOpponent.draws + (didDraw ? 1 : 0),
        losses: currentOpponent.losses + (didWin ? 1 : 0),
        goalsFor: currentOpponent.goalsFor + result.goalsAgainst,
        goalsAgainst: currentOpponent.goalsAgainst + result.goalsFor,
        points: currentOpponent.points + (!didWin && !didDraw ? 3 : didDraw ? 1 : 0),
      };

      return {
        ...prev,
        leagueTable: {
          ...prev.leagueTable,
          [selectedTeamId]: nextTeam,
          [result.opponentTeamId]: nextOpponent,
        },
        registeredMatchIds: [...prev.registeredMatchIds, result.matchId],
      };
    });

    return true;
  };

  const resetGame = () => {
    deleteGameState();
    setGameState(createInitialGameState());
  };

  return (
    <GameContext.Provider
      value={{
        gameState,
        selectTeam,
        addPlayer,
        sellPlayer,
        updatePlayer,
        upgradeStadium,
        handleNextWeek,
        registerMatchResult,
        resetGame,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame skal bruges inden i en GameProvider');
  return context;
};
