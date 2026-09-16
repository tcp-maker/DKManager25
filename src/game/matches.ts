import { Team } from '../types/teams';

export type MatchDifficulty = 'Nem' | 'Moderat' | 'Svær';
export type MatchResult = 'WIN' | 'DRAW' | 'LOSS';

export interface UpcomingMatch {
  id: string;
  opponent: string;
  isHome: boolean;
  difficulty: MatchDifficulty;
  opponentRating: number;
}

export interface PlayedMatch extends UpcomingMatch {
  week: number;
  result: MatchResult;
  teamGoals: number;
  opponentGoals: number;
  fanChange: number;
  moodChange: number;
  budgetChange: number;
  ticketRevenue: number;
  sponsorBonus: number;
}

interface Opponent {
  name: string;
  baseRating: number;
}

const OPPONENTS: Opponent[] = [
  { name: 'FC København', baseRating: 82 },
  { name: 'Brøndby IF', baseRating: 79 },
  { name: 'AaB Aalborg', baseRating: 76 },
  { name: 'Silkeborg IF', baseRating: 74 },
  { name: 'Randers FC', baseRating: 75 },
  { name: 'Midtjylland', baseRating: 78 },
  { name: 'OB Odense', baseRating: 73 },
  { name: 'Nordsjælland', baseRating: 77 },
];

const clampNumber = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const createSeededRandom = (seed: number) => {
  let currentSeed = seed >>> 0;

  return () => {
    currentSeed = (currentSeed * 1664525 + 1013904223) >>> 0;
    return currentSeed / 4294967296;
  };
};

const createSeedFromTeamAndWeek = (team: Team, week: number): number => {
  const baseSeed = team.id
    .split('')
    .reduce((sum, char, index) => sum + char.charCodeAt(0) * (index + 1), 0);

  return baseSeed + week * 9973;
};

const getDifficulty = (rating: number): MatchDifficulty => {
  if (rating >= 79) return 'Svær';
  if (rating >= 75) return 'Moderat';
  return 'Nem';
};

const getWeeklyTicketRevenue = (fanCount: number, stadiumCapacity: number): number =>
  Math.min(fanCount, stadiumCapacity) * 150;

export const getTeamRating = (players: Record<string, RatedPlayer>): number => {
  const squad = Object.values(players);

  if (squad.length === 0) {
    return 70;
  }

  const totalRating = squad.reduce((sum, player) => sum + player.rating, 0);
  return totalRating / squad.length;
};

export const generateUpcomingMatches = (week: number, team: Team): UpcomingMatch[] => {
  const random = createSeededRandom(createSeedFromTeamAndWeek(team, week));
  const availableOpponents = OPPONENTS.filter(opponent => opponent.name !== team.name);
  const opponentPool = [...availableOpponents];
  const matches: UpcomingMatch[] = [];

  for (let index = 0; index < Math.min(3, opponentPool.length); index += 1) {
    const opponentIndex = Math.floor(random() * opponentPool.length);
    const opponent = opponentPool.splice(opponentIndex, 1)[0];
    const isHome = random() >= 0.5;
    const ratingOffset = Math.round((random() * 6 - 3) * 10) / 10;
    const opponentRating = clampNumber(opponent.baseRating + ratingOffset, 68, 85);

    matches.push({
      id: `week-${week}-${index}-${opponent.name}-${isHome ? 'home' : 'away'}`,
      opponent: opponent.name,
      isHome,
      difficulty: getDifficulty(opponentRating),
      opponentRating,
    });
  }

  return matches;
};

const normalizeProbabilities = (winProbability: number, drawProbability: number) => {
  const safeWin = clampNumber(winProbability, 0.18, 0.68);
  const safeDraw = clampNumber(drawProbability, 0.18, 0.3);
  const safeLoss = Math.max(0.12, 1 - safeWin - safeDraw);
  const total = safeWin + safeDraw + safeLoss;

  return {
    win: safeWin / total,
    draw: safeDraw / total,
    loss: safeLoss / total,
  };
};

const pickWeighted = <T>(options: Array<{ value: T; weight: number }>, random: () => number): T => {
  const totalWeight = options.reduce((sum, option) => sum + option.weight, 0);
  const roll = random() * totalWeight;
  let cursor = 0;

  for (const option of options) {
    cursor += option.weight;
    if (roll <= cursor) {
      return option.value;
    }
  }

  return options[options.length - 1].value;
};

const createScoreline = (result: MatchResult, advantage: number, random: () => number) => {
  if (result === 'DRAW') {
    const drawGoals = pickWeighted(
      [
        { value: 0, weight: 0.18 },
        { value: 1, weight: 0.52 },
        { value: 2, weight: 0.24 },
        { value: 3, weight: 0.06 },
      ],
      random
    );

    return {
      teamGoals: drawGoals,
      opponentGoals: drawGoals,
    };
  }

  const strongAdvantage = advantage >= 6;
  const margin = strongAdvantage
    ? pickWeighted(
        [
          { value: 1, weight: 0.45 },
          { value: 2, weight: 0.35 },
          { value: 3, weight: 0.2 },
        ],
        random
      )
    : pickWeighted(
        [
          { value: 1, weight: 0.65 },
          { value: 2, weight: 0.28 },
          { value: 3, weight: 0.07 },
        ],
        random
      );

  const baseLosingGoals = pickWeighted(
    [
      { value: 0, weight: 0.46 },
      { value: 1, weight: 0.37 },
      { value: 2, weight: 0.14 },
      { value: 3, weight: 0.03 },
    ],
    random
  );

  const losingGoals = clampNumber(baseLosingGoals, 0, 3);
  const winningGoals = clampNumber(losingGoals + margin, 1, 5);

  if (result === 'WIN') {
    return {
      teamGoals: winningGoals,
      opponentGoals: losingGoals,
    };
  }

  return {
    teamGoals: losingGoals,
    opponentGoals: winningGoals,
  };
};

export const simulateMatch = ({
  match,
  teamRating,
  fanMood,
  fanCount,
  stadiumCapacity,
  week,
}: {
  match: UpcomingMatch;
  teamRating: number;
  fanMood: number;
  fanCount: number;
  stadiumCapacity: number;
  week: number;
}): PlayedMatch => {
  const random = createSeededRandom(
    createSeedFromTeamAndWeek({ id: match.id, name: match.opponent, logo: '' }, week) +
      Math.round(teamRating * 100) +
      fanMood * 37
  );
  const moodModifier = (fanMood - 50) / 12;
  const venueModifier = match.isHome ? 3 : -2;
  const advantage = clampNumber(teamRating + moodModifier + venueModifier - match.opponentRating, -18, 18);

  const probabilities = normalizeProbabilities(0.44 + advantage / 42, 0.26 - Math.abs(advantage) / 120);
  const roll = random();
  const result: MatchResult =
    roll < probabilities.win ? 'WIN' : roll < probabilities.win + probabilities.draw ? 'DRAW' : 'LOSS';

  const { teamGoals, opponentGoals } = createScoreline(result, advantage, random);
  const fanChange = result === 'WIN' ? 50 : result === 'DRAW' ? 10 : -20;
  const moodChange = result === 'WIN' ? 8 : result === 'DRAW' ? 2 : -7;
  const sponsorBonus = result === 'WIN' ? 100000 : result === 'DRAW' ? 25000 : -30000;
  const ticketRevenue = getWeeklyTicketRevenue(fanCount, stadiumCapacity);

  return {
    ...match,
    week,
    result,
    teamGoals,
    opponentGoals,
    fanChange,
    moodChange,
    budgetChange: ticketRevenue + sponsorBonus,
    ticketRevenue,
    sponsorBonus,
  };
};
interface RatedPlayer {
  rating: number;
}
