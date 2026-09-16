import { useGame } from '../context/GameContext';

const TeamView = () => {
  const { gameState } = useGame();
  const team = gameState.selectedTeam;

  if (!team) {
    return <div className="text-center text-gray-500 py-8">Ingen trup valgt</div>;
  }

  const players = Object.values(gameState.players);
  const gkCount = players.filter(player => player.position === 'GK').length;
  const dfCount = players.filter(player => player.position === 'DF').length;
  const mfCount = players.filter(player => player.position === 'MF').length;
  const fwCount = players.filter(player => player.position === 'FW').length;

  return (
    <div className="p-1 sm:p-0">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-4xl" aria-hidden="true">
          {team.logo}
        </span>
        <h2 className="text-2xl md:text-3xl font-bold break-words">{team.name}</h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
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
        <div className="overflow-x-auto">
        <table className="w-full min-w-[620px]">
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
