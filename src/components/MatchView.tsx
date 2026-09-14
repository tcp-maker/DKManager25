import React, { useState } from 'react';
import { useGame } from '../context/GameContext';

interface Match {
  id: string;
  opponent: string;
  isHome: boolean;
  difficulty: 'Nem' | 'Moderat' | 'Svær';
  opponentRating: number;
}

interface PlayedMatch {
  id: string;
  opponent: string;
  result: 'WIN' | 'DRAW' | 'LOSS';
  homeGoals: number;
  awayGoals: number;
  date: number;
}

interface MatchViewProps {
  onNotify?: (message: string, tone?: 'info' | 'success' | 'warning') => void;
}

const MatchView: React.FC<MatchViewProps> = ({ onNotify }) => {
  const { gameState, handleNextWeek } = useGame();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming');
  const [playedMatches, setPlayedMatches] = useState<PlayedMatch[]>([]);
  const [currentMatch, setCurrentMatch] = useState<Match | null>(null);
  const [matchResult, setMatchResult] = useState<PlayedMatch | null>(null);
  const [isMatchPlaying, setIsMatchPlaying] = useState(false);

  // Dummy modstandere
  const opponents = [
    { name: 'FC København', baseRating: 82 },
    { name: 'Brøndby IF', baseRating: 79 },
    { name: 'AaB Aalborg', baseRating: 76 },
    { name: 'Silkeborg IF', baseRating: 74 },
    { name: 'Randers FC', baseRating: 75 },
    { name: 'Midtjylland', baseRating: 78 },
    { name: 'OB Odense', baseRating: 73 },
    { name: 'Nordsjælland', baseRating: 77 },
  ];

  // Generate upcoming matches
  const generateUpcomingMatches = (): Match[] => {
    const matches: Match[] = [];
    for (let i = 0; i < 3; i++) {
      const opponent = opponents[Math.floor(Math.random() * opponents.length)];
      const isHome = Math.random() > 0.5;
      matches.push({
        id: `match_${gameState.week}_${i}`,
        opponent: opponent.name,
        isHome,
        difficulty: opponent.baseRating > 80 ? 'Svær' : opponent.baseRating > 75 ? 'Moderat' : 'Nem',
        opponentRating: opponent.baseRating + Math.random() * 5 - 2.5,
      });
    }
    return matches;
  };

  // Calculate team rating (average of all players)
  const getTeamRating = (): number => {
    const players = Object.values(gameState.players);
    if (players.length === 0) return 70;
    const totalRating = players.reduce((sum, p) => sum + p.rating, 0);
    return totalRating / players.length;
  };

  // Simulate match
  const simulateMatch = (match: Match) => {
    setIsMatchPlaying(true);
    setCurrentMatch(match);

    // Simulate match delay
    setTimeout(() => {
      const homeRating = match.isHome ? getTeamRating() : match.opponentRating;
      const awayRating = match.isHome ? match.opponentRating : getTeamRating();

      const diff = homeRating - awayRating;
      const winProb = 0.4 + diff / 200;
      const drawProb = 0.25;

      const roll = Math.random();
      let result: 'WIN' | 'DRAW' | 'LOSS';
      let homeGoals: number;
      let awayGoals: number;

      if (roll < winProb) {
        result = match.isHome ? 'WIN' : 'LOSS';
        homeGoals = Math.floor(Math.random() * 3) + 1;
        awayGoals = Math.floor(Math.random() * homeGoals);
      } else if (roll < winProb + drawProb) {
        result = 'DRAW';
        homeGoals = Math.floor(Math.random() * 2) + 1;
        awayGoals = homeGoals;
      } else {
        result = match.isHome ? 'LOSS' : 'WIN';
        awayGoals = Math.floor(Math.random() * 3) + 1;
        homeGoals = Math.floor(Math.random() * awayGoals);
      }

      const played: PlayedMatch = {
        id: match.id,
        opponent: match.opponent,
        result: match.isHome ? result : result === 'WIN' ? 'LOSS' : result === 'LOSS' ? 'WIN' : 'DRAW',
        homeGoals: match.isHome ? homeGoals : awayGoals,
        awayGoals: match.isHome ? awayGoals : homeGoals,
        date: gameState.week,
      };

      setMatchResult(played);
      setPlayedMatches(prev => [played, ...prev].slice(0, 5)); // Keep last 5 matches
      setIsMatchPlaying(false);

      // Award fans and budget for wins
      if (played.result === 'WIN') {
        // Note: In a real app, you'd call updateGameState here
        // For now, we just display the result
      }
    }, 2000);
  };

  const upcomingMatches = generateUpcomingMatches();
  const teamRating = getTeamRating();

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Kampe</h1>

      {/* Match Info */}
      <div className="bg-purple-50 border-l-4 border-purple-500 p-4 mb-6 rounded">
        <p className="text-lg font-semibold">Din Trup Rating: <span className="text-purple-600">{teamRating.toFixed(1)}</span></p>
        <p className="text-sm text-gray-600">Uge {gameState.week}</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 mb-6 border-b">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`px-4 py-2 font-semibold border-b-2 ${
            activeTab === 'upcoming'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Kommende Kampe
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 font-semibold border-b-2 ${
            activeTab === 'history'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Kamp Historie ({playedMatches.length})
        </button>
      </div>

      {/* Upcoming Matches Tab */}
      {activeTab === 'upcoming' && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Kommende Kampe</h2>

          {/* Match Simulator */}
          {matchResult && !isMatchPlaying && (
            <div className="bg-white border-2 border-green-500 rounded-lg p-6 mb-6">
              <h3 className="text-2xl font-bold mb-4">Kamp Resultat</h3>
              <div className="flex justify-between items-center mb-4">
                <div className="text-center flex-1">
                  <p className="text-sm text-gray-600">{matchResult.opponent}</p>
                  <p className="text-4xl font-bold text-blue-600">{matchResult.awayGoals}</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">-</p>
                </div>
                <div className="text-center flex-1">
                  <p className="text-sm text-gray-600">Dit Hold</p>
                  <p className="text-4xl font-bold text-green-600">{matchResult.homeGoals}</p>
                </div>
              </div>

              <div className="text-center mb-4">
                {matchResult.result === 'WIN' && (
                  <span className="bg-green-100 text-green-800 text-lg font-bold px-4 py-2 rounded">
                    🏆 SEJR! +50 fans, +100.000 kr
                  </span>
                )}
                {matchResult.result === 'DRAW' && (
                  <span className="bg-yellow-100 text-yellow-800 text-lg font-bold px-4 py-2 rounded">
                    ⚖️ UAFGJORT +10 fans
                  </span>
                )}
                {matchResult.result === 'LOSS' && (
                  <span className="bg-red-100 text-red-800 text-lg font-bold px-4 py-2 rounded">
                    ❌ NEDERLAG -20 fans
                  </span>
                )}
              </div>

              <button
                onClick={() => {
                  setMatchResult(null);
                  const ticketRevenue = Math.min(gameState.fanCount, gameState.stadiumCapacity) * 150;
                  handleNextWeek();
                  onNotify?.(
                    `Uge ${gameState.week + 1} er startet. Billetindtægt: +${ticketRevenue.toLocaleString('da-DK')} kr.`,
                    'info'
                  );
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition"
              >
                Gå til næste uge
              </button>
            </div>
          )}

          {/* Playing match animation */}
          {isMatchPlaying && currentMatch && (
            <div className="bg-gradient-to-b from-green-100 to-green-50 rounded-lg p-6 mb-6 text-center">
              <h3 className="text-2xl font-bold mb-4">⚽ Kamp i gang...</h3>
              <div className="flex justify-between items-center mb-4 animate-pulse">
                <p className="text-lg font-semibold">{currentMatch.opponent}</p>
                <p className="text-2xl font-bold">vs</p>
                <p className="text-lg font-semibold">{gameState.selectedTeam?.name}</p>
              </div>
              <p className="text-gray-600">Resultat beregnes...</p>
            </div>
          )}

          {/* Upcoming matches list */}
          {!isMatchPlaying && !matchResult && (
            <div className="space-y-3">
              {upcomingMatches.map((match, index) => (
                <div
                  key={match.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-gray-600">Uge {gameState.week}, Kamp {index + 1}</span>
                        <span className={`text-xs font-bold px-2 py-1 rounded ${
                          match.isHome
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {match.isHome ? '🏠 Hjemme' : '✈️ Ude'}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold">{match.opponent}</h3>
                      <p className="text-sm text-gray-600">
                        Modstanders Rating: {match.opponentRating.toFixed(1)} • Sværhedsgrad: {match.difficulty}
                      </p>
                    </div>

                    {/* Difficulty indicator */}
                    <div className="text-right">
                      <p className={`text-xs font-bold px-3 py-1 rounded ${
                        match.difficulty === 'Nem'
                          ? 'bg-green-100 text-green-800'
                          : match.difficulty === 'Moderat'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {match.difficulty}
                      </p>
                    </div>
                  </div>

                  {/* Play button */}
                  <button
                    onClick={() => simulateMatch(match)}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded transition"
                  >
                    Start Kamp
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Kamp Historie</h2>
          {playedMatches.length === 0 ? (
            <div className="text-center py-8 border border-dashed rounded-lg bg-gray-50">
              <p className="text-gray-700 font-semibold">Ingen kampe spillet endnu</p>
              <p className="text-sm text-gray-500 mt-1">Start en kamp i “Kommende Kampe” for at komme i gang.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {playedMatches.map((match) => (
                <div
                  key={match.id}
                  className={`bg-white border-l-4 rounded-lg p-4 ${
                    match.result === 'WIN'
                      ? 'border-green-500 bg-green-50'
                      : match.result === 'LOSS'
                      ? 'border-red-500 bg-red-50'
                      : 'border-yellow-500 bg-yellow-50'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <p className="text-sm text-gray-600">Uge {match.date}</p>
                      <h3 className="text-lg font-bold">{match.opponent}</h3>
                    </div>

                    <div className="text-center">
                      <p className="text-3xl font-bold">
                        {match.homeGoals} - {match.awayGoals}
                      </p>
                      <p className={`text-sm font-bold ${
                        match.result === 'WIN'
                          ? 'text-green-700'
                          : match.result === 'LOSS'
                          ? 'text-red-700'
                          : 'text-yellow-700'
                      }`}>
                        {match.result === 'WIN' ? '✓ Sejr' : match.result === 'LOSS' ? '✗ Nedlag' : '⚖️ Uafgjort'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MatchView;
