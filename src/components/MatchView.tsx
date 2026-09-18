import React, { useMemo, useState } from 'react';
import { useGame } from '../context/GameContext';
import { getLeagueTeams } from '../data/teams';
import { LeagueFixture, PlayedMatch } from '../types/game';
import { Team } from '../types/teams';
import { generateLeagueFixtures, getUpcomingFixtures } from '../utils/leagueUtils';
import { calculateSquadRating } from '../utils/matchUtils';

const getOpponent = (fixture: LeagueFixture, selectedTeamId: string, teams: Team[]): Team | null => {
  const opponentId = fixture.homeTeamId === selectedTeamId ? fixture.awayTeamId : fixture.homeTeamId;
  return teams.find((team) => team.id === opponentId) ?? null;
};

const getDifficulty = (teamRating: number, opponentStrength: number): 'Nem' | 'Moderat' | 'Svær' => {
  const difference = opponentStrength - teamRating;
  if (difference >= 6) {
    return 'Svær';
  }
  if (difference >= 1) {
    return 'Moderat';
  }
  return 'Nem';
};

const MatchView: React.FC = () => {
  const { gameState, handleNextWeek, playMatch } = useGame();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming');
  const [currentMatch, setCurrentMatch] = useState<LeagueFixture | null>(null);
  const [matchResult, setMatchResult] = useState<PlayedMatch | null>(null);
  const [isMatchPlaying, setIsMatchPlaying] = useState(false);

  const selectedTeam = gameState.selectedTeam;
  const leagueTeams = useMemo(() => (selectedTeam ? getLeagueTeams(selectedTeam.leagueId) : []), [selectedTeam]);
  const fixtures = useMemo(() => generateLeagueFixtures(leagueTeams), [leagueTeams]);
  const upcomingMatches = useMemo(
    () => (selectedTeam ? getUpcomingFixtures(fixtures, selectedTeam.id, gameState.week, 3) : []),
    [fixtures, gameState.week, selectedTeam],
  );
  const teamRating = calculateSquadRating(Object.values(gameState.players));

  if (!selectedTeam) {
    return <div>Ingen klub valgt</div>;
  }

  const simulateMatch = (fixture: LeagueFixture) => {
    setIsMatchPlaying(true);
    setCurrentMatch(fixture);

    window.setTimeout(() => {
      const played = playMatch(fixture.id);
      setMatchResult(played);
      setIsMatchPlaying(false);
    }, 1200);
  };

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
          Kamp Historik ({gameState.matchHistory.length})
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
                  <p className="text-sm text-gray-600">
                    {matchResult.homeTeamName}
                    {matchResult.isHome ? ' (Dit Hold)' : ''}
                  </p>
                  <p className={`text-4xl font-bold ${matchResult.isHome ? 'text-green-600' : 'text-blue-600'}`}>{matchResult.homeGoals}</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">-</p>
                </div>
                <div className="text-center flex-1">
                  <p className="text-sm text-gray-600">
                    {matchResult.awayTeamName}
                    {!matchResult.isHome ? ' (Dit Hold)' : ''}
                  </p>
                  <p className={`text-4xl font-bold ${matchResult.isHome ? 'text-blue-600' : 'text-green-600'}`}>{matchResult.awayGoals}</p>
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
                    ⚖️ UAFGJORT +10 fans, +25.000 kr
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
                Gå til næste uge
              </button>
            </div>
          )}

          {isMatchPlaying && currentMatch && (
            <div className="bg-gradient-to-b from-green-100 to-green-50 rounded-lg p-6 mb-6 text-center">
              <h3 className="text-2xl font-bold mb-4">⚽ Kamp i gang...</h3>
              <div className="flex justify-between items-center mb-4 animate-pulse">
                <p className="text-lg font-semibold">{leagueTeams.find((team) => team.id === currentMatch.homeTeamId)?.name}</p>
                <p className="text-2xl font-bold">vs</p>
                <p className="text-lg font-semibold">{leagueTeams.find((team) => team.id === currentMatch.awayTeamId)?.name}</p>
              </div>
              <p className="text-gray-600">Resultat beregnes og ligatabellen opdateres...</p>
            </div>
          )}

          {!isMatchPlaying && !matchResult && (
            <div className="space-y-3">
              {upcomingMatches.length === 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
                  <h3 className="text-xl font-bold mb-2">Sæsonen er afsluttet</h3>
                  <p className="text-gray-600">Ligatabellen er opdateret og gemt. Start et nyt spil for at spille en ny sæson.</p>
                </div>
              )}

              {upcomingMatches.map((fixture, index) => {
                const opponent = getOpponent(fixture, selectedTeam.id, leagueTeams);
                if (!opponent) {
                  return null;
                }

                const difficulty = getDifficulty(teamRating, opponent.strength);
                const canPlayNow = fixture.week === gameState.week && index === 0;

                return (
                  <div
                    key={fixture.id}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                  >
                    <div className="flex justify-between items-start mb-3 gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-sm font-semibold text-gray-600">Uge {fixture.week}</span>
                          <span className={`text-xs font-bold px-2 py-1 rounded ${fixture.homeTeamId === selectedTeam.id ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                            {fixture.homeTeamId === selectedTeam.id ? '🏠 Hjemme' : '✈️ Ude'}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold">{fixture.homeTeamId === selectedTeam.id ? `${selectedTeam.name} vs ${opponent.name}` : `${opponent.name} vs ${selectedTeam.name}`}</h3>
                        <p className="text-sm text-gray-600">
                          Modstander: {opponent.name} • Rating: {opponent.strength} • Sværhedsgrad: {difficulty}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className={`text-xs font-bold px-3 py-1 rounded ${
                          difficulty === 'Nem'
                            ? 'bg-green-100 text-green-800'
                            : difficulty === 'Moderat'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                        }`}>
                          {difficulty}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => simulateMatch(fixture)}
                      disabled={!canPlayNow}
                      className={`w-full font-bold py-2 px-4 rounded transition ${
                        canPlayNow
                          ? 'bg-purple-600 hover:bg-purple-700 text-white'
                          : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {canPlayNow ? 'Start Kamp' : 'Spil først den næste ligakamp'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Kamp Historik</h2>
          {gameState.matchHistory.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Ingen kampe spillet endnu</p>
          ) : (
            <div className="space-y-3">
              {gameState.matchHistory.map((match) => (
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
                      <p className="text-sm text-gray-600">Uge {match.week}</p>
                      <h3 className="text-lg font-bold">{match.homeTeamName} vs {match.awayTeamName}</h3>
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
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MatchView;
