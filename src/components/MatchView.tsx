import { useEffect, useMemo, useRef, useState } from 'react';
import { useGame } from '../context/GameContext';
import { generateUpcomingMatches, getTeamRating, PlayedMatch, simulateMatch, UpcomingMatch } from '../game/matches';

const MatchView = () => {
  const { gameState, recordMatchResult } = useGame();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming');
  const [currentMatch, setCurrentMatch] = useState<UpcomingMatch | null>(null);
  const [matchResult, setMatchResult] = useState<PlayedMatch | null>(null);
  const [isMatchPlaying, setIsMatchPlaying] = useState(false);
  const matchTimeoutRef = useRef<number | null>(null);

  const selectedTeam = gameState.selectedTeam;
  const playedMatches = gameState.playedMatches;
  const teamRating = useMemo(() => getTeamRating(gameState.players), [gameState.players]);

  const upcomingMatches = useMemo(() => {
    if (!selectedTeam) {
      return [];
    }

    return generateUpcomingMatches(gameState.week, selectedTeam);
  }, [gameState.week, selectedTeam]);

  useEffect(() => {
    return () => {
      if (matchTimeoutRef.current !== null) {
        window.clearTimeout(matchTimeoutRef.current);
      }
    };
  }, []);

  if (!selectedTeam) {
    return <div className="text-center text-gray-500 py-8">Vælg et hold for at spille kampe.</div>;
  }

  const startMatch = (match: UpcomingMatch) => {
    if (isMatchPlaying || matchTimeoutRef.current !== null) {
      return;
    }

    setCurrentMatch(match);
    setMatchResult(null);
    setIsMatchPlaying(true);

    matchTimeoutRef.current = window.setTimeout(() => {
      const playedMatch = simulateMatch({
        match,
        teamRating,
        fanMood: gameState.fanMood,
        fanCount: gameState.fanCount,
        stadiumCapacity: gameState.stadiumCapacity,
        week: gameState.week,
      });

      recordMatchResult(playedMatch);
      setMatchResult(playedMatch);
      setCurrentMatch(null);
      setIsMatchPlaying(false);
      matchTimeoutRef.current = null;
    }, 1500);
  };

  const renderScoreline = (match: PlayedMatch) => {
    const homeTeamName = match.isHome ? selectedTeam.name : match.opponent;
    const awayTeamName = match.isHome ? match.opponent : selectedTeam.name;
    const homeGoals = match.isHome ? match.teamGoals : match.opponentGoals;
    const awayGoals = match.isHome ? match.opponentGoals : match.teamGoals;

    return (
      <div className="flex justify-between items-center mb-4">
        <div className="text-center flex-1">
          <p className="text-sm text-gray-600">{homeTeamName}</p>
          <p className="text-4xl font-bold text-blue-600">{homeGoals}</p>
        </div>
        <div className="text-center px-4">
          <p className="text-2xl font-bold">-</p>
          <p className="text-xs text-gray-500">{match.isHome ? 'Hjemme' : 'Ude'}</p>
        </div>
        <div className="text-center flex-1">
          <p className="text-sm text-gray-600">{awayTeamName}</p>
          <p className="text-4xl font-bold text-green-600">{awayGoals}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Kampe</h1>

      <div className="bg-purple-50 border-l-4 border-purple-500 p-4 mb-6 rounded">
        <p className="text-lg font-semibold">
          Din trup rating: <span className="text-purple-600">{teamRating.toFixed(1)}</span>
        </p>
        <p className="text-sm text-gray-600">
          Uge {gameState.week} • Fans: {gameState.fanCount.toLocaleString('da-DK')} • Mood: {gameState.fanMood}/100
        </p>
      </div>

      <div className="flex space-x-4 mb-6 border-b">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`px-4 py-2 font-semibold border-b-2 ${
            activeTab === 'upcoming'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Kommende kampe
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 font-semibold border-b-2 ${
            activeTab === 'history'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Kamp historik ({playedMatches.length})
        </button>
      </div>

      {activeTab === 'upcoming' && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Kommende kampe</h2>

          {matchResult && !isMatchPlaying && (
            <div className="bg-white border-2 border-green-500 rounded-lg p-6 mb-6">
              <h3 className="text-2xl font-bold mb-4">Kampresultat</h3>
              {renderScoreline(matchResult)}

              <div className="text-center mb-4">
                {matchResult.result === 'WIN' && (
                  <span className="bg-green-100 text-green-800 text-lg font-bold px-4 py-2 rounded">
                    🏆 Sejr! +{matchResult.fanChange} fans, +{matchResult.sponsorBonus.toLocaleString('da-DK')} kr bonus
                  </span>
                )}
                {matchResult.result === 'DRAW' && (
                  <span className="bg-yellow-100 text-yellow-800 text-lg font-bold px-4 py-2 rounded">
                    ⚖️ Uafgjort! +{matchResult.fanChange} fans, +{matchResult.sponsorBonus.toLocaleString('da-DK')} kr
                  </span>
                )}
                {matchResult.result === 'LOSS' && (
                  <span className="bg-red-100 text-red-800 text-lg font-bold px-4 py-2 rounded">
                    ❌ Nederlag! {matchResult.fanChange} fans, {matchResult.sponsorBonus.toLocaleString('da-DK')} kr
                  </span>
                )}
              </div>

              <div className="bg-gray-50 rounded p-4 mb-4 text-sm text-gray-700 space-y-1">
                <p>Spillet uge: {matchResult.week}</p>
                <p>Billetindtægt: +{matchResult.ticketRevenue.toLocaleString('da-DK')} kr</p>
                <p>Samlet budgetændring: {matchResult.budgetChange >= 0 ? '+' : ''}{matchResult.budgetChange.toLocaleString('da-DK')} kr</p>
                <p>Fan mood: {matchResult.moodChange >= 0 ? '+' : ''}{matchResult.moodChange}</p>
              </div>

              <button
                onClick={() => setMatchResult(null)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition"
              >
                Se næste uge
              </button>
            </div>
          )}

          {isMatchPlaying && currentMatch && (
            <div className="bg-gradient-to-b from-green-100 to-green-50 rounded-lg p-6 mb-6 text-center">
              <h3 className="text-2xl font-bold mb-4">⚽ Kamp i gang...</h3>
              <div className="flex justify-between items-center mb-4 animate-pulse">
                <p className="text-lg font-semibold">{currentMatch.isHome ? selectedTeam.name : currentMatch.opponent}</p>
                <p className="text-2xl font-bold">vs</p>
                <p className="text-lg font-semibold">{currentMatch.isHome ? currentMatch.opponent : selectedTeam.name}</p>
              </div>
              <p className="text-gray-600">Resultat beregnes...</p>
            </div>
          )}

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
                        <span className="text-sm font-semibold text-gray-600">
                          Uge {gameState.week}, kamp {index + 1}
                        </span>
                        <span
                          className={`text-xs font-bold px-2 py-1 rounded ${
                            match.isHome ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {match.isHome ? '🏠 Hjemme' : '✈️ Ude'}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold">{match.opponent}</h3>
                      <p className="text-sm text-gray-600">
                        Modstanders rating: {match.opponentRating.toFixed(1)} • Sværhedsgrad: {match.difficulty}
                      </p>
                    </div>

                    <div className="text-right">
                      <p
                        className={`text-xs font-bold px-3 py-1 rounded ${
                          match.difficulty === 'Nem'
                            ? 'bg-green-100 text-green-800'
                            : match.difficulty === 'Moderat'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {match.difficulty}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => startMatch(match)}
                    disabled={isMatchPlaying}
                    className={`w-full text-white font-bold py-2 px-4 rounded transition ${
                      isMatchPlaying
                        ? 'bg-purple-300 cursor-not-allowed'
                        : 'bg-purple-600 hover:bg-purple-700'
                    }`}
                  >
                    Start kamp
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Kamp historik</h2>
          {playedMatches.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Ingen kampe spillet endnu</p>
          ) : (
            <div className="space-y-3">
              {playedMatches.map(match => (
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
                  <div className="flex justify-between items-center gap-4">
                    <div className="flex-1">
                      <p className="text-sm text-gray-600">
                        Uge {match.week} • {match.isHome ? 'Hjemme' : 'Ude'}
                      </p>
                      <h3 className="text-lg font-bold">{selectedTeam.name} vs {match.opponent}</h3>
                    </div>

                    <div className="text-center">
                      <p className="text-3xl font-bold">
                        {match.teamGoals} - {match.opponentGoals}
                      </p>
                      <p
                        className={`text-sm font-bold ${
                          match.result === 'WIN'
                            ? 'text-green-700'
                            : match.result === 'LOSS'
                              ? 'text-red-700'
                              : 'text-yellow-700'
                        }`}
                      >
                        {match.result === 'WIN' ? '✓ Sejr' : match.result === 'LOSS' ? '✗ Nederlag' : '⚖️ Uafgjort'}
                      </p>
                    </div>

                    <div className="text-right text-sm text-gray-600">
                      <p>{match.budgetChange >= 0 ? '+' : ''}{match.budgetChange.toLocaleString('da-DK')} kr</p>
                      <p>{match.moodChange >= 0 ? '+' : ''}{match.moodChange} mood</p>
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
