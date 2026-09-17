import React from 'react';
import { LEAGUES } from '../data/leagues';
import { Team } from '../types/teams';

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
          <p className="text-gray-500">Vælg din klub og begin dit eventyr som manager</p>
        </div>

        {/* Leagues */}
        <div className="space-y-8">
          {LEAGUES.map((league) => (
            <div key={league.id}>
              {/* League Header */}
              <div className={`bg-gradient-to-r ${league.color} rounded-lg px-6 py-4 mb-4`}>
                <h2 className="text-2xl font-bold text-white">{league.name}</h2>
              </div>

              {/* Team Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {league.teams.map((team) => (
                  <button
                    key={team.id}
                    onClick={() => onSelectTeam(team)}
                    className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all p-6 text-center card-hover border-2 border-transparent hover:border-blue-500"
                  >
                    <div className="text-5xl mb-3">{team.logo}</div>
                    <h3 className="font-bold text-lg text-gray-900 mb-2">{team.name}</h3>
                    <p className="text-sm text-gray-600 mb-4">Klik for at vælge</p>
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
            <li>✓ Vælg din klub fra en af de fire danske ligaer</li>
            <li>✓ Du starter med 1.000.000 kr i budget</li>
            <li>✓ Din trup har 13 spillere klar til at spille</li>
            <li>✓ Administrer transfers, kampe, ligatabel og stadion for at blive Danmarks bedste manager!</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SelectTeamView;
