import React from 'react';
import { useGame } from '../context/GameContext';

const TeamView: React.FC = () => {
  const { gameState } = useGame();
  const players = Object.values(gameState.players);

  const squadByPosition = {
    GK: players.filter(player => player.position === 'GK').length,
    DF: players.filter(player => player.position === 'DF').length,
    MF: players.filter(player => player.position === 'MF').length,
    FW: players.filter(player => player.position === 'FW').length,
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Min Trup</h1>
      <p className="text-gray-600 mb-6">{gameState.selectedTeam?.name}</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border p-4 text-center">
          <p className="text-sm text-gray-600">Målmænd</p>
          <p className="text-2xl font-bold text-blue-600">{squadByPosition.GK}</p>
        </div>
        <div className="bg-white rounded-lg border p-4 text-center">
          <p className="text-sm text-gray-600">Forsvar</p>
          <p className="text-2xl font-bold text-green-600">{squadByPosition.DF}</p>
        </div>
        <div className="bg-white rounded-lg border p-4 text-center">
          <p className="text-sm text-gray-600">Midtbane</p>
          <p className="text-2xl font-bold text-purple-600">{squadByPosition.MF}</p>
        </div>
        <div className="bg-white rounded-lg border p-4 text-center">
          <p className="text-sm text-gray-600">Angreb</p>
          <p className="text-2xl font-bold text-orange-600">{squadByPosition.FW}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border p-4">
        <h2 className="text-xl font-bold mb-4">Spillerliste</h2>
        <div className="space-y-2">
          {players.map(player => (
            <div key={player.id} className="flex justify-between border-b border-gray-100 py-2">
              <span className="font-semibold">{player.name}</span>
              <span className="text-gray-600">
                {player.position} • {player.age} år • Rating {player.rating}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TeamView;
