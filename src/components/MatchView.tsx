import React, { useEffect, useRef, useState } from 'react';
import { getLeagueById, getLeagueStandings, getTeamById, LeagueResult } from '../data/leagues';
import { useGame } from '../context/GameContext';
import LeagueTable from './LeagueTable';

const MatchView: React.FC = () => {
  const { gameState, playCurrentWeek, handleNextWeek } = useGame();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'table' | 'history'>('upcoming');
  const [isMatchPlaying, setIsMatchPlaying] = useState(false);
  const matchTimerRef = useRef<number | null>(null);

  const league = getLeagueById(gameState.leagueId);
  const standings = league ? getLeagueStandings(league, gameState.results) : [];
  const fixturesThisWeek = gameState.fixtures.filter((fixture) => fixture.round === gameState.week);
  const userFixture = fixturesThisWeek.find(
    (fixture) =>
      fixture.homeTeamId === gameState.selectedTeam?.id || fixture.awayTeamId === gameState.selectedTeam?.id,
  );
  const otherFixtures = fixturesThisWeek.filter((fixture) => fixture.id !== userFixture?.id);
  const weekResults = gameState.results.filter((result) => result.round === gameState.week);
  const playedUserResult = userFixture
    ? gameState.results.find((result) => result.fixtureId === userFixture.id) ?? null
    : null;
  const playedMatches = gameState.results
    .filter(
      (result) =>
        result.homeTeamId === gameState.selectedTeam?.id || result.awayTeamId === gameState.selectedTeam?.id,
    )
    .sort((a, b) => b.round - a.round);
  const teamRating = (() => {
    const players = Object.values(gameState.players);
    if (players.length === 0) return 70;
    return players.reduce((sum, player) => sum + player.rating, 0) / players.length;
  })();

  const getPerspectiveScore = (result: LeagueResult) => {
    const isHome = result.homeTeamId === gameState.selectedTeam?.id;
    return {
      userGoals: isHome ? result.homeGoals : result.awayGoals,
      opponentGoals: isHome ? result.awayGoals : result.homeGoals,
      opponentName: getTeamById(isHome ? result.awayTeamId : result.homeTeamId)?.name ?? 'Modstander',
    };
  };

  const handlePlayMatch = () => {
    if (!userFixture || isMatchPlaying || playedUserResult) {
      return;
    }

    setIsMatchPlaying(true);

    matchTimerRef.current = window.setTimeout(() => {
      playCurrentWeek();
      setIsMatchPlaying(false);
      matchTimerRef.current = null;
    }, 1200);
  };

  const currentSummary =
    gameState.latestWeekSummary?.round === gameState.week ? gameState.latestWeekSummary : null;
  const fallbackSummary =
    !currentSummary && playedUserResult
      ? {
          round: playedUserResult.round,
          userFixtureId: playedUserResult.fixtureId,
          userResult:
            getPerspectiveScore(playedUserResult).userGoals > getPerspectiveScore(playedUserResult).opponentGoals
              ? 'WIN'
              : getPerspectiveScore(playedUserResult).userGoals < getPerspectiveScore(playedUserResult).opponentGoals
                ? 'LOSS'
                : 'DRAW',
          userGoals: getPerspectiveScore(playedUserResult).userGoals,
          opponentGoals: getPerspectiveScore(playedUserResult).opponentGoals,
          ticketRevenue: 0,
          fanDelta: 0,
          moodDelta: 0,
        }
      : null;
  const displaySummary = currentSummary ?? fallbackSummary;
  const maxRound = gameState.fixtures.length > 0 ? Math.max(...gameState.fixtures.map((fixture) => fixture.round)) : 0;
  const hasSeasonFinished = Boolean(league) && gameState.week > maxRound && maxRound > 0;

  useEffect(() => () => {
    if (matchTimerRef.current !== null) {
      window.clearTimeout(matchTimerRef.current);
    }
  }, []);

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Kampe</h1>

      <div className="bg-purple-50 border-l-4 border-purple-500 p-4 mb-6 rounded">
        <p className="text-lg font-semibold">
          Din Trup Rating: <span className="text-purple-600">{teamRating.toFixed(1)}</span>
        </p>
        <p className="text-sm text-gray-600">
          {gameState.leagueName ?? 'Liga mangler'} • Uge {gameState.week}
          {gameState.fixtures.length > 0 ? ` / ${Math.max(...gameState.fixtures.map((fixture) => fixture.round))}` : ''}
        </p>
      </div>

      <div className="flex flex-wrap gap-4 mb-6 border-b">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`px-4 py-2 font-semibold border-b-2 ${
            activeTab === 'upcoming'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Ugens Kamp
        </button>
        <button
          onClick={() => setActiveTab('table')}
          className={`px-4 py-2 font-semibold border-b-2 ${
            activeTab === 'table'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Ligatabel
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
        <div className="space-y-6">
          {!league ? (
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <h2 className="text-2xl font-bold mb-2">Liga ikke klar</h2>
              <p className="text-gray-600">Vælg eller genstart dit hold for at indlæse en gyldig liga og kampprogram.</p>
            </div>
          ) : hasSeasonFinished ? (
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <h2 className="text-2xl font-bold mb-2">Sæsonen er afsluttet</h2>
              <p className="text-gray-600">Der er ingen flere ligakampe planlagt i den aktuelle sæson.</p>
            </div>
          ) : !userFixture ? (
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <h2 className="text-2xl font-bold mb-2">Kampdata mangler</h2>
              <p className="text-gray-600">Det lykkedes ikke at finde denne uges kamp i den valgte liga.</p>
            </div>
          ) : displaySummary && playedUserResult ? (
            <div className="bg-white border-2 border-green-500 rounded-lg p-6">
              <h3 className="text-2xl font-bold mb-4">Kamp Resultat</h3>
              <div className="flex justify-between items-center mb-4">
                <div className="text-center flex-1">
                  <p className="text-sm text-gray-600">
                    {getPerspectiveScore(playedUserResult).opponentName}
                  </p>
                  <p className="text-4xl font-bold text-blue-600">{displaySummary.opponentGoals}</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">-</p>
                </div>
                <div className="text-center flex-1">
                  <p className="text-sm text-gray-600">Dit Hold</p>
                  <p className="text-4xl font-bold text-green-600">{displaySummary.userGoals}</p>
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-3 mb-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-600">Resultat</p>
                  <p className="font-bold">
                    {displaySummary.userResult === 'WIN'
                      ? '🏆 Sejr'
                      : displaySummary.userResult === 'DRAW'
                        ? '⚖️ Uafgjort'
                        : '❌ Nederlag'}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-600">Fans</p>
                  <p className="font-bold">{displaySummary.fanDelta > 0 ? '+' : ''}{displaySummary.fanDelta}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-600">Ugens indtægt</p>
                  <p className="font-bold text-green-600">
                    {displaySummary.ticketRevenue > 0
                      ? `+${displaySummary.ticketRevenue.toLocaleString('da-DK')} kr`
                      : 'Allerede bogført'}
                  </p>
                </div>
              </div>

              {weekResults.length > 1 && (
                <div className="mb-4 border-t pt-4">
                  <h4 className="font-semibold mb-2">Andre resultater i runden</h4>
                  <div className="space-y-2">
                    {weekResults
                      .filter((result) => result.fixtureId !== displaySummary.userFixtureId)
                      .map((result) => (
                        <div key={result.fixtureId} className="flex justify-between text-sm bg-gray-50 rounded px-3 py-2">
                          <span>
                            {getTeamById(result.homeTeamId)?.name} - {getTeamById(result.awayTeamId)?.name}
                          </span>
                          <span className="font-bold">
                            {result.homeGoals}-{result.awayGoals}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              <button
                onClick={handleNextWeek}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition"
              >
                Gå til næste uge
              </button>
            </div>
          ) : isMatchPlaying ? (
            <div className="bg-gradient-to-b from-green-100 to-green-50 rounded-lg p-6 text-center">
              <h3 className="text-2xl font-bold mb-4">⚽ Kamp i gang...</h3>
              <div className="flex justify-between items-center mb-4 animate-pulse">
                <p className="text-lg font-semibold">{getTeamById(userFixture.homeTeamId)?.name}</p>
                <p className="text-2xl font-bold">vs</p>
                <p className="text-lg font-semibold">{getTeamById(userFixture.awayTeamId)?.name}</p>
              </div>
              <p className="text-gray-600">Resultat beregnes og ligatabellen opdateres...</p>
            </div>
          ) : (
            <>
              <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                <div className="flex flex-wrap justify-between items-start gap-4 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-gray-600">Uge {gameState.week}</span>
                      <span
                        className={`text-xs font-bold px-2 py-1 rounded ${
                          userFixture.homeTeamId === gameState.selectedTeam?.id
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {userFixture.homeTeamId === gameState.selectedTeam?.id ? '🏠 Hjemme' : '✈️ Ude'}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold">
                      {getTeamById(userFixture.homeTeamId)?.name} - {getTeamById(userFixture.awayTeamId)?.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {league.name} • Modstander: {getPerspectiveScore({
                        fixtureId: userFixture.id,
                        round: userFixture.round,
                        homeTeamId: userFixture.homeTeamId,
                        awayTeamId: userFixture.awayTeamId,
                        homeGoals: 0,
                        awayGoals: 0,
                      }).opponentName}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Truprating</p>
                    <p className="text-lg font-bold text-purple-600">{teamRating.toFixed(1)}</p>
                  </div>
                </div>

                <button
                  onClick={handlePlayMatch}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded transition"
                >
                  Start Kamp
                </button>
              </div>

              {otherFixtures.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-bold mb-3">Øvrige kampe denne uge</h3>
                  <div className="space-y-2">
                    {otherFixtures.map((fixture) => (
                      <div key={fixture.id} className="flex justify-between text-sm bg-gray-50 rounded px-3 py-2">
                        <span>
                          {getTeamById(fixture.homeTeamId)?.name} - {getTeamById(fixture.awayTeamId)?.name}
                        </span>
                        <span className="text-gray-500">Afventer</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === 'table' &&
        (league ? (
          <LeagueTable
            league={league}
            standings={standings}
            selectedTeamId={gameState.selectedTeam?.id}
          />
        ) : (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <h2 className="text-2xl font-bold mb-2">Ingen ligatabel tilgængelig</h2>
            <p className="text-gray-600">Vælg et hold for at se den aktuelle ligastilling.</p>
          </div>
        ))}

      {activeTab === 'history' && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Kamp Historie</h2>
          {playedMatches.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Ingen kampe spillet endnu</p>
          ) : (
            <div className="space-y-3">
              {playedMatches.map((match) => {
                const isSelectedTeamHome = match.homeTeamId === gameState.selectedTeam?.id;
                const userGoals = isSelectedTeamHome ? match.homeGoals : match.awayGoals;
                const opponentGoals = isSelectedTeamHome ? match.awayGoals : match.homeGoals;
                const result = userGoals > opponentGoals ? 'WIN' : userGoals < opponentGoals ? 'LOSS' : 'DRAW';

                return (
                  <div
                    key={match.fixtureId}
                    className={`bg-white border-l-4 rounded-lg p-4 ${
                      result === 'WIN'
                        ? 'border-green-500 bg-green-50'
                        : result === 'LOSS'
                          ? 'border-red-500 bg-red-50'
                          : 'border-yellow-500 bg-yellow-50'
                    }`}
                  >
                    <div className="flex justify-between items-center gap-4">
                      <div className="flex-1">
                        <p className="text-sm text-gray-600">Uge {match.round}</p>
                        <h3 className="text-lg font-bold">
                          {getTeamById(match.homeTeamId)?.name} - {getTeamById(match.awayTeamId)?.name}
                        </h3>
                      </div>

                      <div className="text-center">
                        <p className="text-3xl font-bold">
                          {match.homeGoals} - {match.awayGoals}
                        </p>
                        <p
                          className={`text-sm font-bold ${
                            result === 'WIN'
                              ? 'text-green-700'
                              : result === 'LOSS'
                                ? 'text-red-700'
                                : 'text-yellow-700'
                          }`}
                        >
                          {result === 'WIN' ? '✓ Sejr' : result === 'LOSS' ? '✗ Nederlag' : '⚖️ Uafgjort'}
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
