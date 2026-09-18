import React, { useState } from 'react';
import { useGame } from './context/GameContext';
import SelectTeamView from './components/SelectTeamView';
import ConfirmAction from './components/ConfirmAction';
import TransferMarketView from './components/TransferMarketView';
import MatchView from './components/MatchView';
import StadiumView from './components/StadiumView';
import TeamView from './components/TeamView';

const App: React.FC = () => {
  const { gameState, selectTeam, resetGame } = useGame();
  const [activeView, setActiveView] = useState<'team' | 'transfers' | 'matches' | 'stadium'>('team');

  const selectedTeam = gameState.selectedTeam;

  return (
    <div className="min-h-screen bg-gray-100">
      {!selectedTeam ? (
        <SelectTeamView onSelectTeam={selectTeam} />
      ) : (
        <>
          <nav className="bg-blue-600 text-white p-4">
            <div className="max-w-7xl mx-auto flex flex-wrap gap-4">
              <button onClick={() => setActiveView('team')} className={activeView === 'team' ? 'font-bold' : ''}>Trup</button>
              <button onClick={() => setActiveView('transfers')} className={activeView === 'transfers' ? 'font-bold' : ''}>Transfer</button>
              <button onClick={() => setActiveView('matches')} className={activeView === 'matches' ? 'font-bold' : ''}>Kampe</button>
              <button onClick={() => setActiveView('stadium')} className={activeView === 'stadium' ? 'font-bold' : ''}>Stadion</button>
            </div>
          </nav>
          <div className="max-w-7xl mx-auto px-4 pt-4">
            <div className="rounded-lg border border-red-200 bg-white p-4 shadow-sm md:flex md:items-start md:justify-between md:gap-6">
              <div className="mb-4 md:mb-0">
                <p className="text-lg font-semibold text-gray-900">{selectedTeam.name}</p>
                <p className="text-sm text-gray-600">{selectedTeam.league} • Sæson {gameState.season} • Uge {gameState.week}</p>
                <p className="mt-1 text-sm text-gray-500">Nulstil kun spillet, hvis du vil starte helt forfra.</p>
              </div>
              <div className="w-full md:w-80">
                <ConfirmAction
                  label="Nulstil spil"
                  confirmLabel="Bekræft nulstilling"
                  confirmMessage="Dette sletter din nuværende klub, sæson, ligastilling og gemte spiltilstand. Er du sikker på, at du vil starte forfra?"
                  onConfirm={() => {
                    resetGame();
                    setActiveView('team');
                    return null;
                  }}
                  buttonClassName="bg-red-600 hover:bg-red-700 text-white"
                  confirmButtonClassName="bg-red-700 hover:bg-red-800 text-white"
                />
              </div>
            </div>
          </div>
          <main className="max-w-7xl mx-auto px-4 py-8">
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
