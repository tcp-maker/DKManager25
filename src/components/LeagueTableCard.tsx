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
  id?: string;
  headingLevel?: 'h2' | 'h3';
}

const LeagueTableCard: React.FC<LeagueTableCardProps> = ({
  leagueName,
  season,
  selectedTeamId,
  standings,
  availableSeasons,
  currentSeason,
  onSeasonChange,
  id,
  headingLevel: Heading = 'h2',
}) => {
  const isArchivedSeason = currentSeason !== undefined && season !== currentSeason;
  const isKnownCurrentSeason = currentSeason !== undefined && season === currentSeason;
  const showSeasonSelector = Boolean(onSeasonChange && availableSeasons && availableSeasons.length > 1);
  const title = isArchivedSeason ? 'Sluttabel' : 'Ligatabel';
  const headingId = id ? `${id}-heading` : undefined;

  return (
    <div
      id={id}
      className={`rounded-lg border bg-white shadow-sm overflow-hidden ${
        isArchivedSeason ? 'border-amber-300' : 'border-gray-200'
      }`}
    >
      <div
        className={`border-b px-4 py-4 flex flex-wrap items-start justify-between gap-3 ${
          isArchivedSeason ? 'border-amber-200 bg-amber-50' : 'border-gray-100'
        }`}
      >
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Heading id={headingId} className="text-xl font-bold">{title}</Heading>
            {isArchivedSeason && (
              <span className="rounded-full bg-amber-200 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-amber-900">
                Afsluttet sæson
              </span>
            )}
            {isKnownCurrentSeason && (
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-green-800">
                Aktuel sæson
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600">
            {leagueName} • Sæson {season}{isArchivedSeason ? ' • endelig stilling' : ''}
          </p>
        </div>
        {showSeasonSelector && (
          <label className="text-sm text-gray-600 flex items-center gap-2">
            {isArchivedSeason ? 'Vælg afsluttet sæson' : 'Sæson'}
            <select
              value={season}
              onChange={event => onSeasonChange?.(Number(event.target.value))}
              className="rounded border border-gray-300 bg-white px-2 py-1 text-gray-900"
            >
              {availableSeasons?.map(option => (
                <option key={option} value={option}>
                  Sæson {option}{currentSeason === undefined ? '' : option === currentSeason ? ' (aktuel)' : ' (afsluttet)'}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <div className="max-h-[70vh] overflow-auto">
        <table className="min-w-full text-sm">
          <caption className="sr-only">
            {title} for {leagueName}, sæson {season}{isArchivedSeason ? ' (afsluttet sæson)' : ''}
          </caption>
          <thead className="sticky top-0 bg-gray-50 text-gray-600">
            <tr>
              <th scope="col" className="px-3 py-2 text-left">#</th>
              <th scope="col" className="px-3 py-2 text-left">Hold</th>
              <th scope="col" className="px-3 py-2 text-center">K</th>
              <th scope="col" className="px-3 py-2 text-center">+/-</th>
              <th scope="col" className="px-3 py-2 text-center">P</th>
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
                    {team.teamId === selectedTeamId && <span className="sr-only">(dit hold)</span>}
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
