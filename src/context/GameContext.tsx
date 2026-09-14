import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
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

interface GameState {
  selectedTeam: Team | null;
  budget: number;
  players: Record<string, Player>;
  fanCount: number;
  stadiumCapacity: number;
  fanMood: number;
  week: number;
}

interface FeedbackMessage {
  tone: 'success' | 'info' | 'warning';
  title: string;
  message: string;
}

interface GameContextType {
  gameState: GameState;
  feedback: FeedbackMessage | null;
  clearFeedback: () => void;
  selectTeam: (team: Team) => void;
  addPlayer: (player: Player) => void;
  buyPlayer: (player: Player) => boolean;
  sellPlayer: (playerId: string) => void;
  updatePlayer: (playerId: string, updates: Partial<Player>) => void;
  upgradeStadium: () => void;
  handleNextWeek: () => void;
  resetGame: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

// Dummy spillere til start
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

// Initial game state
const initialGameState: GameState = {
  selectedTeam: null,
  budget: 1000000,
  players: {},
  fanCount: 1200,
  stadiumCapacity: 3000,
  fanMood: 50,
  week: 1,
};

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

// Hent game state fra localStorage
const loadGameState = (): GameState | null => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
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
    // Prøv at indlæse saved state, ellers brug initial state
    return loadGameState() || initialGameState;
  });
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);

  // Auto-save game state når det ændrer sig
  useEffect(() => {
    saveGameState(gameState);
  }, [gameState]);

  useEffect(() => {
    if (!feedback) return;

    const timeout = window.setTimeout(() => {
      setFeedback(null);
    }, 4000);

    return () => window.clearTimeout(timeout);
  }, [feedback]);

  const clearFeedback = () => setFeedback(null);

  const selectTeam = (team: Team) => {
    setGameState(prev => ({
      ...prev,
      selectedTeam: team,
      players: generateDummyPlayers(),
    }));
    setFeedback({
      tone: 'success',
      title: `${team.name} er valgt`,
      message: 'Du er klar til at gennemgå truppen og tage hul på den første uge.',
    });
  };

  const addPlayer = (player: Player) => {
    setGameState(prev => ({
      ...prev,
      players: { ...prev.players, [player.id]: player }
    }));
  };

  const buyPlayer = (player: Player) => {
    let didBuy = false;
    let nextFeedback: FeedbackMessage | null = null;

    setGameState(prev => {
      if (prev.budget < player.value) {
        nextFeedback = {
          tone: 'warning',
          title: 'Budgettet rækker ikke',
          message: `${player.name} koster ${player.value.toLocaleString('da-DK')} kr, men du har kun ${prev.budget.toLocaleString('da-DK')} kr.`,
        };
        return prev;
      }

      didBuy = true;
      nextFeedback = {
        tone: 'success',
        title: `${player.name} er købt`,
        message: `${player.value.toLocaleString('da-DK')} kr er trukket fra budgettet, og spilleren er lagt til i din trup.`,
      };

      return {
        ...prev,
        budget: prev.budget - player.value,
        players: {
          ...prev.players,
          [`own_${player.id}`]: {
            ...player,
            id: `own_${player.id}`,
            isForSale: false,
            askingPrice: undefined,
          }
        }
      };
    });

    if (nextFeedback) {
      setFeedback(nextFeedback);
    }

    return didBuy;
  };

  const sellPlayer = (playerId: string) => {
    const player = gameState.players[playerId];
    if (!player) return;

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
    setFeedback({
      tone: 'success',
      title: `${player.name} er solgt`,
      message: `Du har modtaget ${player.value.toLocaleString('da-DK')} kr, som nu er lagt til budgettet.`,
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
      setFeedback({
        tone: 'success',
        title: 'Stadionet er opgraderet',
        message: `Kapaciteten er øget med 2.500 pladser, og ${cost.toLocaleString('da-DK')} kr er trukket fra budgettet.`,
      });
      return;
    }

    setFeedback({
      tone: 'warning',
      title: 'Du mangler penge til udvidelsen',
      message: `Du skal bruge ${cost.toLocaleString('da-DK')} kr for at opgradere stadionet.`,
    });
  };

  const handleNextWeek = () => {
    const ticketRevenue = Math.min(gameState.fanCount, gameState.stadiumCapacity) * 150;
    setGameState(prev => ({
      ...prev,
      week: prev.week + 1,
      budget: prev.budget + ticketRevenue
    }));
    setFeedback({
      tone: 'info',
      title: `Uge ${gameState.week + 1} er startet`,
      message: `Du modtog ${ticketRevenue.toLocaleString('da-DK')} kr i billetindtægter baseret på dine nuværende fans og stadionpladser.`,
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
        feedback,
        clearFeedback,
        selectTeam, 
        addPlayer, 
        buyPlayer,
        sellPlayer, 
        updatePlayer, 
        upgradeStadium, 
        handleNextWeek,
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
