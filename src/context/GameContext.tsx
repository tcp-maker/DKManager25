import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { getLeagueSeasonSchedule, getSeasonFixtures, getTeamById, LeagueMatchRecord, ScheduledMatch, simulateScore } from '../data/leagues';
import { normalizePlayerRecord, STARTER_PLAYERS } from '../data/players';
import { Team } from '../types/teams';
import { Player } from '../types/player';

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
}

interface GameContextType {
  gameState: GameState;
  selectTeam: (team: Team) => void;
  addPlayer: (player: Player) => boolean;
  sellPlayer: (playerId: string) => void;
  updatePlayer: (playerId: string, updates: Partial<Player>) => void;
  upgradeStadium: () => void;
  handleNextWeek: () => number;
  recordMatchResult: (fixture: ScheduledMatch, userGoals: number, opponentGoals: number) => void;
  resetGame: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

// Dummy spillere til start
const generateDummyPlayers = (): Record<string, Player> => {
  return STARTER_PLAYERS.reduce((acc, player) => {
    acc[player.id] = player;
    return acc;
  }, {} as Record<string, Player>);
};

// Initial game state
const initialGameState: GameState = {
  selectedTeam: null,
  budget: 1000000,
  players: {},
  fanCount: 1200,
  stadiumCapacity: 3000,
  fanMood: 50,
  season: 1,
  week: 1,
  leagueMatches: [],
};

// localStorage nøgler
const STORAGE_KEY = 'dkmanager25_gamestate';

// Gem game state til localStorage
const saveGameState = (state: GameState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Fejl ved gemning af game state:', error);
  }
};

// Hent game state fra localStorage
const loadGameState = (): GameState | null => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as Partial<GameState>;
      const selectedTeam = parsed.selectedTeam ? (getTeamById(parsed.selectedTeam.id) ?? parsed.selectedTeam) : null;

      return {
        ...initialGameState,
        ...parsed,
        selectedTeam,
        players: normalizePlayerRecord(parsed.players),
        season: typeof parsed.season === 'number' ? parsed.season : initialGameState.season,
        week: typeof parsed.week === 'number' ? parsed.week : initialGameState.week,
        leagueMatches: Array.isArray(parsed.leagueMatches) ? parsed.leagueMatches : [],
      };
    }
  } catch (error) {
    console.error('Fejl ved indlæsning af game state:', error);
  }
  return null;
};

// Slet game state fra localStorage
const deleteGameState = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Fejl ved sletning af game state:', error);
  }
};

export const GameProvider = ({ children }: { children: ReactNode }) => {
  const [gameState, setGameState] = useState<GameState>(() => {
    // Prøv at indlæse saved state, ellers brug initial state
    return loadGameState() || initialGameState;
  });

  // Auto-save game state når det ændrer sig
  useEffect(() => {
    saveGameState(gameState);
  }, [gameState]);

  const selectTeam = (team: Team) => {
    setGameState({
      ...initialGameState,
      selectedTeam: getTeamById(team.id) ?? team,
      players: generateDummyPlayers(),
    });
  };

  const addPlayer = (player: Player): boolean => {
    // Beregn kostprisen (brug askingPrice hvis tilgængelig, ellers value)
    const cost = player.askingPrice ?? player.value;
    
    // Tjek om spilleren allerede er i truppen
    if (gameState.players[player.id]) {
      console.warn(`Spiller ${player.name} er allerede i truppen`);
      return false;
    }
    
    // Tjek om der er budget nok
    if (gameState.budget < cost) {
      console.warn(`Ikke budget nok til at købe ${player.name}. Mangler: ${cost - gameState.budget} kr`);
      return false;
    }

    // Træk penge fra budget og tilføj spiller
    setGameState(prev => ({
      ...prev,
      budget: prev.budget - cost,
      players: { ...prev.players, [player.id]: player }
    }));
    
    return true;
  };

  const sellPlayer = (playerId: string) => {
    setGameState(prev => {
      const newPlayers = { ...prev.players };
      const price = newPlayers[playerId]?.value || 0;
      delete newPlayers[playerId];
      return {
        ...prev,
        budget: prev.budget + price,
        players: newPlayers
      };
    });
  };

  const updatePlayer = (playerId: string, updates: Partial<Player>) => {
    setGameState(prev => ({
      ...prev,
      players: {
        ...prev.players,
        [playerId]: { ...prev.players[playerId], ...updates }
      }
    }));
  };

  const upgradeStadium = () => {
    const cost = 500000;
    if (gameState.budget >= cost) {
      setGameState(prev => ({
        ...prev,
        budget: prev.budget - cost,
        stadiumCapacity: prev.stadiumCapacity + 2500
      }));
    }
  };

  const handleNextWeek = (): number => {
    const ticketRevenue = Math.min(gameState.fanCount, gameState.stadiumCapacity) * 150;
    setGameState(prev => {
      if (!prev.selectedTeam) {
        return prev;
      }

      const completedMatches = prev.leagueMatches.filter(match => match.season === prev.season && match.isUserMatch).length;
      const seasonFixtures = getSeasonFixtures(prev.selectedTeam);
      const currentWeekFixture = seasonFixtures.find(match => match.week === prev.week);
      const isCurrentWeekPlayed = currentWeekFixture
        ? prev.leagueMatches.some(match => match.season === prev.season && match.fixtureId === currentWeekFixture.id)
        : true;
      const isSeasonFinished = seasonFixtures.length > 0 && completedMatches >= seasonFixtures.length;

      if (!isSeasonFinished && !isCurrentWeekPlayed) {
        return prev;
      }

      return {
        ...prev,
        week: isSeasonFinished ? 1 : prev.week + 1,
        season: isSeasonFinished ? prev.season + 1 : prev.season,
        budget: prev.budget + ticketRevenue,
        leagueMatches: prev.leagueMatches,
      };
    });
    return ticketRevenue;
  };

  const recordMatchResult = (fixture: ScheduledMatch, userGoals: number, opponentGoals: number) => {
    setGameState(prev => {
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
          match.week === prev.week &&
          match.id !== fixture.id &&
          !prev.leagueMatches.some(existing => existing.season === prev.season && existing.fixtureId === match.id)
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
        ? { budget: 100000, fanCount: 50, fanMood: 5 }
        : userGoals === opponentGoals
          ? { budget: 0, fanCount: 10, fanMood: 1 }
          : { budget: 0, fanCount: -20, fanMood: -5 };

      return {
        ...prev,
        budget: prev.budget + resultDelta.budget,
        fanCount: Math.max(0, prev.fanCount + resultDelta.fanCount),
        fanMood: Math.max(0, Math.min(100, prev.fanMood + resultDelta.fanMood)),
        leagueMatches: [
          ...prev.leagueMatches,
          userMatch,
          ...otherMatches,
        ],
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
        handleNextWeek,
        recordMatchResult,
        resetGame
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame skal bruges inden i en GameProvider');
  return context;
};
