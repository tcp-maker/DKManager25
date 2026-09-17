import React, { useMemo, useState } from 'react';
import { getTransferMarketPlayers } from '../data/gameData';
import { useGame } from '../context/GameContext';
import { Player } from '../types/player';

const TransferMarketView: React.FC = () => {
  const { gameState, sellPlayer, updatePlayer, addPlayer } = useGame();
  const [activeTab, setActiveTab] = useState<'squad' | 'market'>('squad');
  const [selectedBuyPlayer, setSelectedBuyPlayer] = useState<Player | null>(null);

  const playerList = Object.values(gameState.players).sort((a, b) => b.rating - a.rating);
  const playersForSale = playerList.filter(p => p.isForSale);
  const squadPlayers = playerList.filter(p => !p.isForSale);
  const availableForBuy = useMemo(
    () => getTransferMarketPlayers(gameState.selectedTeam?.id),
    [gameState.selectedTeam?.id]
  );

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
        askingPrice: !player.isForSale ? Math.round(player.value * 1.05 / 1000) * 1000 : undefined
      });
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Transfermarked</h1>

      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded">
        <p className="text-lg font-semibold">Budget: <span className="text-blue-600">{gameState.budget.toLocaleString('da-DK')} kr</span></p>
        <p className="text-sm text-gray-600">Scouted salgsliste fra de øvrige danske divisioner</p>
      </div>

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

      {activeTab === 'squad' && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Min Trup</h2>
          {squadPlayers.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Ingen spillere i trupen endnu</p>
          ) : (
            <div className="space-y-3">
              {squadPlayers.map(player => (
                <div key={player.id} className="bg-white border border-gray-200 rounded-lg p-4 flex justify-between items-center hover:shadow-md transition gap-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">{player.name}</h3>
                    <p className="text-sm text-gray-600">{player.position} • {player.age} år • OVR {player.rating}</p>
                    <p className="text-sm text-gray-600">GK {player.goalkeeping} • DEF {player.defending} • PLAY {player.playmaking} • FIN {player.finishing}</p>
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

          {playersForSale.length > 0 && (
            <div className="mt-8">
              <h3 className="text-xl font-bold mb-4 text-orange-600">Til Salg</h3>
              <div className="space-y-3">
                {playersForSale.map(player => (
                  <div key={player.id} className="bg-orange-50 border-2 border-orange-300 rounded-lg p-4 flex justify-between items-center gap-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">{player.name}</h3>
                      <p className="text-sm text-gray-600">{player.position} • OVR {player.rating}</p>
                      <p className="text-sm text-gray-600">GK {player.goalkeeping} • DEF {player.defending} • PLAY {player.playmaking} • FIN {player.finishing}</p>
                      <p className="text-sm font-semibold text-orange-600">Prisønske: {player.askingPrice?.toLocaleString('da-DK')} kr</p>
                    </div>
                    <div className="space-x-2 shrink-0">
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

      {activeTab === 'market' && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Ledige Spillere</h2>
          <p className="text-sm text-gray-600 mb-4">Markedet viser de højest ratede spillere, som andre danske klubber har sat til salg.</p>
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
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">{player.name}</h3>
                      <p className="text-sm text-gray-600">{player.position} • {player.age} år • OVR {player.rating}</p>
                      <p className="text-sm text-gray-600">GK {player.goalkeeping} • DEF {player.defending} • PLAY {player.playmaking} • FIN {player.finishing}</p>
                      <p className="text-lg font-bold text-blue-600 mt-2">Pris: {player.value.toLocaleString('da-DK')} kr</p>
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
                        Køber du denne spiller, har du{' '}
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
