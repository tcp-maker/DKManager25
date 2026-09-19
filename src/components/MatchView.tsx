import React, { useMemo, useState } from 'react';
import { useGame } from '../context/GameContext';
import { calculateSquadStrength, getBalancedOpponentStrength, getMatchPerformanceRating } from '../data/players';
import { getSeasonFixtures, getTeamById, ScheduledMatch, simulateScore } from '../data/leagues';
import TeamBadge from './TeamBadge';

interface PlayedMatchSummary {
  id: string;
  opponentId: string;
  opponent: string;
  result: 'WIN' | 'DRAW' | 'LOSS';
  userGoals: number;
  opponentGoals: number;
  date: number;
}

const MatchView: React.FC = () => {
  const { gameState, handleNextWeek, recordMatchResult } = useGame();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming');
  const [currentMatch, setCurrentMatch] = useState<ScheduledMatch | null>(null);
  const [matchResult, setMatchResult] = useState<PlayedMatchSummary | null>(null);
  const [isMatchPlaying, setIsMatchPlaying] = useState(false);
  const selectedTeam = gameState.selectedTeam ? (getTeamById(gameState.selectedTeam.id) ?? gameState.selectedTeam) : null;
  const fixtures = useMemo(() => getSeasonFixtures(selectedTeam), [selectedTeam]);
  const seasonMatches = useMemo(
    () => gameState.leagueMatches.filter(match => match.season === gameState.season),
    [gameState.leagueMatches, gameState.season],
  );
  const playedFixtureIds = useMemo(
    () => new Set(seasonMatches.filter(match => match.isUserMatch).map(match => match.fixtureId)),
    [seasonMatches],
  );
  const nextPlayableWeek = useMemo(
    () => fixtures.find(match => !playedFixtureIds.has(match.id))?.week ?? null,
    [fixtures, playedFixtureIds],
  );
  const upcomingMatches = useMemo(
    () => fixtures
      .filter(match => !playedFixtureIds.has(match.id) && match.week === nextPlayableWeek)
      .slice(0, 3),
    [fixtures, playedFixtureIds, nextPlayableWeek],
  );
  const playedMatches = useMemo<PlayedMatchSummary[]>(
    () => seasonMatches
      .filter(match => match.isUserMatch && selectedTeam)
      .map(match => {
        const isHome = match.homeTeamId === selectedTeam?.id;
        const homeGoals = isHome ? match.homeGoals : match.awayGoals;
        const awayGoals = isHome ? match.awayGoals : match.homeGoals;
        const result: PlayedMatchSummary['result'] = homeGoals > awayGoals ? 'WIN' : homeGoals < awayGoals ? 'LOSS' : 'DRAW';
        return {
          id: match.fixtureId,
          opponentId: isHome ? match.awayTeamId : match.homeTeamId,
          opponent: isHome ? match.awayTeamName : match.homeTeamName,
          result,
          userGoals: homeGoals,
          opponentGoals: awayGoals,
          date: match.week,
        };
      })
      .sort((a, b) => b.date - a.date),
    [seasonMatches, selectedTeam],
  );
  const isSeasonComplete = fixtures.length > 0 && playedFixtureIds.size >= fixtures.length;
  const nextAdvanceStartsNewSeason = Boolean(
    matchResult &&
    currentMatch &&
    fixtures.length > 0 &&
    (playedFixtureIds.has(currentMatch.id) ? playedFixtureIds.size : playedFixtureIds.size + 1) >= fixtures.length
  );

  const squadStrength = useMemo(
    () => calculateSquadStrength(Object.values(gameState.players)),
    [gameState.players],
  );
  const currentOpponent = currentMatch ? getTeamById(currentMatch.opponentId) : null;
  const leftSideIsUser = Boolean(currentMatch?.isHome);
  const rightSideIsUser = currentMatch ? !currentMatch.isHome : false;

  // Simulate match
  const simulateMatch = (match: ScheduledMatch) => {
    if (isMatchPlaying) return;

    setIsMatchPlaying(true);
    setCurrentMatch(match);

    // Simulate match delay
    setTimeout(() => {
      const opponentStrength = getBalancedOpponentStrength(match.opponentRating);
      const simulated = simulateScore(
        match.isHome ? getMatchPerformanceRating(squadStrength, true) : getMatchPerformanceRating(opponentStrength, true),
        match.isHome ? getMatchPerformanceRating(opponentStrength, false) : getMatchPerformanceRating(squadStrength, false),
      );
      const userGoals = match.isHome ? simulated.homeGoals : simulated.awayGoals;
      const opponentGoals = match.isHome ? simulated.awayGoals : simulated.homeGoals;

      const played: PlayedMatchSummary = {
        id: match.id,
        opponentId: match.opponentId,
        opponent: match.opponent,
        result: userGoals > opponentGoals ? 'WIN' : userGoals < opponentGoals ? 'LOSS' : 'DRAW',
        userGoals,
        opponentGoals,
        date: gameState.week,
      };

      recordMatchResult(match, userGoals, opponentGoals);
      setMatchResult(played);
      setIsMatchPlaying(false);
    }, 2000);
  };

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Kampe</h1>

      <div>
        {/* Match Info */}
        <div className="bg-purple-50 border-l-4 border-purple-500 p-4 mb-6 rounded">
          <p className="text-lg font-semibold">Samlet Holdstyrke: <span className="text-purple-600">{squadStrength.overall}</span></p>
          <p className="text-sm text-gray-600">Sæson {gameState.season} • Uge {gameState.week}</p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
            <div className="rounded bg-white/70 px-3 py-2">Målmand: <span className="font-bold">{squadStrength.goalkeeping}</span></div>
            <div className="rounded bg-white/70 px-3 py-2">Forsvar: <span className="font-bold">{squadStrength.defense}</span></div>
            <div className="rounded bg-white/70 px-3 py-2">Midtbane: <span className="font-bold">{squadStrength.midfield}</span></div>
            <div className="rounded bg-white/70 px-3 py-2">Angreb: <span className="font-bold">{squadStrength.attack}</span></div>
          </div>
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

        {activeTab === 'upcoming' && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Kommende Kampe</h2>

            {matchResult && !isMatchPlaying && (
              <div className="bg-white border-2 border-green-500 rounded-lg p-6 mb-6">
                <h3 className="text-2xl font-bold mb-4">Kamp Resultat</h3>
                <div className="flex justify-between items-center mb-4">
                  <div className="text-center flex-1">
                    <div className="mb-2 flex justify-center">
                      <TeamBadge team={leftSideIsUser && selectedTeam ? selectedTeam : (currentOpponent ?? { name: matchResult.opponent, logo: '⚽' })} size="lg" />
                    </div>
                    <p className="text-sm text-gray-600">{leftSideIsUser ? 'Dit Hold' : matchResult.opponent}</p>
                    <p className={`text-4xl font-bold ${leftSideIsUser ? 'text-green-600' : 'text-blue-600'}`}>
                      {leftSideIsUser ? matchResult.userGoals : matchResult.opponentGoals}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">-</p>
                  </div>
                  <div className="text-center flex-1">
                    <div className="mb-2 flex justify-center">
                      <TeamBadge team={rightSideIsUser && selectedTeam ? selectedTeam : (currentOpponent ?? { name: matchResult.opponent, logo: '⚽' })} size="lg" />
                    </div>
                    <p className="text-sm text-gray-600">{rightSideIsUser ? 'Dit Hold' : matchResult.opponent}</p>
                    <p className={`text-4xl font-bold ${rightSideIsUser ? 'text-green-600' : 'text-blue-600'}`}>
                      {rightSideIsUser ? matchResult.userGoals : matchResult.opponentGoals}
                    </p>
                  </div>
                </div>

                <div className="text-center mb-4">
                  {matchResult.result === 'WIN' && (
                    <span className="bg-green-100 text-green-800 text-lg font-bold px-4 py-2 rounded">
                      🏆 SEJR! +50 fans og bedre sponsorgrundlag
                    </span>
                  )}
                  {matchResult.result === 'DRAW' && (
                    <span className="bg-yellow-100 text-yellow-800 text-lg font-bold px-4 py-2 rounded">
                      ⚖️ UAFGJORT +10 fans og stabil sponsorværdi
                    </span>
                  )}
                  {matchResult.result === 'LOSS' && (
                    <span className="bg-red-100 text-red-800 text-lg font-bold px-4 py-2 rounded">
                      ❌ NEDERLAG -20 fans og lavere sponsorværdi
                    </span>
                  )}
                </div>

                <button
                  onClick={() => {
                    handleNextWeek();
                    setMatchResult(null);
                    setCurrentMatch(null);
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition"
                >
                  {nextAdvanceStartsNewSeason || isSeasonComplete ? 'Start næste sæson' : 'Gå til næste uge'}
                </button>
              </div>
            )}

            {isMatchPlaying && currentMatch && (
              <div className="bg-gradient-to-b from-green-100 to-green-50 rounded-lg p-6 mb-6 text-center">
                <h3 className="text-2xl font-bold mb-4">⚽ Kamp i gang...</h3>
                <div className="flex justify-between items-center mb-4 animate-pulse">
                  <div className="flex items-center gap-3">
                    {currentOpponent && <TeamBadge team={currentOpponent} size="md" />}
                    <p className="text-lg font-semibold">{currentMatch.opponent}</p>
                  </div>
                  <p className="text-2xl font-bold">vs</p>
                  <div className="flex items-center gap-3">
                    {selectedTeam && <TeamBadge team={selectedTeam} size="md" />}
                    <p className="text-lg font-semibold">{gameState.selectedTeam?.name}</p>
                  </div>
                </div>
                <p className="text-gray-600">Resultat beregnes...</p>
              </div>
            )}

            {!isMatchPlaying && !matchResult && (
              <>
                {upcomingMatches.length === 0 ? (
                  <div className="rounded-lg border border-gray-200 bg-white p-6 text-center text-gray-600">
                    <p>
                      {isSeasonComplete
                        ? 'Sæsonen er færdigspillet. Start næste sæson for at få en ny ligatabel og nye kampe.'
                        : 'Ingen kommende kampe tilgængelige endnu.'}
                    </p>
                    {isSeasonComplete && (
                      <button
                        onClick={() => {
                          handleNextWeek();
                          setMatchResult(null);
                          setCurrentMatch(null);
                        }}
                        className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition"
                      >
                        Start næste sæson
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {upcomingMatches.map((match) => (
                      <div
                        key={match.id}
                        className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                      >
                        <div className="flex justify-between items-start mb-3 gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="text-sm font-semibold text-gray-600">Uge {match.week}</span>
                              <span className={`text-xs font-bold px-2 py-1 rounded ${
                                match.isHome
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {match.isHome ? '🏠 Hjemme' : '✈️ Ude'}
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <TeamBadge
                                team={getTeamById(match.opponentId) ?? { name: match.opponent, logo: '⚽' }}
                                size="md"
                              />
                              <h3 className="text-xl font-bold">{match.opponent}</h3>
                            </div>
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
                          disabled={isMatchPlaying}
                          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded transition disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
                        >
                          Start Kamp
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Kamp Historie</h2>
            {playedMatches.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Ingen kampe spillet i sæson {gameState.season} endnu</p>
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
                    <div className="flex justify-between items-center gap-4">
                      <div className="flex-1">
                        <p className="text-sm text-gray-600">Sæson {gameState.season} • Uge {match.date}</p>
                        <div className="mt-1 flex items-center gap-3">
                          <TeamBadge
                            team={getTeamById(match.opponentId) ?? { name: match.opponent, logo: '⚽' }}
                            size="md"
                          />
                          <h3 className="text-lg font-bold">{match.opponent}</h3>
                        </div>
                      </div>

                      <div className="text-center">
                        <p className="text-3xl font-bold">
                          {match.userGoals} - {match.opponentGoals}
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
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchView;
