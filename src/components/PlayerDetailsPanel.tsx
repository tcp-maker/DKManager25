import React from 'react';
import { getPlayerAreaStrengths, getTopAndBottomSkills, ROLE_LABELS, SKILL_KEYS, SKILL_LABELS } from '../data/players';
import { Player } from '../types/player';

interface PlayerDetailsPanelProps {
  player: Player;
  title?: string;
  onClose?: () => void;
}

const PlayerDetailsPanel: React.FC<PlayerDetailsPanelProps> = ({ player, title = 'Spillerdetaljer', onClose }) => {
  const { strengths, weaknesses } = getTopAndBottomSkills(player);
  const areas = getPlayerAreaStrengths(player);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">{title}</p>
          <h3 className="text-2xl font-bold text-gray-900">{player.name}</h3>
          <p className="text-sm text-gray-600">
            {ROLE_LABELS[player.primaryRole]} • {player.age} år
          </p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label={`Luk spillerdetaljer for ${player.name}`}
            className="rounded bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200"
          >
            Luk
          </button>
        )}
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="rounded-lg bg-blue-50 p-3">
          <p className="text-xs text-gray-600">ASI</p>
          <p className="text-2xl font-bold text-blue-700">{player.asi}</p>
        </div>
        <div className="rounded-lg bg-sky-50 p-3">
          <p className="text-xs text-gray-600">Målmand</p>
          <p className="text-2xl font-bold text-sky-700">{areas.goalkeeping}</p>
        </div>
        <div className="rounded-lg bg-green-50 p-3">
          <p className="text-xs text-gray-600">Forsvar</p>
          <p className="text-2xl font-bold text-green-700">{areas.defense}</p>
        </div>
        <div className="rounded-lg bg-purple-50 p-3">
          <p className="text-xs text-gray-600">Midtbane</p>
          <p className="text-2xl font-bold text-purple-700">{areas.midfield}</p>
        </div>
        <div className="rounded-lg bg-orange-50 p-3">
          <p className="text-xs text-gray-600">Angreb</p>
          <p className="text-2xl font-bold text-orange-700">{areas.attack}</p>
        </div>
      </div>

      <div className="mb-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-green-100 bg-green-50 p-4">
          <p className="mb-2 font-semibold text-green-800">Styrker</p>
          <ul className="space-y-1 text-sm text-green-900">
            {strengths.map(skill => (
              <li key={skill.key} className="flex justify-between">
                <span>{skill.label}</span>
                <span className="font-bold">{skill.value}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg border border-amber-100 bg-amber-50 p-4">
          <p className="mb-2 font-semibold text-amber-800">Svagheder</p>
          <ul className="space-y-1 text-sm text-amber-900">
            {weaknesses.map(skill => (
              <li key={skill.key} className="flex justify-between">
                <span>{skill.label}</span>
                <span className="font-bold">{skill.value}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mb-5 rounded-lg border border-gray-100 bg-gray-50 p-4">
        <p className="mb-2 font-semibold text-gray-800">Roller</p>
        <p className="text-sm text-gray-700">
          Primær rolle: <span className="font-semibold">{ROLE_LABELS[player.primaryRole]}</span>
        </p>
        {player.secondaryRoles.length > 0 && (
          <p className="mt-1 text-sm text-gray-700">
            Sekundære roller:{' '}
            <span className="font-semibold">
              {player.secondaryRoles.map(role => ROLE_LABELS[role]).join(', ')}
            </span>
          </p>
        )}
      </div>

      <div>
        <p className="mb-3 font-semibold text-gray-800">Specifikke evner</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {SKILL_KEYS.map(skill => (
            <div key={skill} className="rounded border border-gray-100 px-3 py-2">
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="text-gray-700">{SKILL_LABELS[skill]}</span>
                <span className="font-bold text-gray-900">{player.skills[skill]}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full bg-blue-600"
                  style={{ width: `${Math.min(player.skills[skill], 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PlayerDetailsPanel;
