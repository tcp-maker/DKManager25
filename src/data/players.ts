import { Player, PlayerRole, PlayerSkills, SkillKey } from '../types/player';
import { Team } from '../types/teams';
import { estimateWeeklySalary } from '../lib/economy';
import { LEAGUES, getTeamById } from './leagues';

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

interface PlayerValueInput {
  age: number;
  primaryRole: PlayerRole;
  skills: PlayerSkills;
  asi: number;
}

interface SquadTemplateSlot {
  position: Player['position'];
  primaryRole: PlayerRole;
  secondaryRoles?: PlayerRole[];
  ageRange: [number, number];
  baseOffset: number;
  overrides?: SkillOverrides;
}

interface TeamPlayerSeed {
  name: string;
  age?: number;
  position?: Player['position'];
  primaryRole?: PlayerRole;
  secondaryRoles?: PlayerRole[];
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

const calculateRoleScoreFromSkills = (skills: PlayerSkills, role: PlayerRole) => {
  const weights = roleWeights[role];
  const weightedEntries = Object.entries(weights) as Array<[SkillKey, number]>;
  const totalWeight = weightedEntries.reduce((sum, [, weight]) => sum + weight, 0);
  const weightedValue = weightedEntries.reduce((sum, [skill, weight]) => sum + skills[skill] * weight, 0);

  return Math.round(weightedValue / totalWeight);
};

export const calculateRoleScore = (player: Player, role: PlayerRole = player.primaryRole) =>
  calculateRoleScoreFromSkills(player.skills, role);

export const estimatePlayerValue = ({ age, primaryRole, skills, asi }: PlayerValueInput) => {
  const roleScore = calculateRoleScoreFromSkills(skills, primaryRole);
  const ageFactor = Math.max(0.82, 1.14 - Math.abs(age - 27) * 0.018);
  const developmentBonus = average([
    skills.intelligence,
    skills.stamina,
    skills.vision,
    skills.passing,
  ]) * 1200;

  return roundToNearestTenThousand((asi * 7000 + roleScore * 5000 + developmentBonus) * ageFactor);
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
  const value = estimatePlayerValue({
    age: seed.age,
    primaryRole: seed.primaryRole,
    skills: {
      ...skills,
      intelligence: Math.round((skills.intelligence + baseSkills.intelligence) / 2),
    },
    asi,
  });

  return {
    ...seed,
    secondaryRoles,
    skills,
    asi,
    value,
    salary: estimateWeeklySalary({ age: seed.age, asi, value, primaryRole: seed.primaryRole }),
    isForSale,
    askingPrice: askingPrice ?? (isForSale ? value : undefined),
  };
};

const SQUAD_TEMPLATE: SquadTemplateSlot[] = [
  { position: 'GK', primaryRole: 'goalkeeper', ageRange: [30, 35], baseOffset: 3, overrides: { goalkeeping: 22, passing: 6, vision: 4 } },
  { position: 'GK', primaryRole: 'goalkeeper', ageRange: [19, 24], baseOffset: 0, overrides: { goalkeeping: 18, intelligence: 5, passing: 4 } },
  { position: 'DF', primaryRole: 'center-back', secondaryRoles: ['full-back'], ageRange: [27, 32], baseOffset: 3, overrides: { defending: 18, heading: 15, passing: 6 } },
  { position: 'DF', primaryRole: 'center-back', ageRange: [24, 29], baseOffset: 2, overrides: { defending: 16, heading: 13, pace: -2 } },
  { position: 'DF', primaryRole: 'center-back', ageRange: [20, 25], baseOffset: 0, overrides: { defending: 13, heading: 9, pace: 1 } },
  { position: 'DF', primaryRole: 'full-back', secondaryRoles: ['winger'], ageRange: [23, 28], baseOffset: 1, overrides: { pace: 13, wingPlay: 10, dribbling: 5 } },
  { position: 'DF', primaryRole: 'full-back', secondaryRoles: ['defensive-midfielder'], ageRange: [19, 24], baseOffset: 0, overrides: { defending: 10, pace: 10, stamina: 11, passing: 6 } },
  { position: 'MF', primaryRole: 'defensive-midfielder', secondaryRoles: ['center-back'], ageRange: [25, 31], baseOffset: 2, overrides: { midfieldPlay: 12, defending: 11, passing: 9 } },
  { position: 'MF', primaryRole: 'defensive-midfielder', secondaryRoles: ['central-midfielder'], ageRange: [20, 25], baseOffset: 0, overrides: { midfieldPlay: 10, defending: 9, stamina: 9 } },
  { position: 'MF', primaryRole: 'central-midfielder', secondaryRoles: ['defensive-midfielder'], ageRange: [26, 31], baseOffset: 3, overrides: { midfieldPlay: 15, passing: 13, vision: 11 } },
  { position: 'MF', primaryRole: 'central-midfielder', secondaryRoles: ['attacking-midfielder'], ageRange: [22, 27], baseOffset: 1, overrides: { midfieldPlay: 13, passing: 11, vision: 10 } },
  { position: 'MF', primaryRole: 'central-midfielder', ageRange: [18, 22], baseOffset: -1, overrides: { midfieldPlay: 10, passing: 8, stamina: 8 } },
  { position: 'MF', primaryRole: 'attacking-midfielder', secondaryRoles: ['winger'], ageRange: [23, 28], baseOffset: 2, overrides: { attackingPlay: 12, dribbling: 10, vision: 10, finishing: 6 } },
  { position: 'MF', primaryRole: 'winger', secondaryRoles: ['attacking-midfielder'], ageRange: [20, 26], baseOffset: 1, overrides: { wingPlay: 14, pace: 13, dribbling: 10 } },
  { position: 'MF', primaryRole: 'winger', secondaryRoles: ['full-back'], ageRange: [18, 23], baseOffset: 0, overrides: { wingPlay: 11, pace: 12, dribbling: 8 } },
  { position: 'FW', primaryRole: 'striker', secondaryRoles: ['winger'], ageRange: [26, 31], baseOffset: 3, overrides: { attackingPlay: 15, finishing: 14, heading: 9 } },
  { position: 'FW', primaryRole: 'striker', secondaryRoles: ['attacking-midfielder'], ageRange: [22, 27], baseOffset: 1, overrides: { attackingPlay: 13, finishing: 11, pace: 8 } },
  { position: 'FW', primaryRole: 'striker', secondaryRoles: ['winger'], ageRange: [18, 22], baseOffset: 0, overrides: { attackingPlay: 11, finishing: 10, pace: 10 } },
];

export const PLAYER_DATA_SNAPSHOT_DATE = '2026-09-19';
export const TEAM_PLAYER_SEEDS: Record<string, readonly TeamPlayerSeed[]> = {
  fckoebenhavn: [
    { name: 'Diant Ramaj', age: 25, position: 'GK', primaryRole: 'goalkeeper' },
    { name: 'Rúnar Alex Rúnarsson', age: 31, position: 'GK', primaryRole: 'goalkeeper' },
    { name: 'Felix Beijmo', age: 28, position: 'DF', primaryRole: 'full-back' },
    { name: 'Asger Sørensen', age: 30, position: 'DF', primaryRole: 'center-back' },
    { name: 'Marcos López', age: 26, position: 'DF', primaryRole: 'full-back' },
    { name: 'Birger Meling', age: 31, position: 'DF', primaryRole: 'full-back' },
    { name: 'Rodrigo Huescas', age: 23, position: 'DF', primaryRole: 'full-back' },
    { name: 'William Clem', age: 22, position: 'MF', primaryRole: 'defensive-midfielder' },
    { name: 'Magnus Mattsson', age: 27, position: 'MF', primaryRole: 'attacking-midfielder' },
    { name: 'Mads Emil Madsen', age: 27, position: 'MF', primaryRole: 'central-midfielder' },
    { name: 'Alex Král', age: 28, position: 'MF', primaryRole: 'defensive-midfielder' },
    { name: 'Thomas Delaney', age: 35, position: 'MF', primaryRole: 'defensive-midfielder' },
    { name: 'Mohamed Elyounoussi', age: 32, position: 'MF', primaryRole: 'winger' },
    { name: 'Andreas Cornelius', age: 33, position: 'FW', primaryRole: 'striker' },
    { name: 'Maher Carrizo', age: 20, position: 'FW', primaryRole: 'winger' },
    { name: 'Thapelo Maseko', age: 23, position: 'MF', primaryRole: 'winger' },
    { name: 'Geovanni Vianney Ndjee', age: 20, position: 'FW', primaryRole: 'striker' },
    { name: 'Viktor Dadason', age: 22, position: 'FW', primaryRole: 'striker' },
  ],
  broendby: [
    { name: 'Patrick Pentz', age: 29, position: 'GK', primaryRole: 'goalkeeper' },
    { name: 'Mads Hermansen', age: 26, position: 'GK', primaryRole: 'goalkeeper' },
    { name: 'Sebastian Sebulonsen', age: 27, position: 'DF', primaryRole: 'full-back' },
    { name: 'Kevin Mensah', age: 35, position: 'DF', primaryRole: 'full-back' },
    { name: 'Sigurd Rosted', age: 32, position: 'DF', primaryRole: 'center-back' },
    { name: 'Jacob Rasmussen', age: 29, position: 'DF', primaryRole: 'center-back' },
    { name: 'Frederik Alves', age: 27, position: 'DF', primaryRole: 'center-back' },
    { name: 'Daniel Wass', age: 37, position: 'MF', primaryRole: 'central-midfielder' },
    { name: 'Anis Ben Slimane', age: 25, position: 'MF', primaryRole: 'central-midfielder' },
    { name: 'Håkon Evjen', age: 26, position: 'MF', primaryRole: 'winger' },
    { name: 'Mathias Greve', age: 31, position: 'MF', primaryRole: 'central-midfielder' },
    { name: 'Nicolai Vallys', age: 30, position: 'MF', primaryRole: 'attacking-midfielder' },
    { name: 'Yuito Suzuki', age: 24, position: 'MF', primaryRole: 'winger' },
    { name: 'Marko Divković', age: 27, position: 'MF', primaryRole: 'winger' },
    { name: 'Oskar Fallenius', age: 24, position: 'MF', primaryRole: 'winger' },
    { name: 'Mathias Kvistgaarden', age: 24, position: 'FW', primaryRole: 'striker' },
    { name: 'Andreas Maxsø', age: 32, position: 'DF', primaryRole: 'center-back' },
  ],
  midtjylland: [
    { name: 'Elías Ólafsson', age: 26, position: 'GK', primaryRole: 'goalkeeper' },
    { name: 'Nordin Bakker', age: 28, position: 'GK', primaryRole: 'goalkeeper' },
    { name: 'Ousmane Diao', age: 22, position: 'DF', primaryRole: 'center-back' },
    { name: 'Mads Bech Sørensen', age: 27, position: 'DF', primaryRole: 'center-back' },
    { name: 'Martin Erlić', age: 28, position: 'DF', primaryRole: 'center-back' },
    { name: 'Victor Bak', age: 24, position: 'DF', primaryRole: 'full-back' },
    { name: 'Rasmus Nissen Kristensen', age: 29, position: 'DF', primaryRole: 'full-back' },
    { name: 'Béni Junior', age: 25, position: 'DF', primaryRole: 'full-back' },
    { name: 'Denil Castillo', age: 22, position: 'MF', primaryRole: 'defensive-midfielder' },
    { name: 'Philip Billing', age: 30, position: 'MF', primaryRole: 'central-midfielder' },
    { name: 'Pedro Bravo', age: 23, position: 'MF', primaryRole: 'central-midfielder' },
    { name: 'Kjell Wätjen', age: 20, position: 'MF', primaryRole: 'central-midfielder' },
    { name: 'Hyun-seok Hong', age: 27, position: 'MF', primaryRole: 'attacking-midfielder' },
    { name: 'Mikel Gogorza', age: 23, position: 'MF', primaryRole: 'winger' },
    { name: 'David Martínez', age: 20, position: 'MF', primaryRole: 'winger' },
    { name: 'Gue-sung Cho', age: 28, position: 'FW', primaryRole: 'striker' },
    { name: 'Mikael Uhre', age: 31, position: 'FW', primaryRole: 'striker' },
    { name: 'Mileta Rajović', age: 27, position: 'FW', primaryRole: 'striker' },
  ],
};

const TEAM_IDS = LEAGUES.flatMap(league => league.teams.map(team => team.id));
export const TEAM_IDS_WITH_FALLBACK_NAMES = TEAM_IDS.filter(teamId => !(teamId in TEAM_PLAYER_SEEDS));

const clampBase = (value: number) => Math.max(42, Math.min(74, Math.round(value)));

const hashString = (value: string) => {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash || 1;
};

const createDeterministicGenerator = (seed: string) => {
  let state = hashString(seed);

  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
};

const randomInt = (rng: () => number, min: number, max: number) =>
  min + Math.floor(rng() * (max - min + 1));

const normalizePlayerNameValue = (name: unknown): string | null => {
  if (typeof name !== 'string') {
    return null;
  }

  const normalizedName = name.replace(/\s+/g, ' ').trim();
  return normalizedName.length > 0 ? normalizedName : null;
};

const normalizeNameForCompare = (name: string) =>
  (normalizePlayerNameValue(name) ?? '').toLocaleLowerCase('da-DK');

const buildFallbackClubName = (team: Team, slotIndex: number) =>
  `${team.name} Talent ${String(slotIndex + 1).padStart(2, '0')} [fallback]`;

const getTeamSeedPool = (teamId: string): TeamPlayerSeed[] =>
  (TEAM_PLAYER_SEEDS[teamId] ?? []).map(seed => ({ ...seed }));

const pickSeedForSlot = (
  team: Team,
  slot: SquadTemplateSlot,
  slotIndex: number,
  seedPool: TeamPlayerSeed[],
  usedNames: Set<string>
) => {
  const preferredIndex = seedPool.findIndex(candidate =>
    !usedNames.has(normalizeNameForCompare(candidate.name)) &&
    (!candidate.position || candidate.position === slot.position) &&
    (!candidate.primaryRole || candidate.primaryRole === slot.primaryRole)
  );

  const fallbackIndex = preferredIndex >= 0
    ? preferredIndex
    : seedPool.findIndex(candidate => !usedNames.has(normalizeNameForCompare(candidate.name)));

  if (fallbackIndex >= 0) {
    const [seed] = seedPool.splice(fallbackIndex, 1);
    usedNames.add(normalizeNameForCompare(seed.name));
    return seed;
  }

  const fallbackSeed = { name: buildFallbackClubName(team, slotIndex) } as TeamPlayerSeed;
  let dedupeOffset = 0;

  while (usedNames.has(normalizeNameForCompare(fallbackSeed.name))) {
    dedupeOffset += 1;
    fallbackSeed.name = `${buildFallbackClubName(team, slotIndex)}-${dedupeOffset}`;
  }

  usedNames.add(normalizeNameForCompare(fallbackSeed.name));
  return fallbackSeed;
};

const buildTeamSquad = (team: Team): Player[] => {
  const canonicalTeam = getTeamById(team.id) ?? team;
  const rng = createDeterministicGenerator(canonicalTeam.id);
  const usedNames = new Set<string>();
  const baseLevel = clampBase(canonicalTeam.baseRating - 13);
  const seedPool = getTeamSeedPool(canonicalTeam.id);

  return SQUAD_TEMPLATE.map((slot, index) => {
    const selectedSeed = pickSeedForSlot(canonicalTeam, slot, index, seedPool, usedNames);
    const age = selectedSeed.age ?? randomInt(rng, slot.ageRange[0], slot.ageRange[1]);
    const variation = randomInt(rng, -1, 1);
    const base = clampBase(baseLevel + slot.baseOffset + variation);
    const isForSale = index >= SQUAD_TEMPLATE.length - 2 && rng() > 0.55;

    return createPlayer({
      id: `${canonicalTeam.id}-player-${index + 1}`,
      name: selectedSeed.name,
      age,
      position: selectedSeed.position ?? slot.position,
      primaryRole: selectedSeed.primaryRole ?? slot.primaryRole,
      secondaryRoles: selectedSeed.secondaryRoles ?? slot.secondaryRoles ?? [],
      base,
      overrides: slot.overrides,
      isForSale,
    });
  });
};

const transferSeeds: PlayerSeed[] = [
  { id: 'buy1', name: 'Transfermål A', age: 27, position: 'FW', primaryRole: 'winger', secondaryRoles: ['attacking-midfielder'], base: 64, overrides: { wingPlay: 16, dribbling: 15, pace: 14, finishing: 12, attackingPlay: 11 } },
  { id: 'buy2', name: 'Transfermål B', age: 29, position: 'FW', primaryRole: 'striker', base: 66, overrides: { attackingPlay: 16, finishing: 15, heading: 16, pace: 5 } },
  { id: 'buy3', name: 'Transfermål C', age: 26, position: 'MF', primaryRole: 'central-midfielder', secondaryRoles: ['defensive-midfielder'], base: 62, overrides: { midfieldPlay: 14, passing: 12, vision: 11, stamina: 9 } },
  { id: 'buy4', name: 'Transfermål D', age: 24, position: 'DF', primaryRole: 'full-back', secondaryRoles: ['winger'], base: 59, overrides: { pace: 12, wingPlay: 11, defending: 10, dribbling: 8 } },
  { id: 'buy5', name: 'Transfermål E', age: 30, position: 'GK', primaryRole: 'goalkeeper', base: 61, overrides: { goalkeeping: 18, intelligence: 9, passing: 8 } },
];

const FALLBACK_TEAM: Team = {
  id: 'starter-team',
  name: 'Starterholdet',
  logo: '⚽',
  league: 'Prototype',
  baseRating: 68,
};

export const STARTER_PLAYERS = buildTeamSquad(FALLBACK_TEAM);

export const getTeamSquad = (team: Team | null): Player[] => {
  if (!team) {
    return STARTER_PLAYERS;
  }

  return buildTeamSquad(team);
};

export const getTeamSquadRecord = (team: Team | null): Record<string, Player> =>
  getTeamSquad(team).reduce((acc, player) => {
    acc[player.id] = player;
    return acc;
  }, {} as Record<string, Player>);

export const TRANSFER_MARKET_PLAYERS = transferSeeds.map(createPlayer);

export const normalizePlayer = (rawPlayer: LegacyPlayerShape, fallbackId?: string): Player | null => {
  const normalizedName = normalizePlayerNameValue(rawPlayer.name);
  if (!normalizedName || !rawPlayer.position) {
    return null;
  }

  if (rawPlayer.skills && rawPlayer.primaryRole) {
    const skills = normalizeAbsoluteSkills(rawPlayer.skills);
    const normalizedPlayer = {
      id: rawPlayer.id ?? fallbackId ?? normalizedName,
      name: normalizedName,
      age: rawPlayer.age ?? 24,
      position: rawPlayer.position,
      primaryRole: rawPlayer.primaryRole,
      secondaryRoles: rawPlayer.secondaryRoles ?? [],
      skills,
      asi: typeof rawPlayer.asi === 'number' ? rawPlayer.asi : calculateASI(skills),
      value: rawPlayer.value ?? 0,
      salary: estimateWeeklySalary({
        age: rawPlayer.age ?? 24,
        asi: typeof rawPlayer.asi === 'number' ? rawPlayer.asi : calculateASI(skills),
        value: rawPlayer.value ?? 0,
        primaryRole: rawPlayer.primaryRole,
        salary: rawPlayer.salary,
      }),
      isForSale: rawPlayer.isForSale ?? false,
      askingPrice: rawPlayer.askingPrice,
    } as Player;

    return {
      ...normalizedPlayer,
      value: rawPlayer.value ?? estimatePlayerValue(normalizedPlayer),
      salary: estimateWeeklySalary({
        age: normalizedPlayer.age,
        asi: normalizedPlayer.asi,
        value: rawPlayer.value ?? estimatePlayerValue(normalizedPlayer),
        primaryRole: normalizedPlayer.primaryRole,
        salary: rawPlayer.salary,
      }),
    };
  }

  const sourceRating = rawPlayer.rating ?? rawPlayer.asi;
  const base = typeof sourceRating === 'number'
    ? Math.max(40, Math.min(80, Math.round(sourceRating)))
    : 65;
  return createPlayer({
    id: rawPlayer.id ?? fallbackId ?? normalizedName,
    name: normalizedName,
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
