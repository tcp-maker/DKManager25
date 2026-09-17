import React from 'react';
import { Player, PLAYER_ABILITY_LABELS, getPlayerAbilities } from '../types/players';

interface PlayerAbilitiesProps {
  player: Player;
  compact?: boolean;
}

const PlayerAbilities: React.FC<PlayerAbilitiesProps> = ({ player, compact = false }) => {
  const abilities = getPlayerAbilities(player);
  const entries = Object.entries(PLAYER_ABILITY_LABELS).map(([key, label]) => ({
    key,
    label,
    value: abilities[key as keyof typeof abilities],
  }));
  const visibleEntries = compact
    ? [...entries].sort((a, b) => b.value - a.value).slice(0, 3)
    : entries;

  return (
    <div className={`grid ${compact ? 'grid-cols-1 gap-1' : 'grid-cols-2 gap-2'} mt-3`}>
      {visibleEntries.map((ability) => (
        <div key={ability.key} className="bg-gray-50 rounded px-2 py-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-gray-600">{ability.label}</span>
            <span className="text-xs font-bold text-gray-900">{ability.value}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PlayerAbilities;
