import React from 'react';
import { useGame } from '../context/GameContext';

const TeamView: React.FC = () => {
  const { gameState } = useGame();
  const team = gameState.selectedTeam;

  if (!team) {
    return (
      <div className="mx-auto max-w-3xl rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900">Ingen klub valgt endnu</h2>
        <p className="mt-2 text-gray-600">
          Start med at vælge en klub, så du kan se truppen og begynde din første uge som manager.
        </p>
      </div>
    );
  }

  const players = Object.values(gameState.players);
  const gkCount = players.filter(p => p.position === 'GK').length;
  const dfCount = players.filter(p => p.position === 'DF').length;
  const mfCount = players.filter(p => p.position === 'MF').length;
  const fwCount = players.filter(p => p.position === 'FW').length;
  const averageRating = players.length > 0
    ? (players.reduce((sum, player) => sum + player.rating, 0) / players.length).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="text-3xl font-bold text-gray-900">{team.name}</h2>
        <p className="mt-2 text-gray-600">
          Her får du et hurtigt overblik over truppen. Tjek især om alle kæder er dækket, før du går videre til næste kampuge.
        </p>
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <span className="rounded-full bg-blue-50 px-3 py-1 font-semibold text-blue-700">
            {players.length} spillere i truppen
          </span>
          <span className="rounded-full bg-purple-50 px-3 py-1 font-semibold text-purple-700">
            Gennemsnitlig rating: {averageRating}
          </span>
        </div>
      </div>

      {players.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center shadow-sm">
          <h3 className="text-xl font-bold text-gray-900">Truppen er tom</h3>
          <p className="mt-2 text-gray-600">
            Gå til Transfer for at købe nye spillere, eller nulstil spillet hvis du vil starte forfra.
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl bg-white p-4 shadow-sm">
              <p className="text-gray-600">Målmænd (GK)</p>
              <p className="text-2xl font-bold">{gkCount}</p>
            </div>
            <div className="rounded-xl bg-white p-4 shadow-sm">
              <p className="text-gray-600">Forsvar (DF)</p>
              <p className="text-2xl font-bold">{dfCount}</p>
            </div>
            <div className="rounded-xl bg-white p-4 shadow-sm">
              <p className="text-gray-600">Midtbane (MF)</p>
              <p className="text-2xl font-bold">{mfCount}</p>
            </div>
            <div className="rounded-xl bg-white p-4 shadow-sm">
              <p className="text-gray-600">Angreb (FW)</p>
              <p className="text-2xl font-bold">{fwCount}</p>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl bg-white shadow-sm">
            <table className="w-full">
              <thead className="bg-gray-100">
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
        </>
      )}
    </div>
  );
};

export default TeamView;