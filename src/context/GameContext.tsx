import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Team } from '../data/teams';

interface GameState {
  selectedTeam: Team | null;
  // Tilføj andre game states her senere
}

interface GameContextType {
  gameState: GameState;
  selectTeam: (team: Team) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider = ({ children }: { children: ReactNode }) => {
  const [gameState, setGameState] = useState<GameState>({
    selectedTeam: null,
  });

  const selectTeam = (team: Team) => {
    setGameState(prev => ({ ...prev, selectedTeam: team }));
  };

  return (
    <GameContext.Provider value={{ gameState, selectTeam }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame skal bruges inden i en GameProvider');
  return context;
};
