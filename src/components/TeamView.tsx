import React, { useMemo, useState } from 'react';
import { useGame } from '../context/GameContext';
import PlayerAttributesGrid from './PlayerAttributesGrid';

const TeamView: React.FC = () => {
  const { gameState } = useGame();
  const team = gameState.selectedTeam;
  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null);

  const players = useMemo(
    () => Object.values(gameState.players).sort((left, right) => right.rating - left.rating || left.name.localeCompare(right.name, 'da')),
    [gameState.players],
  );

  if (!team) return <div>Ingen trup valgt</div>;

  const gkCount = players.filter((player) => player.position === 'GK').length;
  const dfCount = players.filter((player) => player.position === 'DF').length;
  const mfCount = players.filter((player) => player.position === 'MF').length;
  const fwCount = players.filter((player) => player.position === 'FW').length;

  return (
    <div>
      <h2 className="text-3xl font-bold mb-4">{team.name}</h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
      </div>

      <div className="space-y-4">
        {players.map((player) => {
          const isExpanded = expandedPlayerId === player.id;
          return (
            <div key={player.id} className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
              <button
                type="button"
                onClick={() => setExpandedPlayerId(isExpanded ? null : player.id)}
                className="w-full text-left p-4 hover:bg-gray-50 transition"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold">{player.name}</h3>
                    <p className="text-sm text-gray-600">{player.position} • {player.age} år</p>
                  </div>
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Rating</p>
                      <p className="font-bold">{player.rating}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Værdi</p>
                      <p className="font-bold">{player.value.toLocaleString('da-DK')} kr</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Status</p>
                      <p className="font-bold">{player.isForSale ? 'Til salg' : 'I truppen'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Detaljer</p>
                      <p className="font-bold">{isExpanded ? 'Skjul' : 'Vis evner'}</p>
                    </div>
                  </div>
                </div>
              </button>
              {isExpanded && (
                <div className="border-t border-gray-200 p-4 bg-gray-50">
                  <PlayerAttributesGrid attributes={player.attributes} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TeamView;
