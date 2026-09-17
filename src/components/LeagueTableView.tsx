import React from 'react';
import { calculateLeagueStandings, getLeagueByTeamId } from '../data/leagues';
import { useGame } from '../context/GameContext';

const LeagueTableView: React.FC = () => {
  const { gameState } = useGame();
  const selectedTeam = gameState.selectedTeam;

  if (!selectedTeam) {
    return <div>Ingen klub valgt</div>;
  }

  const league = getLeagueByTeamId(selectedTeam.id);
  if (!league) {
    return <div>Kunne ikke finde ligaen for den valgte klub.</div>;
  }

  const standings = calculateLeagueStandings(league, gameState.playedLeagueMatches);
  const selectedStanding = standings.find(standing => standing.teamId === selectedTeam.id);
  const roundsPlayed = selectedStanding?.played ?? 0;

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Ligatabel</h1>

      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded">
        <p className="text-lg font-semibold">{league.name}</p>
        <p className="text-sm text-gray-600">Uge {gameState.week} • Rundens stilling opdateres automatisk efter kampene</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded shadow">
          <p className="text-gray-600">Din placering</p>
          <p className="text-2xl font-bold text-blue-600">{selectedStanding?.position ?? '-'}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <p className="text-gray-600">Point</p>
          <p className="text-2xl font-bold text-green-600">{selectedStanding?.points ?? 0}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <p className="text-gray-600">Kampe spillet</p>
          <p className="text-2xl font-bold text-purple-600">{roundsPlayed}</p>
        </div>
      </div>

      <div className="bg-white rounded shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-200">
              <tr>
                <th className="p-3 text-left">Placering</th>
                <th className="p-3 text-left">Klub</th>
                <th className="p-3 text-center"><abbr title="Kampe spillet" className="no-underline">K</abbr></th>
                <th className="p-3 text-center"><abbr title="Vundne" className="no-underline">V</abbr></th>
                <th className="p-3 text-center"><abbr title="Uafgjorte" className="no-underline">U</abbr></th>
                <th className="p-3 text-center"><abbr title="Tabte" className="no-underline">T</abbr></th>
                <th className="p-3 text-center"><abbr title="Mål for" className="no-underline">MF</abbr></th>
                <th className="p-3 text-center"><abbr title="Mål imod" className="no-underline">MA</abbr></th>
                <th className="p-3 text-center"><abbr title="Målforskel" className="no-underline">+/-</abbr></th>
                <th className="p-3 text-center"><abbr title="Point" className="no-underline">P</abbr></th>
              </tr>
            </thead>
            <tbody>
              {standings.map((standing) => {
                const isSelectedTeam = standing.teamId === selectedTeam.id;

                return (
                  <tr
                    key={standing.teamId}
                    className={`border-t ${isSelectedTeam ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                  >
                    <td className="p-3 font-bold">{standing.position}</td>
                    <td className="p-3 font-semibold">{standing.teamName}</td>
                    <td className="p-3 text-center">{standing.played}</td>
                    <td className="p-3 text-center">{standing.wins}</td>
                    <td className="p-3 text-center">{standing.draws}</td>
                    <td className="p-3 text-center">{standing.losses}</td>
                    <td className="p-3 text-center">{standing.goalsFor}</td>
                    <td className="p-3 text-center">{standing.goalsAgainst}</td>
                    <td className="p-3 text-center">{standing.goalDifference}</td>
                    <td className="p-3 text-center font-bold">{standing.points}</td>
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
