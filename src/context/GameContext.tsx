import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { PlayedMatch } from '../game/matches';
import { Team } from '../types/teams';

export interface Player {
  id: string;
  name: string;
  age: number;
  position: 'GK' | 'DF' | 'MF' | 'FW';
  rating: number;
  value: number;
  isForSale: boolean;
  askingPrice?: number;
}

export interface GameState {
  selectedTeam: Team | null;
  budget: number;
  players: Record<string, Player>;
  fanCount: number;
  stadiumCapacity: number;
  fanMood: number;
  week: number;
  playedMatches: PlayedMatch[];
  stadiumUpgrades: number;
}

interface GameContextType {
  gameState: GameState;
  selectTeam: (team: Team) => void;
  addPlayer: (player: Player) => boolean;
  sellPlayer: (playerId: string) => boolean;
  updatePlayer: (playerId: string, updates: Partial<Player>) => void;
  upgradeStadium: () => boolean;
  handleNextWeek: () => number;
  recordMatchResult: (match: PlayedMatch) => void;
  resetGame: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

const clampNumber = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isPosition = (value: unknown): value is Player['position'] =>
  value === 'GK' || value === 'DF' || value === 'MF' || value === 'FW';

const normalizeNumber = (
  value: unknown,
  fallback: number,
  min = Number.NEGATIVE_INFINITY,
  max = Number.POSITIVE_INFINITY
): number => {
  if (typeof value !== 'number' || Number.isNaN(value) || !Number.isFinite(value)) {
    return fallback;
  }

  return clampNumber(value, min, max);
};

const normalizeTeam = (value: unknown): Team | null => {
  if (!isObject(value)) {
    return null;
  }

  if (typeof value.id !== 'string' || typeof value.name !== 'string' || typeof value.logo !== 'string') {
    return null;
  }

  return {
    id: value.id,
    name: value.name,
    logo: value.logo,
  };
};

const normalizePlayer = (value: unknown): Player | null => {
  if (!isObject(value) || typeof value.id !== 'string' || typeof value.name !== 'string' || !isPosition(value.position)) {
    return null;
  }

  return {
    id: value.id,
    name: value.name,
    age: normalizeNumber(value.age, 24, 15, 45),
    position: value.position,
    rating: normalizeNumber(value.rating, 70, 40, 99),
    value: normalizeNumber(value.value, 250000, 0),
    isForSale: Boolean(value.isForSale),
    askingPrice:
      typeof value.askingPrice === 'number' && Number.isFinite(value.askingPrice)
        ? normalizeNumber(value.askingPrice, 0, 0)
        : undefined,
  };
};

const normalizePlayedMatch = (value: unknown): PlayedMatch | null => {
  if (
    !isObject(value) ||
    typeof value.id !== 'string' ||
    typeof value.opponent !== 'string' ||
    typeof value.isHome !== 'boolean' ||
    (value.difficulty !== 'Nem' && value.difficulty !== 'Moderat' && value.difficulty !== 'Svær') ||
    (value.result !== 'WIN' && value.result !== 'DRAW' && value.result !== 'LOSS')
  ) {
    return null;
  }

  return {
    id: value.id,
    opponent: value.opponent,
    isHome: value.isHome,
    difficulty: value.difficulty,
    opponentRating: normalizeNumber(value.opponentRating, 74, 60, 95),
    week: normalizeNumber(value.week, 1, 1),
    result: value.result,
    teamGoals: normalizeNumber(value.teamGoals, 0, 0, 9),
    opponentGoals: normalizeNumber(value.opponentGoals, 0, 0, 9),
    fanChange: normalizeNumber(value.fanChange, 0, -5000, 5000),
    moodChange: normalizeNumber(value.moodChange, 0, -100, 100),
    budgetChange: normalizeNumber(value.budgetChange, 0, -10000000, 10000000),
    ticketRevenue: normalizeNumber(value.ticketRevenue, 0, 0, 10000000),
    sponsorBonus: normalizeNumber(value.sponsorBonus, 0, -10000000, 10000000),
  };
};

const generateDummyPlayers = (): Record<string, Player> => {
  const players: Player[] = [
    { id: '1', name: 'Peter Vindahl', age: 28, position: 'GK', rating: 78, value: 500000, isForSale: false },
    { id: '2', name: 'Karl-Johan Johnsson', age: 34, position: 'GK', rating: 75, value: 300000, isForSale: true, askingPrice: 350000 },
    { id: '3', name: 'Henrik Dalsgaard', age: 31, position: 'DF', rating: 79, value: 600000, isForSale: false },
    { id: '4', name: 'Andreas Bjelland', age: 32, position: 'DF', rating: 76, value: 450000, isForSale: false },
    { id: '5', name: 'Jens Martin Hauge', age: 23, position: 'DF', rating: 71, value: 400000, isForSale: true, askingPrice: 450000 },
    { id: '6', name: 'Markus Halsti', age: 26, position: 'DF', rating: 74, value: 380000, isForSale: false },
    { id: '7', name: 'Kristoffer Olsson', age: 25, position: 'MF', rating: 76, value: 520000, isForSale: false },
    { id: '8', name: 'Rasmus Nissen', age: 27, position: 'MF', rating: 73, value: 420000, isForSale: false },
    { id: '9', name: 'Marcus Ingvartsen', age: 24, position: 'MF', rating: 72, value: 450000, isForSale: true, askingPrice: 500000 },
    { id: '10', name: 'Filip Tronild', age: 22, position: 'MF', rating: 68, value: 280000, isForSale: false },
    { id: '11', name: 'Karlo Bartolec', age: 26, position: 'FW', rating: 80, value: 750000, isForSale: false },
    { id: '12', name: 'Tyrik Wonder', age: 24, position: 'FW', rating: 77, value: 600000, isForSale: false },
    { id: '13', name: 'Samuel Mráz', age: 28, position: 'FW', rating: 74, value: 500000, isForSale: true, askingPrice: 550000 },
  ];

  return players.reduce((accumulator, player) => {
    accumulator[player.id] = player;
    return accumulator;
  }, {} as Record<string, Player>);
};

const initialGameState: GameState = {
  selectedTeam: null,
  budget: 1000000,
  players: {},
  fanCount: 1200,
  stadiumCapacity: 3000,
  fanMood: 50,
  week: 1,
  playedMatches: [],
  stadiumUpgrades: 0,
};

const STORAGE_KEY = 'dkmanager25_gamestate';

const saveGameState = (state: GameState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Fejl ved gemning af game state:', error);
  }
};

const loadRawGameState = (): unknown => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return null;
    }

    return JSON.parse(saved);
  } catch (error) {
    console.error('Fejl ved indlæsning af game state:', error);
    return null;
  }
};

const normalizeGameState = (value: unknown): GameState | null => {
  if (!isObject(value)) {
    return null;
  }

  const normalizedPlayers = isObject(value.players)
    ? Object.values(value.players)
        .map(normalizePlayer)
        .filter((player): player is Player => player !== null)
        .reduce((players, player) => {
          players[player.id] = player;
          return players;
        }, {} as Record<string, Player>)
    : {};

  const playedMatches = Array.isArray(value.playedMatches)
    ? value.playedMatches
        .map(normalizePlayedMatch)
        .filter((match): match is PlayedMatch => match !== null)
        .slice(0, 10)
    : [];

  return {
    selectedTeam: normalizeTeam(value.selectedTeam),
    budget: normalizeNumber(value.budget, initialGameState.budget, 0),
    players: normalizedPlayers,
    fanCount: normalizeNumber(value.fanCount, initialGameState.fanCount, 0),
    stadiumCapacity: normalizeNumber(value.stadiumCapacity, initialGameState.stadiumCapacity, 1000),
    fanMood: normalizeNumber(value.fanMood, initialGameState.fanMood, 0, 100),
    week: normalizeNumber(value.week, initialGameState.week, 1),
    playedMatches,
    stadiumUpgrades: normalizeNumber(value.stadiumUpgrades, initialGameState.stadiumUpgrades, 0, 100),
  };
};

const deleteGameState = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Fejl ved sletning af game state:', error);
  }
};

const getWeeklyTicketRevenue = (fanCount: number, stadiumCapacity: number): number =>
  Math.min(fanCount, stadiumCapacity) * 150;

export const GameProvider = ({ children }: { children: ReactNode }) => {
  const [gameState, setGameState] = useState<GameState>(() => normalizeGameState(loadRawGameState()) ?? initialGameState);

  useEffect(() => {
    saveGameState(gameState);
  }, [gameState]);

  const selectTeam = (team: Team) => {
    setGameState({
      ...initialGameState,
      selectedTeam: team,
      players: generateDummyPlayers(),
    });
  };

  const addPlayer = (player: Player): boolean => {
    const cost = player.askingPrice ?? player.value;
    let didAdd = false;

    setGameState(prev => {
      if (prev.players[player.id] || prev.budget < cost) {
        return prev;
      }

      didAdd = true;

      return {
        ...prev,
        budget: prev.budget - cost,
        players: {
          ...prev.players,
          [player.id]: {
            ...player,
            isForSale: false,
            askingPrice: undefined,
          },
        },
      };
    });

    return didAdd;
  };

  const sellPlayer = (playerId: string): boolean => {
    let didSell = false;

    setGameState(prev => {
      const player = prev.players[playerId];

      if (!player) {
        return prev;
      }

      const newPlayers = { ...prev.players };
      delete newPlayers[playerId];
      didSell = true;

      return {
        ...prev,
        budget: prev.budget + player.value,
        players: newPlayers,
      };
    });

    return didSell;
  };

  const updatePlayer = (playerId: string, updates: Partial<Player>) => {
    setGameState(prev => {
      const player = prev.players[playerId];

      if (!player) {
        return prev;
      }

      return {
        ...prev,
        players: {
          ...prev.players,
          [playerId]: {
            ...player,
            ...updates,
          },
        },
      };
    });
  };

  const upgradeStadium = (): boolean => {
    const cost = 500000;
    let didUpgrade = false;

    setGameState(prev => {
      if (prev.budget < cost) {
        return prev;
      }

      didUpgrade = true;

      return {
        ...prev,
        budget: prev.budget - cost,
        stadiumCapacity: prev.stadiumCapacity + 2500,
        stadiumUpgrades: prev.stadiumUpgrades + 1,
      };
    });

    return didUpgrade;
  };

  const handleNextWeek = (): number => {
    let ticketRevenue = 0;

    setGameState(prev => {
      ticketRevenue = getWeeklyTicketRevenue(prev.fanCount, prev.stadiumCapacity);

      return {
        ...prev,
        week: prev.week + 1,
        budget: prev.budget + ticketRevenue,
      };
    });

    return ticketRevenue;
  };

  const recordMatchResult = (match: PlayedMatch) => {
    setGameState(prev => ({
      ...prev,
      week: prev.week + 1,
      budget: Math.max(0, prev.budget + match.budgetChange),
      fanCount: Math.max(0, prev.fanCount + match.fanChange),
      fanMood: clampNumber(prev.fanMood + match.moodChange, 0, 100),
      playedMatches: [match, ...prev.playedMatches].slice(0, 10),
    }));
  };

  const resetGame = () => {
    deleteGameState();
    setGameState(initialGameState);
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
        recordMatchResult,
        resetGame,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);

  if (!context) {
    throw new Error('useGame skal bruges inden i en GameProvider');
  }

  return context;
};
