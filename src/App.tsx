import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  const startNewGameButtonRef = useRef<HTMLButtonElement | null>(null);

  const selectedTeam = gameState.selectedTeam ? (getTeamById(gameState.selectedTeam.id) ?? gameState.selectedTeam) : null;
  const isBankrupt = gameState.economy.isBankrupt;
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

      if (isBankrupt) {
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
  }, [isBankrupt, selectedTeam]);

  useEffect(() => {
    if (!isBankrupt) {
      return;
    }

    setIsResetConfirmationOpen(false);
    startNewGameButtonRef.current?.focus();
  }, [isBankrupt]);

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

  const handleStartNewGame = () => {
    resetGame();
    setActiveView('team');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {!selectedTeam ? (
        <SelectTeamView onSelectTeam={selectTeam} />
      ) : isBankrupt ? (
        <main className="flex min-h-screen items-center justify-center px-4 py-8">
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="bankruptcy-title"
            aria-describedby="bankruptcy-description"
            className="w-full max-w-2xl rounded-2xl border border-red-200 bg-white p-6 shadow-lg sm:p-8"
          >
            <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-950">
              <p className="text-sm font-semibold uppercase tracking-wide text-red-700">Spillet er slut</p>
              <h1 id="bankruptcy-title" className="mt-2 text-3xl font-bold">Klubben er gået konkurs</h1>
              <p className="mt-4 text-base leading-7" id="bankruptcy-description">
                Klubben er solgt til Stanglakrids FC. Bestyrelsen har erklæret klubben konkurs, og din ledelse er afsluttet.
              </p>
              <p className="mt-3 text-sm leading-6 text-red-900/80">
                {selectedTeam.name} nåede tre sammenhængende afsluttede uger i status <span className="font-semibold">Krise</span>.
                Du kan ikke fortsætte sæsonen fra denne gemte tilstand.
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-3 rounded-xl bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-gray-900">{selectedTeam.name}</p>
                <p className="text-sm text-gray-600">Sæson {gameState.season} • Uge {gameState.week}</p>
              </div>

              <button
                ref={startNewGameButtonRef}
                type="button"
                onClick={handleStartNewGame}
                className="w-full rounded bg-blue-600 px-4 py-3 font-bold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
              >
                Start nyt spil
              </button>
            </div>
          </section>
        </main>
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
