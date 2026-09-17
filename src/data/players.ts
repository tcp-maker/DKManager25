import { Player, PlayerRole, PlayerSkills, SkillKey } from '../types/player';

export const SKILL_KEYS: SkillKey[] = [
  'intelligence',
  'dribbling',
  'vision',
  'finishing',
  'setPieces',
  'passing',
  'heading',
  'pace',
  'stamina',
  'goalkeeping',
  'defending',
  'midfieldPlay',
  'attackingPlay',
  'wingPlay',
];

export const SKILL_LABELS: Record<SkillKey, string> = {
  intelligence: 'Intelligens',
  dribbling: 'Dribling',
  vision: 'Overblik',
  finishing: 'Skud',
  setPieces: 'Dødbolde',
  passing: 'Pasninger',
  heading: 'Hovedstød',
  pace: 'Fart',
  stamina: 'Udholdenhed',
  goalkeeping: 'Målmandsspil',
  defending: 'Forsvarsspil',
  midfieldPlay: 'Midtbanespil',
  attackingPlay: 'Angrebsspil',
  wingPlay: 'Fløjspil',
};

export const ROLE_LABELS: Record<PlayerRole, string> = {
  goalkeeper: 'Målmand',
  'center-back': 'Centerforsvarer',
  'full-back': 'Back',
  'defensive-midfielder': 'Defensiv midtbane',
  'central-midfielder': 'Central midtbane',
  'attacking-midfielder': 'Offensiv midtbane',
  winger: 'Fløj',
  striker: 'Angriber',
};

type SkillOverrides = Partial<PlayerSkills>;

interface PlayerSeed {
  id: string;
  name: string;
  age: number;
  position: Player['position'];
  primaryRole: PlayerRole;
  secondaryRoles?: PlayerRole[];
  base: number;
  overrides?: SkillOverrides;
  isForSale?: boolean;
  askingPrice?: number;
}

interface LegacyPlayerShape extends Partial<Player> {
  rating?: number;
}

interface SquadStrength {
  goalkeeping: number;
  defense: number;
  midfield: number;
  attack: number;
  overall: number;
}

const clampSkill = (value: number) => Math.max(1, Math.min(99, Math.round(value)));

const average = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;

const roundToNearestTenThousand = (value: number) => Math.round(value / 10000) * 10000;

const roleSkillDefaults: Record<PlayerRole, SkillOverrides> = {
  goalkeeper: {
    goalkeeping: 18,
    intelligence: 10,
    vision: 8,
    passing: 6,
    defending: 4,
    stamina: 4,
    attackingPlay: -18,
    finishing: -20,
    wingPlay: -18,
    dribbling: -12,
  },
  'center-back': {
    defending: 16,
    heading: 14,
    intelligence: 8,
    stamina: 8,
    passing: 4,
    pace: 3,
    midfieldPlay: -2,
    attackingPlay: -10,
    finishing: -16,
    wingPlay: -10,
    goalkeeping: -20,
  },
  'full-back': {
    defending: 12,
    pace: 11,
    stamina: 10,
    wingPlay: 9,
    passing: 7,
    dribbling: 5,
    intelligence: 6,
    attackingPlay: 1,
    finishing: -8,
    goalkeeping: -20,
  },
  'defensive-midfielder': {
    midfieldPlay: 13,
    passing: 11,
    intelligence: 10,
    defending: 10,
    stamina: 8,
    vision: 8,
    attackingPlay: -2,
    finishing: -8,
    goalkeeping: -20,
  },
  'central-midfielder': {
    midfieldPlay: 15,
    passing: 13,
    vision: 11,
    intelligence: 10,
    stamina: 8,
    dribbling: 5,
    defending: 2,
    attackingPlay: 3,
    goalkeeping: -20,
  },
  'attacking-midfielder': {
    attackingPlay: 13,
    midfieldPlay: 11,
    dribbling: 11,
    vision: 10,
    passing: 10,
    setPieces: 6,
    finishing: 4,
    defending: -8,
    goalkeeping: -20,
  },
  winger: {
    wingPlay: 16,
    pace: 14,
    dribbling: 13,
    attackingPlay: 10,
    passing: 7,
    finishing: 4,
    vision: 5,
    defending: -8,
    goalkeeping: -20,
  },
  striker: {
    attackingPlay: 16,
    finishing: 15,
    heading: 8,
    pace: 8,
    dribbling: 8,
    intelligence: 7,
    defending: -15,
    midfieldPlay: -8,
    goalkeeping: -20,
  },
};

const roleInfluence: Record<PlayerRole, Omit<SquadStrength, 'overall'>> = {
  goalkeeper: { goalkeeping: 1, defense: 0.25, midfield: 0.05, attack: 0.02 },
  'center-back': { goalkeeping: 0.02, defense: 1, midfield: 0.22, attack: 0.05 },
  'full-back': { goalkeeping: 0.02, defense: 0.78, midfield: 0.42, attack: 0.24 },
  'defensive-midfielder': { goalkeeping: 0.02, defense: 0.5, midfield: 0.95, attack: 0.18 },
  'central-midfielder': { goalkeeping: 0.02, defense: 0.28, midfield: 1, attack: 0.38 },
  'attacking-midfielder': { goalkeeping: 0.02, defense: 0.12, midfield: 0.78, attack: 0.92 },
  winger: { goalkeeping: 0.02, defense: 0.12, midfield: 0.5, attack: 1 },
  striker: { goalkeeping: 0.02, defense: 0.05, midfield: 0.22, attack: 1.05 },
};

const roleWeights: Record<PlayerRole, Partial<Record<SkillKey, number>>> = {
  goalkeeper: { goalkeeping: 0.4, intelligence: 0.12, vision: 0.1, passing: 0.08, stamina: 0.08, heading: 0.05, defending: 0.1, pace: 0.07 },
  'center-back': { defending: 0.28, heading: 0.18, intelligence: 0.12, stamina: 0.1, passing: 0.1, pace: 0.09, midfieldPlay: 0.06, attackingPlay: 0.07 },
  'full-back': { defending: 0.2, pace: 0.18, stamina: 0.15, wingPlay: 0.12, passing: 0.1, dribbling: 0.1, intelligence: 0.08, attackingPlay: 0.07 },
  'defensive-midfielder': { midfieldPlay: 0.18, defending: 0.15, passing: 0.14, intelligence: 0.12, vision: 0.1, stamina: 0.1, heading: 0.08, attackingPlay: 0.05, dribbling: 0.08 },
  'central-midfielder': { midfieldPlay: 0.2, passing: 0.16, vision: 0.14, intelligence: 0.12, stamina: 0.1, dribbling: 0.1, defending: 0.08, attackingPlay: 0.1 },
  'attacking-midfielder': { attackingPlay: 0.18, dribbling: 0.14, vision: 0.14, passing: 0.13, midfieldPlay: 0.12, setPieces: 0.08, finishing: 0.1, intelligence: 0.11 },
  winger: { wingPlay: 0.2, pace: 0.17, dribbling: 0.16, attackingPlay: 0.14, passing: 0.1, finishing: 0.08, intelligence: 0.07, setPieces: 0.04, stamina: 0.04 },
  striker: { attackingPlay: 0.22, finishing: 0.22, pace: 0.12, heading: 0.12, intelligence: 0.1, dribbling: 0.08, setPieces: 0.05, passing: 0.04, vision: 0.05 },
};

const roleFallbackByPosition: Record<Player['position'], PlayerRole> = {
  GK: 'goalkeeper',
  DF: 'center-back',
  MF: 'central-midfielder',
  FW: 'striker',
};

const buildSkillSet = (base: number, overrides: SkillOverrides = {}): PlayerSkills => ({
  intelligence: clampSkill(base + (overrides.intelligence ?? 0)),
  dribbling: clampSkill(base + (overrides.dribbling ?? 0)),
  vision: clampSkill(base + (overrides.vision ?? 0)),
  finishing: clampSkill(base + (overrides.finishing ?? 0)),
  setPieces: clampSkill(base + (overrides.setPieces ?? 0)),
  passing: clampSkill(base + (overrides.passing ?? 0)),
  heading: clampSkill(base + (overrides.heading ?? 0)),
  pace: clampSkill(base + (overrides.pace ?? 0)),
  stamina: clampSkill(base + (overrides.stamina ?? 0)),
  goalkeeping: clampSkill(base + (overrides.goalkeeping ?? 0)),
  defending: clampSkill(base + (overrides.defending ?? 0)),
  midfieldPlay: clampSkill(base + (overrides.midfieldPlay ?? 0)),
  attackingPlay: clampSkill(base + (overrides.attackingPlay ?? 0)),
  wingPlay: clampSkill(base + (overrides.wingPlay ?? 0)),
});

const normalizeAbsoluteSkills = (skills: PlayerSkills): PlayerSkills => ({
  intelligence: clampSkill(skills.intelligence),
  dribbling: clampSkill(skills.dribbling),
  vision: clampSkill(skills.vision),
  finishing: clampSkill(skills.finishing),
  setPieces: clampSkill(skills.setPieces),
  passing: clampSkill(skills.passing),
  heading: clampSkill(skills.heading),
  pace: clampSkill(skills.pace),
  stamina: clampSkill(skills.stamina),
  goalkeeping: clampSkill(skills.goalkeeping),
  defending: clampSkill(skills.defending),
  midfieldPlay: clampSkill(skills.midfieldPlay),
  attackingPlay: clampSkill(skills.attackingPlay),
  wingPlay: clampSkill(skills.wingPlay),
});

export const calculateASI = (skills: PlayerSkills) =>
  Math.round(average(SKILL_KEYS.map(skill => skills[skill])));

export const calculateRoleScore = (player: Player, role: PlayerRole = player.primaryRole) => {
  const weights = roleWeights[role];
  const weightedEntries = Object.entries(weights) as Array<[SkillKey, number]>;
  const totalWeight = weightedEntries.reduce((sum, [, weight]) => sum + weight, 0);
  const weightedValue = weightedEntries.reduce((sum, [skill, weight]) => sum + player.skills[skill] * weight, 0);

  return Math.round(weightedValue / totalWeight);
};

export const getPlayerAreaStrengths = (player: Player): Omit<SquadStrength, 'overall'> => {
  const baseGoalkeeping = average([player.skills.goalkeeping, player.skills.intelligence, player.skills.vision, player.skills.passing]);
  const baseDefense = average([player.skills.defending, player.skills.heading, player.skills.intelligence, player.skills.stamina, player.skills.pace]);
  const baseMidfield = average([player.skills.midfieldPlay, player.skills.passing, player.skills.vision, player.skills.intelligence, player.skills.dribbling, player.skills.stamina]);
  const baseAttack = average([player.skills.attackingPlay, player.skills.finishing, player.skills.dribbling, player.skills.pace, player.skills.heading, player.skills.setPieces]);
  const influence = roleInfluence[player.primaryRole];

  return {
    goalkeeping: Math.round(baseGoalkeeping * influence.goalkeeping),
    defense: Math.round(baseDefense * influence.defense),
    midfield: Math.round(baseMidfield * influence.midfield),
    attack: Math.round(baseAttack * influence.attack),
  };
};

export const calculateSquadStrength = (players: Player[]): SquadStrength => {
  if (players.length === 0) {
    return { goalkeeping: 70, defense: 70, midfield: 70, attack: 70, overall: 70 };
  }

  const totals = players.reduce(
    (aggregate, player) => {
      const areas = getPlayerAreaStrengths(player);
      const influence = roleInfluence[player.primaryRole];
      return {
        goalkeeping: aggregate.goalkeeping + areas.goalkeeping,
        defense: aggregate.defense + areas.defense,
        midfield: aggregate.midfield + areas.midfield,
        attack: aggregate.attack + areas.attack,
        goalkeepingWeight: aggregate.goalkeepingWeight + influence.goalkeeping,
        defenseWeight: aggregate.defenseWeight + influence.defense,
        midfieldWeight: aggregate.midfieldWeight + influence.midfield,
        attackWeight: aggregate.attackWeight + influence.attack,
      };
    },
    {
      goalkeeping: 0,
      defense: 0,
      midfield: 0,
      attack: 0,
      goalkeepingWeight: 0,
      defenseWeight: 0,
      midfieldWeight: 0,
      attackWeight: 0,
    }
  );

  const goalkeeping = totals.goalkeeping / Math.max(1, totals.goalkeepingWeight);
  const defense = totals.defense / Math.max(1, totals.defenseWeight);
  const midfield = totals.midfield / Math.max(1, totals.midfieldWeight);
  const attack = totals.attack / Math.max(1, totals.attackWeight);

  return {
    goalkeeping: Math.round(goalkeeping),
    defense: Math.round(defense),
    midfield: Math.round(midfield),
    attack: Math.round(attack),
    overall: Math.round(goalkeeping * 0.16 + defense * 0.31 + midfield * 0.29 + attack * 0.24),
  };
};

export const getBalancedOpponentStrength = (rating: number): SquadStrength => ({
  goalkeeping: Math.round(rating - 1),
  defense: Math.round(rating),
  midfield: Math.round(rating + 1),
  attack: Math.round(rating),
  overall: Math.round(rating),
});

export const getMatchPerformanceRating = (strength: SquadStrength, isHome: boolean) =>
  Math.round(
    strength.goalkeeping * 0.14 +
    strength.defense * 0.28 +
    strength.midfield * 0.3 +
    strength.attack * 0.28 +
    (isHome ? 3 : 0)
  );

export const getTopAndBottomSkills = (player: Player, limit = 3) => {
  const sortedSkills = SKILL_KEYS
    .map(skill => ({ key: skill, label: SKILL_LABELS[skill], value: player.skills[skill] }))
    .sort((a, b) => b.value - a.value);

  return {
    strengths: sortedSkills.slice(0, limit),
    weaknesses: [...sortedSkills].reverse().slice(0, limit),
  };
};

export const createPlayer = ({
  secondaryRoles = [],
  isForSale = false,
  askingPrice,
  ...seed
}: PlayerSeed): Player => {
  const baseSkills = buildSkillSet(seed.base, roleSkillDefaults[seed.primaryRole]);
  const skills = buildSkillSet(seed.base, {
    ...roleSkillDefaults[seed.primaryRole],
    ...seed.overrides,
  });
  const asi = calculateASI(skills);
  const roleScore = calculateRoleScore({
    ...seed,
    isForSale,
    askingPrice,
    secondaryRoles,
    skills,
    asi,
    value: 0,
  } as Player);
  const ageFactor = Math.max(0.82, 1.14 - Math.abs(seed.age - 27) * 0.018);
  const developmentBonus = average([
    skills.intelligence,
    skills.stamina,
    skills.vision,
    baseSkills.intelligence,
  ]) * 1200;
  const value = roundToNearestTenThousand((asi * 7000 + roleScore * 5000 + developmentBonus) * ageFactor);

  return {
    ...seed,
    secondaryRoles,
    skills,
    asi,
    value,
    isForSale,
    askingPrice: askingPrice ?? (isForSale ? value : undefined),
  };
};

const starterSeeds: PlayerSeed[] = [
  { id: '1', name: 'Peter Vindahl', age: 28, position: 'GK', primaryRole: 'goalkeeper', base: 63, overrides: { goalkeeping: 21, passing: 8, intelligence: 10, vision: 7 } },
  { id: '2', name: 'Karl-Johan Johnsson', age: 34, position: 'GK', primaryRole: 'goalkeeper', base: 60, overrides: { goalkeeping: 19, intelligence: 11, heading: 5 }, isForSale: true },
  { id: '3', name: 'Henrik Dalsgaard', age: 31, position: 'DF', primaryRole: 'center-back', secondaryRoles: ['full-back'], base: 64, overrides: { defending: 18, heading: 15, passing: 7 } },
  { id: '4', name: 'Andreas Bjelland', age: 32, position: 'DF', primaryRole: 'center-back', base: 62, overrides: { defending: 16, intelligence: 11, heading: 14, pace: -6 } },
  { id: '5', name: 'Jens Martin Hauge', age: 23, position: 'DF', primaryRole: 'full-back', secondaryRoles: ['winger'], base: 58, overrides: { pace: 14, wingPlay: 12, dribbling: 7 }, isForSale: true },
  { id: '6', name: 'Markus Halsti', age: 26, position: 'DF', primaryRole: 'full-back', secondaryRoles: ['defensive-midfielder'], base: 60, overrides: { defending: 12, stamina: 11, passing: 8, wingPlay: 8 } },
  { id: '7', name: 'Kristoffer Olsson', age: 25, position: 'MF', primaryRole: 'central-midfielder', secondaryRoles: ['attacking-midfielder'], base: 63, overrides: { midfieldPlay: 15, passing: 13, vision: 12 } },
  { id: '8', name: 'Rasmus Nissen', age: 27, position: 'MF', primaryRole: 'defensive-midfielder', secondaryRoles: ['central-midfielder'], base: 60, overrides: { defending: 11, passing: 10, stamina: 10 } },
  { id: '9', name: 'Marcus Ingvartsen', age: 24, position: 'MF', primaryRole: 'attacking-midfielder', secondaryRoles: ['winger', 'striker'], base: 61, overrides: { attackingPlay: 12, finishing: 9, dribbling: 10, vision: 10 }, isForSale: true },
  { id: '10', name: 'Filip Tronild', age: 22, position: 'MF', primaryRole: 'winger', secondaryRoles: ['attacking-midfielder'], base: 57, overrides: { wingPlay: 14, pace: 12, dribbling: 9 } },
  { id: '11', name: 'Karlo Bartolec', age: 26, position: 'FW', primaryRole: 'striker', secondaryRoles: ['winger'], base: 65, overrides: { attackingPlay: 15, finishing: 14, pace: 10 } },
  { id: '12', name: 'Tyrik Wonder', age: 24, position: 'FW', primaryRole: 'winger', secondaryRoles: ['striker'], base: 63, overrides: { wingPlay: 15, pace: 13, dribbling: 12, attackingPlay: 9 } },
  { id: '13', name: 'Samuel Mráz', age: 28, position: 'FW', primaryRole: 'striker', secondaryRoles: ['attacking-midfielder'], base: 61, overrides: { attackingPlay: 13, heading: 10, finishing: 11 }, isForSale: true },
];

const transferSeeds: PlayerSeed[] = [
  { id: 'buy1', name: 'Pione Sisto', age: 27, position: 'FW', primaryRole: 'winger', secondaryRoles: ['attacking-midfielder'], base: 64, overrides: { wingPlay: 16, dribbling: 15, pace: 14, finishing: 8 } },
  { id: 'buy2', name: 'Paul Onuachu', age: 29, position: 'FW', primaryRole: 'striker', base: 66, overrides: { attackingPlay: 16, finishing: 15, heading: 16, pace: 5 } },
  { id: 'buy3', name: 'Magnus Andersen', age: 26, position: 'MF', primaryRole: 'central-midfielder', secondaryRoles: ['defensive-midfielder'], base: 62, overrides: { midfieldPlay: 14, passing: 12, vision: 11, stamina: 9 } },
  { id: 'buy4', name: 'Nicolai Vallys', age: 24, position: 'DF', primaryRole: 'full-back', secondaryRoles: ['winger'], base: 59, overrides: { pace: 12, wingPlay: 11, defending: 10, dribbling: 8 } },
  { id: 'buy5', name: 'Jesper Hansen', age: 30, position: 'GK', primaryRole: 'goalkeeper', base: 61, overrides: { goalkeeping: 18, intelligence: 9, passing: 8 } },
];

export const STARTER_PLAYERS = starterSeeds.map(createPlayer);

export const TRANSFER_MARKET_PLAYERS = transferSeeds.map(createPlayer);

export const normalizePlayer = (rawPlayer: LegacyPlayerShape, fallbackId?: string): Player | null => {
  if (!rawPlayer.name || !rawPlayer.position) {
    return null;
  }

  if (rawPlayer.skills && rawPlayer.primaryRole && typeof rawPlayer.asi === 'number') {
    const skills = normalizeAbsoluteSkills(rawPlayer.skills);
    const normalizedPlayer = {
      id: rawPlayer.id ?? fallbackId ?? rawPlayer.name,
      name: rawPlayer.name,
      age: rawPlayer.age ?? 24,
      position: rawPlayer.position,
      primaryRole: rawPlayer.primaryRole,
      secondaryRoles: rawPlayer.secondaryRoles ?? [],
      skills,
      asi: rawPlayer.asi ?? calculateASI(skills),
      value: rawPlayer.value ?? 0,
      isForSale: rawPlayer.isForSale ?? false,
      askingPrice: rawPlayer.askingPrice,
    } as Player;

    return {
      ...normalizedPlayer,
      value: rawPlayer.value ?? createPlayer({
        id: normalizedPlayer.id,
        name: normalizedPlayer.name,
        age: normalizedPlayer.age,
        position: normalizedPlayer.position,
        primaryRole: normalizedPlayer.primaryRole,
        secondaryRoles: normalizedPlayer.secondaryRoles,
        base: normalizedPlayer.asi,
        overrides: {},
        isForSale: normalizedPlayer.isForSale,
        askingPrice: normalizedPlayer.askingPrice,
      }).value,
    };
  }

  const sourceRating = rawPlayer.rating ?? rawPlayer.asi;
  const base = typeof sourceRating === 'number'
    ? Math.max(40, Math.min(80, Math.round(sourceRating)))
    : 65;
  return createPlayer({
    id: rawPlayer.id ?? fallbackId ?? rawPlayer.name,
    name: rawPlayer.name,
    age: rawPlayer.age ?? 24,
    position: rawPlayer.position,
    primaryRole: rawPlayer.primaryRole ?? roleFallbackByPosition[rawPlayer.position],
    secondaryRoles: rawPlayer.secondaryRoles ?? [],
    base,
    isForSale: rawPlayer.isForSale ?? false,
    askingPrice: rawPlayer.askingPrice,
  });
};

export const normalizePlayerRecord = (players: unknown): Record<string, Player> => {
  if (!players || typeof players !== 'object') {
    return {};
  }

  return Object.entries(players as Record<string, LegacyPlayerShape>).reduce((acc, [playerId, rawPlayer]) => {
    const normalized = normalizePlayer(rawPlayer, playerId);
    if (normalized) {
      acc[playerId] = normalized;
    }
    return acc;
  }, {} as Record<string, Player>);
};
