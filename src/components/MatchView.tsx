import React, { useEffect, useMemo, useState } from 'react';
import { useGame } from '../context/GameContext';
import {
  calculateSquadStrength,
  getBalancedOpponentStrength,
  getMatchPerformanceRating,
} from '../data/players';
import {
  MATCH_TIMELINE,
  getSeasonFixtures,
  getTeamById,
  type MatchDetails,
  type MatchEvent,
  type MatchEventPhase,
  type MatchTimelineConfig,
  type ScheduledMatch,
  simulateDetailedMatch,
} from '../data/leagues';
import TeamBadge from './TeamBadge';

interface PlayedMatchSummary {
  id: string;
  opponentId: string;
  opponent: string;
  result: 'WIN' | 'DRAW' | 'LOSS';
  userGoals: number;
  opponentGoals: number;
  week: number;
  details?: MatchDetails;
}

interface LiveMatchState {
  fixture: ScheduledMatch;
  details: MatchDetails;
  homeTeamName: string;
  awayTeamName: string;
  homeTeamId: string;
  awayTeamId: string;
  homeGoals: number;
  awayGoals: number;
}

const TICK_DURATION_MS = 250;

const getLivePhase = (
  tick: number,
  timeline: MatchTimelineConfig,
): { phase: MatchEventPhase; minute: number; pauseMinute: number } => {
  if (tick <= timeline.firstHalfMinutes) {
    return { phase: 'FIRST_HALF', minute: tick, pauseMinute: 0 };
  }

  if (tick <= timeline.firstHalfMinutes + timeline.halftimeMinutes) {
    return {
      phase: 'HALFTIME',
      minute: timeline.firstHalfMinutes,
      pauseMinute: tick - timeline.firstHalfMinutes,
    };
  }

  const secondHalfTick = tick - timeline.firstHalfMinutes - timeline.halftimeMinutes;
  if (secondHalfTick <= timeline.secondHalfMinutes) {
    return {
      phase: 'SECOND_HALF',
      minute: timeline.firstHalfMinutes + secondHalfTick,
      pauseMinute: timeline.halftimeMinutes,
    };
  }

  return {
    phase: 'FULL_TIME',
    minute: timeline.firstHalfMinutes + timeline.secondHalfMinutes,
    pauseMinute: timeline.halftimeMinutes,
  };
};

const getPhaseLabel = (phase: MatchEventPhase, pauseMinute: number, halftimeMinutes: number) => {
  switch (phase) {
    case 'FIRST_HALF':
      return '1. halvleg';
    case 'HALFTIME':
      return `Pause ${pauseMinute}/${halftimeMinutes} min`;
    case 'SECOND_HALF':
      return '2. halvleg';
    case 'FULL_TIME':
      return 'Kampen er slut';
    default:
      return '';
  }
};

const getVisibleEvents = (
  events: MatchEvent[],
  phase: MatchEventPhase,
  minute: number,
): MatchEvent[] =>
  events.filter(event => {
    if (phase === 'FIRST_HALF') {
      return event.phase === 'FIRST_HALF' && event.minute <= minute;
    }

    if (phase === 'HALFTIME') {
      return event.phase === 'FIRST_HALF' || event.phase === 'HALFTIME';
    }

    if (phase === 'SECOND_HALF') {
      return event.phase === 'FIRST_HALF' || event.phase === 'HALFTIME' || (event.phase === 'SECOND_HALF' && event.minute <= minute);
    }

    return true;
  });

const getCurrentScore = (visibleEvents: MatchEvent[]) => {
  const latestEvent = visibleEvents[visibleEvents.length - 1];
  return {
    homeGoals: latestEvent?.homeGoals ?? 0,
    awayGoals: latestEvent?.awayGoals ?? 0,
  };
};

const countEvents = (
  events: MatchEvent[],
  type: 'chance' | 'goal' | 'yellow_card' | 'red_card',
  team: 'home' | 'away',
) => events.filter(event => event.team === team && event.type === type).length;

const swapMatchDetailsPerspective = (details?: MatchDetails): MatchDetails | undefined => {
  if (!details) {
    return undefined;
  }

  return {
    ...details,
    stats: {
      chancesHome: details.stats.chancesAway,
      chancesAway: details.stats.chancesHome,
      yellowCardsHome: details.stats.yellowCardsAway,
      yellowCardsAway: details.stats.yellowCardsHome,
      redCardsHome: details.stats.redCardsAway,
      redCardsAway: details.stats.redCardsHome,
      possessionHome: details.stats.possessionAway,
      possessionAway: details.stats.possessionHome,
    },
  };
};

const StatCard = ({ label, homeValue, awayValue }: { label: string; homeValue: string | number; awayValue: string | number }) => (
  <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-center">
    <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
    <div className="mt-1 flex items-center justify-between gap-4">
      <span className="text-lg font-bold text-blue-700">{homeValue}</span>
      <span className="text-sm font-semibold text-gray-400">vs</span>
      <span className="text-lg font-bold text-green-700">{awayValue}</span>
    </div>
  </div>
);

const MatchDetailsPanel = ({
  details,
  homeLabel,
  awayLabel,
  compact = false,
}: {
  details?: MatchDetails;
  homeLabel: string;
  awayLabel: string;
  compact?: boolean;
}) => {
  if (!details) {
    return (
      <div className="mt-4 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-600">
        Kampen blev spillet før den udvidede live-afvikling og har derfor ikke et detaljeret referat.
      </div>
    );
  }

  return (
    <div className={`mt-4 space-y-4 ${compact ? '' : 'rounded-xl border border-gray-200 bg-gray-50 p-4'}`}>
      <div>
        <h4 className="text-lg font-bold text-gray-900">Kampreferat</h4>
        <p className="mt-1 text-sm text-gray-700">{details.report.summary}</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <StatCard label="Chancer" homeValue={details.stats.chancesHome} awayValue={details.stats.chancesAway} />
        <StatCard
          label="Boldbesiddelse"
          homeValue={`${details.stats.possessionHome}%`}
          awayValue={`${details.stats.possessionAway}%`}
        />
        <StatCard label="Gule kort" homeValue={details.stats.yellowCardsHome} awayValue={details.stats.yellowCardsAway} />
        <StatCard label="Røde kort" homeValue={details.stats.redCardsHome} awayValue={details.stats.redCardsAway} />
      </div>

      <div>
        <h5 className="font-semibold text-gray-900">Kronologi</h5>
        <ol className="mt-2 space-y-2 text-sm text-gray-700">
          {details.report.highlights.map((entry, index) => (
            <li key={`${entry}-${index}`} className="rounded border border-gray-200 bg-white px-3 py-2">
              {entry}
            </li>
          ))}
        </ol>
      </div>

      {!compact && (
        <p className="text-xs text-gray-500">
          {homeLabel} er vist til venstre og {awayLabel} til højre i statistikfelterne ovenfor.
        </p>
      )}
    </div>
  );
};

const MatchView: React.FC = () => {
  const { gameState, handleNextWeek, recordMatchResult } = useGame();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming');
  const [currentMatch, setCurrentMatch] = useState<ScheduledMatch | null>(null);
  const [matchResult, setMatchResult] = useState<PlayedMatchSummary | null>(null);
  const [isMatchPlaying, setIsMatchPlaying] = useState(false);
  const [liveMatch, setLiveMatch] = useState<LiveMatchState | null>(null);
  const [liveTick, setLiveTick] = useState(0);
  const [expandedHistoryMatchId, setExpandedHistoryMatchId] = useState<string | null>(null);
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
        const userGoals = isHome ? match.homeGoals : match.awayGoals;
        const opponentGoals = isHome ? match.awayGoals : match.homeGoals;
        const result: PlayedMatchSummary['result'] = userGoals > opponentGoals ? 'WIN' : userGoals < opponentGoals ? 'LOSS' : 'DRAW';
        return {
          id: match.fixtureId,
          opponentId: isHome ? match.awayTeamId : match.homeTeamId,
          opponent: isHome ? match.awayTeamName : match.homeTeamName,
          result,
          userGoals,
          opponentGoals,
          week: match.week,
          details: isHome ? match.details : swapMatchDetailsPerspective(match.details),
        };
      })
      .sort((a, b) => b.week - a.week),
    [seasonMatches, selectedTeam],
  );
  const isSeasonComplete = fixtures.length > 0 && playedFixtureIds.size >= fixtures.length;
  const nextAdvanceStartsNewSeason = Boolean(
    matchResult
    && currentMatch
    && fixtures.length > 0
    && (playedFixtureIds.has(currentMatch.id) ? playedFixtureIds.size : playedFixtureIds.size + 1) >= fixtures.length
  );

  const squadStrength = useMemo(
    () => calculateSquadStrength(Object.values(gameState.players)),
    [gameState.players],
  );
  const currentOpponent = currentMatch ? getTeamById(currentMatch.opponentId) : null;
  const leftSideIsUser = Boolean(currentMatch?.isHome);
  const rightSideIsUser = currentMatch ? !currentMatch.isHome : false;

  useEffect(() => {
    if (!isMatchPlaying || !liveMatch) {
      return undefined;
    }

    const totalTicks =
      liveMatch.details.timeline.firstHalfMinutes
      + liveMatch.details.timeline.halftimeMinutes
      + liveMatch.details.timeline.secondHalfMinutes;

    if (liveTick >= totalTicks) {
      const timeout = window.setTimeout(() => {
        const userGoals = liveMatch.fixture.isHome ? liveMatch.homeGoals : liveMatch.awayGoals;
        const opponentGoals = liveMatch.fixture.isHome ? liveMatch.awayGoals : liveMatch.homeGoals;

        recordMatchResult(liveMatch.fixture, userGoals, opponentGoals, liveMatch.details);
        setMatchResult({
          id: liveMatch.fixture.id,
          opponentId: liveMatch.fixture.opponentId,
          opponent: liveMatch.fixture.opponent,
          result: userGoals > opponentGoals ? 'WIN' : userGoals < opponentGoals ? 'LOSS' : 'DRAW',
          userGoals,
          opponentGoals,
          week: gameState.week,
          details: liveMatch.fixture.isHome ? liveMatch.details : swapMatchDetailsPerspective(liveMatch.details),
        });
        setIsMatchPlaying(false);
        setLiveMatch(null);
      }, TICK_DURATION_MS);

      return () => window.clearTimeout(timeout);
    }

    const interval = window.setInterval(() => {
      setLiveTick(previous => Math.min(previous + 1, totalTicks));
    }, TICK_DURATION_MS);

    return () => window.clearInterval(interval);
  }, [gameState.week, isMatchPlaying, liveMatch, liveTick, recordMatchResult]);

  const livePhase = liveMatch ? getLivePhase(liveTick, liveMatch.details.timeline) : null;
  const liveEvents = liveMatch && livePhase
    ? getVisibleEvents(liveMatch.details.events, livePhase.phase, livePhase.minute)
    : [];
  const liveScore = getCurrentScore(liveEvents);
  const liveProgress = liveMatch
    ? Math.min(
      1,
      liveTick / (liveMatch.details.timeline.firstHalfMinutes + liveMatch.details.timeline.halftimeMinutes + liveMatch.details.timeline.secondHalfMinutes),
    )
    : 0;
  const liveStats = liveMatch
    ? {
      chancesHome: countEvents(liveEvents, 'chance', 'home') + countEvents(liveEvents, 'goal', 'home'),
      chancesAway: countEvents(liveEvents, 'chance', 'away') + countEvents(liveEvents, 'goal', 'away'),
      yellowCardsHome: countEvents(liveEvents, 'yellow_card', 'home'),
      yellowCardsAway: countEvents(liveEvents, 'yellow_card', 'away'),
      redCardsHome: countEvents(liveEvents, 'red_card', 'home'),
      redCardsAway: countEvents(liveEvents, 'red_card', 'away'),
      possessionHome: Math.round(50 + (liveMatch.details.stats.possessionHome - 50) * liveProgress),
    }
    : null;

  const simulateMatch = (match: ScheduledMatch) => {
    if (isMatchPlaying || !selectedTeam) {
      return;
    }

    const opponentStrength = getBalancedOpponentStrength(match.opponentRating);
    const homeTeamName = match.isHome ? selectedTeam.name : match.opponent;
    const awayTeamName = match.isHome ? match.opponent : selectedTeam.name;
    const homeTeamId = match.isHome ? selectedTeam.id : match.opponentId;
    const awayTeamId = match.isHome ? match.opponentId : selectedTeam.id;
    const detailedResult = simulateDetailedMatch(
      match.isHome ? getMatchPerformanceRating(squadStrength, true) : getMatchPerformanceRating(opponentStrength, true),
      match.isHome ? getMatchPerformanceRating(opponentStrength, false) : getMatchPerformanceRating(squadStrength, false),
      homeTeamName,
      awayTeamName,
    );

    setIsMatchPlaying(true);
    setCurrentMatch(match);
    setMatchResult(null);
    setLiveTick(0);
    setLiveMatch({
      fixture: match,
      details: detailedResult.details,
      homeTeamName,
      awayTeamName,
      homeTeamId,
      awayTeamId,
      homeGoals: detailedResult.homeGoals,
      awayGoals: detailedResult.awayGoals,
    });
  };

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Kampe</h1>

      <div>
        <div className="bg-purple-50 border-l-4 border-purple-500 p-4 mb-6 rounded">
          <p className="text-lg font-semibold">Samlet Holdstyrke: <span className="text-purple-600">{squadStrength.overall}</span></p>
          <p className="text-sm text-gray-600">Sæson {gameState.season} • Uge {gameState.week}</p>
          <p className="mt-2 text-sm text-gray-700">Kampformat: 2 x {MATCH_TIMELINE.firstHalfMinutes} minutter med {MATCH_TIMELINE.halftimeMinutes} minutters pause.</p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
            <div className="rounded bg-white/70 px-3 py-2">Målmand: <span className="font-bold">{squadStrength.goalkeeping}</span></div>
            <div className="rounded bg-white/70 px-3 py-2">Forsvar: <span className="font-bold">{squadStrength.defense}</span></div>
            <div className="rounded bg-white/70 px-3 py-2">Midtbane: <span className="font-bold">{squadStrength.midfield}</span></div>
            <div className="rounded bg-white/70 px-3 py-2">Angreb: <span className="font-bold">{squadStrength.attack}</span></div>
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

                <MatchDetailsPanel
                  details={matchResult.details}
                  homeLabel={leftSideIsUser ? 'dit hold' : matchResult.opponent}
                  awayLabel={rightSideIsUser ? 'dit hold' : matchResult.opponent}
                />

                <button
                  onClick={() => {
                    handleNextWeek();
                    setMatchResult(null);
                    setCurrentMatch(null);
                  }}
                  className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition"
                >
                  {nextAdvanceStartsNewSeason || isSeasonComplete ? 'Start næste sæson' : 'Gå til næste uge'}
                </button>
              </div>
            )}

            {isMatchPlaying && currentMatch && liveMatch && livePhase && liveStats && (
              <div className="bg-gradient-to-b from-green-100 to-green-50 rounded-lg p-6 mb-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold">⚽ Kamp i gang</h3>
                    <p className="text-sm text-gray-600">Tidslinjen følger 2 halvlege á 15 minutter med 5 minutters pause.</p>
                    <div className="mt-4 flex justify-between items-center rounded-xl border border-green-200 bg-white/80 p-4">
                      <div className="text-center flex-1">
                        <div className="mb-2 flex justify-center">
                          <TeamBadge team={getTeamById(liveMatch.homeTeamId) ?? { name: liveMatch.homeTeamName, logo: '⚽' }} size="md" />
                        </div>
                        <p className="font-semibold">{liveMatch.homeTeamName}</p>
                        <p className="text-4xl font-bold text-blue-700">{liveScore.homeGoals}</p>
                      </div>
                      <div className="px-4 text-center">
                        <p className="text-3xl font-bold text-green-800">{livePhase.minute}'</p>
                        <p className="text-sm font-semibold text-gray-600">
                          {getPhaseLabel(livePhase.phase, livePhase.pauseMinute, liveMatch.details.timeline.halftimeMinutes)}
                        </p>
                      </div>
                      <div className="text-center flex-1">
                        <div className="mb-2 flex justify-center">
                          <TeamBadge team={getTeamById(liveMatch.awayTeamId) ?? { name: liveMatch.awayTeamName, logo: '⚽' }} size="md" />
                        </div>
                        <p className="font-semibold">{liveMatch.awayTeamName}</p>
                        <p className="text-4xl font-bold text-green-700">{liveScore.awayGoals}</p>
                      </div>
                    </div>
                  </div>

                  <div className="w-full lg:w-[22rem] space-y-3">
                    <StatCard label="Chancer" homeValue={liveStats.chancesHome} awayValue={liveStats.chancesAway} />
                    <StatCard label="Boldbesiddelse" homeValue={`${liveStats.possessionHome}%`} awayValue={`${100 - liveStats.possessionHome}%`} />
                    <StatCard label="Gule kort" homeValue={liveStats.yellowCardsHome} awayValue={liveStats.yellowCardsAway} />
                    <StatCard label="Røde kort" homeValue={liveStats.redCardsHome} awayValue={liveStats.redCardsAway} />
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="text-lg font-bold mb-3">Live-begivenheder</h4>
                  <div className="max-h-72 space-y-2 overflow-y-auto rounded-xl border border-green-200 bg-white/80 p-3">
                    {liveEvents.length === 0 ? (
                      <p className="text-sm text-gray-500">Dommeren fløjter op om et øjeblik...</p>
                    ) : (
                      [...liveEvents].reverse().map((event, index) => (
                        <div key={`${event.type}-${event.minute}-${index}`} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm">
                          <div className="flex items-center justify-between gap-3">
                            <span className="font-semibold text-gray-900">{event.minute}'</span>
                            <span className="text-xs font-bold uppercase tracking-wide text-gray-500">
                              {event.phase === 'HALFTIME' ? 'Pause' : event.phase === 'SECOND_HALF' ? '2. halvleg' : event.phase === 'FULL_TIME' ? 'Slut' : '1. halvleg'}
                            </span>
                          </div>
                          <p className="mt-1 text-gray-700">{event.description}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
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
                              <span className="text-xs font-bold px-2 py-1 rounded bg-purple-100 text-purple-800">
                                2 x {MATCH_TIMELINE.firstHalfMinutes} min + {MATCH_TIMELINE.halftimeMinutes} min pause
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
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex-1">
                        <p className="text-sm text-gray-600">Sæson {gameState.season} • Uge {match.week}</p>
                        <div className="mt-1 flex items-center gap-3">
                          <TeamBadge
                            team={getTeamById(match.opponentId) ?? { name: match.opponent, logo: '⚽' }}
                            size="md"
                          />
                          <div>
                            <h3 className="text-lg font-bold">{match.opponent}</h3>
                            {match.details && (
                              <p className="text-sm text-gray-600">
                                Chancer {match.details.stats.chancesHome}-{match.details.stats.chancesAway} • Boldbesiddelse {match.details.stats.possessionHome}% / {match.details.stats.possessionAway}%
                              </p>
                            )}
                          </div>
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

                      <button
                        onClick={() => setExpandedHistoryMatchId(previous => previous === match.id ? null : match.id)}
                        className="rounded bg-white px-4 py-2 text-sm font-bold text-purple-700 shadow-sm ring-1 ring-purple-200 transition hover:bg-purple-50"
                      >
                        {expandedHistoryMatchId === match.id ? 'Skjul referat' : 'Vis referat'}
                      </button>
                    </div>

                    {expandedHistoryMatchId === match.id && (
                      <MatchDetailsPanel
                        details={match.details}
                        homeLabel="dit hold"
                        awayLabel={match.opponent}
                        compact
                      />
                    )}
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
