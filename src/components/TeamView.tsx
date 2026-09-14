import React from 'react';
import { useGame } from '../context/GameContext';

const TeamView: React.FC = () => {
  const { gameState } = useGame();
  const team = gameState.teams[gameState.selectedTeamId];

  if (!team) return <div>Ingen trup valgt</div>;

  const players = Object.values(gameState.players);
  const gkCount = players.filter(p => p.position === 'GK').length;
  const dfCount = players.filter(p => p.position === 'DF').length;
  const mfCount = players.filter(p => p.position === 'MF').length;
  const fwCount = players.filter(p => p.position === 'FW').length;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold sm:text-3xl">{team.name}</h2>
      
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <div className="rounded bg-white p-4 shadow">
          <p className="text-gray-600">Målmænd (GK)</p>
          <p className="text-2xl font-bold">{gkCount}</p>
        </div>
        <div className="rounded bg-white p-4 shadow">
          <p className="text-gray-600">Forsvar (DF)</p>
          <p className="text-2xl font-bold">{dfCount}</p>
        </div>
        <div className="rounded bg-white p-4 shadow">
          <p className="text-gray-600">Midtbane (MF)</p>
          <p className="text-2xl font-bold">{mfCount}</p>
        </div>
        <div className="rounded bg-white p-4 shadow">
          <p className="text-gray-600">Angreb (FW)</p>
          <p className="text-2xl font-bold">{fwCount}</p>
        </div>
      </div>

      <div className="space-y-3 sm:hidden">
        {players.map(player => (
          <div key={player.id} className="rounded-lg bg-white p-4 shadow">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-bold text-gray-900">{player.name}</h3>
                <p className="text-sm text-gray-600">{player.position} • {player.age} år</p>
              </div>
              <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">
                {player.rating}
              </span>
            </div>
            <p className="mt-3 text-sm font-semibold text-green-600">
              Værdi: {player.value.toLocaleString('da-DK')} kr
            </p>
          </div>
        ))}
      </div>

      <div className="hidden overflow-hidden rounded bg-white shadow sm:block">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-200">
              <tr>
                <th className="p-3 text-left">Spiller</th>
                <th className="p-3 text-left">Position</th>
                <th className="p-3 text-left">Alder</th>
                <th className="p-3 text-left">Rating</th>
                <th className="p-3 text-left">Værdi</th>
              </tr>
            </thead>
            <tbody>
              {players.map(player => (
                <tr key={player.id} className="border-t hover:bg-gray-50">
                  <td className="p-3">{player.name}</td>
                  <td className="p-3">{player.position}</td>
                  <td className="p-3">{player.age}</td>
                  <td className="p-3">{player.rating}</td>
                  <td className="p-3">{player.value.toLocaleString('da-DK')} kr</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TeamView;