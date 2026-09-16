import { useGame } from '../context/GameContext';

const StadiumView = () => {
  const { gameState, upgradeStadium } = useGame();

  const weeklyRevenue = Math.min(gameState.fanCount, gameState.stadiumCapacity) * 150;
  const capacityUsage = (gameState.fanCount / gameState.stadiumCapacity) * 100;
  const stadiumName = gameState.selectedTeam ? `${gameState.selectedTeam.name} Stadion` : 'Dit Stadion';

  return (
    <div className="p-3 md:p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">Stadion Management</h1>

      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-orange-500 rounded-lg p-6 mb-6">
        <h2 className="text-2xl font-bold mb-4">{stadiumName}</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-600">Kapacitet</p>
            <p className="text-2xl font-bold text-orange-600">{gameState.stadiumCapacity.toLocaleString('da-DK')}</p>
            <p className="text-xs text-gray-500 mt-1">pladser</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Nuværende fans</p>
            <p className="text-2xl font-bold text-blue-600">{gameState.fanCount.toLocaleString('da-DK')}</p>
            <p className="text-xs text-gray-500 mt-1">{capacityUsage.toFixed(1)}% af kapaciteten</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Ugentlig billetindtægt</p>
            <p className="text-2xl font-bold text-green-600">{weeklyRevenue.toLocaleString('da-DK')} kr</p>
            <p className="text-xs text-gray-500 mt-1">fra billetsalg</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Fan mood</p>
            <p className="text-2xl font-bold text-purple-600">{gameState.fanMood}/100</p>
            <p className="text-xs text-gray-500 mt-1">tilfredshed</p>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-sm font-semibold text-gray-700 mb-2">Kapacitetsudnyttelse</p>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full transition-all ${
                capacityUsage > 90 ? 'bg-green-500' : capacityUsage > 70 ? 'bg-yellow-500' : 'bg-blue-500'
              }`}
              style={{ width: `${Math.min(capacityUsage, 100)}%` }}
            />
          </div>
        </div>

        <div className="mt-4">
          <p className="text-sm font-semibold text-gray-700 mb-2">Fan mood</p>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full transition-all ${
                gameState.fanMood > 75 ? 'bg-green-500' : gameState.fanMood > 50 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${gameState.fanMood}%` }}
            />
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-2xl font-bold mb-4">Stadionudvidelse</h2>

        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4 rounded">
          <p className="text-sm text-gray-700 mb-2">
            Udvid stadion for at øge billetindtægterne. Hver udvidelse koster <span className="font-bold">500.000 kr</span>
            {' '}og tilføjer <span className="font-bold">2.500 pladser</span>.
          </p>
          <p className="text-xs text-gray-600">Du har gennemført {gameState.stadiumUpgrades} udvidelser hidtil.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <p className="text-sm text-gray-600">Omkostning</p>
            <p className="text-xl font-bold text-red-600">500.000 kr</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Nye pladser</p>
            <p className="text-xl font-bold text-green-600">+2.500</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Ekstra billetloft</p>
            <p className="text-xl font-bold text-blue-600">+375.000 kr/uge</p>
          </div>
        </div>

        <button
          onClick={upgradeStadium}
          disabled={gameState.budget < 500000}
          className={`w-full font-bold py-3 px-4 rounded transition text-white ${
            gameState.budget >= 500000 ? 'bg-blue-600 hover:bg-blue-700 cursor-pointer' : 'bg-gray-400 cursor-not-allowed'
          }`}
        >
          {gameState.budget >= 500000
            ? '🏗️ Udvid stadion (500.000 kr)'
            : `❌ Ikke råd - Du mangler ${(500000 - gameState.budget).toLocaleString('da-DK')} kr`}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-xl font-bold mb-4">🏋️ Træningsanlæg</h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Facilitetsstandard</p>
              <div className="flex gap-1 mt-1">
                {[1, 2, 3, 4, 5].map(level => (
                  <div key={level} className={`w-6 h-6 rounded ${level <= 4 ? 'bg-blue-500' : 'bg-gray-300'}`} />
                ))}
              </div>
            </div>
            <p className="text-sm text-gray-700">Påvirker spillernes udvikling og rating.</p>
            <button className="w-full bg-gray-300 text-gray-600 font-bold py-2 px-4 rounded cursor-not-allowed">
              Opgrader anlæg (låst)
            </button>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-xl font-bold mb-4">🏥 Medicinsk afdeling</h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Facilitetsstandard</p>
              <div className="flex gap-1 mt-1">
                {[1, 2, 3, 4, 5].map(level => (
                  <div key={level} className={`w-6 h-6 rounded ${level <= 3 ? 'bg-green-500' : 'bg-gray-300'}`} />
                ))}
              </div>
            </div>
            <p className="text-sm text-gray-700">Reducerer skader og holder spillerne friske.</p>
            <button className="w-full bg-gray-300 text-gray-600 font-bold py-2 px-4 rounded cursor-not-allowed">
              Opgrader anlæg (låst)
            </button>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-l-4 border-purple-500 rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">👥 Fan Engagement</h2>

        <div className="space-y-4">
          <div className="bg-white rounded-lg p-4">
            <h3 className="font-bold mb-2">Kampresultater påvirker fans</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>✓ <span className="font-semibold">Sejr:</span> +50 fans, +8 mood, +100.000 kr bonus</li>
              <li>⚖️ <span className="font-semibold">Uafgjort:</span> +10 fans, +2 mood, +25.000 kr bonus</li>
              <li>✗ <span className="font-semibold">Nederlag:</span> -20 fans, -7 mood, -30.000 kr bonus</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg p-4">
            <h3 className="font-bold mb-2">Fan mood påvirker performance</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>📈 <span className="font-semibold">Høj mood (75+):</span> Holdet får et lille løft</li>
              <li>📊 <span className="font-semibold">Neutral mood (50-75):</span> Normal performance</li>
              <li>📉 <span className="font-semibold">Lav mood (&lt;50):</span> Holdet mister skarphed</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg p-4">
            <h3 className="font-bold mb-2">Tips til fanfastholdelse</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>🏆 Vind kampe regelmæssigt</li>
              <li>💰 Byg et stærkere hold uden at sprænge budgettet</li>
              <li>🤝 Køb spillere, der hæver holdets rating</li>
              <li>🎉 Opgrader stadion, når efterspørgslen vokser</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StadiumView;
