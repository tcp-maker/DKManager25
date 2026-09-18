import React, { useMemo, useState } from 'react';
import { useGame } from '../context/GameContext';
import {
  calculateEquity,
  calculateLoanOffer,
  calculatePeriodSummary,
  calculateSeasonSummary,
  calculateSquadValue,
  calculateSquadWageBill,
  calculateTicketRevenue,
  calculateWeeklySponsorIncome,
} from '../lib/economy';
import { ECONOMY_CATEGORY_LABELS, type BoardStatusLevel, type EconomyTransaction, type EconomyTransactionCategory } from '../types/economy';

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

const sumByCategory = (
  transactions: EconomyTransaction[],
  type: EconomyTransaction['type'],
) => transactions.reduce((acc, transaction) => {
  if (transaction.type !== type) {
    return acc;
  }

  acc[transaction.category] = (acc[transaction.category] ?? 0) + transaction.amount;
  return acc;
}, {} as Partial<Record<EconomyTransactionCategory, number>>);

const renderCategoryList = (entries: Array<[EconomyTransactionCategory, number]>, emptyLabel: string) => {
  if (entries.length === 0) {
    return <p className="text-sm text-gray-500">{emptyLabel}</p>;
  }

  return (
    <div className="space-y-3">
      {entries.map(([category, amount]) => (
        <div key={category} className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
          <span className="text-sm font-medium text-gray-700">{ECONOMY_CATEGORY_LABELS[category]}</span>
          <span className="text-sm font-semibold text-gray-900">{formatCurrency(amount)}</span>
        </div>
      ))}
    </div>
  );
};

const EconomyView: React.FC = () => {
  const { gameState, takeLoan } = useGame();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const selectedTeam = gameState.selectedTeam;
  const players = useMemo(() => Object.values(gameState.players), [gameState.players]);
  const squadValue = useMemo(() => calculateSquadValue(players), [players]);
  const wageBill = useMemo(() => calculateSquadWageBill(players), [players]);
  const currentWeekSummary = useMemo(
    () => calculatePeriodSummary(gameState.economy.transactions, gameState.season, gameState.week),
    [gameState.economy.transactions, gameState.season, gameState.week],
  );
  const displayedWeekSummary = currentWeekSummary.income > 0 || currentWeekSummary.expenses > 0
    ? currentWeekSummary
    : gameState.economy.lastWeekSummary ?? currentWeekSummary;
  const seasonSummary = useMemo(
    () => calculateSeasonSummary(gameState.economy.transactions, gameState.season),
    [gameState.economy.transactions, gameState.season],
  );
  const projectedIncome = useMemo(
    () => calculateTicketRevenue(gameState.fanCount, gameState.stadiumCapacity)
      + calculateWeeklySponsorIncome(selectedTeam, gameState.fanCount, gameState.fanMood, gameState.stadiumCapacity, 'none'),
    [selectedTeam, gameState.fanCount, gameState.fanMood, gameState.stadiumCapacity],
  );
  const wageRatio = wageBill / Math.max(displayedWeekSummary.income || projectedIncome, 1);
  const equity = calculateEquity(gameState.budget, squadValue, gameState.economy.stadiumBookValue, gameState.economy.debt);
  const seasonTransactions = useMemo(
    () => gameState.economy.transactions.filter(transaction => transaction.season === gameState.season),
    [gameState.economy.transactions, gameState.season],
  );
  const incomeByCategory = Object.entries(sumByCategory(seasonTransactions, 'income'))
    .sort(([, leftAmount], [, rightAmount]) => (rightAmount ?? 0) - (leftAmount ?? 0)) as Array<[EconomyTransactionCategory, number]>;
  const expenseByCategory = Object.entries(sumByCategory(seasonTransactions, 'expense'))
    .sort(([, leftAmount], [, rightAmount]) => (rightAmount ?? 0) - (leftAmount ?? 0)) as Array<[EconomyTransactionCategory, number]>;
  const recentTransactions = [...gameState.economy.transactions].reverse().slice(0, 10);
  const loanOffer = calculateLoanOffer({
    selectedTeam,
    cash: gameState.budget,
    debt: gameState.economy.debt,
    stadiumBookValue: gameState.economy.stadiumBookValue,
    squadValue,
    fanCount: gameState.fanCount,
    stadiumCapacity: gameState.stadiumCapacity,
  });
  const currentWeekKey = `${gameState.season}-${gameState.week}`;
  const loanBlockedThisWeek = gameState.economy.lastLoanWeekKey === currentWeekKey;

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Økonomi</h1>
          <p className="text-sm text-gray-600">
            {selectedTeam?.name} • Sæson {gameState.season} • Uge {gameState.week}
          </p>
        </div>
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          <p className="font-semibold">Lønmasse: {formatCurrency(wageBill)}</p>
          <p>Lønandel: {(wageRatio * 100).toFixed(0)}%</p>
        </div>
      </div>

      {statusMessage && (
        <div className="mb-6 rounded border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          {statusMessage}
        </div>
      )}

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Kassebeholdning</p>
          <p className="mt-2 text-2xl font-bold text-blue-700">{formatCurrency(gameState.budget)}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Ugens indtægter</p>
          <p className="mt-2 text-2xl font-bold text-emerald-600">{formatCurrency(displayedWeekSummary.income)}</p>
          <p className="mt-1 text-xs text-gray-500">Bogført uge {displayedWeekSummary.week}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Ugens udgifter</p>
          <p className="mt-2 text-2xl font-bold text-red-600">{formatCurrency(displayedWeekSummary.expenses)}</p>
          <p className="mt-1 text-xs text-gray-500">Bogført uge {displayedWeekSummary.week}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Ugens resultat</p>
          <p className={`mt-2 text-2xl font-bold ${resultToneClasses(displayedWeekSummary.net)}`}>
            {formatCurrency(displayedWeekSummary.net, true)}
          </p>
          <p className="mt-1 text-xs text-gray-500">Bogført uge {displayedWeekSummary.week}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Sæsonresultat</p>
          <p className={`mt-2 text-2xl font-bold ${resultToneClasses(seasonSummary.net)}`}>
            {formatCurrency(seasonSummary.net, true)}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Gæld</p>
          <p className="mt-2 text-2xl font-bold text-orange-600">{formatCurrency(gameState.economy.debt)}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Rente pr. uge</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{(gameState.economy.weeklyInterestRate * 100).toFixed(2)}%</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Egenkapital</p>
          <p className={`mt-2 text-2xl font-bold ${resultToneClasses(equity)}`}>{formatCurrency(equity, true)}</p>
          <p className="mt-1 text-xs text-gray-500">
            Budget + trupværdi + stadionværdi - gæld
          </p>
        </div>
      </div>

      <div className="mb-6 grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,1fr)]">
        <div className={`rounded-lg border p-6 ${boardToneClasses[gameState.economy.boardStatus.level]}`}>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-bold">Bestyrelsesstatus: {gameState.economy.boardStatus.level}</h2>
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

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold">Finansiering</h2>
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
            onClick={() => {
              const result = takeLoan();
              setStatusMessage(result ?? `Lånet blev optaget, og kassen er styrket med ${formatCurrency(loanOffer.amount)}.`);
            }}
            disabled={!loanOffer.available || loanBlockedThisWeek}
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
        </div>
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-2xl font-bold">Indtægter efter kategori</h2>
          {renderCategoryList(incomeByCategory, 'Ingen indtægter bogført endnu i denne sæson.')}
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-2xl font-bold">Udgifter efter kategori</h2>
          {renderCategoryList(expenseByCategory, 'Ingen udgifter bogført endnu i denne sæson.')}
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-2xl font-bold">Seneste transaktioner</h2>
        {recentTransactions.length === 0 ? (
          <p className="text-sm text-gray-500">Der er endnu ingen transaktioner i regnskabet.</p>
        ) : (
          <div className="space-y-3">
            {recentTransactions.map(transaction => (
              <div key={transaction.id} className="flex flex-col gap-2 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{transaction.description}</p>
                  <p className="text-sm text-gray-500">
                    {ECONOMY_CATEGORY_LABELS[transaction.category]} • Sæson {transaction.season}, uge {transaction.week}
                  </p>
                </div>
                <p className={`text-lg font-bold ${transaction.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
                  {formatCurrency(transaction.type === 'income' ? transaction.amount : -transaction.amount, true)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EconomyView;
