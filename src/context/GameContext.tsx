import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { getLeagueByTeamId, getSeasonFixtures, getTeamById, LeagueMatchRecord, ScheduledMatch, simulateScore } from '../data/leagues';
import { Team } from '../types/teams';

export interface Player {
  id: string;
  name: string;
  age: number;
  position: 'GK' | 'DF' | 'MF' | 'FW';
  rating: number;
  value: number;
  isForSale: boolean;
  askingPrice?: number;
}

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
  const players: Player[] = [
    { id: '1', name: 'Peter Vindahl', age: 28, position: 'GK', rating: 78, value: 500000, isForSale: false },
    { id: '2', name: 'Karl-Johan Johnsson', age: 34, position: 'GK', rating: 75, value: 300000, isForSale: true, askingPrice: 350000 },
    
    { id: '3', name: 'Henrik Dalsgaard', age: 31, position: 'DF', rating: 79, value: 600000, isForSale: false },
    { id: '4', name: 'Andreas Bjelland', age: 32, position: 'DF', rating: 76, value: 450000, isForSale: false },
    { id: '5', name: 'Jens Martin Hauge', age: 23, position: 'DF', rating: 71, value: 400000, isForSale: true, askingPrice: 450000 },
    { id: '6', name: 'Markus Halsti', age: 26, position: 'DF', rating: 74, value: 380000, isForSale: false },
    
    { id: '7', name: 'Kristoffer Olsson', age: 25, position: 'MF', rating: 76, value: 520000, isForSale: false },
    { id: '8', name: 'Rasmus Nissen', age: 27, position: 'MF', rating: 73, value: 420000, isForSale: false },
    { id: '9', name: 'Marcus Ingvartsen', age: 24, position: 'MF', rating: 72, value: 450000, isForSale: true, askingPrice: 500000 },
    { id: '10', name: 'Filip Tronild', age: 22, position: 'MF', rating: 68, value: 280000, isForSale: false },
    
    { id: '11', name: 'Karlo Bartolec', age: 26, position: 'FW', rating: 80, value: 750000, isForSale: false },
    { id: '12', name: 'Tyrik Wonder', age: 24, position: 'FW', rating: 77, value: 600000, isForSale: false },
    { id: '13', name: 'Samuel Mráz', age: 28, position: 'FW', rating: 74, value: 500000, isForSale: true, askingPrice: 550000 },
  ];

  return players.reduce((acc, player) => {
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
      const completedMatches = prev.leagueMatches.filter(match => match.season === prev.season && match.isUserMatch).length;
      const seasonMatchCount = prev.selectedTeam ? getSeasonFixtures(prev.selectedTeam).length : 0;
      const isSeasonFinished = seasonMatchCount > 0 && completedMatches >= seasonMatchCount;

      return {
        ...prev,
        week: isSeasonFinished ? 1 : prev.week + 1,
        season: isSeasonFinished ? prev.season + 1 : prev.season,
        budget: prev.budget + ticketRevenue
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

      const league = getLeagueByTeamId(selectedTeam.id);
      if (!league) {
        return prev;
      }

      const remainingTeams = league.teams.filter(team => team.id !== selectedTeam.id && team.id !== fixture.opponentId);
      const shouldReverseOtherFixture = prev.week % 2 === 0;
      const otherHomeTeam = shouldReverseOtherFixture ? remainingTeams[1] : remainingTeams[0];
      const otherAwayTeam = shouldReverseOtherFixture ? remainingTeams[0] : remainingTeams[1];
      const otherResult = otherHomeTeam && otherAwayTeam
        ? simulateScore(otherHomeTeam.baseRating, otherAwayTeam.baseRating)
        : null;

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
          ...(otherResult && otherHomeTeam && otherAwayTeam ? [{
            fixtureId: `other-${prev.season}-${prev.week}`,
            season: prev.season,
            week: prev.week,
            homeTeamId: otherHomeTeam.id,
            homeTeamName: otherHomeTeam.name,
            awayTeamId: otherAwayTeam.id,
            awayTeamName: otherAwayTeam.name,
            homeGoals: otherResult.homeGoals,
            awayGoals: otherResult.awayGoals,
            isUserMatch: false,
          }] : []),
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
