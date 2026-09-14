import React, { useState } from 'react';
import { useGame } from './context/GameContext';
import SelectTeamView from './components/SelectTeamView';
import TransferMarketView from './components/TransferMarketView';
import MatchView from './components/MatchView';
import StadiumView from './components/StadiumView';
import TeamView from './components/TeamView';
import { Team } from './types/teams';

const App: React.FC = () => {
  const { gameState, feedback, clearFeedback, selectTeam } = useGame();
  const [activeView, setActiveView] = useState<'team' | 'transfers' | 'matches' | 'stadium'>('team');

  const handleSelectTeam = (team: Team) => {
    selectTeam(team);
    setActiveView('team');
  };

  const statusCards = [
    { label: 'Uge', value: gameState.week, accent: 'text-blue-100' },
    { label: 'Budget', value: `${gameState.budget.toLocaleString('da-DK')} kr`, accent: 'text-green-200' },
    { label: 'Fans', value: gameState.fanCount.toLocaleString('da-DK'), accent: 'text-blue-100' },
    { label: 'Fan mood', value: `${gameState.fanMood}/100`, accent: 'text-purple-200' },
    { label: 'Kapacitet', value: gameState.stadiumCapacity.toLocaleString('da-DK'), accent: 'text-orange-200' },
  ];

  const activeViewHelp = {
    team: 'Få overblik over truppen og se, hvor du mangler spillere.',
    transfers: 'Køb spillere eller sæt dine egne til salg uden at miste overblikket over budgettet.',
    matches: 'Start næste kamp, og afslut ugen når resultatet er på plads.',
    stadium: 'Udvid stadionet, når økonomien er klar til at øge indtægterne fremover.',
  };

  const feedbackStyles = {
    success: 'border-green-200 bg-green-50 text-green-900',
    info: 'border-blue-200 bg-blue-50 text-blue-900',
    warning: 'border-amber-200 bg-amber-50 text-amber-900',
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {!gameState.selectedTeam ? (
        <SelectTeamView onSelectTeam={handleSelectTeam} />
      ) : (
        <>
          <nav className="bg-blue-700 text-white shadow-lg">
            <div className="max-w-7xl mx-auto px-4 py-5 space-y-4">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-wide text-blue-100">Aktiv klub</p>
                  <h1 className="text-3xl font-bold">{gameState.selectedTeam.name}</h1>
                  <p className="text-sm text-blue-100 mt-1">{activeViewHelp[activeView]}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
                  {statusCards.map((card) => (
                    <div key={card.label} className="rounded-lg bg-white/10 px-4 py-3">
                      <p className="text-xs uppercase tracking-wide text-blue-100">{card.label}</p>
                      <p className={`text-lg font-bold ${card.accent}`}>{card.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'team', label: 'Trup' },
                  { id: 'transfers', label: 'Transfer' },
                  { id: 'matches', label: 'Kampe' },
                  { id: 'stadium', label: 'Stadion' },
                ].map((view) => (
                  <button
                    key={view.id}
                    onClick={() => setActiveView(view.id as typeof activeView)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold ${
                      activeView === view.id
                        ? 'bg-white text-blue-700 shadow'
                        : 'bg-blue-600/70 text-white hover:bg-blue-600'
                    }`}
                  >
                    {view.label}
                  </button>
                ))}
              </div>
            </div>
          </nav>

          {feedback && (
            <div className="max-w-7xl mx-auto px-4 pt-4">
              <div
                aria-live="polite"
                role="status"
                className={`flex items-start justify-between gap-4 rounded-lg border px-4 py-3 shadow-sm ${feedbackStyles[feedback.tone]}`}
              >
                <div>
                  <p className="font-bold">{feedback.title}</p>
                  <p className="text-sm">{feedback.message}</p>
                </div>
                <button
                  onClick={clearFeedback}
                  className="shrink-0 rounded px-2 py-1 text-sm font-semibold hover:bg-white/60"
                >
                  Luk
                </button>
              </div>
            </div>
          )}

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