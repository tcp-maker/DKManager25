import React from 'react';
import { useGame } from '../context/GameContext';

const TeamView: React.FC = () => {
  const { gameState } = useGame();
  const team = gameState.selectedTeam;

  if (!team) return <div>Ingen trup valgt</div>;

  const players = Object.values(gameState.players).sort((a, b) => b.rating - a.rating || a.position.localeCompare(b.position));
  const gkCount = players.filter(p => p.position === 'GK').length;
  const dfCount = players.filter(p => p.position === 'DF').length;
  const mfCount = players.filter(p => p.position === 'MF').length;
  const fwCount = players.filter(p => p.position === 'FW').length;
  const averageRating = players.length > 0 ? (players.reduce((sum, player) => sum + player.rating, 0) / players.length).toFixed(1) : '0.0';

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-3xl font-bold">{team.name}</h2>
          <p className="text-gray-600">{team.leagueName} • Trup på {players.length} spillere</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
          <p className="text-sm text-gray-600">Holdrating</p>
          <p className="text-2xl font-bold text-blue-700">{averageRating}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white p-4 rounded shadow">
          <p className="text-gray-600">Målmænd</p>
          <p className="text-2xl font-bold">{gkCount}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <p className="text-gray-600">Forsvar</p>
          <p className="text-2xl font-bold">{dfCount}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <p className="text-gray-600">Midtbane</p>
          <p className="text-2xl font-bold">{mfCount}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <p className="text-gray-600">Angreb</p>
          <p className="text-2xl font-bold">{fwCount}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <p className="text-gray-600">Til salg</p>
          <p className="text-2xl font-bold">{players.filter(player => player.isForSale).length}</p>
        </div>
      </div>

      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="w-full min-w-[980px]">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-3 text-left">Spiller</th>
              <th className="p-3 text-left">Pos.</th>
              <th className="p-3 text-left">Alder</th>
              <th className="p-3 text-left">OVR</th>
              <th className="p-3 text-left">GK</th>
              <th className="p-3 text-left">DEF</th>
              <th className="p-3 text-left">PLAY</th>
              <th className="p-3 text-left">FIN</th>
              <th className="p-3 text-left">Værdi</th>
            </tr>
          </thead>
          <tbody>
            {players.map(player => (
              <tr key={player.id} className="border-t hover:bg-gray-50">
                <td className="p-3 font-medium">{player.name}</td>
                <td className="p-3">{player.position}</td>
                <td className="p-3">{player.age}</td>
                <td className="p-3 font-semibold">{player.rating}</td>
                <td className="p-3">{player.goalkeeping}</td>
                <td className="p-3">{player.defending}</td>
                <td className="p-3">{player.playmaking}</td>
                <td className="p-3">{player.finishing}</td>
                <td className="p-3">{player.value.toLocaleString('da-DK')} kr</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TeamView;
