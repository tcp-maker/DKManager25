import { useState } from 'react';
import { Player, useGame } from '../context/GameContext';

const AVAILABLE_FOR_BUY: Player[] = [
  { id: 'buy1', name: 'Pione Sisto', age: 27, position: 'FW', rating: 79, value: 650000, isForSale: false },
  { id: 'buy2', name: 'Paul Onuachu', age: 29, position: 'FW', rating: 81, value: 800000, isForSale: false },
  { id: 'buy3', name: 'Magnus Andersen', age: 26, position: 'MF', rating: 75, value: 550000, isForSale: false },
  { id: 'buy4', name: 'Nicolai Vallys', age: 24, position: 'DF', rating: 72, value: 420000, isForSale: false },
  { id: 'buy5', name: 'Jesper Hansen', age: 30, position: 'GK', rating: 76, value: 380000, isForSale: false },
];

const TransferMarketView = () => {
  const { gameState, sellPlayer, updatePlayer, addPlayer } = useGame();
  const [activeTab, setActiveTab] = useState<'squad' | 'market'>('squad');
  const [selectedBuyPlayer, setSelectedBuyPlayer] = useState<Player | null>(null);

  const playerList = Object.values(gameState.players);
  const playersForSale = playerList.filter(player => player.isForSale);
  const squadPlayers = playerList.filter(player => !player.isForSale);
  const availableForBuy = AVAILABLE_FOR_BUY.filter(player => !gameState.players[`own_${player.id}`]);

  const handleBuyPlayer = (player: Player) => {
    const newPlayer: Player = {
      ...player,
      id: `own_${player.id}`,
      isForSale: false,
      askingPrice: undefined,
    };

    const wasAdded = addPlayer(newPlayer);

    if (wasAdded) {
      setSelectedBuyPlayer(null);
      alert(`${player.name} blev købt for ${player.value.toLocaleString('da-DK')} kr!`);
      return;
    }

    alert(
      `Købet kunne ikke gennemføres. Du har ${gameState.budget.toLocaleString('da-DK')} kr til rådighed.`
    );
  };

  const handleToggleSale = (playerId: string) => {
    const player = gameState.players[playerId];

    if (!player) {
      return;
    }

    updatePlayer(playerId, {
      isForSale: !player.isForSale,
      askingPrice: !player.isForSale ? player.value : undefined,
    });
  };

  return (
    <div className="p-3 md:p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">Transfermarked</h1>

      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded">
        <p className="text-lg font-semibold">
          Budget: <span className="text-blue-600">{gameState.budget.toLocaleString('da-DK')} kr</span>
        </p>
        <p className="text-sm text-gray-600">Uge {gameState.week}</p>
      </div>

      <div className="grid grid-cols-2 gap-2 md:flex md:space-x-4 mb-6 border-b pb-2 md:pb-0">
        <button
          onClick={() => setActiveTab('squad')}
          className={`px-4 py-2 font-semibold border-b-2 ${
            activeTab === 'squad'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Min trup ({squadPlayers.length})
        </button>
        <button
          onClick={() => setActiveTab('market')}
          className={`px-4 py-2 font-semibold border-b-2 ${
            activeTab === 'market'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Køb spillere ({availableForBuy.length})
        </button>
      </div>

      {activeTab === 'squad' && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Min trup</h2>
          {squadPlayers.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Ingen spillere i trupen endnu</p>
          ) : (
            <div className="space-y-3">
              {squadPlayers.map(player => (
                <div
                  key={player.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center hover:shadow-md transition"
                >
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">{player.name}</h3>
                    <p className="text-sm text-gray-600">
                      {player.position} • {player.age} år • Rating: {player.rating}
                    </p>
                    <p className="text-sm font-semibold text-green-600">
                      Værdi: {player.value.toLocaleString('da-DK')} kr
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggleSale(player.id)}
                    className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded transition"
                  >
                    Sæt til salg
                  </button>
                </div>
              ))}
            </div>
          )}

          {playersForSale.length > 0 && (
            <div className="mt-8">
              <h3 className="text-xl font-bold mb-4 text-orange-600">Til salg</h3>
              <div className="space-y-3">
                {playersForSale.map(player => (
                  <div
                    key={player.id}
                    className="bg-orange-50 border-2 border-orange-300 rounded-lg p-4 flex justify-between items-center"
                  >
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">{player.name}</h3>
                      <p className="text-sm text-gray-600">{player.position} • Rating: {player.rating}</p>
                      <p className="text-sm font-semibold text-orange-600">
                        Prisønske: {player.askingPrice?.toLocaleString('da-DK')} kr
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:space-x-2">
                      <button
                        onClick={() => handleToggleSale(player.id)}
                        className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition"
                      >
                        Annuller
                      </button>
                      <button
                        onClick={() => sellPlayer(player.id)}
                        className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition"
                      >
                        Sælg nu
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'market' && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Ledige spillere</h2>
          {availableForBuy.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Ingen spillere på markedet</p>
          ) : (
            <div className="space-y-3">
              {availableForBuy.map(player => (
                <div
                  key={player.id}
                  onClick={() => setSelectedBuyPlayer(selectedBuyPlayer?.id === player.id ? null : player)}
                  className={`bg-white border rounded-lg p-4 cursor-pointer transition ${
                    selectedBuyPlayer?.id === player.id
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:shadow-md'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">{player.name}</h3>
                      <p className="text-sm text-gray-600">
                        {player.position} • {player.age} år • Rating: {player.rating}
                      </p>
                      <p className="text-lg font-bold text-blue-600 mt-2">
                        Pris: {player.value.toLocaleString('da-DK')} kr
                      </p>
                    </div>
                    {gameState.budget >= player.value ? (
                      <span className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded">Råd</span>
                    ) : (
                      <span className="bg-red-100 text-red-800 text-xs font-bold px-3 py-1 rounded">For dyr</span>
                    )}
                  </div>

                  {selectedBuyPlayer?.id === player.id && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm text-gray-700 mb-4">
                        Køb denne spiller til {player.value.toLocaleString('da-DK')} kr. Du vil have{' '}
                        <span className="font-bold text-green-600">
                          {(gameState.budget - player.value).toLocaleString('da-DK')} kr
                        </span>{' '}
                        tilbage.
                      </p>
                      <button
                        onClick={event => {
                          event.stopPropagation();
                          handleBuyPlayer(player);
                        }}
                        disabled={gameState.budget < player.value}
                        className={`w-full font-bold py-3 px-4 rounded transition ${
                          gameState.budget >= player.value
                            ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        {gameState.budget >= player.value ? 'Køb spiller' : 'Ikke råd'}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TransferMarketView;
