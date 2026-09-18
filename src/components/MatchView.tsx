import React, { useEffect, useRef, useState } from 'react';
import { Match, PlayedMatch, getMatchReward, useGame } from '../context/GameContext';

const MatchView: React.FC = () => {
  const { gameState, handleNextWeek, applyMatchResult } = useGame();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming');
  const [currentMatch, setCurrentMatch] = useState<Match | null>(null);
  const [matchResult, setMatchResult] = useState<PlayedMatch | null>(null);
  const [isMatchPlaying, setIsMatchPlaying] = useState(false);
  const simulationLockRef = useRef<string | null>(null);
  const simulationTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (simulationTimeoutRef.current !== null) {
        window.clearTimeout(simulationTimeoutRef.current);
      }
      simulationLockRef.current = null;
    };
  }, []);

  const getTeamRating = (): number => {
    const players = Object.values(gameState.players);
    if (players.length === 0) return 70;
    return players.reduce((sum, player) => sum + player.rating, 0) / players.length;
  };

  const getRandomGoals = (max: number): number => Math.floor(Math.random() * (max + 1));
  const formatSigned = (value: number): string => `${value >= 0 ? '+' : ''}${value.toLocaleString('da-DK')}`;

  const simulateMatch = (match: Match) => {
    if (isMatchPlaying || simulationLockRef.current) return;

    simulationLockRef.current = match.id;
    setIsMatchPlaying(true);
    setCurrentMatch(match);

    simulationTimeoutRef.current = window.setTimeout(() => {
      const teamRating = getTeamRating() + (match.isHome ? 1.5 : 0);
      const opponentRating = match.opponentRating + (match.isHome ? 0 : 1.5);
      const ratingDiff = teamRating - opponentRating;

      const winProb = Math.max(0.2, Math.min(0.7, 0.42 + ratingDiff / 110));
      const drawProb = 0.23;

      const roll = Math.random();
      let result: 'WIN' | 'DRAW' | 'LOSS';
      let playerGoals: number;
      let opponentGoals: number;

      if (roll < winProb) {
        result = 'WIN';
        opponentGoals = getRandomGoals(2);
        playerGoals = opponentGoals + 1 + getRandomGoals(2);
      } else if (roll < winProb + drawProb) {
        result = 'DRAW';
        playerGoals = getRandomGoals(3);
        opponentGoals = playerGoals;
      } else {
        result = 'LOSS';
        playerGoals = getRandomGoals(2);
        opponentGoals = playerGoals + 1 + getRandomGoals(2);
      }

      const reward = getMatchReward(result);
      const played: PlayedMatch = {
        id: `${match.id}_played_${Date.now()}`,
        fixtureId: match.id,
        opponent: match.opponent,
        result,
        playerGoals,
        opponentGoals,
        homeGoals: match.isHome ? playerGoals : opponentGoals,
        awayGoals: match.isHome ? opponentGoals : playerGoals,
        isHome: match.isHome,
        date: Date.now(),
        week: match.week,
        reward,
      };

      setMatchResult(played);
      applyMatchResult(played);
      setIsMatchPlaying(false);
      simulationLockRef.current = null;
      simulationTimeoutRef.current = null;
    }, 2000);
  };

  const upcomingMatches = gameState.upcomingMatches;
  const teamRating = getTeamRating();
  const teamName = gameState.selectedTeam?.name ?? 'Dit Hold';

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Kampe</h1>

      <div className="bg-purple-50 border-l-4 border-purple-500 p-4 mb-6 rounded">
        <p className="text-lg font-semibold">Din Trup Rating: <span className="text-purple-600">{teamRating.toFixed(1)}</span></p>
        <p className="text-sm text-gray-600">Uge {gameState.week}</p>
      </div>

      <div className="flex space-x-4 mb-6 border-b">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`px-4 py-2 font-semibold border-b-2 ${
            activeTab === 'upcoming' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Kommende Kampe
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 font-semibold border-b-2 ${
            activeTab === 'history' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Kamp Historie ({gameState.playedMatches.length})
        </button>
      </div>

      {activeTab === 'upcoming' && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Kommende Kampe</h2>

          {matchResult && !isMatchPlaying && (
            <div className="bg-white border-2 border-green-500 rounded-lg p-6 mb-6">
              <h3 className="text-2xl font-bold mb-4">Kamp Resultat</h3>
              <div className="flex justify-between items-center mb-4">
                <div className="text-center flex-1">
                  <p className="text-sm text-gray-600">{matchResult.isHome ? teamName : matchResult.opponent}</p>
                  <p className="text-4xl font-bold text-green-600">{matchResult.homeGoals}</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">-</p>
                </div>
                <div className="text-center flex-1">
                  <p className="text-sm text-gray-600">{matchResult.isHome ? matchResult.opponent : teamName}</p>
                  <p className="text-4xl font-bold text-blue-600">{matchResult.awayGoals}</p>
                </div>
              </div>

              <div className="text-center mb-4">
                {matchResult.result === 'WIN' && (
                  <span className="bg-green-100 text-green-800 text-lg font-bold px-4 py-2 rounded">
                    🏆 SEJR! {formatSigned(matchResult.reward.fanCount)} fans, {formatSigned(matchResult.reward.budget)} kr, {formatSigned(matchResult.reward.fanMood)} fanmood
                  </span>
                )}
                {matchResult.result === 'DRAW' && (
                  <span className="bg-yellow-100 text-yellow-800 text-lg font-bold px-4 py-2 rounded">
                    ⚖️ UAFGJORT {formatSigned(matchResult.reward.fanCount)} fans, {formatSigned(matchResult.reward.budget)} kr, {formatSigned(matchResult.reward.fanMood)} fanmood
                  </span>
                )}
                {matchResult.result === 'LOSS' && (
                  <span className="bg-red-100 text-red-800 text-lg font-bold px-4 py-2 rounded">
                    ❌ NEDERLAG {formatSigned(matchResult.reward.fanCount)} fans, {formatSigned(matchResult.reward.budget)} kr, {formatSigned(matchResult.reward.fanMood)} fanmood
                  </span>
                )}
              </div>

              <button
                onClick={() => {
                  setMatchResult(null);
                  handleNextWeek();
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition"
              >
                {gameState.upcomingMatches.length === 0 ? 'Gå til næste uge' : 'Tilbage til kampliste'}
              </button>
            </div>
          )}

          {isMatchPlaying && currentMatch && (
            <div className="bg-gradient-to-b from-green-100 to-green-50 rounded-lg p-6 mb-6 text-center">
              <h3 className="text-2xl font-bold mb-4">⚽ Kamp i gang...</h3>
              <div className="flex justify-between items-center mb-4 animate-pulse">
                <p className="text-lg font-semibold">{currentMatch.isHome ? teamName : currentMatch.opponent}</p>
                <p className="text-2xl font-bold">vs</p>
                <p className="text-lg font-semibold">{currentMatch.isHome ? currentMatch.opponent : teamName}</p>
              </div>
              <p className="text-gray-600">Resultat beregnes...</p>
            </div>
          )}

          {!isMatchPlaying && !matchResult && (
            <div className="space-y-3">
              {upcomingMatches.map((match, index) => (
                <div key={match.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-gray-600">Uge {match.week}, Kamp {index + 1}</span>
                        <span className={`text-xs font-bold px-2 py-1 rounded ${
                          match.isHome ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {match.isHome ? '🏠 Hjemme' : '✈️ Ude'}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold">{match.isHome ? `${teamName} vs ${match.opponent}` : `${match.opponent} vs ${teamName}`}</h3>
                      <p className="text-sm text-gray-600">
                        Modstanders Rating: {match.opponentRating.toFixed(1)} • Sværhedsgrad: {match.difficulty}
                      </p>
                    </div>

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

      {activeTab === 'history' && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Kamp Historie</h2>
          {gameState.playedMatches.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Ingen kampe spillet endnu</p>
          ) : (
            <div className="space-y-3">
              {gameState.playedMatches.map(match => (
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
                      <p className="text-sm text-gray-600">Uge {match.week} • {match.isHome ? 'Hjemme' : 'Ude'}</p>
                      <h3 className="text-lg font-bold">{match.isHome ? `${teamName} vs ${match.opponent}` : `${match.opponent} vs ${teamName}`}</h3>
                    </div>

                    <div className="text-center">
                      <p className="text-3xl font-bold">{match.homeGoals} - {match.awayGoals}</p>
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

      <div className="mt-8 bg-white border border-gray-200 rounded-lg p-4 overflow-x-auto">
        <h2 className="text-2xl font-bold mb-4">Ligatabel</h2>
        <table className="w-full text-sm">
          <caption className="sr-only">Ligatabel med stilling for holdene</caption>
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="p-2 text-left">#</th>
              <th className="p-2 text-left">Hold</th>
              <th className="p-2 text-center">K</th>
              <th className="p-2 text-center">V</th>
              <th className="p-2 text-center">U</th>
              <th className="p-2 text-center">T</th>
              <th className="p-2 text-center">MF</th>
              <th className="p-2 text-center">MI</th>
              <th className="p-2 text-center">MD</th>
              <th className="p-2 text-center">P</th>
            </tr>
          </thead>
          <tbody>
            {gameState.standings.map((entry, index) => (
              <tr key={entry.teamName} className={`border-b ${entry.teamName === teamName ? 'bg-blue-50 font-semibold' : ''}`}>
                <td className="p-2">{index + 1}</td>
                <td className="p-2">{entry.teamName}</td>
                <td className="p-2 text-center">{entry.played}</td>
                <td className="p-2 text-center">{entry.wins}</td>
                <td className="p-2 text-center">{entry.draws}</td>
                <td className="p-2 text-center">{entry.losses}</td>
                <td className="p-2 text-center">{entry.goalsFor}</td>
                <td className="p-2 text-center">{entry.goalsAgainst}</td>
                <td className="p-2 text-center">{entry.goalDifference}</td>
                <td className="p-2 text-center font-bold">{entry.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MatchView;
