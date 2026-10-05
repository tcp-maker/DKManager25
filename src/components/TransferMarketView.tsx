import React, { useState } from 'react';
import ConfirmAction from './ConfirmAction';
import PlayerDetailsPanel from './PlayerDetailsPanel';
import { ROLE_LABELS } from '../data/players';
import { useGame } from '../context/GameContext';
import { Player } from '../types/player';

const TransferMarketView: React.FC = () => {
  const { gameState, sellPlayer, updatePlayer, addPlayer } = useGame();
  const [activeTab, setActiveTab] = useState<'squad' | 'market'>('squad');
  const [selectedBuyPlayer, setSelectedBuyPlayer] = useState<Player | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Konverter Record til Array
  const playerList = Object.values(gameState.squad.players);
  const playersForSale = playerList.filter(p => p.isForSale);
  const squadPlayers = playerList.filter(p => !p.isForSale);

  const availableForBuy = Object.values(gameState.transferMarket)
    .filter(player => !Object.prototype.hasOwnProperty.call(gameState.squad.players, player.id));
  const getPurchasePrice = (player: Player) => player.askingPrice ?? player.value;

  const handleSellPlayer = (playerId: string): string | null => {
    const player = gameState.squad.players[playerId];
    if (!player) {
      return 'Spilleren findes ikke længere i truppen.';
    }

    sellPlayer(playerId);
    setStatusMessage(`${player.name} blev solgt for ${player.value.toLocaleString('da-DK')} kr.`);
    return null;
  };

  const handleBuyPlayer = (player: Player): string | null => {
    const price = getPurchasePrice(player);
    if (gameState.budget < price) {
      return `Ikke tilstrækkelige midler. Du har ${gameState.budget.toLocaleString('da-DK')} kr, men ${player.name} koster ${price.toLocaleString('da-DK')} kr.`;
    }

    const wasAdded = addPlayer(player);
    if (!wasAdded) {
      return `Købet af ${player.name} kunne ikke gennemføres.`;
    }

    setSelectedBuyPlayer(null);
    setStatusMessage(`${player.name} blev købt for ${price.toLocaleString('da-DK')} kr.`);
    return null;
  };

  const handleToggleSale = (playerId: string) => {
    const player = gameState.squad.players[playerId];
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
        <p className="text-sm text-gray-600">Sæson {gameState.season} • Uge {gameState.week}</p>
      </div>

      {statusMessage && (
        <div role="status" className="mb-6 rounded border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {statusMessage}
        </div>
      )}

      {/* Tabs */}
      <div role="tablist" aria-label="Transfermarked" className="flex space-x-4 mb-6 border-b">
        <button
          type="button"
          role="tab"
          id="transfer-squad-tab"
          aria-selected={activeTab === 'squad'}
          aria-controls="transfer-squad-panel"
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
          type="button"
          role="tab"
          id="transfer-market-tab"
          aria-selected={activeTab === 'market'}
          aria-controls="transfer-market-panel"
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
        <div role="tabpanel" id="transfer-squad-panel" aria-labelledby="transfer-squad-tab" tabIndex={0}>
          <h2 className="text-2xl font-bold mb-4">Min Trup</h2>
          {squadPlayers.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Ingen spillere i trupen endnu</p>
          ) : (
            <div className="space-y-3">
              {squadPlayers.map(player => (
                <div key={player.id} className="bg-white border border-gray-200 rounded-lg p-4 flex justify-between items-center hover:shadow-md transition">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">{player.name}</h3>
                    <p className="text-sm text-gray-600">{ROLE_LABELS[player.primaryRole]} • {player.age} år • ASI: {player.asi}</p>
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
                  <div key={player.id} className="bg-orange-50 border-2 border-orange-300 rounded-lg p-4 flex justify-between items-center">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">{player.name}</h3>
                      <p className="text-sm text-gray-600">{ROLE_LABELS[player.primaryRole]} • ASI: {player.asi}</p>
                      <p className="text-sm font-semibold text-orange-600">Prisønsker: {player.askingPrice?.toLocaleString('da-DK')} kr</p>
                    </div>
                    <div className="space-x-2">
                      <button
                        onClick={() => handleToggleSale(player.id)}
                        className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition"
                      >
                        Annuller
                      </button>
                      <div className="mt-2 sm:mt-0 sm:inline-block">
                        <ConfirmAction
                          label="Sælg Nu"
                          confirmLabel="Bekræft salg"
                          confirmMessage={`Sælg ${player.name} nu for ${player.value.toLocaleString('da-DK')} kr? Denne handling kan ikke fortrydes.`}
                          onConfirm={() => handleSellPlayer(player.id)}
                          buttonClassName="bg-green-500 hover:bg-green-600 text-white"
                          confirmButtonClassName="bg-green-600 hover:bg-green-700 text-white"
                        />
                      </div>
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
        <div role="tabpanel" id="transfer-market-panel" aria-labelledby="transfer-market-tab" tabIndex={0}>
          <h2 className="text-2xl font-bold mb-4">Ledige Spillere</h2>
          {availableForBuy.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Ingen spillere på markedet</p>
          ) : (
            <div className="space-y-3">
              {availableForBuy.map(player => (
                <div key={player.id} className={`bg-white border rounded-lg p-4 transition ${
                  selectedBuyPlayer?.id === player.id
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 hover:shadow-md'
                }`}>
                  <button
                    type="button"
                    onClick={() => setSelectedBuyPlayer(selectedBuyPlayer?.id === player.id ? null : player)}
                    aria-expanded={selectedBuyPlayer?.id === player.id}
                    aria-controls={selectedBuyPlayer?.id === player.id ? `transfer-player-${player.id}` : undefined}
                    className="flex w-full items-start justify-between gap-3 text-left focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <span className="flex-1">
                      <span className="block font-bold text-lg">{player.name}</span>
                      <span className="block text-sm text-gray-600">{ROLE_LABELS[player.primaryRole]} • {player.age} år • ASI: {player.asi}</span>
                      <span className="mt-2 block text-lg font-bold text-blue-600">Pris: {getPurchasePrice(player).toLocaleString('da-DK')} kr</span>
                    </span>
                    <span className={`rounded px-3 py-1 text-xs font-bold ${
                      gameState.budget >= getPurchasePrice(player)
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {gameState.budget >= getPurchasePrice(player) ? 'Råd' : 'For dyr'}
                    </span>
                  </button>

                  {/* Expanded details */}
                  {selectedBuyPlayer?.id === player.id && (
                    <div id={`transfer-player-${player.id}`} className="mt-4 pt-4 border-t">
                      <div className="mb-4">
                        <PlayerDetailsPanel player={player} title="Spillerprofil" />
                      </div>
                      <p className="text-sm text-gray-700 mb-4">
                        Købt denne spiller til {getPurchasePrice(player).toLocaleString('da-DK')} kr. Du vil have{' '}
                        <span className="font-bold text-green-600">
                          {(gameState.budget - getPurchasePrice(player)).toLocaleString('da-DK')} kr
                        </span>{' '}
                        tilbage.
                      </p>
                      <div>
                        <ConfirmAction
                          label={gameState.budget >= getPurchasePrice(player) ? 'Køb Spiller' : 'Ikke råd'}
                          confirmLabel="Bekræft køb"
                          confirmMessage={`Køb ${player.name} for ${getPurchasePrice(player).toLocaleString('da-DK')} kr? Du vil have ${(gameState.budget - getPurchasePrice(player)).toLocaleString('da-DK')} kr tilbage bagefter.`}
                          onConfirm={() => handleBuyPlayer(player)}
                          disabled={gameState.budget < getPurchasePrice(player)}
                          disabledMessage={gameState.budget < getPurchasePrice(player) ? `Du mangler ${(getPurchasePrice(player) - gameState.budget).toLocaleString('da-DK')} kr.` : undefined}
                          buttonClassName="bg-blue-600 hover:bg-blue-700 text-white"
                          confirmButtonClassName="bg-blue-700 hover:bg-blue-800 text-white"
                        />
                      </div>
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
