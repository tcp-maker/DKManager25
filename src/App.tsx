import React, { useState } from 'react';
import { useGame } from './context/GameContext';
import { Team } from './types/teams';
import SelectTeamView from './components/SelectTeamView';
import TransferMarketView from './components/TransferMarketView';
import MatchView from './components/MatchView';
import StadiumView from './components/StadiumView';
import TeamView from './components/TeamView';

type NotificationTone = 'info' | 'success' | 'warning';

const App: React.FC = () => {
  const { gameState, selectTeam } = useGame();
  const [activeView, setActiveView] = useState<'team' | 'transfers' | 'matches' | 'stadium'>('team');
  const [statusMessage, setStatusMessage] = useState<{ tone: NotificationTone; message: string } | null>(null);

  const showMessage = (message: string, tone: NotificationTone = 'info') => {
    setStatusMessage({ message, tone });
  };

  const handleSelectTeam = (team: Team) => {
    selectTeam(team);
    setActiveView('team');
    showMessage(`Du har valgt ${team.name}. Start med at gennemgå truppen, og planlæg din første uge.`, 'success');
  };

  const fanMoodLabel =
    gameState.fanMood >= 75 ? 'Fantastisk' : gameState.fanMood >= 50 ? 'Stabil' : 'Bekymret';

  const messageStyles: Record<NotificationTone, string> = {
    info: 'bg-blue-50 border-blue-500 text-blue-900',
    success: 'bg-green-50 border-green-500 text-green-900',
    warning: 'bg-yellow-50 border-yellow-500 text-yellow-900',
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {!gameState.selectedTeam ? (
        <SelectTeamView onSelectTeam={handleSelectTeam} />
      ) : (
        <>
          <nav className="bg-blue-600 text-white p-4">
            <div className="max-w-7xl mx-auto flex gap-4">
              <button onClick={() => setActiveView('team')} className={activeView === 'team' ? 'font-bold' : ''}>Trup</button>
              <button onClick={() => setActiveView('transfers')} className={activeView === 'transfers' ? 'font-bold' : ''}>Transfer</button>
              <button onClick={() => setActiveView('matches')} className={activeView === 'matches' ? 'font-bold' : ''}>Kampe</button>
              <button onClick={() => setActiveView('stadium')} className={activeView === 'stadium' ? 'font-bold' : ''}>Stadion</button>
            </div>
          </nav>
          <section className="bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 py-3 grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="rounded-lg bg-gray-50 px-3 py-2">
                <p className="text-xs text-gray-500">Klub</p>
                <p className="font-semibold text-gray-900">{gameState.selectedTeam.name}</p>
              </div>
              <div className="rounded-lg bg-gray-50 px-3 py-2">
                <p className="text-xs text-gray-500">Uge</p>
                <p className="font-semibold text-gray-900">{gameState.week}</p>
              </div>
              <div className="rounded-lg bg-gray-50 px-3 py-2">
                <p className="text-xs text-gray-500">Budget</p>
                <p className="font-semibold text-gray-900">{gameState.budget.toLocaleString('da-DK')} kr</p>
              </div>
              <div className="rounded-lg bg-gray-50 px-3 py-2">
                <p className="text-xs text-gray-500">Fans</p>
                <p className="font-semibold text-gray-900">{gameState.fanCount.toLocaleString('da-DK')}</p>
              </div>
              <div className="rounded-lg bg-gray-50 px-3 py-2">
                <p className="text-xs text-gray-500">Fan Mood</p>
                <p className="font-semibold text-gray-900">{gameState.fanMood}/100 · {fanMoodLabel}</p>
              </div>
            </div>
          </section>
          <main className="max-w-7xl mx-auto px-4 py-8">
            {statusMessage && (
              <div className={`mb-6 border-l-4 rounded p-4 flex justify-between gap-4 ${messageStyles[statusMessage.tone]}`}>
                <p className="text-sm md:text-base">{statusMessage.message}</p>
                <button
                  onClick={() => setStatusMessage(null)}
                  className="font-semibold underline text-sm"
                >
                  Luk
                </button>
              </div>
            )}
            {activeView === 'team' && <TeamView />}
            {activeView === 'transfers' && <TransferMarketView onNotify={showMessage} />}
            {activeView === 'matches' && <MatchView onNotify={showMessage} />}
            {activeView === 'stadium' && <StadiumView onNotify={showMessage} />}
          </main>
        </>
      )}
    </div>
  );
};

export default App;