import React, { useState } from 'react';
import { useGame, Player } from '../context/GameContext';

const TransferMarketView: React.FC = () => {
  const { gameState, sellPlayer, updatePlayer, addPlayer } = useGame();
  const [activeTab, setActiveTab] = useState<'squad' | 'market'>('squad');
  const [selectedBuyPlayer, setSelectedBuyPlayer] = useState<Player | null>(null);

  // Konverter Record til Array
  const playerList = Object.values(gameState.players);
  const playersForSale = playerList.filter(p => p.isForSale);
  const squadPlayers = playerList.filter(p => !p.isForSale);

  // Dummy spillere der kan købes
  const availableForBuy: Player[] = [
    { id: 'buy1', name: 'Pione Sisto', age: 27, position: 'FW', rating: 79, value: 650000, isForSale: false },
    { id: 'buy2', name: 'Paul Onuachu', age: 29, position: 'FW', rating: 81, value: 800000, isForSale: false },
    { id: 'buy3', name: 'Magnus Andersen', age: 26, position: 'MF', rating: 75, value: 550000, isForSale: false },
    { id: 'buy4', name: 'Nicolai Vallys', age: 24, position: 'DF', rating: 72, value: 420000, isForSale: false },
    { id: 'buy5', name: 'Jesper Hansen', age: 30, position: 'GK', rating: 76, value: 380000, isForSale: false },
  ];

  const handleSellPlayer = (playerId: string) => {
    sellPlayer(playerId);
  };

  const handleBuyPlayer = (player: Player) => {
    if (gameState.budget >= player.value) {
      const newPlayer = {
        ...player,
        id: `own_${player.id}`,
        isForSale: false,
        askingPrice: undefined
      };
      addPlayer(newPlayer);
      setSelectedBuyPlayer(null);
      alert(`${player.name} blev købt for ${player.value.toLocaleString('da-DK')} kr!`);
    } else {
      alert(`Ikke tilstrækkelige midler! Du har ${gameState.budget.toLocaleString('da-DK')} kr, men ${player.name} koster ${player.value.toLocaleString('da-DK')} kr`);
    }
  };

  const handleToggleSale = (playerId: string) => {
    const player = gameState.players[playerId];
    if (player) {
      updatePlayer(playerId, {
        isForSale: !player.isForSale,
        askingPrice: !player.isForSale ? player.value : undefined
      });
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-0 py-1 sm:px-4">
      <h1 className="mb-6 text-2xl font-bold sm:text-3xl">Transfermarked</h1>

      {/* Budget Info */}
      <div className="mb-6 rounded border-l-4 border-blue-500 bg-blue-50 p-4">
        <p className="text-lg font-semibold">Budget: <span className="text-blue-600">{gameState.budget.toLocaleString('da-DK')} kr</span></p>
        <p className="text-sm text-gray-600">Uge {gameState.week}</p>
      </div>

      {/* Tabs */}
      <div className="-mx-4 mb-6 overflow-x-auto border-b px-4">
        <div className="flex min-w-max gap-4">
          <button
            onClick={() => setActiveTab('squad')}
            className={`border-b-2 px-4 py-2 font-semibold whitespace-nowrap ${
              activeTab === 'squad'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Min Trup ({squadPlayers.length})
          </button>
          <button
            onClick={() => setActiveTab('market')}
            className={`border-b-2 px-4 py-2 font-semibold whitespace-nowrap ${
              activeTab === 'market'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Køb Spillere ({availableForBuy.length})
          </button>
        </div>
      </div>

      {/* Squad Tab */}
      {activeTab === 'squad' && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Min Trup</h2>
          {squadPlayers.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Ingen spillere i trupen endnu</p>
          ) : (
            <div className="space-y-3">
              {squadPlayers.map(player => (
                <div key={player.id} className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 transition hover:shadow-md sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">{player.name}</h3>
                    <p className="text-sm text-gray-600">{player.position} • {player.age} år • Rating: {player.rating}</p>
                    <p className="text-sm font-semibold text-green-600">Værdi: {player.value.toLocaleString('da-DK')} kr</p>
                  </div>
                  <button
                    onClick={() => handleToggleSale(player.id)}
                    className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded transition"
                  >
                    Sælg
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Spillere til salg */}
          {playersForSale.length > 0 && (
            <div className="mt-8">
              <h3 className="text-xl font-bold mb-4 text-orange-600">Til Salg</h3>
              <div className="space-y-3">
                {playersForSale.map(player => (
                  <div key={player.id} className="flex flex-col gap-3 rounded-lg border-2 border-orange-300 bg-orange-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">{player.name}</h3>
                      <p className="text-sm text-gray-600">{player.position} • Rating: {player.rating}</p>
                      <p className="text-sm font-semibold text-orange-600">Prisønsker: {player.askingPrice?.toLocaleString('da-DK')} kr</p>
                    </div>
                    <div className="grid gap-2 sm:flex">
                      <button
                        onClick={() => handleToggleSale(player.id)}
                        className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition"
                      >
                        Annuller
                      </button>
                      <button
                        onClick={() => handleSellPlayer(player.id)}
                        className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition"
                      >
                        Sælg Nu
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Market Tab */}
      {activeTab === 'market' && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Ledige Spillere</h2>
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
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">{player.name}</h3>
                      <p className="text-sm text-gray-600">{player.position} • {player.age} år • Rating: {player.rating}</p>
                      <p className="text-lg font-bold text-blue-600 mt-2">Pris: {player.value.toLocaleString('da-DK')} kr</p>
                    </div>
                    {gameState.budget >= player.value && (
                      <span className="self-start rounded bg-green-100 px-3 py-1 text-xs font-bold text-green-800">
                        Råd
                      </span>
                    )}
                    {gameState.budget < player.value && (
                      <span className="self-start rounded bg-red-100 px-3 py-1 text-xs font-bold text-red-800">
                        For dyr
                      </span>
                    )}
                  </div>

                  {/* Expanded details */}
                  {selectedBuyPlayer?.id === player.id && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm text-gray-700 mb-4">
                        Købt denne spiller til {player.value.toLocaleString('da-DK')} kr. Du vil have{' '}
                        <span className="font-bold text-green-600">
                          {(gameState.budget - player.value).toLocaleString('da-DK')} kr
                        </span>{' '}
                        tilbage.
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBuyPlayer(player);
                        }}
                        disabled={gameState.budget < player.value}
                        className={`w-full font-bold py-3 px-4 rounded transition ${
                          gameState.budget >= player.value
                            ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        {gameState.budget >= player.value ? 'Køb Spiller' : 'Ikke råd'}
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
