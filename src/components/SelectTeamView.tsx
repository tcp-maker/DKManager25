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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 px-4 py-6 sm:py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-10 text-center sm:mb-12">
          <h1 className="mb-2 text-4xl font-bold text-blue-600 sm:text-5xl">DKManager25</h1>
          <p className="mb-4 text-lg text-gray-600 sm:text-xl">Dansk Fodbold Management Spil</p>
          <p className="mx-auto max-w-2xl text-sm text-gray-500 sm:text-base">Vælg din klub og begynd dit eventyr som manager.</p>
        </div>

        {/* Leagues */}
        <div className="space-y-6 sm:space-y-8">
          {leagues.map((league) => (
            <div key={league.name}>
              {/* League Header */}
              <div className={`mb-4 rounded-lg bg-gradient-to-r px-4 py-3 sm:px-6 sm:py-4 ${league.color}`}>
                <h2 className="text-xl font-bold text-white sm:text-2xl">{league.name}</h2>
              </div>

              {/* Team Cards Grid */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {league.teams.map((team) => (
                  <button
                    key={team.id}
                    onClick={() => onSelectTeam(team as Team)}
                    className="card-hover rounded-lg border-2 border-transparent bg-white p-5 text-center shadow-md transition-all hover:border-blue-500 hover:shadow-lg sm:p-6"
                  >
                    <div className="text-5xl mb-3">{team.logo}</div>
                    <h3 className="font-bold text-lg text-gray-900 mb-2">{team.name}</h3>
                    <p className="text-sm text-gray-600 mb-4">Klik for at vælge</p>
                    <div className="w-full rounded bg-blue-100 px-4 py-2 font-semibold text-blue-700 transition hover:bg-blue-200">
                      Vælg Klub
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Info Box */}
        <div className="mt-10 rounded-lg border-l-4 border-blue-500 bg-white p-5 shadow-md sm:mt-12 sm:p-6">
          <h3 className="text-lg font-bold mb-3">💡 Sådan Starter Du</h3>
          <ul className="text-gray-700 space-y-2">
            <li>✓ Vælg din klub fra en af de fire danske ligaer</li>
            <li>✓ Du starter med 1.000.000 kr i budget</li>
            <li>✓ Din trup har 13 spillere klar til at spille</li>
            <li>✓ Administrer transfers, kampe og stadion for at blive Danmarks bedste manager!</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SelectTeamView;
