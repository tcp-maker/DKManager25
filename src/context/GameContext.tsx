import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
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

export interface Match {
  id: string;
  opponent: string;
  isHome: boolean;
  difficulty: 'Nem' | 'Moderat' | 'Svær';
  opponentRating: number;
  week: number;
}

export type MatchResult = 'WIN' | 'DRAW' | 'LOSS';

export interface MatchReward {
  budget: number;
  fanCount: number;
  fanMood: number;
}

export interface PlayedMatch {
  id: string;
  fixtureId: string;
  opponent: string;
  result: MatchResult;
  playerGoals: number;
  opponentGoals: number;
  homeGoals: number;
  awayGoals: number;
  isHome: boolean;
  date: number;
  week: number;
  reward: MatchReward;
}

export interface StandingEntry {
  teamName: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

interface GameState {
  version: number;
  selectedTeam: Team | null;
  budget: number;
  players: Record<string, Player>;
  fanCount: number;
  stadiumCapacity: number;
  fanMood: number;
  week: number;
  upcomingMatches: Match[];
  playedMatches: PlayedMatch[];
  standings: StandingEntry[];
}

interface GameContextType {
  gameState: GameState;
  selectTeam: (team: Team) => void;
  addPlayer: (player: Player) => boolean;
  sellPlayer: (playerId: string) => void;
  updatePlayer: (playerId: string, updates: Partial<Player>) => void;
  upgradeStadium: () => void;
  handleNextWeek: () => void;
  applyMatchResult: (match: PlayedMatch) => void;
  resetGame: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

const GAME_STATE_VERSION = 2;
const STORAGE_KEY = 'dkmanager25_gamestate';

const DEFAULT_OPPONENTS = [
  { name: 'FC København', baseRating: 82 },
  { name: 'Brøndby IF', baseRating: 79 },
  { name: 'AaB Aalborg', baseRating: 76 },
  { name: 'Silkeborg IF', baseRating: 74 },
  { name: 'Randers FC', baseRating: 75 },
  { name: 'Midtjylland', baseRating: 78 },
  { name: 'OB Odense', baseRating: 73 },
  { name: 'Nordsjælland', baseRating: 77 },
] as const;

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

const hashSeed = (week: number, teamName: string): number => {
  let hash = week * 2654435761;
  for (let i = 0; i < teamName.length; i += 1) {
    hash = (hash ^ teamName.charCodeAt(i)) * 16777619;
  }
  return hash >>> 0;
};

const createSeededRandom = (seed: number) => {
  let current = seed;
  return () => {
    current = (current * 1664525 + 1013904223) >>> 0;
    return current / 4294967296;
  };
};

const generateUpcomingMatches = (week: number, selectedTeam: Team | null): Match[] => {
  const random = createSeededRandom(hashSeed(week, selectedTeam?.name ?? 'default'));
  const opponentPool = [...DEFAULT_OPPONENTS];
  const matches: Match[] = [];

  for (let i = 0; i < 3; i += 1) {
    const opponentIndex = Math.floor(random() * opponentPool.length);
    const opponent = opponentPool.splice(opponentIndex, 1)[0] ?? DEFAULT_OPPONENTS[i % DEFAULT_OPPONENTS.length];
    const isHome = random() > 0.5;

    matches.push({
      id: `match_${week}_${i}`,
      opponent: opponent.name,
      isHome,
      difficulty: opponent.baseRating > 80 ? 'Svær' : opponent.baseRating > 75 ? 'Moderat' : 'Nem',
      opponentRating: Number((opponent.baseRating + (random() * 5 - 2.5)).toFixed(1)),
      week,
    });
  }

  return matches;
};

const createBaseStandings = (selectedTeam: Team | null): StandingEntry[] => {
  const teamNames = new Set<string>(DEFAULT_OPPONENTS.map(opponent => opponent.name));
  if (selectedTeam?.name) {
    teamNames.add(selectedTeam.name);
  }

  return Array.from(teamNames).map(teamName => ({
    teamName,
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0,
  }));
};

const sortStandings = (standings: StandingEntry[]): StandingEntry[] => {
  return [...standings].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    return a.teamName.localeCompare(b.teamName, 'da');
  });
};

export const getMatchReward = (result: MatchResult): MatchReward => {
  switch (result) {
    case 'WIN':
      return { budget: 100000, fanCount: 50, fanMood: 10 };
    case 'DRAW':
      return { budget: 25000, fanCount: 10, fanMood: 2 };
    default:
      return { budget: 0, fanCount: -20, fanMood: -8 };
  }
};

const upsertStanding = (standings: StandingEntry[], teamName: string, updates: Partial<StandingEntry>): StandingEntry[] => {
  let found = false;
  const next = standings.map(entry => {
    if (entry.teamName !== teamName) return entry;
    found = true;

    const merged = { ...entry, ...updates };
    return {
      ...merged,
      goalDifference: merged.goalsFor - merged.goalsAgainst,
      points: merged.wins * 3 + merged.draws,
    };
  });

  if (!found) {
    const created: StandingEntry = {
      teamName,
      played: updates.played ?? 0,
      wins: updates.wins ?? 0,
      draws: updates.draws ?? 0,
      losses: updates.losses ?? 0,
      goalsFor: updates.goalsFor ?? 0,
      goalsAgainst: updates.goalsAgainst ?? 0,
      goalDifference: 0,
      points: 0,
    };
    created.goalDifference = created.goalsFor - created.goalsAgainst;
    created.points = created.wins * 3 + created.draws;

    return [...next, created];
  }

  return next;
};

const applyMatchToStandings = (standings: StandingEntry[], selectedTeamName: string, match: PlayedMatch): StandingEntry[] => {
  const teamEntry = standings.find(entry => entry.teamName === selectedTeamName) ?? {
    teamName: selectedTeamName,
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0,
  };

  const opponentEntry = standings.find(entry => entry.teamName === match.opponent) ?? {
    teamName: match.opponent,
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0,
  };

  let updated = upsertStanding(standings, selectedTeamName, {
    played: teamEntry.played + 1,
    wins: teamEntry.wins + (match.result === 'WIN' ? 1 : 0),
    draws: teamEntry.draws + (match.result === 'DRAW' ? 1 : 0),
    losses: teamEntry.losses + (match.result === 'LOSS' ? 1 : 0),
    goalsFor: teamEntry.goalsFor + match.playerGoals,
    goalsAgainst: teamEntry.goalsAgainst + match.opponentGoals,
  });

  updated = upsertStanding(updated, match.opponent, {
    played: opponentEntry.played + 1,
    wins: opponentEntry.wins + (match.result === 'LOSS' ? 1 : 0),
    draws: opponentEntry.draws + (match.result === 'DRAW' ? 1 : 0),
    losses: opponentEntry.losses + (match.result === 'WIN' ? 1 : 0),
    goalsFor: opponentEntry.goalsFor + match.opponentGoals,
    goalsAgainst: opponentEntry.goalsAgainst + match.playerGoals,
  });

  return sortStandings(updated);
};

const buildStandingsFromHistory = (selectedTeam: Team | null, matches: PlayedMatch[]): StandingEntry[] => {
  const selectedTeamName = selectedTeam?.name ?? 'Dit Hold';
  let standings = sortStandings(createBaseStandings(selectedTeam));

  [...matches]
    .sort((a, b) => a.date - b.date)
    .forEach(match => {
      standings = applyMatchToStandings(standings, selectedTeamName, match);
    });

  return standings;
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

const parseTeam = (value: unknown): Team | null => {
  if (!isRecord(value)) return null;
  if (typeof value.id !== 'string' || typeof value.name !== 'string' || typeof value.logo !== 'string') return null;
  return { id: value.id, name: value.name, logo: value.logo };
};

const parsePlayers = (value: unknown): Record<string, Player> => {
  if (!isRecord(value)) return {};

  return Object.entries(value).reduce((acc, [key, raw]) => {
    if (!isRecord(raw)) return acc;

    const position = raw.position;
    if (position !== 'GK' && position !== 'DF' && position !== 'MF' && position !== 'FW') return acc;

    const parsedPlayer: Player = {
      id: typeof raw.id === 'string' ? raw.id : key,
      name: typeof raw.name === 'string' ? raw.name : 'Ukendt spiller',
      age: typeof raw.age === 'number' ? raw.age : 18,
      position,
      rating: typeof raw.rating === 'number' ? raw.rating : 65,
      value: typeof raw.value === 'number' ? raw.value : 0,
      isForSale: Boolean(raw.isForSale),
      askingPrice: typeof raw.askingPrice === 'number' ? raw.askingPrice : undefined,
    };

    acc[parsedPlayer.id] = parsedPlayer;
    return acc;
  }, {} as Record<string, Player>);
};

const parseUpcomingMatches = (value: unknown): Match[] => {
  if (!Array.isArray(value)) return [];

  return value
    .filter(isRecord)
    .map(raw => {
      const difficulty = raw.difficulty;
      if (
        typeof raw.id !== 'string' ||
        typeof raw.opponent !== 'string' ||
        typeof raw.isHome !== 'boolean' ||
        (difficulty !== 'Nem' && difficulty !== 'Moderat' && difficulty !== 'Svær')
      ) {
        return null;
      }

      return {
        id: raw.id,
        opponent: raw.opponent,
        isHome: raw.isHome,
        difficulty,
        opponentRating: typeof raw.opponentRating === 'number' ? raw.opponentRating : 70,
        week: typeof raw.week === 'number' ? raw.week : 1,
      };
    })
    .filter((match): match is Match => match !== null);
};

const parsePlayedMatches = (value: unknown): PlayedMatch[] => {
  if (!Array.isArray(value)) return [];

  return value
    .filter(isRecord)
    .map((raw, index) => {
      const result = raw.result;
      if ((result !== 'WIN' && result !== 'DRAW' && result !== 'LOSS') || typeof raw.opponent !== 'string') {
        return null;
      }

      const isHome = typeof raw.isHome === 'boolean' ? raw.isHome : true;
      const homeGoals = typeof raw.homeGoals === 'number' ? raw.homeGoals : 0;
      const awayGoals = typeof raw.awayGoals === 'number' ? raw.awayGoals : 0;
      const playerGoals = typeof raw.playerGoals === 'number' ? raw.playerGoals : (isHome ? homeGoals : awayGoals);
      const opponentGoals = typeof raw.opponentGoals === 'number' ? raw.opponentGoals : (isHome ? awayGoals : homeGoals);
      const timestamp = typeof raw.date === 'number' && raw.date > 1000000000 ? raw.date : Date.now() - index;
      const week = typeof raw.week === 'number'
        ? Math.max(1, Math.floor(raw.week))
        : typeof raw.date === 'number'
          ? Math.max(1, Math.floor(raw.date))
          : 1;

      return {
        id: typeof raw.id === 'string' ? raw.id : `legacy_match_${index}`,
        fixtureId: typeof raw.fixtureId === 'string'
          ? raw.fixtureId
          : typeof raw.id === 'string'
            ? raw.id
            : `legacy_match_${index}`,
        opponent: raw.opponent,
        result,
        playerGoals,
        opponentGoals,
        homeGoals: isHome ? playerGoals : opponentGoals,
        awayGoals: isHome ? opponentGoals : playerGoals,
        isHome,
        date: timestamp,
        week,
        reward: isRecord(raw.reward)
          ? {
              budget: typeof raw.reward.budget === 'number' ? raw.reward.budget : getMatchReward(result).budget,
              fanCount: typeof raw.reward.fanCount === 'number' ? raw.reward.fanCount : getMatchReward(result).fanCount,
              fanMood: typeof raw.reward.fanMood === 'number' ? raw.reward.fanMood : getMatchReward(result).fanMood,
            }
          : getMatchReward(result),
      };
    })
    .filter((match): match is PlayedMatch => match !== null)
    .sort((a, b) => b.date - a.date)
    .slice(0, 20);
};

const parseStandings = (value: unknown): StandingEntry[] => {
  if (!Array.isArray(value)) return [];

  return value
    .filter(isRecord)
    .map(raw => {
      if (typeof raw.teamName !== 'string') return null;

      const wins = typeof raw.wins === 'number' ? raw.wins : 0;
      const draws = typeof raw.draws === 'number' ? raw.draws : 0;
      const losses = typeof raw.losses === 'number' ? raw.losses : 0;
      const goalsFor = typeof raw.goalsFor === 'number' ? raw.goalsFor : 0;
      const goalsAgainst = typeof raw.goalsAgainst === 'number' ? raw.goalsAgainst : 0;

      return {
        teamName: raw.teamName,
        played: typeof raw.played === 'number' ? raw.played : wins + draws + losses,
        wins,
        draws,
        losses,
        goalsFor,
        goalsAgainst,
        goalDifference: goalsFor - goalsAgainst,
        points: wins * 3 + draws,
      };
    })
    .filter((entry): entry is StandingEntry => entry !== null);
};

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

const createInitialGameState = (selectedTeam: Team | null = null): GameState => ({
  version: GAME_STATE_VERSION,
  selectedTeam,
  budget: 1000000,
  players: selectedTeam ? generateDummyPlayers() : {},
  fanCount: 1200,
  stadiumCapacity: 3000,
  fanMood: 50,
  week: 1,
  upcomingMatches: generateUpcomingMatches(1, selectedTeam),
  playedMatches: [],
  standings: sortStandings(createBaseStandings(selectedTeam)),
});

const normalizeGameState = (value: unknown): GameState => {
  const parsed = isRecord(value) ? value : {};
  const selectedTeam = parseTeam(parsed.selectedTeam);
  const fallback = createInitialGameState(selectedTeam);

  const week = typeof parsed.week === 'number' && Number.isFinite(parsed.week) ? Math.max(1, Math.floor(parsed.week)) : 1;
  const playedMatches = parsePlayedMatches(parsed.playedMatches);
  const upcomingMatches = parseUpcomingMatches(parsed.upcomingMatches);

  const baseStandings = createBaseStandings(selectedTeam);
  let standings = parseStandings(parsed.standings);
  if (standings.length === 0) {
    standings = playedMatches.length > 0 ? buildStandingsFromHistory(selectedTeam, playedMatches) : baseStandings;
  } else {
    baseStandings.forEach(baseEntry => {
      if (!standings.some(entry => entry.teamName === baseEntry.teamName)) {
        standings.push(baseEntry);
      }
    });
    standings = sortStandings(standings);
  }

  return {
    version: GAME_STATE_VERSION,
    selectedTeam,
    budget: typeof parsed.budget === 'number' ? parsed.budget : fallback.budget,
    players: parsePlayers(parsed.players),
    fanCount: Math.max(0, Math.floor(typeof parsed.fanCount === 'number' ? parsed.fanCount : fallback.fanCount)),
    stadiumCapacity: Math.max(1, Math.floor(typeof parsed.stadiumCapacity === 'number' ? parsed.stadiumCapacity : fallback.stadiumCapacity)),
    fanMood: clamp(Math.round(typeof parsed.fanMood === 'number' ? parsed.fanMood : fallback.fanMood), 0, 100),
    week,
    upcomingMatches: upcomingMatches.length > 0 ? upcomingMatches : generateUpcomingMatches(week, selectedTeam),
    playedMatches,
    standings,
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
    if (!saved) return null;
    return normalizeGameState(JSON.parse(saved));
  } catch (error) {
    console.error('Fejl ved indlæsning af game state:', error);
    return null;
  }
};

const deleteGameState = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Fejl ved sletning af game state:', error);
  }
};

export const GameProvider = ({ children }: { children: ReactNode }) => {
  const [gameState, setGameState] = useState<GameState>(() => loadGameState() || createInitialGameState());

  useEffect(() => {
    saveGameState(gameState);
  }, [gameState]);

  const selectTeam = (team: Team) => {
    setGameState(createInitialGameState(team));
  };

  const addPlayer = (player: Player): boolean => {
    const cost = player.askingPrice ?? player.value;

    if (gameState.players[player.id]) {
      console.warn(`Spiller ${player.name} er allerede i truppen`);
      return false;
    }

    if (gameState.budget < cost) {
      console.warn(`Ikke budget nok til at købe ${player.name}. Mangler: ${cost - gameState.budget} kr`);
      return false;
    }

    setGameState(prev => ({
      ...prev,
      budget: prev.budget - cost,
      players: { ...prev.players, [player.id]: player },
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
        players: newPlayers,
      };
    });
  };

  const updatePlayer = (playerId: string, updates: Partial<Player>) => {
    setGameState(prev => ({
      ...prev,
      players: {
        ...prev.players,
        [playerId]: { ...prev.players[playerId], ...updates },
      },
    }));
  };

  const upgradeStadium = () => {
    const cost = 500000;
    if (gameState.budget >= cost) {
      setGameState(prev => ({
        ...prev,
        budget: prev.budget - cost,
        stadiumCapacity: prev.stadiumCapacity + 2500,
      }));
    }
  };

  const applyMatchResult = (match: PlayedMatch) => {
    setGameState(prev => {
      if (
        prev.playedMatches.some(played => played.fixtureId === match.fixtureId) ||
        !prev.upcomingMatches.some(upcoming => upcoming.id === match.fixtureId)
      ) {
        return prev;
      }

      const reward = match.reward ?? getMatchReward(match.result);
      const selectedTeamName = prev.selectedTeam?.name ?? 'Dit Hold';

      return {
        ...prev,
        budget: prev.budget + reward.budget,
        fanCount: Math.max(0, prev.fanCount + reward.fanCount),
        fanMood: clamp(prev.fanMood + reward.fanMood, 0, 100),
        playedMatches: [{ ...match, reward }, ...prev.playedMatches].slice(0, 20),
        upcomingMatches: prev.upcomingMatches.filter(upcoming => upcoming.id !== match.fixtureId),
        standings: applyMatchToStandings(prev.standings, selectedTeamName, { ...match, reward }),
      };
    });
  };

  const handleNextWeek = () => {
    setGameState(prev => {
      if (prev.upcomingMatches.length > 0) return prev;

      const ticketRevenue = Math.min(prev.fanCount, prev.stadiumCapacity) * 150;
      const nextWeek = prev.week + 1;

      return {
        ...prev,
        week: nextWeek,
        budget: prev.budget + ticketRevenue,
        upcomingMatches: generateUpcomingMatches(nextWeek, prev.selectedTeam),
      };
    });
  };

  const resetGame = () => {
    deleteGameState();
    setGameState(createInitialGameState());
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
        applyMatchResult,
        resetGame,
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
