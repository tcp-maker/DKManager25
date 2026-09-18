import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getLeagueTransferShortlist, getTeamRosterPlayers } from '../data/players';
import { getLeagueTeams, getTeamById } from '../data/teams';
import { LeagueMatchResult, PlayedMatch } from '../types/game';
import { GameState } from '../types/gameState';
import { Player } from '../types/players';
import { Team } from '../types/teams';
import { initialGameState, normalizeGameState } from '../utils/gameState';
import { applyMatchToStandings, createInitialStandings, generateLeagueFixtures, getFixtureForTeamAndWeek } from '../utils/leagueUtils';
import { calculateSquadRating, createLeagueMatchResult, createPlayedMatch, simulateFixtureScore } from '../utils/matchUtils';
import { normalizePlayer } from '../utils/playerUtils';

interface GameContextType {
  gameState: GameState;
  selectTeam: (team: Team) => void;
  addPlayer: (player: Player) => boolean;
  sellPlayer: (playerId: string) => void;
  updatePlayer: (playerId: string, updates: Partial<Player>) => void;
  playMatch: (fixtureId: string) => void;
  upgradeStadium: () => void;
  handleNextWeek: () => number;
  resetGame: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);
const STORAGE_KEY = 'dkmanager25_gamestate';

const createPlayerRecord = (players: Player[]): Record<string, Player> => (
  players.reduce<Record<string, Player>>((accumulator, player) => {
    accumulator[player.id] = player;
    return accumulator;
  }, {})
);

const saveGameState = (state: GameState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Fejl ved gemning af game state:', error);
  }
};

const loadGameState = (): GameState => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return normalizeGameState(JSON.parse(saved));
    }
  } catch (error) {
    console.error('Fejl ved indlæsning af game state:', error);
  }

  return initialGameState;
};

const deleteGameState = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Fejl ved sletning af game state:', error);
  }
};

const getResultEffects = (matchResult: PlayedMatch) => {
  if (matchResult.result === 'WIN') {
    return { budgetDelta: 100000, fanDelta: 50, moodDelta: 10 };
  }
  if (matchResult.result === 'DRAW') {
    return { budgetDelta: 25000, fanDelta: 10, moodDelta: 3 };
  }
  return { budgetDelta: 0, fanDelta: -20, moodDelta: -8 };
};

export const GameProvider = ({ children }: { children: ReactNode }) => {
  const [gameState, setGameState] = useState<GameState>(() => loadGameState());

  useEffect(() => {
    saveGameState(gameState);
  }, [gameState]);

  const selectTeam = (team: Team) => {
    const selectedTeam = getTeamById(team.id) ?? team;
    const leagueTeams = getLeagueTeams(selectedTeam.leagueId);

    setGameState({
      ...initialGameState,
      selectedTeam,
      players: createPlayerRecord(getTeamRosterPlayers(selectedTeam.id)),
      marketPlayers: createPlayerRecord(getLeagueTransferShortlist(selectedTeam.leagueId, selectedTeam.id)),
      leagueStandings: createInitialStandings(leagueTeams),
    });
  };

  const addPlayer = (player: Player): boolean => {
    let wasAdded = false;

    setGameState((previous) => {
      const ownerTeamId = previous.selectedTeam?.id ?? player.teamId;
      const normalizedPlayer = normalizePlayer({ ...player, teamId: ownerTeamId }, ownerTeamId);
      const cost = normalizedPlayer.askingPrice ?? normalizedPlayer.value;

      if (previous.players[normalizedPlayer.id] || previous.budget < cost) {
        return previous;
      }

      wasAdded = true;
      const updatedMarketPlayers = { ...previous.marketPlayers };
      delete updatedMarketPlayers[normalizedPlayer.id];

      return {
        ...previous,
        budget: previous.budget - cost,
        players: {
          ...previous.players,
          [normalizedPlayer.id]: { ...normalizedPlayer, teamId: ownerTeamId, isForSale: false, askingPrice: undefined },
        },
        marketPlayers: updatedMarketPlayers,
      };
    });

    return wasAdded;
  };

  const sellPlayer = (playerId: string) => {
    setGameState((previous) => {
      const player = previous.players[playerId];
      if (!player) {
        return previous;
      }

      const updatedPlayers = { ...previous.players };
      delete updatedPlayers[playerId];

      return {
        ...previous,
        budget: previous.budget + player.value,
        players: updatedPlayers,
        marketPlayers: {
          ...previous.marketPlayers,
          [playerId]: { ...player, teamId: 'transfer-market', isForSale: false, askingPrice: undefined },
        },
      };
    });
  };

  const updatePlayer = (playerId: string, updates: Partial<Player>) => {
    setGameState((previous) => {
      const existingPlayer = previous.players[playerId];
      if (!existingPlayer) {
        return previous;
      }

      const normalizedPlayer = normalizePlayer({ ...existingPlayer, ...updates }, existingPlayer.teamId);
      return {
        ...previous,
        players: {
          ...previous.players,
          [playerId]: normalizedPlayer,
        },
      };
    });
  };

  const playMatch = (fixtureId: string) => {
    setGameState((previous) => {
      if (!previous.selectedTeam) {
        return previous;
      }

      const selectedTeam = previous.selectedTeam;
      const leagueTeams = getLeagueTeams(selectedTeam.leagueId);
      const fixtures = generateLeagueFixtures(leagueTeams);
      const fixture = fixtures.find((item) => item.id === fixtureId);

      if (!fixture || fixture.week !== previous.week || previous.completedFixtureIds.includes(fixtureId)) {
        return previous;
      }

      const teamLookup = leagueTeams.reduce<Record<string, Team>>((accumulator, team) => {
        accumulator[team.id] = team;
        return accumulator;
      }, {});

      const weekFixtures = fixtures.filter((item) => item.week === previous.week);
      const squadRating = calculateSquadRating(Object.values(previous.players));
      let leagueStandings = previous.leagueStandings.length > 0
        ? previous.leagueStandings
        : createInitialStandings(leagueTeams);
      const weeklyResults: LeagueMatchResult[] = [];
      let selectedMatch: PlayedMatch | null = null;

      weekFixtures.forEach((weekFixture) => {
        if (previous.completedFixtureIds.includes(weekFixture.id)) {
          return;
        }

        const homeTeam = teamLookup[weekFixture.homeTeamId];
        const awayTeam = teamLookup[weekFixture.awayTeamId];
        if (!homeTeam || !awayTeam) {
          return;
        }

        const homeRating = weekFixture.homeTeamId === selectedTeam.id ? squadRating : homeTeam.strength;
        const awayRating = weekFixture.awayTeamId === selectedTeam.id ? squadRating : awayTeam.strength;
        const score = simulateFixtureScore(homeRating, awayRating, `${weekFixture.id}-${previous.week}-${squadRating}`);

        leagueStandings = applyMatchToStandings(
          leagueStandings,
          weekFixture.homeTeamId,
          weekFixture.awayTeamId,
          score.homeGoals,
          score.awayGoals,
        );

        weeklyResults.push(
          createLeagueMatchResult(weekFixture.id, previous.week, homeTeam, awayTeam, score.homeGoals, score.awayGoals),
        );

        if (weekFixture.id === fixture.id) {
          selectedMatch = createPlayedMatch(
            weekFixture.id,
            previous.week,
            homeTeam,
            awayTeam,
            selectedTeam.id,
            score.homeGoals,
            score.awayGoals,
          );
        }
      });

      if (!selectedMatch) {
        return previous;
      }

      const finalizedMatch = selectedMatch as PlayedMatch;
      const { budgetDelta, fanDelta, moodDelta } = getResultEffects(finalizedMatch);
      return {
        ...previous,
        budget: previous.budget + budgetDelta,
        fanCount: Math.max(0, previous.fanCount + fanDelta),
        fanMood: Math.max(0, Math.min(100, previous.fanMood + moodDelta)),
        leagueStandings,
        matchHistory: [finalizedMatch, ...previous.matchHistory.filter((match) => match.id !== finalizedMatch.id)].slice(0, 12),
        latestMatchResult: finalizedMatch,
        leagueResults: [...weeklyResults, ...previous.leagueResults.filter((result) => !weekFixtures.some((weekFixture) => weekFixture.id === result.fixtureId))],
        completedFixtureIds: Array.from(new Set([...previous.completedFixtureIds, ...weekFixtures.map((weekFixture) => weekFixture.id)])),
      };
    });
  };

  const upgradeStadium = () => {
    const cost = 500000;
    if (gameState.budget >= cost) {
      setGameState((previous) => ({
        ...previous,
        budget: previous.budget - cost,
        stadiumCapacity: previous.stadiumCapacity + 2500,
      }));
    }
  };

  const handleNextWeek = (): number => {
    if (gameState.selectedTeam) {
      const currentFixture = getFixtureForTeamAndWeek(
        generateLeagueFixtures(getLeagueTeams(gameState.selectedTeam.leagueId)),
        gameState.selectedTeam.id,
        gameState.week,
      );

      if (currentFixture && !gameState.completedFixtureIds.includes(currentFixture.id)) {
        return 0;
      }
    }

    const ticketRevenue = Math.min(gameState.fanCount, gameState.stadiumCapacity) * 150;
    setGameState((previous) => ({
      ...previous,
      week: previous.week + 1,
      budget: previous.budget + ticketRevenue,
      latestMatchResult: null,
    }));
    return ticketRevenue;
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
        playMatch,
        upgradeStadium,
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

export type { Player, GameState };
