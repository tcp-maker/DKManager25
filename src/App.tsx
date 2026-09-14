import React, { useState } from 'react';
import { useGame } from './context/GameContext';
import SelectTeamView from './components/SelectTeamView';
import TeamView from './components/TeamView';
import TransferMarketView from './components/TransferMarketView';
import MatchView from './components/MatchView';
import StadiumView from './components/StadiumView';

type ViewType = 'team' | 'transfers' | 'matches' | 'stadium';

const App: React.FC = () => {
  const { gameState, selectTeam, resetGame } = useGame();
  const [activeView, setActiveView] = useState<ViewType>('team');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // If no team selected, show team selection
  if (!gameState.selectedTeam) {
    return <SelectTeamView onSelectTeam={selectTeam} />;
  }

  const handleResetClick = () => {
    setShowResetConfirm(true);
  };

  const handleConfirmReset = () => {
    resetGame();
    setShowResetConfirm(false);
  };

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
              <button
                onClick={handleResetClick}
                className="ml-4 px-3 py-2 bg-red-100 text-red-700 font-semibold rounded-lg hover:bg-red-200 transition text-sm"
                title="Start nyt spil"
              >
                🔄 Nyt Spil
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Start Nyt Spil?</h2>
            <p className="text-gray-700 mb-6">
              Hvis du starter et nyt spil, slettes al din progression og du vender tilbage til klubvalg-skærmen.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-900 font-semibold rounded-lg hover:bg-gray-400 transition"
              >
                Annuller
              </button>
              <button
                onClick={handleConfirmReset}
                className="flex-1 px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition"
              >
                Ja, Start Nyt Spil
              </button>
            </div>
          </div>
        </div>
      )}

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
        {activeView === 'team' && <TeamView />}
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
