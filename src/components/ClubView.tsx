import React from 'react';
import { useGame } from '../context/GameContext';
import type { BoardStatusLevel } from '../types/economy';
import TeamBadge from './TeamBadge';

const boardToneClasses: Record<BoardStatusLevel, string> = {
  Stabil: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  Presset: 'border-amber-200 bg-amber-50 text-amber-900',
  Kritisk: 'border-orange-200 bg-orange-50 text-orange-900',
  Krise: 'border-red-200 bg-red-50 text-red-900',
};

const ClubView: React.FC = () => {
  const { gameState } = useGame();
  const selectedClub = gameState.selectedClub;
  const boardStatus = gameState.economy.boardStatus;

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        {selectedClub && <TeamBadge team={selectedClub} size="lg" />}
        <div>
          <h1 className="text-3xl font-bold">Klub</h1>
          <p className="text-sm text-gray-600">
            {selectedClub?.name} • {selectedClub?.league} • Sæson {gameState.season} • Uge {gameState.week}
          </p>
        </div>
      </div>

      <section aria-labelledby="club-overview-title" className="mb-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 id="club-overview-title" className="text-2xl font-bold">Kluboverblik</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div><dt className="text-sm text-gray-600">Spillere i truppen</dt><dd className="text-xl font-bold">{Object.keys(gameState.squad.players).length}</dd></div>
          <div><dt className="text-sm text-gray-600">Fans</dt><dd className="text-xl font-bold">{gameState.fanCount.toLocaleString('da-DK')}</dd></div>
          <div><dt className="text-sm text-gray-600">Fanhumør</dt><dd className="text-xl font-bold">{gameState.fanMood}/100</dd></div>
          <div><dt className="text-sm text-gray-600">Stadionkapacitet</dt><dd className="text-xl font-bold">{gameState.stadiumCapacity.toLocaleString('da-DK')}</dd></div>
        </dl>
      </section>

      <div className={`rounded-lg border p-6 ${boardToneClasses[boardStatus.level]}`}>
        <h2 className="text-2xl font-bold">Bestyrelse: {boardStatus.level}</h2>
        <p className="mt-3 text-sm">{boardStatus.summary}</p>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <div>
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide">Advarsler</h3>
            {boardStatus.warnings.length > 0 ? (
              <ul className="space-y-2 text-sm">
                {boardStatus.warnings.map(warning => (
                  <li key={warning}>• {warning}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm">Ingen akutte advarsler.</p>
            )}
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide">Anbefalinger</h3>
            <ul className="space-y-2 text-sm">
              {boardStatus.recommendations.map(recommendation => (
                <li key={recommendation}>• {recommendation}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide">Begrænsninger</h3>
            {boardStatus.restrictions.length > 0 ? (
              <ul className="space-y-2 text-sm">
                {boardStatus.restrictions.map(restriction => (
                  <li key={restriction}>• {restriction}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm">Ingen ekstra begrænsninger.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClubView;
