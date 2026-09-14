import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import SelectTeamView from './SelectTeamView';
import TransferMarketView from './TransferMarketView';
import MatchView from './MatchView';
import StadiumView from './StadiumView';

type ViewType = 'team' | 'transfers' | 'matches' | 'stadium';

const App: React.FC = () => {
  const { gameState, selectTeam } = useGame();
  const [activeView, setActiveView] = useState<ViewType>('team');

  // If no team selected, show team selection
  if (!gameState.selectedTeam) {
    return <SelectTeamView onSelectTeam={selectTeam} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-blue-600">DKManager25</h1>
              <p className="text-sm text-gray-600">{gameState.selectedTeam.name}</p>
            </div>
            <div className="flex gap-6 items-center text-right">
              <div>
                <p className="text-xs text-gray-600">Budget</p>
                <p className="text-lg font-bold text-green-600">{gameState.budget.toLocaleString('da-DK')} kr</p>
              </div>
              <div className="border-l-2 border-gray-200 pl-6">
                <p className="text-xs text-gray-600">Uge</p>
                <p className="text-lg font-bold text-purple-600">{gameState.week}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b border-gray-200 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-1 overflow-x-auto">
            <button
              onClick={() => setActiveView('team')}
              className={`px-4 py-3 font-semibold border-b-2 transition whitespace-nowrap ${
                activeView === 'team'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              🏠 Trup
            </button>
            <button
              onClick={() => setActiveView('transfers')}
              className={`px-4 py-3 font-semibold border-b-2 transition whitespace-nowrap ${
                activeView === 'transfers'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              🔄 Transfermarked
            </button>
            <button
              onClick={() => setActiveView('matches')}
              className={`px-4 py-3 font-semibold border-b-2 transition whitespace-nowrap ${
                activeView === 'matches'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              ⚽ Kampe
            </button>
            <button
              onClick={() => setActiveView('stadium')}
              className={`px-4 py-3 font-semibold border-b-2 transition whitespace-nowrap ${
                activeView === 'stadium'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              🏟️ Stadion
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeView === 'team' && <SelectTeamView onSelectTeam={selectTeam} />}
        {activeView === 'transfers' && <TransferMarketView />}
        {activeView === 'matches' && <MatchView />}
        {activeView === 'stadium' && <StadiumView />}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-300 mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p>DKManager25 © 2024 - Dansk Fodbold Management Spil</p>
          <p className="text-xs text-gray-500 mt-2">Build version 1.0</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
