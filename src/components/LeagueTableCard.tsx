import React from 'react';
import { LeagueStanding } from '../data/leagues';

interface LeagueTableCardProps {
  leagueName: string;
  season: number;
  selectedTeamId: string;
  standings: LeagueStanding[];
}

const LeagueTableCard: React.FC<LeagueTableCardProps> = ({ leagueName, season, selectedTeamId, standings }) => {
  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="border-b border-gray-100 px-4 py-4">
        <h2 className="text-xl font-bold">Ligatabel</h2>
        <p className="text-sm text-gray-600">{leagueName} • Sæson {season}</p>
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
                <td className="px-3 py-2">{team.teamName}</td>
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
