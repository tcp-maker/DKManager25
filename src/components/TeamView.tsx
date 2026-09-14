import React from 'react';
import { useGame } from '../context/GameContext';

const TeamView: React.FC = () => {
  const { gameState } = useGame();
  const team = gameState.selectedTeam;

  if (!team) {
    return (
      <div className="bg-white border border-dashed rounded-lg p-6 text-center">
        <h2 className="text-xl font-bold text-gray-800 mb-2">Ingen klub valgt endnu</h2>
        <p className="text-gray-600">Gå tilbage til klubvalg for at starte dit manager-eventyr.</p>
      </div>
    );
  }

  const players = Object.values(gameState.players);
  const gkCount = players.filter(p => p.position === 'GK').length;
  const dfCount = players.filter(p => p.position === 'DF').length;
  const mfCount = players.filter(p => p.position === 'MF').length;
  const fwCount = players.filter(p => p.position === 'FW').length;

  return (
    <div>
      <h2 className="text-3xl font-bold mb-4">{team.name}</h2>
      
      <div className="grid grid-cols-4 gap-4 mb-8">
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

      <div className="bg-white rounded shadow overflow-hidden">
        <table className="w-full">
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
            {players.length > 0 ? (
              players.map(player => (
                <tr key={player.id} className="border-t hover:bg-gray-50">
                  <td className="p-3">{player.name}</td>
                  <td className="p-3">{player.position}</td>
                  <td className="p-3">{player.age}</td>
                  <td className="p-3">{player.rating}</td>
                  <td className="p-3">{player.value.toLocaleString('da-DK')} kr</td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="p-6 text-center text-gray-600" colSpan={5}>
                  Truppen er tom. Gå til Transfer for at købe spillere.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TeamView;