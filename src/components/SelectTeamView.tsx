import React from 'react';
import { Team } from '../types/teams';

interface SelectTeamViewProps {
  onSelectTeam: (team: Team) => void;
}

const SelectTeamView: React.FC<SelectTeamViewProps> = ({ onSelectTeam }) => {
  const leagues = [
    {
      name: 'Superligaen',
      color: 'from-blue-500 to-blue-600',
      teams: [
        { id: 'fckoebenhavn', name: 'FC København', logo: '🔵' },
        { id: 'broendby', name: 'Brøndby IF', logo: '🟡' },
        { id: 'midtjylland', name: 'FC Midtjylland', logo: '🔴' },
        { id: 'aalborg', name: 'AaB Aalborg', logo: '⚫' },
      ]
    },
    {
      name: '1. Division',
      color: 'from-orange-500 to-orange-600',
      teams: [
        { id: 'silkeborg', name: 'Silkeborg IF', logo: '🔶' },
        { id: 'randers', name: 'Randers FC', logo: '🟠' },
        { id: 'ob', name: 'OB Odense', logo: '🔵' },
        { id: 'lolland', name: 'Lolland-Falster Alliancen', logo: '🟣' },
      ]
    },
    {
      name: 'Nordsjaelland Serien',
      color: 'from-green-500 to-green-600',
      teams: [
        { id: 'frem', name: 'BK FREM', logo: '🟢' },
        { id: 'nordsjælland', name: 'Nordsjælland FC', logo: '⚪' },
        { id: 'fredriksberg', name: 'Fredriksberg IF', logo: '🔴' },
        { id: 'ballerup', name: 'Ballerup IF', logo: '🟡' },
      ]
    },
    {
      name: 'Regionsmesterskaberne',
      color: 'from-purple-500 to-purple-600',
      teams: [
        { id: 'kastrup', name: 'Kastrup BK', logo: '🟣' },
        { id: 'glostrup', name: 'Glostrup FK', logo: '⚪' },
        { id: 'tårnby', name: 'Tårnby FF', logo: '🟠' },
        { id: 'virum', name: 'Virum-Skovlunde IF', logo: '🔵' },
      ]
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-blue-600 mb-2">DKManager25</h1>
          <p className="text-xl text-gray-600 mb-4">Dansk Fodbold Management Spil</p>
          <p className="text-gray-500">Vælg din klub og begynd dit eventyr som manager</p>
          <p className="text-sm text-blue-700 mt-3 font-medium">Trin 1 af 3: Vælg klub · Trin 2: Tilpas trup · Trin 3: Spil kamp</p>
        </div>

        {/* Leagues */}
        <div className="space-y-8">
          {leagues.map((league) => (
            <div key={league.name}>
              {/* League Header */}
              <div className={`bg-gradient-to-r ${league.color} rounded-lg px-6 py-4 mb-4`}>
                <h2 className="text-2xl font-bold text-white">{league.name}</h2>
              </div>

              {/* Team Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {league.teams.map((team) => (
                  <button
                    key={team.id}
                    onClick={() => onSelectTeam(team as Team)}
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
            <li>✓ Når klubben er valgt, ser du altid uge, budget, fans og fan mood i topstatus</li>
            <li>✓ Administrer transfers, kampe og stadion for at blive Danmarks bedste manager!</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SelectTeamView;
