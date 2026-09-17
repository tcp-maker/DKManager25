import React from 'react';
import { LeagueDefinition, LeagueStanding } from '../data/leagues';

interface LeagueTableProps {
  league: LeagueDefinition;
  standings: LeagueStanding[];
  selectedTeamId?: string;
}

const LeagueTable: React.FC<LeagueTableProps> = ({ league, standings, selectedTeamId }) => (
  <div className="bg-white rounded-lg shadow overflow-hidden">
    <div className={`bg-gradient-to-r ${league.color} px-4 py-3`}>
      <h3 className="text-lg font-bold text-white">{league.name} - Stilling</h3>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px]">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-3 text-left text-sm font-semibold">#</th>
            <th className="p-3 text-left text-sm font-semibold">Hold</th>
            <th className="p-3 text-center text-sm font-semibold"><abbr title="Kampe">K</abbr></th>
            <th className="p-3 text-center text-sm font-semibold"><abbr title="Vundne">V</abbr></th>
            <th className="p-3 text-center text-sm font-semibold"><abbr title="Uafgjorte">U</abbr></th>
            <th className="p-3 text-center text-sm font-semibold"><abbr title="Tabte">T</abbr></th>
            <th className="p-3 text-center text-sm font-semibold"><abbr title="Mål for og imod">MF</abbr></th>
            <th className="p-3 text-center text-sm font-semibold"><abbr title="Målforskel">+/-</abbr></th>
            <th className="p-3 text-center text-sm font-semibold"><abbr title="Point">P</abbr></th>
          </tr>
        </thead>
        <tbody>
          {standings.map((standing, index) => {
            const team = league.teams.find((entry) => entry.id === standing.teamId);
            const isSelectedTeam = standing.teamId === selectedTeamId;

            return (
              <tr
                key={standing.teamId}
                className={`${isSelectedTeam ? 'bg-blue-50' : 'bg-white'} border-t`}
              >
                <td className="p-3 font-semibold">{index + 1}</td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <span>{team?.logo ?? '⚽'}</span>
                    <span className={`font-medium ${isSelectedTeam ? 'text-blue-700' : 'text-gray-900'}`}>
                      {team?.name ?? standing.teamId}
                    </span>
                  </div>
                </td>
                <td className="p-3 text-center">{standing.played}</td>
                <td className="p-3 text-center">{standing.wins}</td>
                <td className="p-3 text-center">{standing.draws}</td>
                <td className="p-3 text-center">{standing.losses}</td>
                <td className="p-3 text-center">{standing.goalsFor}-{standing.goalsAgainst}</td>
                <td className="p-3 text-center">{standing.goalDifference > 0 ? `+${standing.goalDifference}` : standing.goalDifference}</td>
                <td className="p-3 text-center font-bold">{standing.points}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </div>
);

export default LeagueTable;
