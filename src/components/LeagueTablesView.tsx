import React, { useEffect, useMemo, useState } from 'react';
import { useGame } from '../context/GameContext';
import { getAvailableSeasons, type LeagueStanding } from '../data/leagues';
import LeagueTableCard from './LeagueTableCard';

interface LeagueTablesViewProps {
  currentStandings: LeagueStanding[];
}

const LeagueTablesView: React.FC<LeagueTablesViewProps> = ({ currentStandings }) => {
  const { gameState } = useGame();
  const [selectedSeason, setSelectedSeason] = useState(gameState.season);
  const selectedTeam = gameState.selectedTeam;
  const availableSeasons = useMemo(
    () => getAvailableSeasons(gameState.season, gameState.seasonHistory),
    [gameState.season, gameState.seasonHistory],
  );
  const completedSeasons = useMemo(
    () => [...gameState.seasonHistory].sort((a, b) => b.season - a.season),
    [gameState.seasonHistory],
  );

  useEffect(() => {
    setSelectedSeason(gameState.season);
  }, [gameState.season]);

  const archivedEntry = gameState.seasonHistory.find(entry => entry.season === selectedSeason) ?? null;
  const isCurrentSeason = selectedSeason === gameState.season || !archivedEntry;
  const season = isCurrentSeason ? gameState.season : selectedSeason;

  return (
    <div className="space-y-6">
      <LeagueTableCard
        leagueName={isCurrentSeason ? (selectedTeam?.league ?? '') : (archivedEntry?.leagueName || selectedTeam?.league || '')}
        season={season}
        selectedTeamId={isCurrentSeason ? (selectedTeam?.id ?? '') : (archivedEntry?.teamId ?? '')}
        standings={isCurrentSeason ? currentStandings : (archivedEntry?.standings ?? [])}
        availableSeasons={availableSeasons}
        currentSeason={gameState.season}
        onSeasonChange={setSelectedSeason}
      />

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-gray-100 px-4 py-4">
          <h2 className="text-xl font-bold">Tidligere sæsoner</h2>
          <p className="text-sm text-gray-600">Afsluttede sæsoner gemmes permanent med sluttabel og kampe.</p>
        </div>

        {completedSeasons.length === 0 ? (
          <p className="px-4 py-6 text-center text-gray-500">
            Ingen afsluttede sæsoner endnu. Sæsonen afsluttes efter 22 ligakampe.
          </p>
        ) : (
          <ul className="divide-y">
            {completedSeasons.map(entry => {
              const teamStanding = entry.standings.find(standing => standing.teamId === entry.teamId);
              const isSelected = entry.season === season;
              return (
                <li key={entry.season}>
                  <button
                    type="button"
                    onClick={() => setSelectedSeason(entry.season)}
                    className={`w-full px-4 py-3 text-left flex flex-wrap items-center justify-between gap-2 transition ${
                      isSelected ? 'bg-blue-50 font-semibold' : 'hover:bg-gray-50'
                    }`}
                  >
                    <span>
                      Sæson {entry.season}
                      <span className="ml-2 text-sm font-normal text-gray-600">{entry.leagueName}</span>
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
        )}
      </div>
    </div>
  );
};

export default LeagueTablesView;
