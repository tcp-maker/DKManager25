import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  archiveSeason,
  buildRoundMatchRecords,
  getLeagueSeasonSchedule,
  getSeasonFixtures,
  getTeamById,
  normalizeLeagueMatchRecords,
  normalizeSeasonHistory,
  type LeagueMatchRecord,
  type MatchDetails,
  type ScheduledMatch,
  type SeasonArchiveEntry,
} from '../data/leagues';
import { canonicalizePlayerId, getTeamSquadRecord, normalizePlayerRecord, normalizeTransferMarket } from '../data/players';
import {
  calculateBoardStatus,
  calculateDebtInterestRate,
  calculateEquity,
  calculateLoanOffer,
  calculatePeriodSummary,
  calculateSquadValue,
  calculateSquadWageBill,
  calculateStadiumBookValue,
  calculateTicketRevenue,
  calculateWeeklyOperationsCost,
  calculateWeeklySponsorIncome,
  createDefaultEconomyState,
  createEconomyTransaction,
  trimTransactions,
} from '../lib/economy';
import type { EconomyPeriodSummary, EconomyState, EconomyTransaction } from '../types/economy';
import type { Player } from '../types/player';
import type { Club } from '../types/clubs';
import type { SquadState } from '../types/squads';

interface GameState {
  selectedClub: Club | null;
  budget: number;
  squad: SquadState;
  transferMarket: Record<string, Player>;
  fanCount: number;
  stadiumCapacity: number;
  fanMood: number;
  season: number;
  week: number;
  leagueMatches: LeagueMatchRecord[];
  seasonHistory: SeasonArchiveEntry[];
  economy: EconomyState;
}

interface GameContextType {
  gameState: GameState;
  selectClub: (club: Club) => void;
  restartCurrentClub: () => void;
  addPlayer: (player: Player) => boolean;
  sellPlayer: (playerId: string) => void;
  updatePlayer: (playerId: string, updates: Partial<Player>) => void;
  upgradeStadium: () => void;
  takeLoan: () => string | null;
  handleNextWeek: () => number;
  recordMatchResult: (fixture: ScheduledMatch, userGoals: number, opponentGoals: number, details?: MatchDetails) => void;
  resetGame: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

const STORAGE_KEY = 'dkmanager25_gamestate';
const ECONOMY_TRANSACTION_LIMIT = 180;
const BANKRUPTCY_CRISIS_WEEKS = 3;
const VALID_TRANSACTION_CATEGORIES = new Set<EconomyTransaction['category']>([
  'ticket_sales',
  'sponsor',
  'player_sale',
  'player_purchase',
  'wages',
  'stadium_upgrade',
  'operations',
  'loan',
  'interest',
]);

const buildWeekKey = (season: number, week: number) => `${season}-${week}`;

const createInitialGameState = (): GameState => ({
  selectedClub: null,
  budget: 1000000,
  squad: { clubId: '', players: {} },
  transferMarket: normalizeTransferMarket(undefined, {}),
  fanCount: 1200,
  stadiumCapacity: 3000,
  fanMood: 50,
  season: 1,
  week: 1,
  leagueMatches: [],
  seasonHistory: [],
  economy: createDefaultEconomyState(null, 3000),
});

const getWeeklyMatchResult = (state: GameState): 'win' | 'draw' | 'loss' | 'none' => {
  const selectedTeamId = state.selectedClub?.id;
  if (!selectedTeamId) {
    return 'none';
  }

  const currentWeekMatch = state.leagueMatches.find(
    match => match.isUserMatch && match.season === state.season && match.week === state.week,
  );

  if (!currentWeekMatch) {
    return 'none';
  }

  const userGoals = currentWeekMatch.homeTeamId === selectedTeamId ? currentWeekMatch.homeGoals : currentWeekMatch.awayGoals;
  const opponentGoals = currentWeekMatch.homeTeamId === selectedTeamId ? currentWeekMatch.awayGoals : currentWeekMatch.homeGoals;

  if (userGoals > opponentGoals) {
    return 'win';
  }

  if (userGoals < opponentGoals) {
    return 'loss';
  }

  return 'draw';
};

const hasCurrentWeekTransactions = (transactions: EconomyTransaction[], season: number, week: number) =>
  transactions.some(transaction => transaction.season === season && transaction.week === week);

const normalizePeriodSummary = (summary: unknown): EconomyPeriodSummary | null => {
  if (!summary || typeof summary !== 'object') {
    return null;
  }

  const candidate = summary as Partial<EconomyPeriodSummary>;
  if (
    typeof candidate.season !== 'number'
    || typeof candidate.week !== 'number'
    || typeof candidate.income !== 'number'
    || typeof candidate.expenses !== 'number'
    || typeof candidate.net !== 'number'
  ) {
    return null;
  }

  return {
    season: candidate.season,
    week: candidate.week,
    income: candidate.income,
    expenses: candidate.expenses,
    net: candidate.net,
  };
};

const normalizeTransactions = (transactions: unknown): EconomyTransaction[] => {
  if (!Array.isArray(transactions)) {
    return [];
  }

  return trimTransactions(
    transactions.reduce((acc, rawTransaction, index) => {
      if (!rawTransaction || typeof rawTransaction !== 'object') {
        return acc;
      }

      const candidate = rawTransaction as Partial<EconomyTransaction>;
      if (
        typeof candidate.season !== 'number'
        || typeof candidate.week !== 'number'
        || (candidate.type !== 'income' && candidate.type !== 'expense')
        || typeof candidate.amount !== 'number'
        || typeof candidate.description !== 'string'
        || !candidate.category
        || !VALID_TRANSACTION_CATEGORIES.has(candidate.category)
      ) {
        return acc;
      }

      acc.push({
        id: typeof candidate.id === 'string' && candidate.id.length > 0
          ? candidate.id
          : `txn-${candidate.season}-${candidate.week}-${index}-${candidate.category}`,
        season: candidate.season,
        week: candidate.week,
        type: candidate.type,
        category: candidate.category,
        amount: Math.max(0, Math.round(candidate.amount)),
        description: candidate.description,
      });
      return acc;
    }, [] as EconomyTransaction[]),
    ECONOMY_TRANSACTION_LIMIT,
  );
};

const reconcileGameState = (state: GameState): GameState => {
  const trimmedTransactions = trimTransactions(state.economy.transactions, ECONOMY_TRANSACTION_LIMIT);
  const stadiumBookValue = Math.max(
    state.economy.stadiumBookValue,
    calculateStadiumBookValue(state.selectedClub, state.stadiumCapacity),
  );
  const squadValue = calculateSquadValue(state.squad.players);
  const equity = calculateEquity(state.budget, squadValue, stadiumBookValue, state.economy.debt);
  const weeklyInterestRate = calculateDebtInterestRate(state.selectedClub, state.economy.debt, equity);
  const projectedIncome =
    calculateTicketRevenue(state.fanCount, state.stadiumCapacity)
    + calculateWeeklySponsorIncome(
      state.selectedClub,
      state.fanCount,
      state.fanMood,
      state.stadiumCapacity,
      getWeeklyMatchResult(state),
    );
  const wageBill = calculateSquadWageBill(state.squad.players);
  const projectedExpenses =
    wageBill
    + calculateWeeklyOperationsCost(state.selectedClub, state.fanCount, state.stadiumCapacity)
    + Math.round(state.economy.debt * weeklyInterestRate);
  const currentWeekSummary = calculatePeriodSummary(trimmedTransactions, state.season, state.week);
  const weeklyCashflow = hasCurrentWeekTransactions(trimmedTransactions, state.season, state.week)
    ? currentWeekSummary.net
    : projectedIncome - projectedExpenses;

  return {
    ...state,
    economy: {
      ...state.economy,
      transactions: trimmedTransactions,
      stadiumBookValue,
      weeklyInterestRate,
      boardStatus: calculateBoardStatus({
        cash: state.budget,
        debt: state.economy.debt,
        equity,
        wageBill,
        projectedIncome,
        weeklyCashflow,
      }),
    },
  };
};

const normalizeEconomyState = (
  state: Pick<GameState, 'selectedClub' | 'budget' | 'squad' | 'stadiumCapacity' | 'season' | 'week'>,
  rawEconomy: unknown,
): EconomyState => {
  const fallbackEconomy = createDefaultEconomyState(state.selectedClub, state.stadiumCapacity);
  const parsedEconomy = rawEconomy && typeof rawEconomy === 'object'
    ? rawEconomy as Partial<EconomyState>
    : null;
  const transactions = normalizeTransactions(parsedEconomy?.transactions);
  const stadiumBookValue = typeof parsedEconomy?.stadiumBookValue === 'number' && parsedEconomy.stadiumBookValue > 0
    ? Math.round(parsedEconomy.stadiumBookValue)
    : calculateStadiumBookValue(state.selectedClub, state.stadiumCapacity);
  const debt = typeof parsedEconomy?.debt === 'number' && parsedEconomy.debt > 0
    ? Math.round(parsedEconomy.debt)
    : 0;
  const equity = calculateEquity(state.budget, calculateSquadValue(state.squad.players), stadiumBookValue, debt);

  return {
    ...fallbackEconomy,
    transactions,
    debt,
    stadiumBookValue,
    weeklyInterestRate: calculateDebtInterestRate(state.selectedClub, debt, equity),
    consecutiveCrisisWeeks: typeof parsedEconomy?.consecutiveCrisisWeeks === 'number' && parsedEconomy.consecutiveCrisisWeeks > 0
      ? Math.floor(parsedEconomy.consecutiveCrisisWeeks)
      : 0,
    isBankrupt: parsedEconomy?.isBankrupt === true,
    lastProcessedWeekKey: typeof parsedEconomy?.lastProcessedWeekKey === 'string' ? parsedEconomy.lastProcessedWeekKey : null,
    lastLoanWeekKey: typeof parsedEconomy?.lastLoanWeekKey === 'string' ? parsedEconomy.lastLoanWeekKey : null,
    lastWeekSummary: normalizePeriodSummary(parsedEconomy?.lastWeekSummary),
  };
};

const saveGameState = (state: GameState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Fejl ved gemning af game state:', error);
  }
};

export const loadGameState = (): GameState | null => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      return null;
    }

    const parsed = JSON.parse(saved) as Partial<GameState> & {
      selectedTeam?: Club | null;
      players?: unknown;
    };
    const initialState = createInitialGameState();
    const savedClub = parsed.selectedClub !== undefined ? parsed.selectedClub : parsed.selectedTeam;
    const selectedClub = savedClub ? (getTeamById(savedClub.id) ?? savedClub) : null;
    const savedPlayers = parsed.squad
      ? (parsed.squad.clubId === selectedClub?.id ? parsed.squad.players : undefined)
      : parsed.players;
    const normalizedPlayers = normalizePlayerRecord(savedPlayers);
    const hasEmptySquad = savedPlayers && typeof savedPlayers === 'object' && Object.keys(savedPlayers).length === 0;
    const players = selectedClub
      ? (Object.keys(normalizedPlayers).length > 0 || hasEmptySquad ? normalizedPlayers : getTeamSquadRecord(selectedClub))
      : {};
    const season = typeof parsed.season === 'number' ? parsed.season : initialState.season;
    const leagueMatches = normalizeLeagueMatchRecords(parsed.leagueMatches);
    const loadedState: GameState = {
      ...initialState,
      selectedClub,
      budget: typeof parsed.budget === 'number' ? parsed.budget : initialState.budget,
      squad: { clubId: selectedClub?.id ?? '', players },
      transferMarket: normalizeTransferMarket(parsed.transferMarket, players),
      fanCount: typeof parsed.fanCount === 'number' ? parsed.fanCount : initialState.fanCount,
      stadiumCapacity: typeof parsed.stadiumCapacity === 'number' ? parsed.stadiumCapacity : initialState.stadiumCapacity,
      fanMood: typeof parsed.fanMood === 'number' ? parsed.fanMood : initialState.fanMood,
      season,
      week: typeof parsed.week === 'number' ? parsed.week : initialState.week,
      leagueMatches,
      seasonHistory: normalizeSeasonHistory(parsed.seasonHistory, selectedClub, season, leagueMatches),
      economy: initialState.economy,
    };

    loadedState.economy = normalizeEconomyState(loadedState, parsed.economy);
    return reconcileGameState(loadedState);
  } catch (error) {
    console.error('Fejl ved indlæsning af game state:', error);
  }
  return null;
};

const deleteGameState = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Fejl ved sletning af game state:', error);
  }
};

export const purchasePlayer = (state: GameState, playerId: string): GameState => {
  const id = canonicalizePlayerId(playerId);
  if (
    !state.selectedClub
    || state.economy.isBankrupt
    || Object.prototype.hasOwnProperty.call(state.squad.players, id)
    || !Object.prototype.hasOwnProperty.call(state.transferMarket, id)
  ) {
    return state;
  }
  const player = state.transferMarket[id];
  const cost = player.askingPrice ?? player.value;
  if (!Number.isFinite(cost) || cost < 0 || !Number.isFinite(state.budget) || state.budget < cost) {
    return state;
  }
  const transferMarket = { ...state.transferMarket };
  delete transferMarket[id];
  const transaction = createEconomyTransaction(
    state.economy.transactions.length + 1, state.season, state.week,
    'expense', 'player_purchase', cost, `Køb af ${player.name}`,
  );
  return reconcileGameState({
    ...state,
    budget: state.budget - cost,
    squad: {
      ...state.squad,
      players: { ...state.squad.players, [id]: { ...player, id, isForSale: false, askingPrice: undefined } },
    },
    transferMarket,
    economy: { ...state.economy, transactions: [...state.economy.transactions, transaction] },
  });
};

export const sellOwnedPlayer = (state: GameState, playerId: string): GameState => {
  const id = canonicalizePlayerId(playerId);
  if (state.economy.isBankrupt || !Object.prototype.hasOwnProperty.call(state.squad.players, id)) {
    return state;
  }
  const player = state.squad.players[id];
  if (!Number.isFinite(player.value) || player.value < 0) {
    return state;
  }
  const players = { ...state.squad.players };
  delete players[id];
  const transaction = createEconomyTransaction(
    state.economy.transactions.length + 1, state.season, state.week,
    'income', 'player_sale', player.value, `Salg af ${player.name}`,
  );
  return reconcileGameState({
    ...state,
    budget: state.budget + player.value,
    squad: { ...state.squad, players },
    transferMarket: { ...state.transferMarket, [id]: { ...player, id, isForSale: false, askingPrice: undefined } },
    economy: { ...state.economy, transactions: [...state.economy.transactions, transaction] },
  });
};

export const updateOwnedPlayer = (state: GameState, playerId: string, updates: Partial<Player>): GameState => {
  const id = canonicalizePlayerId(playerId);
  if (state.economy.isBankrupt || !Object.prototype.hasOwnProperty.call(state.squad.players, id)) {
    return state;
  }
  return reconcileGameState({
    ...state,
    squad: {
      ...state.squad,
      players: { ...state.squad.players, [id]: { ...state.squad.players[id], ...updates, id } },
    },
  });
};

export const GameProvider = ({ children }: { children: ReactNode }) => {
  const [gameState, setReactGameState] = useState<GameState>(() => loadGameState() ?? reconcileGameState(createInitialGameState()));
  const stateRef = useRef(gameState);
  const setGameState = (update: GameState | ((prev: GameState) => GameState)) => {
    const next = typeof update === 'function' ? update(stateRef.current) : update;
    stateRef.current = next;
    setReactGameState(next);
  };

  useEffect(() => {
    saveGameState(gameState);
  }, [gameState]);

  const selectClub = (club: Club) => {
    const resolvedClub = getTeamById(club.id) ?? club;
    const initialState = createInitialGameState();
    const nextState: GameState = {
      ...initialState,
      selectedClub: resolvedClub,
      squad: { clubId: resolvedClub.id, players: getTeamSquadRecord(resolvedClub) },
      economy: createDefaultEconomyState(resolvedClub, initialState.stadiumCapacity),
    };

    setGameState(reconcileGameState(nextState));
  };

  const restartCurrentClub = () => {
    setGameState(prev => {
      const initialState = createInitialGameState();
      if (!prev.selectedClub) {
        return reconcileGameState(initialState);
      }

      const resolvedClub = getTeamById(prev.selectedClub.id) ?? prev.selectedClub;
      return reconcileGameState({
        ...initialState,
        selectedClub: resolvedClub,
        squad: { clubId: resolvedClub.id, players: getTeamSquadRecord(resolvedClub) },
        economy: createDefaultEconomyState(resolvedClub, initialState.stadiumCapacity),
      });
    });
  };

  const addPlayer = (player: Player): boolean => {
    const previous = stateRef.current;
    const next = purchasePlayer(previous, player.id);
    if (next === previous) {
      return false;
    }
    setGameState(next);
    return true;
  };

  const sellPlayer = (playerId: string) => {
    if (gameState.economy.isBankrupt) {
      return;
    }

    setGameState(prev => sellOwnedPlayer(prev, playerId));
  };

  const updatePlayer = (playerId: string, updates: Partial<Player>) => {
    if (gameState.economy.isBankrupt) {
      return;
    }

    setGameState(prev => updateOwnedPlayer(prev, playerId, updates));
  };

  const upgradeStadium = () => {
    const cost = 500000;
    if (gameState.economy.isBankrupt || gameState.budget < cost) {
      return;
    }

    setGameState(prev => {
      if (prev.economy.isBankrupt || prev.budget < cost) {
        return prev;
      }

      const nextCapacity = prev.stadiumCapacity + 2500;
      const transaction = createEconomyTransaction(
        prev.economy.transactions.length + 1,
        prev.season,
        prev.week,
        'expense',
        'stadium_upgrade',
        cost,
        'Udvidelse af stadion med 2.500 pladser',
      );

      return reconcileGameState({
        ...prev,
        budget: prev.budget - cost,
        stadiumCapacity: nextCapacity,
        economy: {
          ...prev.economy,
          stadiumBookValue: Math.max(prev.economy.stadiumBookValue + cost, calculateStadiumBookValue(prev.selectedClub, nextCapacity)),
          transactions: [...prev.economy.transactions, transaction],
        },
      });
    });
  };

  const takeLoan = (): string | null => {
    if (!gameState.selectedClub) {
      return 'Vælg en klub først.';
    }

    if (gameState.economy.isBankrupt) {
      return 'Klubben er konkurs. Start et nyt spil for at fortsætte.';
    }

    const currentOffer = calculateLoanOffer({
      selectedClub: gameState.selectedClub,
      cash: gameState.budget,
      debt: gameState.economy.debt,
      stadiumBookValue: gameState.economy.stadiumBookValue,
      squadValue: calculateSquadValue(gameState.squad.players),
      fanCount: gameState.fanCount,
      stadiumCapacity: gameState.stadiumCapacity,
    });
    const currentWeekKey = buildWeekKey(gameState.season, gameState.week);

    if (gameState.economy.lastLoanWeekKey === currentWeekKey) {
      return 'Bestyrelsen godkender kun ét nyt lån pr. uge.';
    }

    if (!currentOffer.available || currentOffer.amount <= 0) {
      return 'Bestyrelsen afviser flere lån på det nuværende økonomiske grundlag.';
    }

    setGameState(prev => {
      if (prev.economy.isBankrupt) {
        return prev;
      }

      const offer = calculateLoanOffer({
        selectedClub: prev.selectedClub,
        cash: prev.budget,
        debt: prev.economy.debt,
        stadiumBookValue: prev.economy.stadiumBookValue,
        squadValue: calculateSquadValue(prev.squad.players),
        fanCount: prev.fanCount,
        stadiumCapacity: prev.stadiumCapacity,
      });
      const weekKey = buildWeekKey(prev.season, prev.week);

      if (prev.economy.lastLoanWeekKey === weekKey || !offer.available || offer.amount <= 0) {
        return prev;
      }

      const transaction = createEconomyTransaction(
        prev.economy.transactions.length + 1,
        prev.season,
        prev.week,
        'income',
        'loan',
        offer.amount,
        'Optaget driftslån',
      );

      return reconcileGameState({
        ...prev,
        budget: prev.budget + offer.amount,
        economy: {
          ...prev.economy,
          debt: prev.economy.debt + offer.amount,
          lastLoanWeekKey: weekKey,
          transactions: [...prev.economy.transactions, transaction],
        },
      });
    });

    return null;
  };

  const handleNextWeek = (): number => {
    if (gameState.economy.isBankrupt) {
      return 0;
    }

    const ticketRevenue = calculateTicketRevenue(gameState.fanCount, gameState.stadiumCapacity);

    setGameState(prev => {
      if (!prev.selectedClub || prev.economy.isBankrupt) {
        return prev;
      }

      const seasonFixtures = getSeasonFixtures(prev.selectedClub);
      const playedFixtureIds = new Set(
        prev.leagueMatches
          .filter(match => match.season === prev.season && match.isUserMatch)
          .map(match => match.fixtureId),
      );
      const nextUnplayedFixture = seasonFixtures.find(match => !playedFixtureIds.has(match.id));
      const isSeasonFinished = seasonFixtures.length > 0 && !nextUnplayedFixture;

      if (nextUnplayedFixture && nextUnplayedFixture.week <= prev.week) {
        return prev;
      }

      const currentWeekKey = buildWeekKey(prev.season, prev.week);
      if (prev.economy.lastProcessedWeekKey === currentWeekKey) {
        return prev;
      }

      const matchResult = getWeeklyMatchResult(prev);
      const sponsorIncome = calculateWeeklySponsorIncome(
        prev.selectedClub,
        prev.fanCount,
        prev.fanMood,
        prev.stadiumCapacity,
        matchResult,
      );
      const wageBill = calculateSquadWageBill(prev.squad.players);
      const operationsCost = calculateWeeklyOperationsCost(prev.selectedClub, prev.fanCount, prev.stadiumCapacity);
      const squadValue = calculateSquadValue(prev.squad.players);
      const currentEquity = calculateEquity(prev.budget, squadValue, prev.economy.stadiumBookValue, prev.economy.debt);
      const interestRate = calculateDebtInterestRate(prev.selectedClub, prev.economy.debt, currentEquity);
      const interestCost = Math.round(prev.economy.debt * interestRate);

      const newTransactions = [
        createEconomyTransaction(
          prev.economy.transactions.length + 1,
          prev.season,
          prev.week,
          'income',
          'ticket_sales',
          ticketRevenue,
          `Billetindtægter i uge ${prev.week}`,
        ),
        createEconomyTransaction(
          prev.economy.transactions.length + 2,
          prev.season,
          prev.week,
          'income',
          'sponsor',
          sponsorIncome,
          matchResult === 'win'
            ? 'Sponsorindtægt efter sejr'
            : matchResult === 'draw'
              ? 'Sponsorindtægt efter uafgjort'
              : matchResult === 'loss'
                ? 'Sponsorindtægt efter nederlag'
                : 'Ugentlig sponsorindtægt',
        ),
        createEconomyTransaction(
          prev.economy.transactions.length + 3,
          prev.season,
          prev.week,
          'expense',
          'wages',
          wageBill,
          'Ugentlig lønudbetaling',
        ),
        createEconomyTransaction(
          prev.economy.transactions.length + 4,
          prev.season,
          prev.week,
          'expense',
          'operations',
          operationsCost,
          'Drift af stadion og klub',
        ),
        ...(interestCost > 0
          ? [
            createEconomyTransaction(
              prev.economy.transactions.length + 5,
              prev.season,
              prev.week,
              'expense',
              'interest',
              interestCost,
              'Ugentlig rente på gæld',
            ),
          ]
          : []),
      ];

      const totalIncome = newTransactions
        .filter(transaction => transaction.type === 'income')
        .reduce((sum, transaction) => sum + transaction.amount, 0);
      const totalExpenses = newTransactions
        .filter(transaction => transaction.type === 'expense')
        .reduce((sum, transaction) => sum + transaction.amount, 0);
      const updatedBudget = prev.budget + totalIncome - totalExpenses;
      const combinedTransactions = trimTransactions(
        [...prev.economy.transactions, ...newTransactions],
        ECONOMY_TRANSACTION_LIMIT,
      );
      const lastWeekSummary = calculatePeriodSummary(combinedTransactions, prev.season, prev.week);
      const completedWeekEquity = calculateEquity(
        updatedBudget,
        squadValue,
        prev.economy.stadiumBookValue,
        prev.economy.debt,
      );
      const completedWeekBoardStatus = calculateBoardStatus({
        cash: updatedBudget,
        debt: prev.economy.debt,
        equity: completedWeekEquity,
        wageBill,
        projectedIncome: ticketRevenue + sponsorIncome,
        weeklyCashflow: lastWeekSummary.net,
      });
      const consecutiveCrisisWeeks = completedWeekBoardStatus.level === 'Krise'
        ? prev.economy.consecutiveCrisisWeeks + 1
        : 0;
      const isBankrupt = consecutiveCrisisWeeks >= BANKRUPTCY_CRISIS_WEEKS;

      return reconcileGameState({
        ...prev,
        week: isSeasonFinished ? 1 : nextUnplayedFixture?.week ?? prev.week + 1,
        season: isSeasonFinished ? prev.season + 1 : prev.season,
        budget: updatedBudget,
        seasonHistory: isSeasonFinished
          ? archiveSeason(prev.seasonHistory, prev.selectedClub, prev.season, prev.leagueMatches)
          : prev.seasonHistory,
        economy: {
          ...prev.economy,
          consecutiveCrisisWeeks,
          isBankrupt,
          lastProcessedWeekKey: currentWeekKey,
          transactions: combinedTransactions,
          lastWeekSummary,
        },
      });
    });

    return ticketRevenue;
  };

  const recordMatchResult = (fixture: ScheduledMatch, userGoals: number, opponentGoals: number, details?: MatchDetails) => {
    setGameState(prev => {
      if (prev.economy.isBankrupt) {
        return prev;
      }

      const selectedClub = prev.selectedClub ? (getTeamById(prev.selectedClub.id) ?? prev.selectedClub) : null;
      if (!selectedClub) {
        return prev;
      }

      const homeGoals = fixture.isHome ? userGoals : opponentGoals;
      const awayGoals = fixture.isHome ? opponentGoals : userGoals;
      const newMatches = buildRoundMatchRecords(
        getLeagueSeasonSchedule(selectedClub),
        prev.season,
        selectedClub.id,
        fixture.id,
        { homeGoals, awayGoals, details },
        prev.leagueMatches,
      );
      if (newMatches.length === 0) {
        return prev;
      }

      const resultDelta = userGoals > opponentGoals
        ? { fanCount: 50, fanMood: 5 }
        : userGoals === opponentGoals
          ? { fanCount: 10, fanMood: 1 }
          : { fanCount: -20, fanMood: -5 };

      return reconcileGameState({
        ...prev,
        fanCount: Math.max(0, prev.fanCount + resultDelta.fanCount),
        fanMood: Math.max(0, Math.min(100, prev.fanMood + resultDelta.fanMood)),
        leagueMatches: [
          ...prev.leagueMatches,
          ...newMatches,
        ],
      });
    });
  };

  const resetGame = () => {
    deleteGameState();
    setGameState(reconcileGameState(createInitialGameState()));
  };

  return (
    <GameContext.Provider
      value={{
        gameState,
        selectClub,
        restartCurrentClub,
        addPlayer,
        sellPlayer,
        updatePlayer,
        upgradeStadium,
        takeLoan,
        handleNextWeek,
        recordMatchResult,
        resetGame,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame skal bruges inden i en GameProvider');
  }
  return context;
};
