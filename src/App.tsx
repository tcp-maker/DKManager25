import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useGame } from './context/GameContext';
import SelectTeamView from './components/SelectTeamView';
import ConfirmAction from './components/ConfirmAction';
import TransferMarketView from './components/TransferMarketView';
import MatchView from './components/MatchView';
import StadiumView from './components/StadiumView';
import TeamView from './components/TeamView';
import ClubView from './components/ClubView';
import EconomyView from './components/EconomyView';
import LeagueTableCard from './components/LeagueTableCard';
import LeagueTablesView from './components/LeagueTablesView';
import TeamBadge from './components/TeamBadge';
import { buildLeagueStandings, getTeamById } from './data/leagues';
import { resolveAppView, type AppView } from './lib/navigation';

const resolveViewFromLocation = (): AppView => {
  if (typeof window === 'undefined') {
    return 'team';
  }

  return resolveAppView(window.location.hash, window.location.pathname);
};

const App: React.FC = () => {
  const { gameState, storageError, selectClub, restartCurrentClub, resetGame } = useGame();
  const [activeView, setActiveView] = useState<AppView>(resolveViewFromLocation);
  const [isResetConfirmationOpen, setIsResetConfirmationOpen] = useState(false);
  const [isRestartConfirmationOpen, setIsRestartConfirmationOpen] = useState(false);
  const startNewGameButtonRef = useRef<HTMLButtonElement | null>(null);

  const selectedClub = gameState.selectedClub ? (getTeamById(gameState.selectedClub.id) ?? gameState.selectedClub) : null;
  const isBankrupt = gameState.economy.isBankrupt;
  const leagueTable = useMemo(
    () => buildLeagueStandings(selectedClub, gameState.season, gameState.leagueMatches),
    [selectedClub, gameState.season, gameState.leagueMatches],
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
        setActiveView('club');
        return;
      }

      if (event.key === '6') {
        event.preventDefault();
        setActiveView('table');
        return;
      }

      if (event.key === '7') {
        event.preventDefault();
        setActiveView('economy');
        return;
      }

      if (selectedClub && event.key.toLowerCase() === 'r') {
        event.preventDefault();
        setIsRestartConfirmationOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isBankrupt, selectedClub]);

  useEffect(() => {
    if (!isBankrupt) {
      return;
    }

    setIsResetConfirmationOpen(false);
    setIsRestartConfirmationOpen(false);
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
      const view = resolveViewFromLocation();
      setActiveView(view);
      const expectedHash = `#${view}`;
      if (window.location.hash !== expectedHash) {
        window.history.replaceState(null, '', expectedHash);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
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
      case 'club':
        return <ClubView />;
      case 'economy':
        return <EconomyView />;
      case 'table':
        return <LeagueTablesView currentStandings={leagueTable} />;
      default:
        return <TeamView />;
    }
  };

  const handleResetGame = () => {
    resetGame();
    setActiveView('team');
    return null;
  };

  const handleStartNewGame = () => {
    restartCurrentClub();
    setActiveView('team');
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {storageError && (
        <p role="alert" className="bg-red-100 px-4 py-3 text-center text-sm font-semibold text-red-900">
          {storageError}
        </p>
      )}
      {!selectedClub ? (
        <SelectTeamView onSelectClub={selectClub} />
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
                {selectedClub.name} nåede tre sammenhængende afsluttede uger i status <span className="font-semibold">Krise</span>.
                Du kan ikke fortsætte sæsonen fra denne gemte tilstand.
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-3 rounded-xl bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <TeamBadge team={selectedClub} size="lg" />
                <div>
                  <p className="font-semibold text-gray-900">{selectedClub.name}</p>
                  <p className="text-sm text-gray-600">Sæson {gameState.season} • Uge {gameState.week}</p>
                </div>
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
          <nav aria-label="Hovedmenu" className="bg-blue-600 text-white p-4">
            <div className="max-w-7xl mx-auto flex flex-wrap items-start gap-4">
              <div className="flex flex-wrap gap-4">
                <button type="button" onClick={() => setActiveView('team')} aria-current={activeView === 'team' ? 'page' : undefined} className={activeView === 'team' ? 'font-bold' : ''}>Trup</button>
                <button type="button" onClick={() => setActiveView('transfers')} aria-current={activeView === 'transfers' ? 'page' : undefined} className={activeView === 'transfers' ? 'font-bold' : ''}>Transfer</button>
                <button type="button" onClick={() => setActiveView('matches')} aria-current={activeView === 'matches' ? 'page' : undefined} className={activeView === 'matches' ? 'font-bold' : ''}>Kampe</button>
                <button type="button" onClick={() => setActiveView('stadium')} aria-current={activeView === 'stadium' ? 'page' : undefined} className={activeView === 'stadium' ? 'font-bold' : ''}>Stadion</button>
                <button type="button" onClick={() => setActiveView('club')} aria-current={activeView === 'club' ? 'page' : undefined} className={activeView === 'club' ? 'font-bold' : ''}>Klub</button>
                <button type="button" onClick={() => setActiveView('economy')} aria-current={activeView === 'economy' ? 'page' : undefined} className={activeView === 'economy' ? 'font-bold' : ''}>Økonomi</button>
                <button type="button" onClick={() => setActiveView('table')} aria-current={activeView === 'table' ? 'page' : undefined} className={activeView === 'table' ? 'font-bold' : ''}>Tabel</button>
              </div>

              <div className="w-full border-t border-blue-500 pt-3 sm:ml-auto sm:w-56 sm:border-l sm:border-t-0 sm:border-blue-500 sm:pl-4 sm:pt-0">
                <ConfirmAction
                  label="Genstart klub"
                  confirmLabel="Bekræft genstart"
                  confirmMessage="Genstart bevarer din valgte klub, men nulstiller sæsonen og opretter en opdateret trup med nye positioner, roller og evneniveauer. Fortsæt?"
                  onConfirm={handleStartNewGame}
                  isOpen={isRestartConfirmationOpen}
                  onOpenChange={setIsRestartConfirmationOpen}
                  buttonClassName="bg-amber-600 hover:bg-amber-700 text-white"
                  confirmButtonClassName="bg-amber-700 hover:bg-amber-800 text-white"
                />
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
            <div className={`grid gap-6 ${activeView !== 'team' && activeView !== 'club' && activeView !== 'economy' && activeView !== 'table' ? 'xl:grid-cols-[minmax(0,2.2fr)_minmax(320px,1fr)]' : ''}`}>
              <div>{renderMainView()}</div>

              {activeView !== 'table' && activeView !== 'team' && activeView !== 'club' && activeView !== 'economy' && (
                <aside className="xl:sticky xl:top-4 xl:self-start">
                  <LeagueTableCard
                    leagueName={selectedClub.league}
                    season={gameState.season}
                    selectedTeamId={selectedClub.id}
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
