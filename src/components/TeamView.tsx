import React, { useMemo, useState } from 'react';
import { useGame } from '../context/GameContext';
import { ROLE_LABELS } from '../data/players';
import PlayerDetailsPanel from './PlayerDetailsPanel';

const TeamView: React.FC = () => {
  const { gameState } = useGame();
  const team = gameState.selectedTeam;
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  if (!team) return <div>Ingen trup valgt</div>;

  const players = Object.values(gameState.players);
  const gkCount = players.filter(p => p.position === 'GK').length;
  const dfCount = players.filter(p => p.position === 'DF').length;
  const mfCount = players.filter(p => p.position === 'MF').length;
  const fwCount = players.filter(p => p.position === 'FW').length;
  const averageAsi = players.length > 0 ? Math.round(players.reduce((sum, player) => sum + player.asi, 0) / players.length) : 0;
  const selectedPlayer = useMemo(
    () => (selectedPlayerId ? gameState.players[selectedPlayerId] ?? null : null),
    [selectedPlayerId, gameState.players],
  );

  return (
    <div>
      <h2 className="text-3xl font-bold mb-4">{team.name}</h2>
      
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-white p-4 rounded shadow">
          <p className="text-gray-600">Målmænd (GK)</p>
          <p className="text-2xl font-bold">{gkCount}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <p className="text-gray-600">Forsvar (DF)</p>
          <p className="text-2xl font-bold">{dfCount}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <p className="text-gray-600">Midtbane (MF)</p>
          <p className="text-2xl font-bold">{mfCount}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <p className="text-gray-600">Angreb (FW)</p>
          <p className="text-2xl font-bold">{fwCount}</p>
        </div>
        <div className="bg-white p-4 rounded shadow col-span-2 lg:col-span-1">
          <p className="text-gray-600">Gennemsnitlig ASI</p>
          <p className="text-2xl font-bold text-blue-600">{averageAsi}</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,1fr)]">
        <div className="bg-white rounded shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-200">
                <tr>
                  <th className="p-3 text-left">Spiller</th>
                  <th className="p-3 text-left">Rolle</th>
                  <th className="p-3 text-left">Alder</th>
                  <th className="p-3 text-left">ASI</th>
                  <th className="p-3 text-left">Værdi</th>
                </tr>
              </thead>
              <tbody>
                {players.map(player => (
                  <tr
                    key={player.id}
                    onClick={() => setSelectedPlayerId(player.id)}
                    className={`border-t cursor-pointer hover:bg-gray-50 ${selectedPlayer?.id === player.id ? 'bg-blue-50' : ''}`}
                  >
                    <td className="p-3 font-semibold">{player.name}</td>
                    <td className="p-3">{ROLE_LABELS[player.primaryRole]}</td>
                    <td className="p-3">{player.age}</td>
                    <td className="p-3 font-bold text-blue-600">{player.asi}</td>
                    <td className="p-3">{player.value.toLocaleString('da-DK')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t bg-gray-50 px-4 py-3 text-sm text-gray-600">
            Tryk på en spiller for at se ASI, styrker, svagheder og alle specifikke evner.
          </div>
        </div>

        {selectedPlayer && (
          <PlayerDetailsPanel
            player={selectedPlayer}
            title="Spillerside"
            onClose={() => setSelectedPlayerId(null)}
          />
        )}
      </div>
    </div>
  );
};

export default TeamView;
