import React from 'react';
import { useGame } from './context/GameContext';
import { SelectTeamView } from './components/SelectTeamView';

function App() {
  const { gameState } = useGame();

  // Hvis intet hold er valgt, vis holdvalg
  if (!gameState.selectedTeam) {
    return <SelectTeamView />;
  }

  // Ellers vis selve spillet
  return (
    <div>
      <h1>Velkommen til {gameState.selectedTeam.name}</h1>
      {/* Her kommer dit spil-indhold */}
    </div>
  );
}

export default App;
