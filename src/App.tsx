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

type AppView = 'team' | 'transfers' | 'matches' | 'stadium' | 'economy' | 'table';

const viewAliases: Record<string, AppView> = {
  team: 'team',
  trup: 'team',
  transfers: 'transfers',
  transfer: 'transfers',
  matches: 'matches',
  kampe: 'matches',
  stadium: 'stadium',
  stadion: 'stadium',
  economy: 'economy',
  okonomi: 'economy',
  økonomi: 'economy',
  table: 'table',
  tabel: 'table',
};

const resolveViewFromLocation = (): AppView => {
  if (typeof window === 'undefined') {
    return 'team';
  }

  const hashView = decodeURIComponent(window.location.hash.replace(/^#/, '')).toLowerCase();
  if (hashView && viewAliases[hashView]) {
    return viewAliases[hashView];
  }

  const pathSegment = decodeURIComponent(window.location.pathname.replace(/^\/+/, '').split('/')[0] ?? '').toLowerCase();
  if (pathSegment && viewAliases[pathSegment]) {
    return viewAliases[pathSegment];
  }

  return 'team';
};

const App: React.FC = () => {
  const { gameState, selectTeam, resetGame } = useGame();
  const [activeView, setActiveView] = useState<AppView>(resolveViewFromLocation);
  const [isResetConfirmationOpen, setIsResetConfirmationOpen] = useState(false);

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
        return;
      }

      if (selectedTeam && event.key.toLowerCase() === 'r') {
        event.preventDefault();
        setIsResetConfirmationOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedTeam]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const expectedHash = `#${activeView}`;
    if (window.location.hash !== expectedHash) {
      window.history.replaceState(null, '', expectedHash);
    }
  }, [activeView]);

  useEffect(() => {
    const handleHashChange = () => {
      setActiveView(resolveViewFromLocation());
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const renderMainView = () => {
    switch (activeView) {
      case 'team':
        return <TeamView onOpenEconomy={() => setActiveView('economy')} />;
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
        return <TeamView onOpenEconomy={() => setActiveView('economy')} />;
    }
  };

  const handleResetGame = () => {
    resetGame();
    setActiveView('team');
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {!selectedTeam ? (
        <SelectTeamView onSelectTeam={selectTeam} />
      ) : (
        <>
          <nav className="bg-blue-600 text-white p-4">
            <div className="max-w-7xl mx-auto flex flex-wrap items-start gap-4">
              <div className="flex flex-wrap gap-4">
                <button onClick={() => setActiveView('team')} className={activeView === 'team' ? 'font-bold' : ''}>Trup</button>
                <button onClick={() => setActiveView('transfers')} className={activeView === 'transfers' ? 'font-bold' : ''}>Transfer</button>
                <button onClick={() => setActiveView('matches')} className={activeView === 'matches' ? 'font-bold' : ''}>Kampe</button>
                <button onClick={() => setActiveView('stadium')} className={activeView === 'stadium' ? 'font-bold' : ''}>Stadion</button>
                <button onClick={() => setActiveView('economy')} className={activeView === 'economy' ? 'font-bold' : ''}>Økonomi</button>
                <button onClick={() => setActiveView('table')} className={activeView === 'table' ? 'font-bold' : ''}>Tabel</button>
              </div>

              <div className="w-full border-t border-blue-500 pt-3 sm:ml-auto sm:w-56 sm:border-l sm:border-t-0 sm:border-blue-500 sm:pl-4 sm:pt-0">
                <ConfirmAction
                  label="Nulstil spil"
                  confirmLabel="Bekræft nulstilling"
                  confirmMessage="Dette sletter din nuværende klub, sæson, ligastilling og gemte spiltilstand. Er du sikker på, at du vil starte forfra?"
                  onConfirm={handleResetGame}
                  isOpen={isResetConfirmationOpen}
                  onOpenChange={setIsResetConfirmationOpen}
                  buttonClassName="bg-red-700 hover:bg-red-800 text-white"
                  confirmButtonClassName="bg-red-800 hover:bg-red-900 text-white"
                />
              </div>
            </div>
          </nav>

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
