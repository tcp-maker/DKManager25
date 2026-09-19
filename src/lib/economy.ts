import type { EconomyPeriodSummary, EconomyState, EconomyTransaction, EconomyTransactionCategory, BoardStatus, BoardStatusLevel } from '../types/economy';
import type { Player, PlayerRole } from '../types/player';
import type { Team } from '../types/teams';

type MatchEconomyResult = 'win' | 'draw' | 'loss' | 'none';

interface LeagueEconomyProfile {
  sponsorBase: number;
  operationsBase: number;
  stadiumBaseValue: number;
  loanStep: number;
  loanCapRatio: number;
  baseInterestRate: number;
}

interface BoardStatusInput {
  cash: number;
  debt: number;
  equity: number;
  wageBill: number;
  projectedIncome: number;
  weeklyCashflow: number;
}

interface LoanOfferInput {
  selectedTeam: Team | null;
  cash: number;
  debt: number;
  stadiumBookValue: number;
  squadValue: number;
  fanCount: number;
  stadiumCapacity: number;
}

export interface EconomyTimelinePoint extends EconomyPeriodSummary {
  key: string;
  label: string;
}

const DEFAULT_PROFILE: LeagueEconomyProfile = {
  sponsorBase: 20000,
  operationsBase: 24000,
  stadiumBaseValue: 1600000,
  loanStep: 250000,
  loanCapRatio: 0.42,
  baseInterestRate: 0.0105,
};

const LEAGUE_ECONOMY_PROFILES: Record<string, LeagueEconomyProfile> = {
  Superliga: {
    sponsorBase: 55000,
    operationsBase: 42000,
    stadiumBaseValue: 3800000,
    loanStep: 500000,
    loanCapRatio: 0.5,
    baseInterestRate: 0.0085,
  },
  '1. division': {
    sponsorBase: 40000,
    operationsBase: 34000,
    stadiumBaseValue: 2800000,
    loanStep: 400000,
    loanCapRatio: 0.47,
    baseInterestRate: 0.009,
  },
  '2. division': {
    sponsorBase: 28000,
    operationsBase: 28000,
    stadiumBaseValue: 2100000,
    loanStep: 300000,
    loanCapRatio: 0.44,
    baseInterestRate: 0.0098,
  },
  '3. division': {
    sponsorBase: 18000,
    operationsBase: 22000,
    stadiumBaseValue: 1500000,
    loanStep: 250000,
    loanCapRatio: 0.42,
    baseInterestRate: 0.0108,
  },
};

const PLAYER_ROLE_SALARY_MULTIPLIER: Record<PlayerRole, number> = {
  goalkeeper: 0.94,
  'center-back': 0.98,
  'full-back': 0.96,
  'defensive-midfielder': 1,
  'central-midfielder': 1.03,
  'attacking-midfielder': 1.08,
  winger: 1.06,
  striker: 1.1,
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const roundToNearest = (value: number, unit: number) => Math.round(value / unit) * unit;

const getLeagueEconomyProfile = (selectedTeam: Team | null) =>
  (selectedTeam?.league ? LEAGUE_ECONOMY_PROFILES[selectedTeam.league] : undefined) ?? DEFAULT_PROFILE;

export const createEmptyBoardStatus = (): BoardStatus => ({
  level: 'Stabil',
  summary: 'Bestyrelsen er tilfreds med klubbens økonomi.',
  warnings: [],
  recommendations: ['Fortsæt med at holde balance mellem vækst og lønforbrug.'],
  restrictions: [],
});

export const createDefaultEconomyState = (
  selectedTeam: Team | null,
  stadiumCapacity: number,
): EconomyState => ({
  debt: 0,
  transactions: [],
  stadiumBookValue: calculateStadiumBookValue(selectedTeam, stadiumCapacity),
  weeklyInterestRate: calculateDebtInterestRate(selectedTeam, 0, 0),
  boardStatus: createEmptyBoardStatus(),
  lastProcessedWeekKey: null,
  lastLoanWeekKey: null,
  lastWeekSummary: null,
});

export const createEconomyTransaction = (
  sequence: number,
  season: number,
  week: number,
  type: EconomyTransaction['type'],
  category: EconomyTransactionCategory,
  amount: number,
  description: string,
): EconomyTransaction => ({
  id: `txn-${season}-${week}-${sequence}-${category}`,
  season,
  week,
  type,
  category,
  amount,
  description,
});

export const calculateSquadValue = (players: Record<string, Player> | Player[]) => {
  const playerList = Array.isArray(players) ? players : Object.values(players);
  return playerList.reduce((sum, player) => sum + player.value, 0);
};

export const estimateWeeklySalary = (player: Pick<Player, 'age' | 'asi' | 'value' | 'primaryRole'> & Partial<Pick<Player, 'salary'>>) => {
  if (typeof player.salary === 'number' && Number.isFinite(player.salary) && player.salary > 0) {
    return roundToNearest(player.salary, 100);
  }

  const roleMultiplier = PLAYER_ROLE_SALARY_MULTIPLIER[player.primaryRole];
  const primeAgeModifier = Math.max(0, 30 - Math.abs(player.age - 27)) * 120;
  const rawSalary = player.value * 0.006 + player.asi * 110 * roleMultiplier + primeAgeModifier;

  return roundToNearest(clamp(rawSalary, 3500, 45000), 100);
};

export const calculateSquadWageBill = (players: Record<string, Player> | Player[]) => {
  const playerList = Array.isArray(players) ? players : Object.values(players);
  return playerList.reduce((sum, player) => sum + estimateWeeklySalary(player), 0);
};

export const calculateTicketRevenue = (fanCount: number, stadiumCapacity: number) =>
  Math.max(0, Math.min(fanCount, stadiumCapacity) * 150);

export const calculateWeeklySponsorIncome = (
  selectedTeam: Team | null,
  fanCount: number,
  fanMood: number,
  stadiumCapacity: number,
  matchResult: MatchEconomyResult,
) => {
  const profile = getLeagueEconomyProfile(selectedTeam);
  const attendanceBase = Math.min(fanCount, stadiumCapacity);
  const resultBonus = matchResult === 'win' ? 30000 : matchResult === 'draw' ? 12000 : matchResult === 'loss' ? 2000 : 0;
  const ratingValue = (selectedTeam?.baseRating ?? 60) * 850;
  const fanValue = attendanceBase * 12;
  const moodValue = fanMood * 480;

  return roundToNearest(profile.sponsorBase + ratingValue + fanValue + moodValue + resultBonus, 1000);
};

export const calculateWeeklyOperationsCost = (
  selectedTeam: Team | null,
  fanCount: number,
  stadiumCapacity: number,
) => {
  const profile = getLeagueEconomyProfile(selectedTeam);
  return roundToNearest(profile.operationsBase + stadiumCapacity * 6 + fanCount * 3, 1000);
};

export const calculateStadiumBookValue = (selectedTeam: Team | null, stadiumCapacity: number) => {
  const profile = getLeagueEconomyProfile(selectedTeam);
  const upgrades = Math.max(0, Math.round((stadiumCapacity - 3000) / 2500));
  return profile.stadiumBaseValue + upgrades * 500000;
};

export const calculateDebtInterestRate = (selectedTeam: Team | null, debt: number, equity: number) => {
  const profile = getLeagueEconomyProfile(selectedTeam);
  const riskBase = debt <= 0
    ? 0
    : clamp(debt / Math.max(500000, Math.abs(equity) + 500000), 0, 2.4) * 0.0025;

  return profile.baseInterestRate + riskBase;
};

export const calculateEquity = (
  cash: number,
  squadValue: number,
  stadiumBookValue: number,
  debt: number,
) => cash + squadValue + stadiumBookValue - debt;

export const calculatePeriodSummary = (
  transactions: EconomyTransaction[],
  season: number,
  week: number,
): EconomyPeriodSummary => {
  const periodTransactions = transactions.filter(transaction => transaction.season === season && transaction.week === week);
  const income = periodTransactions
    .filter(transaction => transaction.type === 'income')
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const expenses = periodTransactions
    .filter(transaction => transaction.type === 'expense')
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  return {
    season,
    week,
    income,
    expenses,
    net: income - expenses,
  };
};

export const calculateSeasonSummary = (transactions: EconomyTransaction[], season: number): EconomyPeriodSummary => {
  const seasonTransactions = transactions.filter(transaction => transaction.season === season);
  const income = seasonTransactions
    .filter(transaction => transaction.type === 'income')
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const expenses = seasonTransactions
    .filter(transaction => transaction.type === 'expense')
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const lastWeek = seasonTransactions.reduce((highestWeek, transaction) => Math.max(highestWeek, transaction.week), 0);

  return {
    season,
    week: lastWeek,
    income,
    expenses,
    net: income - expenses,
  };
};

export const resolveDisplayedWeekSummary = (
  transactions: EconomyTransaction[],
  season: number,
  week: number,
  lastWeekSummary: EconomyPeriodSummary | null,
): EconomyPeriodSummary => {
  const currentWeekSummary = calculatePeriodSummary(transactions, season, week);
  return currentWeekSummary.income > 0 || currentWeekSummary.expenses > 0
    ? currentWeekSummary
    : lastWeekSummary ?? currentWeekSummary;
};

export const calculateEconomyTimeline = (transactions: EconomyTransaction[]): EconomyTimelinePoint[] => {
  const summaryMap = transactions.reduce((map, transaction) => {
    const key = `${transaction.season}-${transaction.week}`;
    const summary = map.get(key) ?? {
      season: transaction.season,
      week: transaction.week,
      income: 0,
      expenses: 0,
      net: 0,
    };

    if (transaction.type === 'income') {
      summary.income += transaction.amount;
    } else {
      summary.expenses += transaction.amount;
    }

    summary.net = summary.income - summary.expenses;
    map.set(key, summary);
    return map;
  }, new Map<string, EconomyPeriodSummary>());

  return [...summaryMap.entries()]
    .sort(([, left], [, right]) => {
      if (left.season !== right.season) {
        return left.season - right.season;
      }

      return left.week - right.week;
    })
    .map(([key, summary]) => ({
      ...summary,
      key,
      label: `S${summary.season} • U${summary.week}`,
    }));
};

export const calculateBoardStatus = ({
  cash,
  debt,
  equity,
  wageBill,
  projectedIncome,
  weeklyCashflow,
}: BoardStatusInput): BoardStatus => {
  const warnings: string[] = [];
  const recommendations: string[] = [];
  const restrictions: string[] = [];

  const effectiveIncome = Math.max(projectedIncome, 1);
  const wageRatio = wageBill / effectiveIncome;
  const liquidityReserve = Math.max(150000, roundToNearest(wageBill * 0.75, 1000));
  const debtLoad = debt <= 0 ? 0 : debt / Math.max(250000, equity);

  let score = 0;

  if (cash < liquidityReserve) {
    score += cash < liquidityReserve * 0.55 ? 2 : 1;
    warnings.push(`Likviditetsreserven er for lav. Bestyrelsen ønsker mindst ${liquidityReserve.toLocaleString('da-DK')} kr i kassen.`);
    recommendations.push('Hold igen med store investeringer, indtil kassebeholdningen er genopbygget.');
  }

  if (wageRatio > 0.7) {
    score += wageRatio > 0.9 ? 2 : 1;
    warnings.push(`Lønandelen er høj (${(wageRatio * 100).toFixed(0)}% af de forventede indtægter).`);
    recommendations.push('Sænk lønudgifterne eller øg de faste indtægter gennem resultater og større stadionkapacitet.');
  }

  if (debtLoad > 0.7 || equity <= 0) {
    score += debtLoad > 1.1 || equity <= 0 ? 2 : 1;
    warnings.push(equity <= 0 ? 'Egenkapitalen er ikke længere sund nok til at absorbere gælden.' : 'Gældsbelastningen nærmer sig et kritisk niveau.');
    recommendations.push('Undgå at finansiere drift med nye lån, før egenkapitalen er styrket.');
  }

  if (weeklyCashflow < 0) {
    score += weeklyCashflow < -150000 ? 2 : 1;
    warnings.push(`Det ugentlige cashflow er negativt (${weeklyCashflow.toLocaleString('da-DK')} kr).`);
    recommendations.push('Skab et positivt cashflow via højere indtægter eller lavere udgifter.');
  }

  let level: BoardStatusLevel = 'Stabil';
  let summary = 'Bestyrelsen er tilfreds med klubbens økonomiske balance.';

  if (score >= 5) {
    level = 'Krise';
    summary = 'Bestyrelsen vurderer, at klubben er i økonomisk krise.';
    restrictions.push('Store investeringer frarådes kraftigt, indtil økonomien vender.');
    restrictions.push('Nye lån kræver tydelig plan for bedre cashflow.');
  } else if (score >= 3) {
    level = 'Kritisk';
    summary = 'Bestyrelsen ser alvorlige risici i økonomien.';
    restrictions.push('Bestyrelsen forventer hurtigt forbedret cashflow og lavere risikoniveau.');
  } else if (score >= 1) {
    level = 'Presset';
    summary = 'Bestyrelsen er presset af udviklingen, men klubben kan stadig genoprette balancen.';
    restrictions.push('Hold transfer- og anlægsinvesteringer på et moderat niveau.');
  }

  if (warnings.length === 0) {
    recommendations.push('Fortsæt med at balancere løn, gæld og anlægsinvesteringer.');
  }

  return { level, summary, warnings, recommendations, restrictions };
};

export const calculateLoanOffer = ({
  selectedTeam,
  cash,
  debt,
  stadiumBookValue,
  squadValue,
  fanCount,
  stadiumCapacity,
}: LoanOfferInput) => {
  const profile = getLeagueEconomyProfile(selectedTeam);
  const projectedIncome = calculateTicketRevenue(fanCount, stadiumCapacity) + calculateWeeklySponsorIncome(selectedTeam, fanCount, 50, stadiumCapacity, 'none');
  const assetBase = Math.max(500000, cash + squadValue + stadiumBookValue + projectedIncome);
  const maxDebt = roundToNearest(assetBase * profile.loanCapRatio, 50000);
  const amount = Math.min(profile.loanStep, Math.max(0, maxDebt - debt));

  return {
    amount,
    maxDebt,
    available: amount > 0,
  };
};

export const trimTransactions = (transactions: EconomyTransaction[], limit = 180) =>
  transactions.length <= limit ? transactions : transactions.slice(transactions.length - limit);
