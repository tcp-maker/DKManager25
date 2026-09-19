import React, { useMemo, useState } from 'react';
import { useGame } from '../context/GameContext';
import { ROLE_LABELS } from '../data/players';
import {
  calculateEconomyTimeline,
  calculateEquity,
  calculateSquadValue,
  resolveDisplayedWeekSummary,
} from '../lib/economy';
import type { BoardStatusLevel } from '../types/economy';
import PlayerDetailsPanel from './PlayerDetailsPanel';

interface TeamViewProps {
  onOpenEconomy: () => void;
}

const boardToneClasses: Record<BoardStatusLevel, string> = {
  Stabil: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  Presset: 'border-amber-200 bg-amber-50 text-amber-900',
  Kritisk: 'border-orange-200 bg-orange-50 text-orange-900',
  Krise: 'border-red-200 bg-red-50 text-red-900',
};

const resultToneClasses = (value: number) =>
  value > 0 ? 'text-emerald-600' : value < 0 ? 'text-red-600' : 'text-gray-700';

const formatCurrency = (value: number, signed = false) => {
  const prefix = signed && value > 0 ? '+' : signed && value < 0 ? '-' : '';
  return `${prefix}${Math.abs(value).toLocaleString('da-DK')} kr`;
};

const TeamView: React.FC<TeamViewProps> = ({ onOpenEconomy }) => {
  const { gameState } = useGame();
  const team = gameState.selectedTeam;
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  if (!team) return <div>Ingen trup valgt</div>;

  const players = Object.values(gameState.players);
  const squadValue = useMemo(() => calculateSquadValue(players), [players]);
  const displayedWeekSummary = useMemo(
    () => resolveDisplayedWeekSummary(
      gameState.economy.transactions,
      gameState.season,
      gameState.week,
      gameState.economy.lastWeekSummary,
    ),
    [gameState.economy.transactions, gameState.season, gameState.week, gameState.economy.lastWeekSummary],
  );
  const equity = useMemo(
    () => calculateEquity(
      gameState.budget,
      squadValue,
      gameState.economy.stadiumBookValue,
      gameState.economy.debt,
    ),
    [gameState.budget, squadValue, gameState.economy.stadiumBookValue, gameState.economy.debt],
  );
  const economyTimeline = useMemo(
    () => calculateEconomyTimeline(gameState.economy.transactions).slice(-6),
    [gameState.economy.transactions],
  );
  const maxTimelineValue = useMemo(() => Math.max(
    1,
    ...economyTimeline.flatMap(point => [point.income, point.expenses, Math.abs(point.net)]),
  ), [economyTimeline]);
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

      <section className="mb-8 grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(280px,1fr)]">
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Økonomisk overblik</h3>
              <p className="text-sm text-gray-600">Seneste nøgletal fra klubbens regnskab og bestyrelse.</p>
            </div>
            <button
              type="button"
              onClick={onOpenEconomy}
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Åbn økonomisiden
            </button>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm text-gray-500">Kassebeholdning</p>
              <p className="mt-2 text-2xl font-bold text-blue-700">{formatCurrency(gameState.budget)}</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm text-gray-500">Ugens indtægter</p>
              <p className="mt-2 text-2xl font-bold text-emerald-600">{formatCurrency(displayedWeekSummary.income)}</p>
              <p className="mt-1 text-xs text-gray-500">Bogført uge {displayedWeekSummary.week}</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm text-gray-500">Ugens udgifter</p>
              <p className="mt-2 text-2xl font-bold text-red-600">{formatCurrency(displayedWeekSummary.expenses)}</p>
              <p className="mt-1 text-xs text-gray-500">Bogført uge {displayedWeekSummary.week}</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm text-gray-500">Ugens resultat</p>
              <p className={`mt-2 text-2xl font-bold ${resultToneClasses(displayedWeekSummary.net)}`}>
                {formatCurrency(displayedWeekSummary.net, true)}
              </p>
              <p className="mt-1 text-xs text-gray-500">Bogført uge {displayedWeekSummary.week}</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm text-gray-500">Gæld</p>
              <p className="mt-2 text-2xl font-bold text-orange-600">{formatCurrency(gameState.economy.debt)}</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm text-gray-500">Egenkapital</p>
              <p className={`mt-2 text-2xl font-bold ${resultToneClasses(equity)}`}>{formatCurrency(equity, true)}</p>
            </div>
            <div className={`rounded-lg border p-4 ${boardToneClasses[gameState.economy.boardStatus.level]}`}>
              <p className="text-sm font-semibold uppercase tracking-wide">Bestyrelsesstatus</p>
              <p className="mt-2 text-2xl font-bold">{gameState.economy.boardStatus.level}</p>
              <p className="mt-2 text-sm">{gameState.economy.boardStatus.summary}</p>
            </div>
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-blue-900">
              <p className="text-sm font-semibold uppercase tracking-wide">Hurtig adgang</p>
              <p className="mt-2 text-sm">
                Se finansiering, kategorier og alle transaktioner under Økonomi.
              </p>
              <button
                type="button"
                onClick={onOpenEconomy}
                className="mt-4 inline-flex items-center rounded-lg border border-blue-300 bg-white px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
              >
                Gå til Økonomi
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Udvikling over tid</h3>
              <p className="text-sm text-gray-600">Bogførte uger på tværs af sæsoner.</p>
            </div>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
              {economyTimeline.length} uge{economyTimeline.length === 1 ? '' : 'r'}
            </span>
          </div>

          {economyTimeline.length < 2 ? (
            <div className="mt-6 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-sm text-gray-500">
              Der er endnu ikke nok bogførte uger til at vise økonomiudviklingen over tid.
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              {economyTimeline.map(point => (
                <div key={point.key} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-gray-900">{point.label}</p>
                    <p className={`text-sm font-bold ${resultToneClasses(point.net)}`}>
                      {formatCurrency(point.net, true)}
                    </p>
                  </div>

                  <div className="space-y-2">
                    {[
                      { label: 'Indtægter', value: point.income, tone: 'bg-emerald-500' },
                      { label: 'Udgifter', value: point.expenses, tone: 'bg-red-500' },
                      { label: 'Netto', value: Math.abs(point.net), tone: point.net >= 0 ? 'bg-blue-500' : 'bg-orange-500' },
                    ].map(bar => (
                      <div key={bar.label} className="grid grid-cols-[64px_minmax(0,1fr)_88px] items-center gap-2 text-xs">
                        <span className="font-medium text-gray-600">{bar.label}</span>
                        <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                          <div
                            className={`h-full rounded-full ${bar.tone}`}
                            style={{ width: `${Math.max((bar.value / maxTimelineValue) * 100, bar.value > 0 ? 8 : 0)}%` }}
                          />
                        </div>
                        <span className="text-right font-semibold text-gray-700">
                          {bar.label === 'Netto' ? formatCurrency(point.net, true) : formatCurrency(bar.value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

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
                    className={`border-t hover:bg-gray-50 ${selectedPlayer?.id === player.id ? 'bg-blue-50' : ''}`}
                  >
                    <td className="p-3 font-semibold">
                      <button
                        type="button"
                        onClick={() => setSelectedPlayerId(player.id)}
                        className="w-full text-left text-blue-700 hover:text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                      >
                        {player.name}
                      </button>
                    </td>
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
