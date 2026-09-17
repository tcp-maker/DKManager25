import React, { useMemo, useState } from 'react';
import { calculateLeagueStandings, getCurrentSeason, getLeagueByTeamId, getLeagueFixtureSet } from '../data/leagues';
import { useGame } from '../context/GameContext';
import { LeagueFixture, LeagueMatchResult } from '../types/teams';

interface ClubPerspectiveMatch {
  id: string;
  opponent: string;
  result: 'WIN' | 'DRAW' | 'LOSS';
  goalsFor: number;
  goalsAgainst: number;
  date: number;
  season: number;
}

const getRandomInt = (max: number) => Math.floor(Math.random() * max);

const MatchView: React.FC = () => {
  const { gameState, handleNextWeek, recordLeagueResults } = useGame();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming');
  const [currentMatch, setCurrentMatch] = useState<LeagueFixture | null>(null);
  const [matchResult, setMatchResult] = useState<LeagueMatchResult | null>(null);
  const [isMatchPlaying, setIsMatchPlaying] = useState(false);

  const selectedTeam = gameState.selectedTeam;
  const currentLeague = selectedTeam ? getLeagueByTeamId(selectedTeam.id) : undefined;
  const currentSeason = getCurrentSeason(gameState.week);

  const getTeamRating = (): number => {
    const players = Object.values(gameState.players);
    if (players.length === 0) return 70;
    const totalRating = players.reduce((sum, player) => sum + player.rating, 0);
    return totalRating / players.length;
  };

  const currentFixtures = currentLeague ? getLeagueFixtureSet(currentLeague.id, gameState.week) : [];
  const playerFixture = currentFixtures.find(
    fixture => fixture.homeTeam.id === selectedTeam?.id || fixture.awayTeam.id === selectedTeam?.id,
  );
  const recordedCurrentWeekMatch = playerFixture
    ? gameState.playedLeagueMatches.find(result => result.id === playerFixture.id)
    : undefined;

  const simulateFixtureResult = (fixture: LeagueFixture): LeagueMatchResult => {
    const homeRating = fixture.homeTeam.id === selectedTeam?.id ? getTeamRating() : fixture.homeTeam.rating;
    const awayRating = fixture.awayTeam.id === selectedTeam?.id ? getTeamRating() : fixture.awayTeam.rating;
    const adjustedDifference = homeRating + 2 - awayRating;
    const homeWinProbability = Math.max(0.2, Math.min(0.65, 0.42 + adjustedDifference / 80));
    const drawProbability = 0.24;
    const roll = Math.random();

    let homeGoals: number;
    let awayGoals: number;

    if (roll < homeWinProbability) {
      homeGoals = 1 + getRandomInt(3) + (adjustedDifference > 8 ? 1 : 0);
      awayGoals = getRandomInt(Math.max(1, homeGoals));
    } else if (roll < homeWinProbability + drawProbability) {
      homeGoals = getRandomInt(3);
      awayGoals = homeGoals;
    } else {
      awayGoals = 1 + getRandomInt(3) + (adjustedDifference < -8 ? 1 : 0);
      homeGoals = getRandomInt(Math.max(1, awayGoals));
    }

    return {
      id: fixture.id,
      leagueId: fixture.leagueId,
      season: fixture.season,
      week: fixture.week,
      homeTeamId: fixture.homeTeam.id,
      awayTeamId: fixture.awayTeam.id,
      homeGoals,
      awayGoals,
    };
  };

  const mapToClubPerspective = (result: LeagueMatchResult): ClubPerspectiveMatch => {
    const isHome = result.homeTeamId === selectedTeam?.id;
    const opponentId = isHome ? result.awayTeamId : result.homeTeamId;
    const opponent = currentLeague?.teams.find(team => team.id === opponentId)?.name ?? opponentId;
    const goalsFor = isHome ? result.homeGoals : result.awayGoals;
    const goalsAgainst = isHome ? result.awayGoals : result.homeGoals;
    const outcome = goalsFor > goalsAgainst ? 'WIN' : goalsFor < goalsAgainst ? 'LOSS' : 'DRAW';

    return {
      id: result.id,
      opponent,
      result: outcome,
      goalsFor,
      goalsAgainst,
      date: result.week,
      season: result.season,
    };
  };

  const playedMatches = useMemo(() => (
    gameState.playedLeagueMatches
      .filter(match => match.homeTeamId === selectedTeam?.id || match.awayTeamId === selectedTeam?.id)
      .sort((left, right) => right.season - left.season || right.week - left.week || left.id.localeCompare(right.id, 'da'))
      .map(mapToClubPerspective)
  ), [gameState.playedLeagueMatches, selectedTeam?.id, currentLeague]);

  const displayResult = recordedCurrentWeekMatch ?? matchResult ?? null;
  const displayPerspectiveMatch = displayResult ? mapToClubPerspective(displayResult) : null;
  const standings = currentLeague
    ? calculateLeagueStandings(currentLeague, gameState.playedLeagueMatches, currentSeason)
    : [];
  const teamStanding = standings.find(standing => standing.teamId === selectedTeam?.id);

  const simulateMatch = (fixture: LeagueFixture) => {
    if (!currentLeague || !selectedTeam) {
      return;
    }

    const fixturesForWeek = [...currentFixtures];

    setIsMatchPlaying(true);
    setCurrentMatch(fixture);

    setTimeout(() => {
      const weeklyResults = fixturesForWeek.map(currentFixture => simulateFixtureResult(currentFixture));
      const userResult = weeklyResults.find(result => result.id === fixture.id) ?? null;

      if (!userResult) {
        setIsMatchPlaying(false);
        setCurrentMatch(null);
        return;
      }

      recordLeagueResults(weeklyResults);
      setMatchResult(userResult);
      setIsMatchPlaying(false);
      setCurrentMatch(null);
    }, 2000);
  };

  if (!selectedTeam || !currentLeague) {
    return <div className="p-4">Ingen ligakampe tilgængelige endnu.</div>;
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Kampe</h1>

      <div className="bg-purple-50 border-l-4 border-purple-500 p-4 mb-6 rounded">
        <p className="text-lg font-semibold">{currentLeague.name} • Sæson {currentSeason} • Din Trup Rating: <span className="text-purple-600">{getTeamRating().toFixed(1)}</span></p>
        <p className="text-sm text-gray-600">Uge {gameState.week} • Placering: {teamStanding?.position ?? '-'} • Point: {teamStanding?.points ?? 0}</p>
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
          Rundens Kampe
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
          <h2 className="text-2xl font-bold mb-4">Runde i {currentLeague.name}</h2>

          {displayPerspectiveMatch && !isMatchPlaying && (
            <div className="bg-white border-2 border-green-500 rounded-lg p-6 mb-6">
              <h3 className="text-2xl font-bold mb-4">Kamp Resultat</h3>
              <div className="flex justify-between items-center mb-4 gap-4">
                <div className="text-center flex-1">
                  <p className="text-sm text-gray-600">{displayPerspectiveMatch.opponent}</p>
                  <p className="text-4xl font-bold text-blue-600">{displayPerspectiveMatch.goalsAgainst}</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">-</p>
                </div>
                <div className="text-center flex-1">
                  <p className="text-sm text-gray-600">Dit Hold</p>
                  <p className="text-4xl font-bold text-green-600">{displayPerspectiveMatch.goalsFor}</p>
                </div>
              </div>

              <div className="text-center mb-4">
                {displayPerspectiveMatch.result === 'WIN' && (
                  <span className="bg-green-100 text-green-800 text-lg font-bold px-4 py-2 rounded">
                    🏆 SEJR! Tabellen er opdateret
                  </span>
                )}
                {displayPerspectiveMatch.result === 'DRAW' && (
                  <span className="bg-yellow-100 text-yellow-800 text-lg font-bold px-4 py-2 rounded">
                    ⚖️ UAFGJORT Tabellen er opdateret
                  </span>
                )}
                {displayPerspectiveMatch.result === 'LOSS' && (
                  <span className="bg-red-100 text-red-800 text-lg font-bold px-4 py-2 rounded">
                    ❌ NEDERLAG Tabellen er opdateret
                  </span>
                )}
              </div>

              <button
                onClick={() => {
                  handleNextWeek();
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition"
              >
                Gå til næste uge
              </button>
            </div>
          )}

          {isMatchPlaying && currentMatch && (
            <div className="bg-gradient-to-b from-green-100 to-green-50 rounded-lg p-6 mb-6 text-center">
              <h3 className="text-2xl font-bold mb-4">⚽ Kamp i gang...</h3>
              <div className="flex justify-between items-center mb-4 animate-pulse gap-4">
                <p className="text-lg font-semibold">{currentMatch.homeTeam.name}</p>
                <p className="text-2xl font-bold">vs</p>
                <p className="text-lg font-semibold">{currentMatch.awayTeam.name}</p>
              </div>
              <p className="text-gray-600">Rundens resultater beregnes...</p>
            </div>
          )}

          {!isMatchPlaying && playerFixture && (
            <div className="space-y-3">
              {currentFixtures.map((fixture) => {
                const isPlayerMatch = fixture.id === playerFixture.id;
                const alreadyPlayed = gameState.playedLeagueMatches.some(result => result.id === fixture.id);

                return (
                  <div
                    key={fixture.id}
                    className={`bg-white border rounded-lg p-4 transition ${
                      isPlayerMatch ? 'border-purple-300 shadow-sm' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-sm font-semibold text-gray-600">Sæson {fixture.season} • Uge {fixture.week}</span>
                          {isPlayerMatch && (
                            <span className="text-xs font-bold px-2 py-1 rounded bg-purple-100 text-purple-800">
                              Din kamp
                            </span>
                          )}
                        </div>
                        <h3 className="text-xl font-bold">
                          {fixture.homeTeam.name} - {fixture.awayTeam.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {fixture.homeTeam.name} ({fixture.homeTeam.rating}) • {fixture.awayTeam.name} ({fixture.awayTeam.rating})
                        </p>
                      </div>

                      {isPlayerMatch ? (
                        <div className="text-right">
                          <button
                            onClick={() => simulateMatch(fixture)}
                            disabled={alreadyPlayed}
                            aria-disabled={alreadyPlayed}
                            className={`font-bold py-2 px-4 rounded transition text-white ${
                              alreadyPlayed
                                ? 'bg-gray-400 cursor-not-allowed opacity-70'
                                : 'bg-purple-600 hover:bg-purple-700'
                            }`}
                          >
                            {alreadyPlayed ? '✓ Kamp spillet' : 'Start Kamp'}
                          </button>
                          {alreadyPlayed && (
                            <p className="text-xs text-gray-500 mt-2">Afsluttet for denne runde</p>
                          )}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-600 bg-gray-100 px-3 py-2 rounded">
                          Simuleres sammen med din kamp
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!isMatchPlaying && !playerFixture && (
            <div className="bg-white border border-gray-200 rounded-lg p-6 text-center text-gray-600">
              Der er ingen aktiv rundekamp for din klub lige nu, men du kan stadig se kamp-historikken og ligatabellen.
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Kamp Historie</h2>
          {playedMatches.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Ingen kampe spillet endnu</p>
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
                      <p className="text-sm text-gray-600">Sæson {match.season} • Uge {match.date}</p>
                      <h3 className="text-lg font-bold">{match.opponent}</h3>
                    </div>

                    <div className="text-center">
                      <p className="text-3xl font-bold">
                        {match.goalsFor} - {match.goalsAgainst}
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
  );
};

export default MatchView;
