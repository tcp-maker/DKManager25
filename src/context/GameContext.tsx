import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { createPlayerRecord, getTeamById } from '../data/gameData';
import { PlayedMatch } from '../types/matches';
import { Player, PlayerPosition } from '../types/player';
import { Team } from '../types/teams';

interface GameState {
  selectedTeam: Team | null;
  budget: number;
  players: Record<string, Player>;
  fanCount: number;
  stadiumCapacity: number;
  fanMood: number;
  week: number;
  playedMatches: PlayedMatch[];
}

interface GameContextType {
  gameState: GameState;
  selectTeam: (team: Team) => void;
  addPlayer: (player: Player) => boolean;
  sellPlayer: (playerId: string) => void;
  updatePlayer: (playerId: string, updates: Partial<Player>) => void;
  upgradeStadium: () => void;
  handleNextWeek: () => number;
  recordPlayedMatch: (match: PlayedMatch) => void;
  resetGame: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

const initialGameState: GameState = {
  selectedTeam: null,
  budget: 1000000,
  players: {},
  fanCount: 1200,
  stadiumCapacity: 3000,
  fanMood: 50,
  week: 1,
  playedMatches: [],
};

const STORAGE_KEY = 'dkmanager25_gamestate';

const createFallbackSkills = (position: PlayerPosition, rating: number) => {
  switch (position) {
    case 'GK':
      return { goalkeeping: rating + 8, defending: Math.round(rating * 0.55), playmaking: Math.round(rating * 0.45), finishing: Math.round(rating * 0.25) };
    case 'DF':
      return { goalkeeping: Math.round(rating * 0.2), defending: rating + 6, playmaking: Math.round(rating * 0.6), finishing: Math.round(rating * 0.35) };
    case 'MF':
      return { goalkeeping: Math.round(rating * 0.15), defending: Math.round(rating * 0.6), playmaking: rating + 7, finishing: Math.round(rating * 0.7) };
    case 'FW':
    default:
      return { goalkeeping: Math.round(rating * 0.1), defending: Math.round(rating * 0.35), playmaking: Math.round(rating * 0.65), finishing: rating + 8 };
  }
};

const normalizeStoredPlayer = (player: unknown): Player | null => {
  if (!player || typeof player !== 'object') return null;

  const raw = player as Partial<Player>;
  if (
    typeof raw.id !== 'string' ||
    typeof raw.name !== 'string' ||
    typeof raw.age !== 'number' ||
    (raw.position !== 'GK' && raw.position !== 'DF' && raw.position !== 'MF' && raw.position !== 'FW') ||
    typeof raw.rating !== 'number' ||
    typeof raw.value !== 'number' ||
    typeof raw.isForSale !== 'boolean'
  ) {
    return null;
  }

  const fallbackSkills = createFallbackSkills(raw.position, raw.rating);

  return {
    id: raw.id,
    name: raw.name,
    age: raw.age,
    position: raw.position,
    rating: raw.rating,
    value: raw.value,
    isForSale: raw.isForSale,
    askingPrice: typeof raw.askingPrice === 'number' ? raw.askingPrice : undefined,
    goalkeeping: typeof raw.goalkeeping === 'number' ? raw.goalkeeping : fallbackSkills.goalkeeping,
    defending: typeof raw.defending === 'number' ? raw.defending : fallbackSkills.defending,
    playmaking: typeof raw.playmaking === 'number' ? raw.playmaking : fallbackSkills.playmaking,
    finishing: typeof raw.finishing === 'number' ? raw.finishing : fallbackSkills.finishing,
  };
};

const normalizePlayedMatch = (match: unknown): PlayedMatch | null => {
  if (!match || typeof match !== 'object') return null;

  const raw = match as Partial<PlayedMatch>;
  if (
    typeof raw.id !== 'string' ||
    typeof raw.opponentId !== 'string' ||
    typeof raw.opponent !== 'string' ||
    typeof raw.isHome !== 'boolean' ||
    (raw.difficulty !== 'Nem' && raw.difficulty !== 'Moderat' && raw.difficulty !== 'Svær') ||
    typeof raw.opponentRating !== 'number' ||
    typeof raw.round !== 'number' ||
    typeof raw.season !== 'number' ||
    (raw.result !== 'WIN' && raw.result !== 'DRAW' && raw.result !== 'LOSS') ||
    typeof raw.homeGoals !== 'number' ||
    typeof raw.awayGoals !== 'number' ||
    typeof raw.date !== 'number'
  ) {
    return null;
  }

  return raw as PlayedMatch;
};

const saveGameState = (state: GameState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Fejl ved gemning af game state:', error);
  }
};

const loadGameState = (): GameState | null => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;

    const parsed = JSON.parse(saved) as Partial<GameState> & { selectedTeam?: { id?: string } };
    const selectedTeam = typeof parsed.selectedTeam?.id === 'string' ? getTeamById(parsed.selectedTeam.id) : null;
    const players = parsed.players && typeof parsed.players === 'object'
      ? Object.values(parsed.players).map(normalizeStoredPlayer).filter((player): player is Player => Boolean(player))
      : [];
    const playedMatches = Array.isArray(parsed.playedMatches)
      ? parsed.playedMatches.map(normalizePlayedMatch).filter((match): match is PlayedMatch => Boolean(match))
      : [];

    return {
      selectedTeam,
      budget: typeof parsed.budget === 'number' ? parsed.budget : initialGameState.budget,
      players: players.length > 0 ? createPlayerRecord(players) : selectedTeam ? createPlayerRecord(selectedTeam.players) : {},
      fanCount: typeof parsed.fanCount === 'number' ? parsed.fanCount : initialGameState.fanCount,
      stadiumCapacity: typeof parsed.stadiumCapacity === 'number' ? parsed.stadiumCapacity : initialGameState.stadiumCapacity,
      fanMood: typeof parsed.fanMood === 'number' ? parsed.fanMood : initialGameState.fanMood,
      week: typeof parsed.week === 'number' && parsed.week > 0 ? Math.floor(parsed.week) : initialGameState.week,
      playedMatches,
    };
  } catch (error) {
    console.error('Fejl ved indlæsning af game state:', error);
  }
  return null;
};

const deleteGameState = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Fejl ved sletning af game state:', error);
  }
};

export const GameProvider = ({ children }: { children: ReactNode }) => {
  const [gameState, setGameState] = useState<GameState>(() => loadGameState() || initialGameState);

  useEffect(() => {
    saveGameState(gameState);
  }, [gameState]);

  const selectTeam = (team: Team) => {
    setGameState(prev => ({
      ...prev,
      selectedTeam: team,
      players: createPlayerRecord(team.players),
      playedMatches: [],
      week: 1,
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

  const recordPlayedMatch = (match: PlayedMatch) => {
    setGameState(prev => ({
      ...prev,
      playedMatches: [match, ...prev.playedMatches]
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
        recordPlayedMatch,
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
