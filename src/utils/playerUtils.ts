import { ATTRIBUTE_KEYS, Player, PlayerAttributes, PlayerPosition, SeedPlayer } from '../types/players';

const POSITION_ATTRIBUTE_DEFAULTS: Record<PlayerPosition, PlayerAttributes> = {
  GK: { pace: 35, shooting: 22, passing: 46, defending: 24, dribbling: 34, physical: 62, goalkeeping: 78 },
  DF: { pace: 63, shooting: 34, passing: 57, defending: 76, dribbling: 52, physical: 74, goalkeeping: 12 },
  MF: { pace: 68, shooting: 61, passing: 74, defending: 57, dribbling: 71, physical: 66, goalkeeping: 10 },
  FW: { pace: 77, shooting: 76, passing: 62, defending: 33, dribbling: 74, physical: 69, goalkeeping: 8 },
};

const POSITION_RATING_WEIGHTS: Record<PlayerPosition, PlayerAttributes> = {
  GK: { pace: 0.03, shooting: 0.02, passing: 0.08, defending: 0.07, dribbling: 0.05, physical: 0.1, goalkeeping: 0.65 },
  DF: { pace: 0.14, shooting: 0.06, passing: 0.14, defending: 0.38, dribbling: 0.08, physical: 0.18, goalkeeping: 0.02 },
  MF: { pace: 0.14, shooting: 0.15, passing: 0.26, defending: 0.11, dribbling: 0.2, physical: 0.12, goalkeeping: 0.02 },
  FW: { pace: 0.22, shooting: 0.3, passing: 0.14, defending: 0.05, dribbling: 0.18, physical: 0.09, goalkeeping: 0.02 },
};

export const clampAttributeValue = (value: number): number => {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(100, Math.max(0, Math.round(value)));
};

export const normalizePlayerAttributes = (
  attributes: Partial<PlayerAttributes> | undefined,
  position: PlayerPosition,
): PlayerAttributes => {
  const defaults = POSITION_ATTRIBUTE_DEFAULTS[position];

  return ATTRIBUTE_KEYS.reduce<PlayerAttributes>((normalized, key) => {
    normalized[key] = clampAttributeValue(attributes?.[key] ?? defaults[key]);
    return normalized;
  }, { ...defaults });
};

export const derivePlayerRating = (attributes: PlayerAttributes, position: PlayerPosition): number => {
  const weights = POSITION_RATING_WEIGHTS[position];
  const total = ATTRIBUTE_KEYS.reduce((sum, key) => sum + attributes[key] * weights[key], 0);
  return clampAttributeValue(total);
};

export const normalizePlayer = (
  player: Partial<Player> & Pick<Player, 'id' | 'name' | 'age' | 'position' | 'value'>,
  fallbackTeamId: string,
): Player => {
  const position = player.position;
  const attributes = normalizePlayerAttributes(player.attributes, position);
  return {
    id: player.id,
    teamId: player.teamId ?? fallbackTeamId,
    name: player.name,
    age: Math.max(16, Math.round(player.age)),
    position,
    rating: clampAttributeValue(player.rating ?? derivePlayerRating(attributes, position)),
    value: Math.max(0, Math.round(player.value)),
    attributes,
    isForSale: Boolean(player.isForSale),
    askingPrice: player.askingPrice !== undefined ? Math.max(0, Math.round(player.askingPrice)) : undefined,
  };
};

export const hydrateSeedPlayer = (seedPlayer: SeedPlayer): Player => {
  const attributes = normalizePlayerAttributes(seedPlayer.attributes, seedPlayer.position);
  return {
    ...seedPlayer,
    rating: derivePlayerRating(attributes, seedPlayer.position),
    attributes,
    isForSale: false,
    askingPrice: undefined,
  };
};
