import React, { useEffect, useMemo, useState } from 'react';
import { useGame } from './context/GameContext';
import SelectTeamView from './components/SelectTeamView';
import ConfirmAction from './components/ConfirmAction';
import TransferMarketView from './components/TransferMarketView';
import MatchView from './components/MatchView';
import StadiumView from './components/StadiumView';
import TeamView from './components/TeamView';
import EconomyView from './components/EconomyView';
import LeagueTableCard from './components/LeagueTableCard';
import { buildLeagueStandings, getTeamById } from './data/leagues';

const App: React.FC = () => {
  const { gameState, selectTeam, resetGame } = useGame();
  const [activeView, setActiveView] = useState<'team' | 'transfers' | 'matches' | 'stadium' | 'economy' | 'table'>('team');

  const selectedTeam = gameState.selectedTeam ? (getTeamById(gameState.selectedTeam.id) ?? gameState.selectedTeam) : null;
  const leagueTable = useMemo(
    () => buildLeagueStandings(selectedTeam, gameState.season, gameState.leagueMatches),
    [selectedTeam, gameState.season, gameState.leagueMatches],
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTypingField = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement;
      if (isTypingField) {
        return;
      }

      if (event.key === '1') {
        event.preventDefault();
        setActiveView('team');
        return;
      }

      if (event.key === '2') {
        event.preventDefault();
        setActiveView('transfers');
        return;
      }

      if (event.key === '3') {
        event.preventDefault();
        setActiveView('matches');
        return;
      }

      if (event.key === '4') {
        event.preventDefault();
        setActiveView('stadium');
        return;
      }

      if (event.key === '5') {
        event.preventDefault();
        setActiveView('economy');
        return;
      }

      if (event.key === '6') {
        event.preventDefault();
        setActiveView('table');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const renderMainView = () => {
    switch (activeView) {
      case 'team':
        return <TeamView />;
      case 'transfers':
        return <TransferMarketView />;
      case 'matches':
        return <MatchView />;
      case 'stadium':
        return <StadiumView />;
      case 'economy':
        return <EconomyView />;
      case 'table':
        return (
          <LeagueTableCard
            leagueName={selectedTeam?.league ?? ''}
            season={gameState.season}
            selectedTeamId={selectedTeam?.id ?? ''}
            standings={leagueTable}
          />
        );
      default:
        return <TeamView />;
    }
  };

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
              <button onClick={() => setActiveView('economy')} className={activeView === 'economy' ? 'font-bold' : ''}>Økonomi</button>
              <button onClick={() => setActiveView('table')} className={activeView === 'table' ? 'font-bold' : ''}>Tabel</button>
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
            <div className="grid gap-6 xl:grid-cols-[minmax(0,2.2fr)_minmax(320px,1fr)]">
              <div>{renderMainView()}</div>

              {activeView !== 'table' && (
                <aside className="xl:sticky xl:top-4 xl:self-start">
                  <LeagueTableCard
                    leagueName={selectedTeam.league}
                    season={gameState.season}
                    selectedTeamId={selectedTeam.id}
                    standings={leagueTable}
                  />
                </aside>
              )}
            </div>
          </main>
        </>
      )}
    </div>
  );
};

export default App;
