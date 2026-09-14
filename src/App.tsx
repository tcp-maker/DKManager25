import React, { useState } from 'react';
import { useGame } from './context/GameContext';
import SelectTeamView from './components/SelectTeamView';
import TransferMarketView from './components/TransferMarketView';
import MatchView from './components/MatchView';
import StadiumView from './components/StadiumView';
import TeamView from './components/TeamView';
import { Team } from './types/teams';

const App: React.FC = () => {
  const { gameState, selectTeam } = useGame();
  const { selectedTeam } = gameState;
  const [activeView, setActiveView] = useState<'team' | 'transfers' | 'matches' | 'stadium'>('team');

  const handleSelectTeam = (team: Team) => {
    selectTeam(team);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {!selectedTeam ? (
        <SelectTeamView onSelectTeam={handleSelectTeam} />
      ) : (
        <>
          <nav className="bg-blue-600 text-white p-3 sm:p-4">
            <div className="max-w-7xl mx-auto overflow-x-auto">
              <div className="flex gap-2 sm:gap-4 min-w-max">
                <button onClick={() => setActiveView('team')} className={`px-3 py-2 rounded-md ${activeView === 'team' ? 'bg-blue-700 font-bold' : 'bg-blue-600'}`}>Trup</button>
                <button onClick={() => setActiveView('transfers')} className={`px-3 py-2 rounded-md ${activeView === 'transfers' ? 'bg-blue-700 font-bold' : 'bg-blue-600'}`}>Transfer</button>
                <button onClick={() => setActiveView('matches')} className={`px-3 py-2 rounded-md ${activeView === 'matches' ? 'bg-blue-700 font-bold' : 'bg-blue-600'}`}>Kampe</button>
                <button onClick={() => setActiveView('stadium')} className={`px-3 py-2 rounded-md ${activeView === 'stadium' ? 'bg-blue-700 font-bold' : 'bg-blue-600'}`}>Stadion</button>
              </div>
            </div>
          </nav>
          <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
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