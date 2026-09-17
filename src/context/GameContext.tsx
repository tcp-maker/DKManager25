import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { getLeagueByTeamId, normalizeLeagueResult } from '../data/leagues';
import { LeagueMatchResult, Team } from '../types/teams';

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

interface GameState {
  selectedTeam: Team | null;
  budget: number;
  players: Record<string, Player>;
  fanCount: number;
  stadiumCapacity: number;
  fanMood: number;
  week: number;
  playedLeagueMatches: LeagueMatchResult[];
}

interface GameContextType {
  gameState: GameState;
  selectTeam: (team: Team) => void;
  addPlayer: (player: Player) => boolean;
  sellPlayer: (playerId: string) => void;
  updatePlayer: (playerId: string, updates: Partial<Player>) => void;
  upgradeStadium: () => void;
  handleNextWeek: () => number;
  recordLeagueResults: (results: LeagueMatchResult[]) => void;
  resetGame: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

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

  return players.reduce((acc, player) => {
    acc[player.id] = player;
    return acc;
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
  playedLeagueMatches: [],
};

const normalizeGameState = (state: Partial<GameState> | null): GameState => {
  if (!state) {
    return initialGameState;
  }

  const selectedTeam = state.selectedTeam
    ? getLeagueByTeamId(state.selectedTeam.id)?.teams.find(team => team.id === state.selectedTeam?.id) ?? state.selectedTeam
    : null;

  return {
    ...initialGameState,
    ...state,
    selectedTeam,
    players: state.players ?? {},
    playedLeagueMatches: Array.isArray(state.playedLeagueMatches)
      ? state.playedLeagueMatches.map(normalizeLeagueResult)
      : [],
  };
};

const STORAGE_KEY = 'dkmanager25_gamestate';

const saveGameState = (state: GameState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Fejl ved gemning af game state:', error);
  }
};

const loadGameState = (): GameState => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return normalizeGameState(JSON.parse(saved) as Partial<GameState>);
    }
  } catch (error) {
    console.error('Fejl ved indlæsning af game state:', error);
  }
  return initialGameState;
};

const deleteGameState = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Fejl ved sletning af game state:', error);
  }
};

export const GameProvider = ({ children }: { children: ReactNode }) => {
  const [gameState, setGameState] = useState<GameState>(() => loadGameState());

  useEffect(() => {
    saveGameState(gameState);
  }, [gameState]);

  const selectTeam = (team: Team) => {
    const normalizedTeam = getLeagueByTeamId(team.id)?.teams.find(leagueTeam => leagueTeam.id === team.id) ?? team;

    setGameState({
      ...initialGameState,
      selectedTeam: normalizedTeam,
      players: generateDummyPlayers(),
    });
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

    setGameState(prev => ({
      ...prev,
      budget: prev.budget - cost,
      players: { ...prev.players, [player.id]: player }
    }));

    return true;
  };

  const sellPlayer = (playerId: string) => {
    setGameState(prev => {
      const newPlayers = { ...prev.players };
      const price = newPlayers[playerId]?.value || 0;
      delete newPlayers[playerId];
      return {
        ...prev,
        budget: prev.budget + price,
        players: newPlayers
      };
    });
  };

  const updatePlayer = (playerId: string, updates: Partial<Player>) => {
    setGameState(prev => ({
      ...prev,
      players: {
        ...prev.players,
        [playerId]: { ...prev.players[playerId], ...updates }
      }
    }));
  };

  const upgradeStadium = () => {
    const cost = 500000;
    if (gameState.budget >= cost) {
      setGameState(prev => ({
        ...prev,
        budget: prev.budget - cost,
        stadiumCapacity: prev.stadiumCapacity + 2500
      }));
    }
  };

  const handleNextWeek = (): number => {
    const ticketRevenue = Math.min(gameState.fanCount, gameState.stadiumCapacity) * 150;
    setGameState(prev => ({
      ...prev,
      week: prev.week + 1,
      budget: prev.budget + ticketRevenue
    }));
    return ticketRevenue;
  };

  const recordLeagueResults = (results: LeagueMatchResult[]) => {
    setGameState(prev => {
      const allResults = new Map(prev.playedLeagueMatches.map(result => [result.id, normalizeLeagueResult(result)]));
      results.forEach(result => {
        allResults.set(result.id, normalizeLeagueResult(result));
      });

      return {
        ...prev,
        playedLeagueMatches: Array.from(allResults.values()).sort((left, right) => (
          left.week - right.week || left.id.localeCompare(right.id, 'da')
        ))
      };
    });
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
        recordLeagueResults,
        resetGame
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
