export type EconomyTransactionType = 'income' | 'expense';

export type EconomyTransactionCategory =
  | 'ticket_sales'
  | 'sponsor'
  | 'player_sale'
  | 'player_purchase'
  | 'wages'
  | 'stadium_upgrade'
  | 'operations'
  | 'loan'
  | 'interest';

export interface EconomyTransaction {
  id: string;
  season: number;
  week: number;
  type: EconomyTransactionType;
  category: EconomyTransactionCategory;
  amount: number;
  description: string;
}

export type BoardStatusLevel = 'Stabil' | 'Presset' | 'Kritisk' | 'Krise';

export interface BoardStatus {
  level: BoardStatusLevel;
  summary: string;
  warnings: string[];
  recommendations: string[];
  restrictions: string[];
}

export interface EconomyPeriodSummary {
  season: number;
  week: number;
  income: number;
  expenses: number;
  net: number;
}

export interface EconomyState {
  debt: number;
  transactions: EconomyTransaction[];
  stadiumBookValue: number;
  weeklyInterestRate: number;
  boardStatus: BoardStatus;
  lastProcessedWeekKey: string | null;
  lastLoanWeekKey: string | null;
  lastWeekSummary: EconomyPeriodSummary | null;
}

export const ECONOMY_CATEGORY_LABELS: Record<EconomyTransactionCategory, string> = {
  ticket_sales: 'Billetsalg',
  sponsor: 'Sponsor',
  player_sale: 'Spillersalg',
  player_purchase: 'Spillerkøb',
  wages: 'Lønninger',
  stadium_upgrade: 'Stadionudvidelse',
  operations: 'Drift',
  loan: 'Lån',
  interest: 'Renter',
};
