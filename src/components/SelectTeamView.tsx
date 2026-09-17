import React from 'react';
import { leagues } from '../data/gameData';
import { Team } from '../types/teams';

interface SelectTeamViewProps {
  onSelectTeam: (team: Team) => void;
}

const SelectTeamView: React.FC<SelectTeamViewProps> = ({ onSelectTeam }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-blue-600 mb-2">DKManager25</h1>
          <p className="text-xl text-gray-600 mb-4">Dansk Fodbold Management Spil</p>
          <p className="text-gray-500">Vælg din klub blandt 48 danske hold fordelt på fire divisioner</p>
        </div>

        <div className="space-y-8">
          {leagues.map((league) => (
            <div key={league.id}>
              <div className={`bg-gradient-to-r ${league.color} rounded-lg px-6 py-4 mb-4`}>
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <h2 className="text-2xl font-bold text-white">{league.name}</h2>
                  <p className="text-white/90 font-medium">12 hold • hjemme/ude sæson på 22 kampe</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {league.teams.map((team) => (
                  <button
                    key={team.id}
                    onClick={() => onSelectTeam(team)}
                    className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all p-6 text-left border-2 border-transparent hover:border-blue-500"
                  >
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div>
                        <div className="text-4xl mb-2">{team.logo}</div>
                        <h3 className="font-bold text-lg text-gray-900">{team.name}</h3>
                      </div>
                      <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded">
                        OVR {team.baseRating}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{team.players.length} spillere i truppen</p>
                    <p className="text-sm text-gray-500 mb-4">Klik for at starte som manager</p>
                    <div className="bg-blue-100 text-blue-700 font-semibold py-2 px-4 rounded hover:bg-blue-200 transition text-center">
                      Vælg Klub
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
          <h3 className="text-lg font-bold mb-3">💡 Nyt Setup</h3>
          <ul className="text-gray-700 space-y-2">
            <li>✓ Superliga, 1. division, 2. division og 3. division er sat op med 12 hold i hver række</li>
            <li>✓ Hver klub har en fuld trup med kvantificerede spillerstyrker</li>
            <li>✓ En sæson består af 22 ligakampe: én hjemme- og én udekamp mod hver modstander</li>
            <li>✓ Transfermarkedet trækker nu spillere fra de øvrige klubtrupper</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SelectTeamView;
