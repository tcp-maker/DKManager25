import React, { useMemo, useState } from 'react';
import { createSeasonSchedule, SEASON_MATCH_COUNT } from '../data/gameData';
import { useGame } from '../context/GameContext';
import { Match, PlayedMatch } from '../types/matches';

const MatchView: React.FC = () => {
  const { gameState, handleNextWeek, recordPlayedMatch } = useGame();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming');
  const [currentMatch, setCurrentMatch] = useState<Match | null>(null);
  const [matchResult, setMatchResult] = useState<PlayedMatch | null>(null);
  const [isMatchPlaying, setIsMatchPlaying] = useState(false);

  const selectedTeam = gameState.selectedTeam;
  const season = Math.floor((gameState.week - 1) / SEASON_MATCH_COUNT) + 1;
  const currentRound = ((gameState.week - 1) % SEASON_MATCH_COUNT) + 1;

  const seasonMatches = useMemo(
    () => selectedTeam ? createSeasonSchedule(selectedTeam, season) : [],
    [selectedTeam, season]
  );

  const upcomingMatches = seasonMatches.filter(match => match.round >= currentRound).slice(0, 4);

  const getTeamRating = (): number => {
    const players = Object.values(gameState.players);
    if (players.length === 0) return selectedTeam?.baseRating ?? 70;
    const totalRating = players.reduce((sum, player) => sum + player.rating, 0);
    return totalRating / players.length;
  };

  const simulateMatch = (match: Match) => {
    setIsMatchPlaying(true);
    setCurrentMatch(match);

    setTimeout(() => {
      const teamRating = getTeamRating();
      const homeRating = match.isHome ? teamRating : match.opponentRating;
      const awayRating = match.isHome ? match.opponentRating : teamRating;
      const diff = homeRating - awayRating;
      const winProb = Math.max(0.15, Math.min(0.7, 0.4 + diff / 200));
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
        ...match,
        result,
        homeGoals,
        awayGoals,
        date: gameState.week,
      };

      setMatchResult(played);
      recordPlayedMatch(played);
      setIsMatchPlaying(false);
    }, 2000);
  };

  if (!selectedTeam) return null;

  const teamRating = getTeamRating();
  const resultHomeName = matchResult ? (matchResult.isHome ? selectedTeam.name : matchResult.opponent) : '';
  const resultAwayName = matchResult ? (matchResult.isHome ? matchResult.opponent : selectedTeam.name) : '';

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Kampe</h1>

      <div className="bg-purple-50 border-l-4 border-purple-500 p-4 mb-6 rounded">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <p className="text-lg font-semibold">Din Trup Rating: <span className="text-purple-600">{teamRating.toFixed(1)}</span></p>
            <p className="text-sm text-gray-600">Sæson {season} • Runde {currentRound} af {SEASON_MATCH_COUNT}</p>
          </div>
          <div className="text-sm text-gray-600">
            <p>{selectedTeam.leagueName}</p>
            <p>22 kampe pr. sæson • 11 hjemme + 11 ude</p>
          </div>
        </div>
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
          Sæsonplan
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 font-semibold border-b-2 ${
            activeTab === 'history'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
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
              <div className="flex justify-between items-center mb-4 gap-4">
                <div className="text-center flex-1">
                  <p className="text-sm text-gray-600">{resultHomeName}</p>
                  <p className="text-4xl font-bold text-blue-600">{matchResult.homeGoals}</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">-</p>
                </div>
                <div className="text-center flex-1">
                  <p className="text-sm text-gray-600">{resultAwayName}</p>
                  <p className="text-4xl font-bold text-green-600">{matchResult.awayGoals}</p>
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
                  handleNextWeek();
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition"
              >
                Gå til næste runde
              </button>
            </div>
          )}

          {isMatchPlaying && currentMatch && (
            <div className="bg-gradient-to-b from-green-100 to-green-50 rounded-lg p-6 mb-6 text-center">
              <h3 className="text-2xl font-bold mb-4">⚽ Kamp i gang...</h3>
              <div className="flex justify-between items-center mb-4 animate-pulse gap-4">
                <p className="text-lg font-semibold">{currentMatch.isHome ? selectedTeam.name : currentMatch.opponent}</p>
                <p className="text-2xl font-bold">vs</p>
                <p className="text-lg font-semibold">{currentMatch.isHome ? currentMatch.opponent : selectedTeam.name}</p>
              </div>
              <p className="text-gray-600">Resultat beregnes...</p>
            </div>
          )}

          {!isMatchPlaying && !matchResult && (
            <div className="space-y-3">
              {upcomingMatches.map((match) => (
                <div
                  key={match.id}
                  className={`bg-white border rounded-lg p-4 transition ${match.round === currentRound ? 'border-purple-400 shadow-md' : 'border-gray-200'}`}
                >
                  <div className="flex justify-between items-start gap-4 mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-sm font-semibold text-gray-600">Sæson {season} • Runde {match.round}</span>
                        <span className={`text-xs font-bold px-2 py-1 rounded ${
                          match.isHome
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {match.isHome ? '🏠 Hjemme' : '✈️ Ude'}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold">{match.isHome ? `${selectedTeam.name} vs ${match.opponent}` : `${match.opponent} vs ${selectedTeam.name}`}</h3>
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

                  {match.round === currentRound ? (
                    <button
                      onClick={() => simulateMatch(match)}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded transition"
                    >
                      Start Kamp
                    </button>
                  ) : (
                    <div className="w-full bg-gray-100 text-gray-500 font-semibold py-2 px-4 rounded text-center">
                      Låses op i senere runde
                    </div>
                  )}
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
              {gameState.playedMatches.map((match) => {
                const homeName = match.isHome ? selectedTeam.name : match.opponent;
                const awayName = match.isHome ? match.opponent : selectedTeam.name;

                return (
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
                        <p className="text-sm text-gray-600">Sæson {match.season} • Runde {match.round} • Uge {match.date}</p>
                        <h3 className="text-lg font-bold">{homeName} vs {awayName}</h3>
                        <p className="text-sm text-gray-600">{match.isHome ? 'Dit hold spillede hjemme' : 'Dit hold spillede ude'}</p>
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
                          {match.result === 'WIN' ? '✓ Sejr' : match.result === 'LOSS' ? '✗ Nederlag' : '⚖️ Uafgjort'}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MatchView;
