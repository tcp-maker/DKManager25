import React from 'react';
import { PlayerAttributes } from '../types/players';

const ATTRIBUTE_LABELS: Array<{ key: keyof PlayerAttributes; label: string }> = [
  { key: 'pace', label: 'Fart' },
  { key: 'shooting', label: 'Afslutning' },
  { key: 'passing', label: 'Aflevering' },
  { key: 'defending', label: 'Forsvar' },
  { key: 'dribbling', label: 'Dribling' },
  { key: 'physical', label: 'Fysik' },
  { key: 'goalkeeping', label: 'Målmand' },
];

interface PlayerAttributesGridProps {
  attributes: PlayerAttributes;
}

const PlayerAttributesGrid: React.FC<PlayerAttributesGridProps> = ({ attributes }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
    {ATTRIBUTE_LABELS.map(({ key, label }) => (
      <div key={key} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          <span className="text-sm font-bold text-gray-900">{attributes[key]}/100</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full ${attributes[key] >= 80 ? 'bg-green-500' : attributes[key] >= 65 ? 'bg-blue-500' : attributes[key] >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
            style={{ width: `${attributes[key]}%` }}
          />
        </div>
      </div>
    ))}
  </div>
);

export default PlayerAttributesGrid;
