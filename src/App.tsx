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
  const [activeView, setActiveView] = useState<'team' | 'transfers' | 'matches' | 'stadium'>('team');
  const selectedTeam = gameState.selectedTeam;
  const handleSelectTeam = (team: Team) => {
    selectTeam(team);
    setActiveView('team');
  };
  const navItems: Array<{ id: 'team' | 'transfers' | 'matches' | 'stadium'; label: string }> = [
    { id: 'team', label: 'Trup' },
    { id: 'transfers', label: 'Transfer' },
    { id: 'matches', label: 'Kampe' },
    { id: 'stadium', label: 'Stadion' },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {!selectedTeam ? (
        <SelectTeamView onSelectTeam={handleSelectTeam} />
      ) : (
        <>
          <header className="sticky top-0 z-20 border-b border-blue-500 bg-blue-600/95 text-white backdrop-blur">
            <div className="max-w-7xl mx-auto px-4 py-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-100">DKManager25</p>
                  <h1 className="text-lg font-bold sm:text-xl">{selectedTeam.name}</h1>
                </div>
                <div className="flex flex-wrap gap-2 text-sm">
                  <span className="rounded-full bg-white/15 px-3 py-2 font-semibold">Uge {gameState.week}</span>
                  <span className="rounded-full bg-white/15 px-3 py-2 font-semibold">{gameState.budget.toLocaleString('da-DK')} kr</span>
                  <span className="rounded-full bg-white/15 px-3 py-2 font-semibold">{gameState.fanCount.toLocaleString('da-DK')} fans</span>
                </div>
              </div>

              <nav className="-mx-4 mt-3 overflow-x-auto px-4 pb-1">
                <div className="flex min-w-max gap-2">
                  {navItems.map(({ id, label }) => (
                    <button
                      key={id}
                      onClick={() => setActiveView(id)}
                      className={`rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap ${
                        activeView === id
                          ? 'bg-white text-blue-700 shadow-sm'
                          : 'bg-blue-500/60 text-white hover:bg-blue-500'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </nav>
            </div>
          </header>
          <main className="max-w-7xl mx-auto px-4 py-4 sm:py-6">
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