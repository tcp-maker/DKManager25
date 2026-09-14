import React, { useState } from 'react';
import { useGame, Player } from '../context/GameContext';

const TransferMarketView: React.FC = () => {
  const { gameState, buyPlayer, sellPlayer, updatePlayer } = useGame();
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
    const canAfford = gameState.budget >= player.value;
    buyPlayer(player);
    if (canAfford) {
      setSelectedBuyPlayer(null);
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
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Transfermarked</h1>

      {/* Budget Info */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded">
        <p className="text-lg font-semibold">Budget: <span className="text-blue-600">{gameState.budget.toLocaleString('da-DK')} kr</span></p>
        <p className="text-sm text-gray-600">Uge {gameState.week}</p>
        <p className="mt-2 text-sm text-gray-700">
          Sæt spillere til salg for at frigøre budget, eller vælg en spiller på markedet for at se hvad købet efterlader i kassen.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 mb-6 border-b">
        <button
          onClick={() => setActiveTab('squad')}
          className={`px-4 py-2 font-semibold border-b-2 ${
            activeTab === 'squad'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Min Trup ({squadPlayers.length})
        </button>
        <button
          onClick={() => setActiveTab('market')}
          className={`px-4 py-2 font-semibold border-b-2 ${
            activeTab === 'market'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Køb Spillere ({availableForBuy.length})
        </button>
      </div>

      {/* Squad Tab */}
      {activeTab === 'squad' && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Min Trup</h2>
          {squadPlayers.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-8 text-center text-gray-600">
              Ingen spillere i trupen lige nu. Gå til <span className="font-semibold">Køb Spillere</span> for at hente nye profiler ind.
            </div>
          ) : (
            <div className="space-y-3">
              {squadPlayers.map(player => (
                <div key={player.id} className="bg-white border border-gray-200 rounded-lg p-4 flex justify-between items-center hover:shadow-md transition">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">{player.name}</h3>
                    <p className="text-sm text-gray-600">{player.position} • {player.age} år • Rating: {player.rating}</p>
                    <p className="text-sm font-semibold text-green-600">Værdi: {player.value.toLocaleString('da-DK')} kr</p>
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

          {/* Spillere til salg */}
          {playersForSale.length > 0 && (
            <div className="mt-8">
              <h3 className="text-xl font-bold mb-4 text-orange-600">Til Salg</h3>
              <div className="space-y-3">
                {playersForSale.map(player => (
                  <div key={player.id} className="bg-orange-50 border-2 border-orange-300 rounded-lg p-4 flex justify-between items-center">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">{player.name}</h3>
                      <p className="text-sm text-gray-600">{player.position} • Rating: {player.rating}</p>
                      <p className="text-sm font-semibold text-orange-600">Prisønsker: {player.askingPrice?.toLocaleString('da-DK')} kr</p>
                    </div>
                    <div className="space-x-2">
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
            <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-8 text-center text-gray-600">
              Markedet er tomt lige nu. Gå videre til næste uge og kig forbi igen senere.
            </div>
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
                      <p className="text-sm text-gray-600">{player.position} • {player.age} år • Rating: {player.rating}</p>
                      <p className="text-lg font-bold text-blue-600 mt-2">Pris: {player.value.toLocaleString('da-DK')} kr</p>
                    </div>
                    {gameState.budget >= player.value && (
                      <span className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded">
                        Råd
                      </span>
                    )}
                    {gameState.budget < player.value && (
                      <span className="bg-red-100 text-red-800 text-xs font-bold px-3 py-1 rounded">
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
