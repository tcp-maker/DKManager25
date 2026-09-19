import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { getLeagueSeasonSchedule, getSeasonFixtures, getTeamById, type LeagueMatchRecord, type ScheduledMatch, simulateScore } from '../data/leagues';
import { getTeamSquadRecord, normalizePlayerRecord } from '../data/players';
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
import type { Team } from '../types/teams';

interface GameState {
  selectedTeam: Team | null;
  budget: number;
  players: Record<string, Player>;
  fanCount: number;
  stadiumCapacity: number;
  fanMood: number;
  season: number;
  week: number;
  leagueMatches: LeagueMatchRecord[];
  economy: EconomyState;
}

interface GameContextType {
  gameState: GameState;
  selectTeam: (team: Team) => void;
  restartCurrentTeam: () => void;
  addPlayer: (player: Player) => boolean;
  sellPlayer: (playerId: string) => void;
  updatePlayer: (playerId: string, updates: Partial<Player>) => void;
  upgradeStadium: () => void;
  takeLoan: () => string | null;
  handleNextWeek: () => number;
  recordMatchResult: (fixture: ScheduledMatch, userGoals: number, opponentGoals: number) => void;
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
  selectedTeam: null,
  budget: 1000000,
  players: {},
  fanCount: 1200,
  stadiumCapacity: 3000,
  fanMood: 50,
  season: 1,
  week: 1,
  leagueMatches: [],
  economy: createDefaultEconomyState(null, 3000),
});

const getWeeklyMatchResult = (state: GameState): 'win' | 'draw' | 'loss' | 'none' => {
  const selectedTeamId = state.selectedTeam?.id;
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
    calculateStadiumBookValue(state.selectedTeam, state.stadiumCapacity),
  );
  const squadValue = calculateSquadValue(state.players);
  const equity = calculateEquity(state.budget, squadValue, stadiumBookValue, state.economy.debt);
  const weeklyInterestRate = calculateDebtInterestRate(state.selectedTeam, state.economy.debt, equity);
  const projectedIncome =
    calculateTicketRevenue(state.fanCount, state.stadiumCapacity)
    + calculateWeeklySponsorIncome(
      state.selectedTeam,
      state.fanCount,
      state.fanMood,
      state.stadiumCapacity,
      getWeeklyMatchResult(state),
    );
  const wageBill = calculateSquadWageBill(state.players);
  const projectedExpenses =
    wageBill
    + calculateWeeklyOperationsCost(state.selectedTeam, state.fanCount, state.stadiumCapacity)
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
  state: Pick<GameState, 'selectedTeam' | 'budget' | 'players' | 'stadiumCapacity' | 'season' | 'week'>,
  rawEconomy: unknown,
): EconomyState => {
  const fallbackEconomy = createDefaultEconomyState(state.selectedTeam, state.stadiumCapacity);
  const parsedEconomy = rawEconomy && typeof rawEconomy === 'object'
    ? rawEconomy as Partial<EconomyState>
    : null;
  const transactions = normalizeTransactions(parsedEconomy?.transactions);
  const stadiumBookValue = typeof parsedEconomy?.stadiumBookValue === 'number' && parsedEconomy.stadiumBookValue > 0
    ? Math.round(parsedEconomy.stadiumBookValue)
    : calculateStadiumBookValue(state.selectedTeam, state.stadiumCapacity);
  const debt = typeof parsedEconomy?.debt === 'number' && parsedEconomy.debt > 0
    ? Math.round(parsedEconomy.debt)
    : 0;
  const equity = calculateEquity(state.budget, calculateSquadValue(state.players), stadiumBookValue, debt);

  return {
    ...fallbackEconomy,
    transactions,
    debt,
    stadiumBookValue,
    weeklyInterestRate: calculateDebtInterestRate(state.selectedTeam, debt, equity),
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

const loadGameState = (): GameState | null => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      return null;
    }

    const parsed = JSON.parse(saved) as Partial<GameState>;
    const initialState = createInitialGameState();
    const selectedTeam = parsed.selectedTeam ? (getTeamById(parsed.selectedTeam.id) ?? parsed.selectedTeam) : null;
    const normalizedPlayers = normalizePlayerRecord(parsed.players);
    const players = Object.keys(normalizedPlayers).length > 0 ? normalizedPlayers : getTeamSquadRecord(selectedTeam);
    const loadedState: GameState = {
      ...initialState,
      ...parsed,
      selectedTeam,
      budget: typeof parsed.budget === 'number' ? parsed.budget : initialState.budget,
      players,
      fanCount: typeof parsed.fanCount === 'number' ? parsed.fanCount : initialState.fanCount,
      stadiumCapacity: typeof parsed.stadiumCapacity === 'number' ? parsed.stadiumCapacity : initialState.stadiumCapacity,
      fanMood: typeof parsed.fanMood === 'number' ? parsed.fanMood : initialState.fanMood,
      season: typeof parsed.season === 'number' ? parsed.season : initialState.season,
      week: typeof parsed.week === 'number' ? parsed.week : initialState.week,
      leagueMatches: Array.isArray(parsed.leagueMatches) ? parsed.leagueMatches : [],
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

export const GameProvider = ({ children }: { children: ReactNode }) => {
  const [gameState, setGameState] = useState<GameState>(() => loadGameState() ?? reconcileGameState(createInitialGameState()));

  useEffect(() => {
    saveGameState(gameState);
  }, [gameState]);

  const selectTeam = (team: Team) => {
    const resolvedTeam = getTeamById(team.id) ?? team;
    const initialState = createInitialGameState();
    const nextState: GameState = {
      ...initialState,
      selectedTeam: resolvedTeam,
      players: getTeamSquadRecord(resolvedTeam),
      economy: createDefaultEconomyState(resolvedTeam, initialState.stadiumCapacity),
    };

    setGameState(reconcileGameState(nextState));
  };

  const restartCurrentTeam = () => {
    setGameState(prev => {
      const initialState = createInitialGameState();
      if (!prev.selectedTeam) {
        return reconcileGameState(initialState);
      }

      const resolvedTeam = getTeamById(prev.selectedTeam.id) ?? prev.selectedTeam;
      return reconcileGameState({
        ...initialState,
        selectedTeam: resolvedTeam,
        players: getTeamSquadRecord(resolvedTeam),
        economy: createDefaultEconomyState(resolvedTeam, initialState.stadiumCapacity),
      });
    });
  };

  const addPlayer = (player: Player): boolean => {
    if (gameState.economy.isBankrupt) {
      return false;
    }

    const cost = player.askingPrice ?? player.value;

    if (gameState.players[player.id]) {
      console.warn(`Spiller ${player.name} er allerede i truppen`);
      return false;
    }

    if (gameState.budget < cost) {
      console.warn(`Ikke budget nok til at købe ${player.name}. Mangler: ${cost - gameState.budget} kr`);
      return false;
    }

    setGameState(prev => {
      if (prev.economy.isBankrupt || prev.players[player.id] || prev.budget < cost) {
        return prev;
      }

      const transaction = createEconomyTransaction(
        prev.economy.transactions.length + 1,
        prev.season,
        prev.week,
        'expense',
        'player_purchase',
        cost,
        `Køb af ${player.name}`,
      );
      return reconcileGameState({
        ...prev,
        budget: prev.budget - cost,
        players: { ...prev.players, [player.id]: player },
        economy: {
          ...prev.economy,
          transactions: [...prev.economy.transactions, transaction],
        },
      });
    });

    return true;
  };

  const sellPlayer = (playerId: string) => {
    if (gameState.economy.isBankrupt) {
      return;
    }

    setGameState(prev => {
      if (prev.economy.isBankrupt) {
        return prev;
      }

      const player = prev.players[playerId];
      if (!player) {
        return prev;
      }

      const newPlayers = { ...prev.players };
      delete newPlayers[playerId];
      const transaction = createEconomyTransaction(
        prev.economy.transactions.length + 1,
        prev.season,
        prev.week,
        'income',
        'player_sale',
        player.value,
        `Salg af ${player.name}`,
      );

      return reconcileGameState({
        ...prev,
        budget: prev.budget + player.value,
        players: newPlayers,
        economy: {
          ...prev.economy,
          transactions: [...prev.economy.transactions, transaction],
        },
      });
    });
  };

  const updatePlayer = (playerId: string, updates: Partial<Player>) => {
    if (gameState.economy.isBankrupt) {
      return;
    }

    setGameState(prev => {
      if (prev.economy.isBankrupt) {
        return prev;
      }

      const currentPlayer = prev.players[playerId];
      if (!currentPlayer) {
        return prev;
      }

      return reconcileGameState({
        ...prev,
        players: {
          ...prev.players,
          [playerId]: {
            ...currentPlayer,
            ...updates,
          },
        },
      });
    });
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
          stadiumBookValue: Math.max(prev.economy.stadiumBookValue + cost, calculateStadiumBookValue(prev.selectedTeam, nextCapacity)),
          transactions: [...prev.economy.transactions, transaction],
        },
      });
    });
  };

  const takeLoan = (): string | null => {
    if (!gameState.selectedTeam) {
      return 'Vælg en klub først.';
    }

    if (gameState.economy.isBankrupt) {
      return 'Klubben er konkurs. Start et nyt spil for at fortsætte.';
    }

    const currentOffer = calculateLoanOffer({
      selectedTeam: gameState.selectedTeam,
      cash: gameState.budget,
      debt: gameState.economy.debt,
      stadiumBookValue: gameState.economy.stadiumBookValue,
      squadValue: calculateSquadValue(gameState.players),
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
        selectedTeam: prev.selectedTeam,
        cash: prev.budget,
        debt: prev.economy.debt,
        stadiumBookValue: prev.economy.stadiumBookValue,
        squadValue: calculateSquadValue(prev.players),
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
      if (!prev.selectedTeam || prev.economy.isBankrupt) {
        return prev;
      }

      const seasonFixtures = getSeasonFixtures(prev.selectedTeam);
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
        prev.selectedTeam,
        prev.fanCount,
        prev.fanMood,
        prev.stadiumCapacity,
        matchResult,
      );
      const wageBill = calculateSquadWageBill(prev.players);
      const operationsCost = calculateWeeklyOperationsCost(prev.selectedTeam, prev.fanCount, prev.stadiumCapacity);
      const squadValue = calculateSquadValue(prev.players);
      const currentEquity = calculateEquity(prev.budget, squadValue, prev.economy.stadiumBookValue, prev.economy.debt);
      const interestRate = calculateDebtInterestRate(prev.selectedTeam, prev.economy.debt, currentEquity);
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
        leagueMatches: isSeasonFinished
          ? prev.leagueMatches.filter(match => match.season >= Math.max(1, prev.season - 2))
          : prev.leagueMatches,
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

  const recordMatchResult = (fixture: ScheduledMatch, userGoals: number, opponentGoals: number) => {
    setGameState(prev => {
      if (prev.economy.isBankrupt) {
        return prev;
      }

      const selectedTeam = prev.selectedTeam ? (getTeamById(prev.selectedTeam.id) ?? prev.selectedTeam) : null;
      if (!selectedTeam) {
        return prev;
      }

      const alreadyPlayed = prev.leagueMatches.some(match => match.season === prev.season && match.fixtureId === fixture.id);
      if (alreadyPlayed) {
        return prev;
      }

      const otherMatches = getLeagueSeasonSchedule(selectedTeam)
        .filter(match =>
          match.week === prev.week
          && match.id !== fixture.id
          && !prev.leagueMatches.some(existing => existing.season === prev.season && existing.fixtureId === match.id),
        )
        .map(match => {
          const homeTeam = getTeamById(match.homeTeamId);
          const awayTeam = getTeamById(match.awayTeamId);
          const otherResult = simulateScore(homeTeam?.baseRating ?? 70, awayTeam?.baseRating ?? 70);

          return {
            fixtureId: match.id,
            season: prev.season,
            week: prev.week,
            homeTeamId: match.homeTeamId,
            homeTeamName: match.homeTeamName,
            awayTeamId: match.awayTeamId,
            awayTeamName: match.awayTeamName,
            homeGoals: otherResult.homeGoals,
            awayGoals: otherResult.awayGoals,
            isUserMatch: false,
          };
        });

      const homeGoals = fixture.isHome ? userGoals : opponentGoals;
      const awayGoals = fixture.isHome ? opponentGoals : userGoals;
      const userMatch: LeagueMatchRecord = {
        fixtureId: fixture.id,
        season: prev.season,
        week: prev.week,
        homeTeamId: fixture.isHome ? selectedTeam.id : fixture.opponentId,
        homeTeamName: fixture.isHome ? selectedTeam.name : fixture.opponent,
        awayTeamId: fixture.isHome ? fixture.opponentId : selectedTeam.id,
        awayTeamName: fixture.isHome ? fixture.opponent : selectedTeam.name,
        homeGoals,
        awayGoals,
        isUserMatch: true,
      };

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
          userMatch,
          ...otherMatches,
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
        selectTeam,
        restartCurrentTeam,
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
