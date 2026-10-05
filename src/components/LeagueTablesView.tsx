import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useGame } from '../context/GameContext';
import { getSeasonFixtures, type LeagueStanding } from '../data/leagues';
import LeagueTableCard from './LeagueTableCard';

interface LeagueTablesViewProps {
  currentStandings: LeagueStanding[];
}

const ARCHIVED_TABLE_ID = 'archived-league-table';

const LeagueTablesView: React.FC<LeagueTablesViewProps> = ({ currentStandings }) => {
  const { gameState } = useGame();
  const selectedClub = gameState.selectedClub;
  const seasonMatchCount = useMemo(() => getSeasonFixtures(selectedClub).length, [selectedClub]);
  const completedSeasons = useMemo(
    () => [...gameState.seasonHistory].sort((a, b) => b.season - a.season),
    [gameState.seasonHistory],
  );
  const latestArchivedSeason = completedSeasons[0]?.season ?? null;
  const [selectedArchivedSeason, setSelectedArchivedSeason] = useState<number | null>(latestArchivedSeason);

  useEffect(() => {
    setSelectedArchivedSeason(latestArchivedSeason);
  }, [gameState.season, latestArchivedSeason]);

  const historySectionRef = useRef<HTMLElement>(null);
  const scrollToHistory = () => {
    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    historySectionRef.current?.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
    historySectionRef.current?.focus({ preventScroll: true });
  };

  const archivedEntry =
    completedSeasons.find(entry => entry.season === selectedArchivedSeason) ?? completedSeasons[0] ?? null;

  return (
    <div className="space-y-8">
      <section aria-labelledby="current-season-section-heading" className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="current-season-section-heading" className="text-2xl font-bold">
              Aktuel sæson
            </h2>
            <p className="text-sm text-gray-600">
              Sæson {gameState.season} er i gang. Tabellen opdateres efter hver spillerunde.
            </p>
          </div>
          <button
            type="button"
            onClick={scrollToHistory}
            className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            Se sæsonhistorik ({completedSeasons.length})
          </button>
        </div>
        <LeagueTableCard
          leagueName={selectedClub?.league ?? ''}
          season={gameState.season}
          selectedTeamId={selectedClub?.id ?? ''}
          standings={currentStandings}
          currentSeason={gameState.season}
          headingLevel="h3"
        />
      </section>

      <section
        ref={historySectionRef}
        tabIndex={-1}
        aria-labelledby="season-history-section-heading"
        className="space-y-3 border-t-2 border-dashed border-gray-300 pt-6 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
      >
        <div>
          <h2 id="season-history-section-heading" className="text-2xl font-bold">
            Sæsonhistorik
            {completedSeasons.length > 0 && (
              <span className="ml-2 text-base font-normal text-gray-600">
                ({completedSeasons.length} afsluttede {completedSeasons.length === 1 ? 'sæson' : 'sæsoner'})
              </span>
            )}
          </h2>
          <p className="text-sm text-gray-600">
            Afsluttede sæsoner gemmes permanent med sluttabel og kampe. Vælg en sæson for at se dens sluttabel.
          </p>
        </div>

        {completedSeasons.length === 0 || !archivedEntry ? (
          <p className="rounded-lg border border-gray-200 bg-white px-4 py-6 text-center text-gray-500 shadow-sm">
            Ingen afsluttede sæsoner endnu. Sæsonen afsluttes efter {seasonMatchCount} ligakampe.
          </p>
        ) : (
          <>
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
              <ul className="divide-y" aria-label="Afsluttede sæsoner">
                {completedSeasons.map(entry => {
                  const teamStanding = entry.standings.find(standing => standing.teamId === entry.teamId);
                  const isSelected = entry.season === archivedEntry.season;
                  return (
                    <li key={entry.season}>
                      <button
                        type="button"
                        onClick={() => setSelectedArchivedSeason(entry.season)}
                        aria-pressed={isSelected}
                        aria-controls={ARCHIVED_TABLE_ID}
                        className={`w-full px-4 py-3 text-left flex flex-wrap items-center justify-between gap-2 border-l-4 transition ${
                          isSelected ? 'border-amber-500 bg-amber-50 font-semibold' : 'border-transparent hover:bg-gray-50'
                        }`}
                      >
                        <span>
                          Sæson {entry.season}
                          <span className="ml-2 text-sm font-normal text-gray-600">{entry.leagueName}</span>
                          <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-normal text-gray-700">
                            Afsluttet
                          </span>
                          {isSelected && (
                            <span className="ml-2 text-xs font-normal text-amber-800">Vises nedenfor</span>
                          )}
                        </span>
                        <span className="text-sm text-gray-700">
                          {entry.finalPosition ? `${entry.finalPosition}. plads` : 'Ingen placering'}
                          {teamStanding ? ` • ${teamStanding.points} point • ${teamStanding.won}-${teamStanding.drawn}-${teamStanding.lost}` : ''}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            <LeagueTableCard
              id={ARCHIVED_TABLE_ID}
              leagueName={archivedEntry.leagueName || selectedClub?.league || ''}
              season={archivedEntry.season}
              selectedTeamId={archivedEntry.teamId}
              standings={archivedEntry.standings}
              availableSeasons={completedSeasons.map(entry => entry.season)}
              currentSeason={gameState.season}
              onSeasonChange={setSelectedArchivedSeason}
              headingLevel="h3"
            />
          </>
        )}
      </section>
    </div>
  );
};

export default LeagueTablesView;
