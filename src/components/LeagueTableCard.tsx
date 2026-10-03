import React from 'react';
import { getTeamById, LeagueStanding } from '../data/leagues';
import TeamBadge from './TeamBadge';

interface LeagueTableCardProps {
  leagueName: string;
  season: number;
  selectedTeamId: string;
  standings: LeagueStanding[];
  availableSeasons?: number[];
  currentSeason?: number;
  onSeasonChange?: (season: number) => void;
}

const LeagueTableCard: React.FC<LeagueTableCardProps> = ({
  leagueName,
  season,
  selectedTeamId,
  standings,
  availableSeasons,
  currentSeason,
  onSeasonChange,
}) => {
  const isArchivedSeason = currentSeason !== undefined && season !== currentSeason;
  const showSeasonSelector = Boolean(onSeasonChange && availableSeasons && availableSeasons.length > 1);

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="border-b border-gray-100 px-4 py-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">{isArchivedSeason ? 'Sluttabel' : 'Ligatabel'}</h2>
          <p className="text-sm text-gray-600">
            {leagueName} • Sæson {season}{isArchivedSeason ? ' (afsluttet)' : ''}
          </p>
        </div>
        {showSeasonSelector && (
          <label className="text-sm text-gray-600 flex items-center gap-2">
            Sæson
            <select
              value={season}
              onChange={event => onSeasonChange?.(Number(event.target.value))}
              className="rounded border border-gray-300 bg-white px-2 py-1 text-gray-900"
            >
              {availableSeasons?.map(option => (
                <option key={option} value={option}>
                  Sæson {option}{option === currentSeason ? ' (aktuel)' : ''}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <div className="max-h-[70vh] overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 bg-gray-50 text-gray-600">
            <tr>
              <th className="px-3 py-2 text-left">#</th>
              <th className="px-3 py-2 text-left">Hold</th>
              <th className="px-3 py-2 text-center">K</th>
              <th className="px-3 py-2 text-center">+/-</th>
              <th className="px-3 py-2 text-center">P</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((team, index) => (
              <tr
                key={team.teamId}
                className={`border-t ${team.teamId === selectedTeamId ? 'bg-blue-50 font-semibold' : 'bg-white'}`}
              >
                <td className="px-3 py-2">{index + 1}</td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <TeamBadge
                      team={getTeamById(team.teamId) ?? { name: team.teamName, logo: '⚽' }}
                      size="sm"
                    />
                    <span>{team.teamName}</span>
                  </div>
                </td>
                <td className="px-3 py-2 text-center">{team.played}</td>
                <td className="px-3 py-2 text-center">{team.goalDifference}</td>
                <td className="px-3 py-2 text-center">{team.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LeagueTableCard;
