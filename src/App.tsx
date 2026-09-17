import React, { useState } from 'react';
import { useGame } from './context/GameContext';
import SelectTeamView from './components/SelectTeamView';
import ConfirmationPanel from './components/ConfirmationPanel';
import TransferMarketView from './components/TransferMarketView';
import MatchView from './components/MatchView';
import StadiumView from './components/StadiumView';
import TeamView from './components/TeamView';

const App: React.FC = () => {
  const { gameState, selectTeam, resetGame } = useGame();
  const [activeView, setActiveView] = useState<'team' | 'transfers' | 'matches' | 'stadium'>('team');
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);

  const selectedTeam = gameState.selectedTeam;

  const handleViewChange = (view: 'team' | 'transfers' | 'matches' | 'stadium') => {
    setActiveView(view);
    setIsConfirmingReset(false);
  };

  const handleResetGame = () => {
    setActiveView('team');
    setIsConfirmingReset(false);
    resetGame();
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {!selectedTeam ? (
        <SelectTeamView onSelectTeam={selectTeam} />
      ) : (
        <>
          <nav className="bg-blue-600 text-white p-4">
            <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-4">
              <button onClick={() => handleViewChange('team')} className={activeView === 'team' ? 'font-bold' : ''}>Trup</button>
              <button onClick={() => handleViewChange('transfers')} className={activeView === 'transfers' ? 'font-bold' : ''}>Transfer</button>
              <button onClick={() => handleViewChange('matches')} className={activeView === 'matches' ? 'font-bold' : ''}>Kampe</button>
              <button onClick={() => handleViewChange('stadium')} className={activeView === 'stadium' ? 'font-bold' : ''}>Stadion</button>
              <button
                type="button"
                onClick={() => setIsConfirmingReset(true)}
                className="ml-auto rounded bg-red-600 px-4 py-2 font-bold text-white transition hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Genstart spillet
              </button>
            </div>
          </nav>
          <main className="max-w-7xl mx-auto px-4 py-8">
            {isConfirmingReset && (
              <ConfirmationPanel
                title="Genstart spillet?"
                message="Din nuværende fremgang bliver slettet, og du skal vælge klub igen."
                confirmLabel="Genstart spillet"
                confirmVariant="danger"
                autoFocusAction="cancel"
                onConfirm={handleResetGame}
                onCancel={() => setIsConfirmingReset(false)}
                className="mb-6"
              />
            )}
            {activeView === 'team' && <TeamView />}
            {activeView === 'transfers' && <TransferMarketView />}
            {activeView === 'matches' && <MatchView />}
            {activeView === 'stadium' && <StadiumView />}
          </main>
        </>
      )}
    </div>
  );
};

export default App;
