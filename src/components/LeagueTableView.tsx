import React from 'react';
import { useGame } from '../context/GameContext';

const LeagueTableView: React.FC = () => {
  const { gameState } = useGame();
  const { selectedTeam, leagueStandings } = gameState;

  if (!selectedTeam) {
    return <div>Ingen klub valgt</div>;
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Ligatabel</h1>
        <p className="text-gray-600">Stillingen for {selectedTeam.name}s liga gemmes mellem genindlæsninger og opdateres efter spillede kampe.</p>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead className="bg-blue-600 text-white">
              <tr>
                <th className="p-3 text-left">#</th>
                <th className="p-3 text-left">Hold</th>
                <th className="p-3 text-center">K</th>
                <th className="p-3 text-center">V</th>
                <th className="p-3 text-center">U</th>
                <th className="p-3 text-center">T</th>
                <th className="p-3 text-center">MF</th>
                <th className="p-3 text-center">MM</th>
                <th className="p-3 text-center">MD</th>
                <th className="p-3 text-center">P</th>
              </tr>
            </thead>
            <tbody>
              {leagueStandings.map((entry, index) => {
                const isSelectedTeam = entry.teamId === selectedTeam.id;
                return (
                  <tr key={entry.teamId} className={`${isSelectedTeam ? 'bg-blue-50' : 'bg-white'} border-t border-gray-100`}>
                    <td className="p-3 font-semibold">{index + 1}</td>
                    <td className="p-3 font-medium">{entry.teamName}</td>
                    <td className="p-3 text-center">{entry.played}</td>
                    <td className="p-3 text-center">{entry.wins}</td>
                    <td className="p-3 text-center">{entry.draws}</td>
                    <td className="p-3 text-center">{entry.losses}</td>
                    <td className="p-3 text-center">{entry.goalsFor}</td>
                    <td className="p-3 text-center">{entry.goalsAgainst}</td>
                    <td className="p-3 text-center">{entry.goalDifference > 0 ? `+${entry.goalDifference}` : entry.goalDifference}</td>
                    <td className="p-3 text-center font-bold">{entry.points}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LeagueTableView;
