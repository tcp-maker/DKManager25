import React from 'react';
import { LEAGUES } from '../data/leagues';
import { Team } from '../types/teams';
import TeamBadge from './TeamBadge';

interface SelectTeamViewProps {
  onSelectTeam: (team: Team) => void;
}

const SelectTeamView: React.FC<SelectTeamViewProps> = ({ onSelectTeam }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-blue-600 mb-2">DKManager25</h1>
          <p className="text-xl text-gray-600 mb-4">Dansk Fodbold Management Spil</p>
          <p className="text-gray-500">Vælg din klub i Superliga, 1. division, 2. division eller 3. division</p>
          <div className="mt-6 grid gap-3 text-left sm:grid-cols-3">
            <div className="rounded-xl bg-white/80 p-4 shadow-sm">
              <p className="text-sm font-semibold text-blue-700">1. Vælg en klub</p>
              <p className="mt-1 text-sm text-gray-600">Din valgte klub fra Superliga, 1. division, 2. division eller 3. division bliver udgangspunktet for resten af spillet.</p>
            </div>
            <div className="rounded-xl bg-white/80 p-4 shadow-sm">
              <p className="text-sm font-semibold text-blue-700">2. Få overblik</p>
              <p className="mt-1 text-sm text-gray-600">Efter valg kan du straks se uge, budget, fans, mood og stadionkapacitet.</p>
            </div>
            <div className="rounded-xl bg-white/80 p-4 shadow-sm">
              <p className="text-sm font-semibold text-blue-700">3. Tag første beslutning</p>
              <p className="mt-1 text-sm text-gray-600">Start med truppen eller markedet, og gør holdet klar til næste uge.</p>
            </div>
          </div>
        </div>

        {/* Leagues */}
        <div className="space-y-8">
          {LEAGUES.map((league) => (
            <div key={league.name}>
              {/* League Header */}
              <div className={`bg-gradient-to-r ${league.color} rounded-lg px-6 py-4 mb-4`}>
                <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                  <h2 className="text-2xl font-bold text-white">{league.name}</h2>
                  <p className="text-sm text-white/85">{league.teams.length} klubber</p>
                </div>
              </div>

              {/* Team Cards Grid */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {league.teams.map((team) => (
                  <button
                    key={team.id}
                    onClick={() => onSelectTeam(team as Team)}
                    className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all p-5 text-center card-hover border-2 border-transparent hover:border-blue-500"
                    aria-label={`Vælg ${team.name}`}
                  >
                    <TeamBadge team={team} size="xl" className="mb-3" />
                    <h3 className="font-bold text-lg text-gray-900 mb-1">{team.name}</h3>
                    <p className="text-sm text-gray-600 mb-1">{team.league}</p>
                    <p className="text-xs text-gray-500 mb-4">Prototype-rating {team.baseRating}</p>
                    <div className="bg-blue-100 text-blue-700 font-semibold py-2 px-4 rounded hover:bg-blue-200 transition w-full">
                      Vælg Klub
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Info Box */}
        <div className="mt-12 bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
          <h3 className="text-lg font-bold mb-3">💡 Sådan Starter Du</h3>
          <ul className="text-gray-700 space-y-2">
            <li>✓ Vælg din klub fra Superliga, 1. division, 2. division eller 3. division</li>
            <li>✓ Du starter med 1.000.000 kr i budget</li>
            <li>✓ Hver klub starter med en separat, deterministisk trup på 18 spillere</li>
            <li>✓ Brug topbaren efter klubvalg til hurtigt at følge med i uge, fans og økonomi</li>
            <li>✓ Administrer transfers, kampe og stadion for at blive Danmarks bedste manager!</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SelectTeamView;
