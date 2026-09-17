import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { STARTER_PLAYERS } from '../data/players';
import {
  createLeagueFixtures,
  getLeagueById,
  getLeagueByTeamId,
  getTeamById,
  LeagueFixture,
  LeagueResult,
} from '../data/leagues';
import { Team } from '../types/teams';
import { Player, normalizePlayer } from '../types/players';

export type { Player } from '../types/players';

type MatchOutcome = 'WIN' | 'DRAW' | 'LOSS';

export interface WeekSummary {
  round: number;
  userFixtureId: string;
  userResult: MatchOutcome;
  userGoals: number;
  opponentGoals: number;
  ticketRevenue: number;
  fanDelta: number;
  moodDelta: number;
}

interface GameState {
  selectedTeam: Team | null;
  budget: number;
  players: Record<string, Player>;
  fanCount: number;
  stadiumCapacity: number;
  fanMood: number;
  week: number;
  leagueId: string | null;
  leagueName: string | null;
  fixtures: LeagueFixture[];
  results: LeagueResult[];
  latestWeekSummary: WeekSummary | null;
}

interface GameContextType {
  gameState: GameState;
  selectTeam: (team: Team) => void;
  addPlayer: (player: Player) => boolean;
  sellPlayer: (playerId: string) => void;
  updatePlayer: (playerId: string, updates: Partial<Player>) => void;
  upgradeStadium: () => void;
  playCurrentWeek: () => WeekSummary | null;
  handleNextWeek: () => void;
  resetGame: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

const STORAGE_KEY = 'dkmanager25_gamestate';

const initialGameState: GameState = {
  selectedTeam: null,
  budget: 1000000,
  players: {},
  fanCount: 1200,
  stadiumCapacity: 3000,
  fanMood: 50,
  week: 1,
  leagueId: null,
  leagueName: null,
  fixtures: [],
  results: [],
  latestWeekSummary: null,
};

const clampMood = (value: number) => Math.max(0, Math.min(100, value));
const getPositiveNumber = (value: unknown, fallback: number) =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : fallback;

const generateDummyPlayers = (): Record<string, Player> =>
  STARTER_PLAYERS.reduce((acc, player) => {
    acc[player.id] = player;
    return acc;
  }, {} as Record<string, Player>);

const getTeamRating = (players: Record<string, Player>) => {
  const squad = Object.values(players);

  if (squad.length === 0) {
    return 70;
  }

  const totalRating = squad.reduce((sum, player) => sum + player.rating, 0);
  return totalRating / squad.length;
};

const normalizePlayers = (players: unknown): Record<string, Player> => {
  if (!players || typeof players !== 'object') {
    return {};
  }

  return Object.entries(players as Record<string, Player>).reduce((acc, [playerKey, player]) => {
    const normalized = normalizePlayer(player);
    acc[playerKey] = {
      ...normalized,
      id: player.id,
    };
    return acc;
  }, {} as Record<string, Player>);
};

const normalizeTeam = (team: unknown): Team | null => {
  if (!team || typeof team !== 'object') {
    return null;
  }

  const rawTeam = team as Partial<Team> & { id?: string };
  const canonicalTeam = getTeamById(rawTeam.id);
  const league = getLeagueByTeamId(rawTeam.id);

  if (canonicalTeam) {
    return canonicalTeam;
  }

  if (!rawTeam.id || !rawTeam.name || !rawTeam.logo) {
    return null;
  }

  return {
    id: rawTeam.id,
    name: rawTeam.name,
    logo: rawTeam.logo,
    leagueId: rawTeam.leagueId ?? league?.id ?? 'custom-league',
    leagueName: rawTeam.leagueName ?? league?.name ?? 'Ukendt Liga',
    strength: rawTeam.strength ?? 70,
  };
};

const normalizeResults = (results: unknown, fixtures: LeagueFixture[]): LeagueResult[] => {
  if (!Array.isArray(results)) {
    return [];
  }

  const fixturesById = new Map(fixtures.map((fixture) => [fixture.id, fixture]));
  const seenFixtureIds = new Set<string>();

  return results.reduce((acc, result) => {
    if (!result || typeof result !== 'object') {
      return acc;
    }

    const rawResult = result as Partial<LeagueResult>;
    const fixture = rawResult.fixtureId ? fixturesById.get(rawResult.fixtureId) : undefined;

    if (
      !rawResult.fixtureId ||
      !fixture ||
      seenFixtureIds.has(rawResult.fixtureId) ||
      typeof rawResult.homeGoals !== 'number' ||
      typeof rawResult.awayGoals !== 'number'
    ) {
      return acc;
    }

    acc.push({
      fixtureId: rawResult.fixtureId,
      round: fixture.round,
      homeTeamId: fixture.homeTeamId,
      awayTeamId: fixture.awayTeamId,
      homeGoals: rawResult.homeGoals,
      awayGoals: rawResult.awayGoals,
    });
    seenFixtureIds.add(rawResult.fixtureId);

    return acc;
  }, [] as LeagueResult[]);
};

const normalizeWeekSummary = (
  summary: unknown,
  fixtures: LeagueFixture[],
  results: LeagueResult[],
): WeekSummary | null => {
  if (!summary || typeof summary !== 'object') {
    return null;
  }

  const rawSummary = summary as Partial<WeekSummary>;
  const validUserResult =
    rawSummary.userResult === 'WIN' ||
    rawSummary.userResult === 'DRAW' ||
    rawSummary.userResult === 'LOSS';

  if (
    typeof rawSummary.round !== 'number' ||
    typeof rawSummary.userFixtureId !== 'string' ||
    !validUserResult ||
    typeof rawSummary.userGoals !== 'number' ||
    typeof rawSummary.opponentGoals !== 'number' ||
    typeof rawSummary.ticketRevenue !== 'number' ||
    typeof rawSummary.fanDelta !== 'number' ||
    typeof rawSummary.moodDelta !== 'number'
  ) {
    return null;
  }

  const hasFixture = fixtures.some((fixture) => fixture.id === rawSummary.userFixtureId);
  const hasResult = results.some((result) => result.fixtureId === rawSummary.userFixtureId);

  if (!hasFixture || !hasResult) {
    return null;
  }

  return {
    round: rawSummary.round,
    userFixtureId: rawSummary.userFixtureId,
    userResult: rawSummary.userResult as MatchOutcome,
    userGoals: rawSummary.userGoals,
    opponentGoals: rawSummary.opponentGoals,
    ticketRevenue: rawSummary.ticketRevenue,
    fanDelta: rawSummary.fanDelta,
    moodDelta: rawSummary.moodDelta,
  };
};

const normalizeGameState = (savedState: unknown): GameState => {
  if (!savedState || typeof savedState !== 'object') {
    return initialGameState;
  }

  const rawState = savedState as Partial<GameState>;
  const selectedTeam = normalizeTeam(rawState.selectedTeam);
  const league = getLeagueById(selectedTeam?.leagueId) ?? getLeagueByTeamId(selectedTeam?.id);
  const fixtures = league ? createLeagueFixtures(league) : [];
  const results = normalizeResults(rawState.results, fixtures);
  const maxRound = fixtures.length > 0 ? Math.max(...fixtures.map((fixture) => fixture.round)) : 1;
  const playedFixtureIds = new Set(results.map((result) => result.fixtureId));
  const seasonComplete = fixtures.length > 0 && playedFixtureIds.size === fixtures.length;
  const maxAllowedWeek = seasonComplete ? maxRound + 1 : maxRound;
  const normalizedWeek =
    typeof rawState.week === 'number' && rawState.week > 0
      ? Math.max(1, Math.min(Math.floor(rawState.week), maxAllowedWeek))
      : 1;

  return {
    selectedTeam,
    budget: getPositiveNumber(rawState.budget, initialGameState.budget),
    players: normalizePlayers(rawState.players),
    fanCount: getPositiveNumber(rawState.fanCount, initialGameState.fanCount),
    stadiumCapacity: getPositiveNumber(rawState.stadiumCapacity, initialGameState.stadiumCapacity),
    fanMood: clampMood(getPositiveNumber(rawState.fanMood, initialGameState.fanMood)),
    week: normalizedWeek,
    leagueId: league?.id ?? null,
    leagueName: league?.name ?? null,
    fixtures,
    results,
    latestWeekSummary: normalizeWeekSummary(rawState.latestWeekSummary, fixtures, results),
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

    if (saved) {
      return normalizeGameState(JSON.parse(saved));
    }
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

const simulateGoals = (homeRating: number, awayRating: number) => {
  const ratingDiff = homeRating - awayRating;
  const expectedHomeGoals = Math.max(0.4, 1.35 + ratingDiff / 24);
  const expectedAwayGoals = Math.max(0.3, 1.1 - ratingDiff / 26);

  const rollGoals = (expectedGoals: number) => {
    const variance = Math.random() * 1.3;
    return Math.max(0, Math.round(expectedGoals + variance - 0.45));
  };

  return {
    homeGoals: rollGoals(expectedHomeGoals),
    awayGoals: rollGoals(expectedAwayGoals),
  };
};

const getMatchOutcome = (goalsFor: number, goalsAgainst: number): MatchOutcome => {
  if (goalsFor > goalsAgainst) return 'WIN';
  if (goalsFor < goalsAgainst) return 'LOSS';
  return 'DRAW';
};

export const GameProvider = ({ children }: { children: ReactNode }) => {
  const [gameState, setGameState] = useState<GameState>(() => loadGameState() || initialGameState);

  useEffect(() => {
    saveGameState(gameState);
  }, [gameState]);

  const selectTeam = (team: Team) => {
    const league = getLeagueById(team.leagueId) ?? getLeagueByTeamId(team.id);

    setGameState({
      ...initialGameState,
      selectedTeam: team,
      players: generateDummyPlayers(),
      leagueId: league?.id ?? team.leagueId,
      leagueName: league?.name ?? team.leagueName,
      fixtures: league ? createLeagueFixtures(league) : [],
    });
  };

  const addPlayer = (player: Player): boolean => {
    const normalizedPlayer = normalizePlayer(player);
    const cost = normalizedPlayer.askingPrice ?? normalizedPlayer.value;

    if (gameState.players[normalizedPlayer.id]) {
      console.warn(`Spiller ${normalizedPlayer.name} er allerede i truppen`);
      return false;
    }

    if (gameState.budget < cost) {
      console.warn(`Ikke budget nok til at købe ${normalizedPlayer.name}. Mangler: ${cost - gameState.budget} kr`);
      return false;
    }

    setGameState((prev) => ({
      ...prev,
      budget: prev.budget - cost,
      players: { ...prev.players, [normalizedPlayer.id]: normalizedPlayer },
    }));

    return true;
  };

  const sellPlayer = (playerId: string) => {
    setGameState((prev) => {
      const newPlayers = { ...prev.players };
      const price = newPlayers[playerId]?.value || 0;
      delete newPlayers[playerId];

      return {
        ...prev,
        budget: prev.budget + price,
        players: newPlayers,
      };
    });
  };

  const updatePlayer = (playerId: string, updates: Partial<Player>) => {
    setGameState((prev) => {
      const player = prev.players[playerId];

      if (!player) {
        return prev;
      }

      const updatedPlayer = normalizePlayer({ ...player, ...updates });

      return {
        ...prev,
        players: {
          ...prev.players,
          [playerId]: updatedPlayer,
        },
      };
    });
  };

  const upgradeStadium = () => {
    const cost = 500000;

    if (gameState.budget >= cost) {
      setGameState((prev) => ({
        ...prev,
        budget: prev.budget - cost,
        stadiumCapacity: prev.stadiumCapacity + 2500,
      }));
    }
  };

  const playCurrentWeek = (): WeekSummary | null => {
    let weekSummary: WeekSummary | null = null;

    setGameState((prev) => {
      const selectedTeam = prev.selectedTeam;

      if (!selectedTeam) {
        return prev;
      }

      const fixturesThisWeek = prev.fixtures.filter((fixture) => fixture.round === prev.week);
      const userFixture = fixturesThisWeek.find(
        (fixture) => fixture.homeTeamId === selectedTeam.id || fixture.awayTeamId === selectedTeam.id,
      );

      if (!userFixture || fixturesThisWeek.length === 0) {
        return prev;
      }

      const resultsThisWeek = prev.results.filter((result) => result.round === prev.week);
      const allWeekResultsExist = fixturesThisWeek.every((fixture) =>
        resultsThisWeek.some((result) => result.fixtureId === fixture.id),
      );

      if (allWeekResultsExist) {
        weekSummary = prev.latestWeekSummary;
        return prev;
      }

      const squadRating = getTeamRating(prev.players);
      const newResults: LeagueResult[] = [];

      fixturesThisWeek.forEach((fixture) => {
        const existingResult = prev.results.find((result) => result.fixtureId === fixture.id);

        if (existingResult) {
          return;
        }

        const homeTeam = getTeamById(fixture.homeTeamId);
        const awayTeam = getTeamById(fixture.awayTeamId);
        const homeRating = fixture.homeTeamId === selectedTeam.id ? squadRating : homeTeam?.strength ?? 70;
        const awayRating = fixture.awayTeamId === selectedTeam.id ? squadRating : awayTeam?.strength ?? 70;
        const { homeGoals, awayGoals } = simulateGoals(homeRating, awayRating);

        newResults.push({
          fixtureId: fixture.id,
          round: fixture.round,
          homeTeamId: fixture.homeTeamId,
          awayTeamId: fixture.awayTeamId,
          homeGoals,
          awayGoals,
        });
      });

      const userResult = [...resultsThisWeek, ...newResults].find((result) => result.fixtureId === userFixture.id);

      if (!userResult) {
        return prev;
      }

      const isHome = userResult.homeTeamId === selectedTeam.id;
      const userGoals = isHome ? userResult.homeGoals : userResult.awayGoals;
      const opponentGoals = isHome ? userResult.awayGoals : userResult.homeGoals;
      const userResultType = getMatchOutcome(userGoals, opponentGoals);
      const fanDelta = userResultType === 'WIN' ? 50 : userResultType === 'DRAW' ? 10 : -20;
      const moodDelta = userResultType === 'WIN' ? 8 : userResultType === 'DRAW' ? 2 : -6;
      const ticketRevenue = Math.min(prev.fanCount, prev.stadiumCapacity) * 150;

      weekSummary = {
        round: prev.week,
        userFixtureId: userFixture.id,
        userResult: userResultType,
        userGoals,
        opponentGoals,
        ticketRevenue,
        fanDelta,
        moodDelta,
      };

      return {
        ...prev,
        budget: prev.budget + ticketRevenue,
        fanCount: Math.max(0, prev.fanCount + fanDelta),
        fanMood: clampMood(prev.fanMood + moodDelta),
        results: [...prev.results, ...newResults],
        latestWeekSummary: weekSummary,
      };
    });

    return weekSummary;
  };

  const handleNextWeek = () => {
    setGameState((prev) => {
      const maxRound =
        prev.fixtures.length > 0 ? Math.max(...prev.fixtures.map((fixture) => fixture.round)) : prev.week;
      const nextWeek = Math.min(prev.week + 1, maxRound + 1);

      return {
        ...prev,
        week: nextWeek,
        latestWeekSummary: null,
      };
    });
  };

  const resetGame = () => {
    deleteGameState();
    setGameState(initialGameState);
  };

  return (
    <GameContext.Provider
      value={{
        gameState,
        selectTeam,
        addPlayer,
        sellPlayer,
        updatePlayer,
        upgradeStadium,
        playCurrentWeek,
        handleNextWeek,
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
