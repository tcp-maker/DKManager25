export type PlayerPosition = 'GK' | 'DF' | 'MF' | 'FW';

export const PLAYER_ABILITY_LABELS = {
  reflexer: 'Reflekser',
  tackling: 'Tackling',
  pasninger: 'Pasninger',
  afslutning: 'Afslutning',
  teknik: 'Teknik',
  fysik: 'Fysik',
} as const;

export type PlayerAbilityKey = keyof typeof PLAYER_ABILITY_LABELS;

export type PlayerAbilities = Record<PlayerAbilityKey, number>;

export interface Player {
  id: string;
  name: string;
  age: number;
  position: PlayerPosition;
  rating: number;
  value: number;
  isForSale: boolean;
  askingPrice?: number;
  abilities?: Partial<PlayerAbilities>;
}

const BASE_ABILITIES_BY_POSITION: Record<PlayerPosition, PlayerAbilities> = {
  GK: {
    reflexer: 78,
    tackling: 38,
    pasninger: 58,
    afslutning: 28,
    teknik: 62,
    fysik: 68,
  },
  DF: {
    reflexer: 35,
    tackling: 78,
    pasninger: 62,
    afslutning: 42,
    teknik: 60,
    fysik: 74,
  },
  MF: {
    reflexer: 32,
    tackling: 60,
    pasninger: 80,
    afslutning: 65,
    teknik: 78,
    fysik: 68,
  },
  FW: {
    reflexer: 30,
    tackling: 45,
    pasninger: 68,
    afslutning: 82,
    teknik: 76,
    fysik: 72,
  },
};

const clampAbility = (value: number) => Math.max(25, Math.min(99, Math.round(value)));

export const getPlayerAbilities = ({
  position,
  rating,
  abilities,
}: Pick<Player, 'position' | 'rating' | 'abilities'>): PlayerAbilities => {
  const base = BASE_ABILITIES_BY_POSITION[position];
  const ratingModifier = (rating - 70) * 1.8;

  const generated = Object.entries(base).reduce((acc, [key, value]) => {
    acc[key as PlayerAbilityKey] = clampAbility(value + ratingModifier);
    return acc;
  }, {} as PlayerAbilities);

  return {
    ...generated,
    ...abilities,
  };
};

export const normalizePlayer = (player: Player): Player => ({
  ...player,
  abilities: getPlayerAbilities(player),
});
