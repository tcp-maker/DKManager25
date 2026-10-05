import React from 'react';
import { useGame } from '../context/GameContext';
import { calculateAttendanceEstimate, TICKET_PRICE } from '../lib/economy';
import TeamBadge from './TeamBadge';

const ClubView: React.FC = () => {
  const { gameState } = useGame();
  const selectedClub = gameState.selectedClub;
  const attendance = calculateAttendanceEstimate(
    gameState.economy.transactions, gameState.season, gameState.fanCount, gameState.stadiumCapacity,
  );
  const formatAttendance = (value: number) => value.toLocaleString('da-DK', { maximumFractionDigits: 0 });
  const occupancyLabel = attendance.average === null ? 'Aktuel estimeret belægning' : 'Estimeret gennemsnitlig belægning';

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        {selectedClub && <TeamBadge team={selectedClub} size="lg" />}
        <div>
          <h1 className="text-3xl font-bold">Klub</h1>
          <p className="text-sm text-gray-600">
            {selectedClub?.name} • {selectedClub?.league} • Sæson {gameState.season} • Uge {gameState.week}
          </p>
          <p className="mt-2 text-sm text-gray-600">Fans: {formatAttendance(gameState.fanCount)}</p>
        </div>
      </div>

      <section aria-labelledby="stadium-activity-title" className="mb-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 id="stadium-activity-title" className="text-2xl font-bold">Stadionaktivitet</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div><dt className="text-sm text-gray-600">Stadionkapacitet</dt><dd className="text-xl font-bold">{formatAttendance(attendance.capacity)}</dd></div>
          <div>
            <dt className="text-sm text-gray-600">Estimeret gennemsnitligt tilskuertal</dt>
            <dd className="text-xl font-bold">{attendance.average === null ? 'Endnu ingen tilskuerhistorik' : formatAttendance(attendance.average)}</dd>
          </div>
          <div><dt className="text-sm text-gray-600">Aktuelt tilskuerestimat</dt><dd className="text-xl font-bold">{formatAttendance(attendance.current)}</dd></div>
          <div><dt className="text-sm text-gray-600">Fanhumør</dt><dd className="text-xl font-bold">{gameState.fanMood}/100</dd></div>
        </dl>
        <p className="mt-4 text-sm text-gray-600">
          {attendance.average === null
            ? `Ingen billetsalg bogført i sæson ${gameState.season}. Aktuelt estimat er min(fans, kapacitet).`
            : `Sæson ${gameState.season}, uge ${attendance.firstWeek}–${attendance.lastWeek}: ${attendance.periodCount} bevarede bogførte billetuger. Billetsalg / ${TICKET_PRICE} kr pr. billet / ${attendance.periodCount} uge = gennemsnit.`
          }
        </p>
        <p className="mt-2 text-xs text-gray-500">Der registreres ikke tilskuertal pr. kamp. Historikken er begrænset til de seneste 180 transaktioner og kan være ufuldstændig. Belægning sammenholdes med nuværende kapacitet.</p>
        <label htmlFor="stadium-occupancy" className="mt-4 block text-sm font-semibold">
          {occupancyLabel}: {attendance.occupancy.toLocaleString('da-DK', { maximumFractionDigits: 1 })}% (0–100%)
        </label>
        <progress id="stadium-occupancy" max={100} value={attendance.occupancy} className="mt-2 h-4 w-full accent-blue-600">
          {attendance.occupancy}%
        </progress>
      </section>

    </div>
  );
};

export default ClubView;
