import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { calculateAttendanceEstimate, calculateLoanOffer, calculateSquadValue, calculateTicketRevenue, calculateWeeklySponsorIncome, TICKET_PRICE } from '../lib/economy';
import TeamBadge from './TeamBadge';

const ClubView: React.FC = () => {
  const { gameState, takeLoan } = useGame();
  const selectedClub = gameState.selectedClub;
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const attendance = calculateAttendanceEstimate(
    gameState.economy.transactions, gameState.season, gameState.fanCount, gameState.stadiumCapacity,
  );
  const formatAttendance = (value: number) => value.toLocaleString('da-DK', { maximumFractionDigits: 0 });
  const formatCurrency = (value: number) => value.toLocaleString('da-DK', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  const occupancyLabel = attendance.average === null ? 'Aktuel estimeret belægning' : 'Estimeret gennemsnitlig belægning';

  const loanOffer = (() => {
    if (!selectedClub) return { amount: 0, maxDebt: 0, available: false };
    return calculateLoanOffer({
      selectedClub,
      cash: gameState.budget,
      debt: gameState.economy.debt,
      stadiumBookValue: gameState.economy.stadiumBookValue,
      squadValue: calculateSquadValue(gameState.squad.players),
      fanCount: gameState.fanCount,
      stadiumCapacity: gameState.stadiumCapacity,
    });
  })();

  const boardToneClasses: Record<string, string> = {
    Stabil: 'border-green-200 bg-green-50',
    Presset: 'border-yellow-200 bg-yellow-50',
    Kritisk: 'border-orange-200 bg-orange-50',
    Krise: 'border-red-200 bg-red-50',
  };

  const projectedIncome = (() => {
    if (!selectedClub) return 0;
    const ticketRevenue = calculateTicketRevenue(gameState.fanCount, gameState.stadiumCapacity);
    return ticketRevenue + calculateWeeklySponsorIncome(selectedClub, gameState.fanCount, gameState.fanMood, gameState.stadiumCapacity, 'none');
  })();

  const squadValue = (() => {
    return calculateSquadValue(gameState.squad.players);
  })();

  const loanBlockedThisWeek = gameState.economy.lastLoanWeekKey === `${gameState.season}-${gameState.week}`;

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

      {statusMessage && (
        <div role="status" className="mb-6 rounded border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          {statusMessage}
        </div>
      )}

      <section aria-labelledby="board-title" className="mb-6">
        <div className={`rounded-lg border p-6 ${boardToneClasses[gameState.economy.boardStatus.level]}`}>
          <div className="flex flex-wrap items-center gap-3">
            <h2 id="board-title" className="text-2xl font-bold">Bestyrelse: {gameState.economy.boardStatus.level}</h2>
            <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold">
              Stadionværdi: {formatCurrency(gameState.economy.stadiumBookValue)}
            </span>
            <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold">
              Trupværdi: {formatCurrency(squadValue)}
            </span>
          </div>
          <p className="mt-3 text-sm">{gameState.economy.boardStatus.summary}</p>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide">Advarsler</h3>
              {gameState.economy.boardStatus.warnings.length > 0 ? (
                <ul className="space-y-2 text-sm">
                  {gameState.economy.boardStatus.warnings.map(warning => (
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
                {gameState.economy.boardStatus.recommendations.map(recommendation => (
                  <li key={recommendation}>• {recommendation}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide">Begrænsninger</h3>
              {gameState.economy.boardStatus.restrictions.length > 0 ? (
                <ul className="space-y-2 text-sm">
                  {gameState.economy.boardStatus.restrictions.map(restriction => (
                    <li key={restriction}>• {restriction}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm">Ingen ekstra begrænsninger.</p>
              )}
            </div>
          </div>
        </div>
      </section>

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

      <section aria-labelledby="financing-title" className="mb-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 id="financing-title" className="text-2xl font-bold">Finansiering</h2>
        <p className="mt-2 text-sm text-gray-600">
          Bestyrelsen kan godkende ét nyt driftslån pr. uge, så længe gælden holder sig under klubbens bæreevne.
        </p>
        <div className="mt-4 space-y-2 text-sm text-gray-700">
          <p>Muligt nyt lån: <span className="font-semibold">{formatCurrency(loanOffer.amount)}</span></p>
          <p>Maksimal samlet gæld: <span className="font-semibold">{formatCurrency(loanOffer.maxDebt)}</span></p>
          <p>Forventet basisindtægt næste uge: <span className="font-semibold">{formatCurrency(projectedIncome)}</span></p>
        </div>
        <button
          type="button"
          onClick={event => {
            event.currentTarget.disabled = true;
            const result = takeLoan();
            if (result !== null) event.currentTarget.disabled = false;
            setStatusMessage(result ?? `Lånet blev optaget, og kassen er styrket med ${formatCurrency(loanOffer.amount)}.`);
          }}
          disabled={!selectedClub || gameState.economy.isBankrupt || !loanOffer.available || loanBlockedThisWeek}
          className="mt-5 w-full rounded bg-blue-600 px-4 py-2 font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500"
        >
          {loanBlockedThisWeek ? 'Lån allerede optaget denne uge' : `Optag lån på ${formatCurrency(loanOffer.amount)}`}
        </button>
        {(!loanOffer.available || loanBlockedThisWeek) && (
          <p className="mt-3 text-xs text-gray-500">
            {loanBlockedThisWeek
              ? 'Vent til næste uge for at søge om endnu et lån.'
              : 'Klubben har nået den gældsramme, som bestyrelsen vil acceptere lige nu.'}
          </p>
        )}
      </section>
    </div>
  );
};

export default ClubView;
