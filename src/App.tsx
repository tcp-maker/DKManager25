import { useState } from 'react';
import { useGame } from './context/GameContext';
import SelectTeamView from './components/SelectTeamView';
import TransferMarketView from './components/TransferMarketView';
import MatchView from './components/MatchView';
import StadiumView from './components/StadiumView';
import TeamView from './components/TeamView';

const NAV_ITEMS = [
  { key: 'team', label: 'Trup', icon: '👥' },
  { key: 'transfers', label: 'Transfer', icon: '💸' },
  { key: 'matches', label: 'Kampe', icon: '⚽' },
  { key: 'stadium', label: 'Stadion', icon: '🏟️' },
] as const;

const App = () => {
  const { gameState, selectTeam } = useGame();
  const [activeView, setActiveView] = useState<'team' | 'transfers' | 'matches' | 'stadium'>('team');

  const selectedTeam = gameState.selectedTeam;

  return (
    <div className="min-h-screen bg-gray-100">
      {!selectedTeam ? (
        <SelectTeamView onSelectTeam={selectTeam} />
      ) : (
        <>
          <nav className="bg-blue-600 text-white px-3 py-3 shadow-sm md:px-4 md:py-4">
            <div className="max-w-7xl mx-auto hidden md:flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-blue-100">Aktiv klub</p>
                <p className="font-bold text-lg">
                  {selectedTeam.logo} {selectedTeam.name}
                </p>
              </div>
              <div className="flex gap-2 rounded-xl bg-blue-700/40 p-1">
                {NAV_ITEMS.map(item => (
                  <button
                    key={item.key}
                    onClick={() => setActiveView(item.key)}
                    className={`rounded-lg px-4 py-2 font-semibold ${
                      activeView === item.key ? 'bg-white text-blue-700' : 'text-white hover:bg-blue-500/60'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <div className="text-right text-sm">
                <p>Uge {gameState.week}</p>
                <p className="text-blue-100">{gameState.budget.toLocaleString('da-DK')} kr</p>
              </div>
            </div>

            <div className="max-w-7xl mx-auto md:hidden">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-blue-100">Aktiv klub</p>
                  <p className="font-bold">
                    {selectedTeam.logo} {selectedTeam.name}
                  </p>
                </div>
                <div className="text-right text-xs text-blue-100">
                  <p>Uge {gameState.week}</p>
                  <p>{gameState.budget.toLocaleString('da-DK')} kr</p>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2 mt-3">
                {NAV_ITEMS.map(item => (
                  <button
                    key={item.key}
                    onClick={() => setActiveView(item.key)}
                    className={`rounded-xl px-2 py-2 text-center text-xs font-semibold ${
                      activeView === item.key ? 'bg-white text-blue-700' : 'bg-blue-500/50 text-white'
                    }`}
                  >
                    <span className="block text-base">{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </nav>

          <main className="max-w-7xl mx-auto px-3 py-5 pb-safe-bottom md:px-4 md:py-8">
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
