import { Team } from '../types/teams';

export type MatchDifficulty = 'Nem' | 'Moderat' | 'Svær';

export interface LeagueDefinition {
  name: string;
  color: string;
  teams: Team[];
}

export interface ScheduledMatch {
  id: string;
  week: number;
  opponentId: string;
  opponent: string;
  isHome: boolean;
  difficulty: MatchDifficulty;
  opponentRating: number;
}

export interface LeagueFixture {
  id: string;
  week: number;
  homeTeamId: string;
  homeTeamName: string;
  awayTeamId: string;
  awayTeamName: string;
}

export interface LeagueMatchRecord {
  fixtureId: string;
  season: number;
  week: number;
  homeTeamId: string;
  homeTeamName: string;
  awayTeamId: string;
  awayTeamName: string;
  homeGoals: number;
  awayGoals: number;
  isUserMatch: boolean;
  details?: MatchDetails;
}

export type MatchEventPhase = 'FIRST_HALF' | 'HALFTIME' | 'SECOND_HALF' | 'FULL_TIME';
export type MatchEventType = 'chance' | 'goal' | 'yellow_card' | 'red_card' | 'halftime' | 'second_half' | 'full_time';
export type MatchEventTeam = 'home' | 'away' | 'neutral';

export interface MatchTimelineConfig {
  firstHalfMinutes: number;
  halftimeMinutes: number;
  secondHalfMinutes: number;
}

export interface MatchStats {
  chancesHome: number;
  chancesAway: number;
  yellowCardsHome: number;
  yellowCardsAway: number;
  redCardsHome: number;
  redCardsAway: number;
  possessionHome: number;
  possessionAway: number;
}

export interface MatchEvent {
  minute: number;
  phase: MatchEventPhase;
  type: MatchEventType;
  team: MatchEventTeam;
  description: string;
  homeGoals: number;
  awayGoals: number;
}

export interface MatchReport {
  summary: string;
  highlights: string[];
}

export interface MatchDetails {
  timeline: MatchTimelineConfig;
  stats: MatchStats;
  events: MatchEvent[];
  report: MatchReport;
}

export interface LeagueStanding {
  teamId: string;
  teamName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

interface TeamSeed {
  id: string;
  name: string;
  logo: string;
  primaryColor: string;
  secondaryColor: string;
  baseRating: number;
}

export const MATCH_TIMELINE: MatchTimelineConfig = {
  firstHalfMinutes: 15,
  halftimeMinutes: 5,
  secondHalfMinutes: 15,
};

const MATCH_EVENT_TYPE_PRIORITY: Record<MatchEventType, number> = {
  goal: 0,
  red_card: 1,
  yellow_card: 2,
  chance: 3,
  halftime: 4,
  second_half: 5,
  full_time: 6,
};

const createLeagueTeams = (league: string, teams: TeamSeed[]): Team[] =>
  teams.map(team => ({
    ...team,
    league,
  }));

const LEGACY_TEAM_ID_ALIASES: Record<string, string> = {
  lolland: 'nykoebing',
  fredriksberg: 'fa-2000',
  ballerup: 'ab',
  kastrup: 'sundby',
  glostrup: 'vanloese',
  'tårnby': 'fremad-amager',
  virum: 'hik',
};

export const LEAGUES: LeagueDefinition[] = [
  // Representative two-tone badge colors for each club. These are stylized club colors,
  // not official crest assets, and conservative shades are used where exact brand specs vary.
  {
    name: 'Superliga',
    color: 'from-blue-500 to-blue-600',
    teams: createLeagueTeams('Superliga', [
      { id: 'fckoebenhavn', name: 'FC København', logo: '🔵', primaryColor: '#004B93', secondaryColor: '#FFFFFF', baseRating: 82 },
      { id: 'broendby', name: 'Brøndby IF', logo: '🟡', primaryColor: '#F2C300', secondaryColor: '#1D4ED8', baseRating: 81 },
      { id: 'midtjylland', name: 'FC Midtjylland', logo: '🔴', primaryColor: '#C62828', secondaryColor: '#111827', baseRating: 81 },
      { id: 'nordsjælland', name: 'FC Nordsjælland', logo: '⚪', primaryColor: '#C62828', secondaryColor: '#F59E0B', baseRating: 79 },
      { id: 'agf', name: 'AGF', logo: '🔷', primaryColor: '#1E3A8A', secondaryColor: '#FFFFFF', baseRating: 78 },
      { id: 'silkeborg', name: 'Silkeborg IF', logo: '🔶', primaryColor: '#D62828', secondaryColor: '#FFFFFF', baseRating: 77 },
      { id: 'randers', name: 'Randers FC', logo: '🟠', primaryColor: '#6CB4EE', secondaryColor: '#111827', baseRating: 76 },
      { id: 'viborg', name: 'Viborg FF', logo: '🟢', primaryColor: '#15803D', secondaryColor: '#FFFFFF', baseRating: 75 },
      { id: 'ob', name: 'OB', logo: '⚪', primaryColor: '#1D4ED8', secondaryColor: '#FFFFFF', baseRating: 75 },
      { id: 'soenderjyske', name: 'Sønderjyske', logo: '🔹', primaryColor: '#60A5FA', secondaryColor: '#1E3A8A', baseRating: 74 },
      { id: 'lyngby', name: 'Lyngby BK', logo: '🔵', primaryColor: '#1D4ED8', secondaryColor: '#FFFFFF', baseRating: 73 },
      { id: 'horsens', name: 'AC Horsens', logo: '🟡', primaryColor: '#F2C300', secondaryColor: '#111827', baseRating: 72 },
    ]),
  },
  {
    name: '1. division',
    color: 'from-orange-500 to-orange-600',
    teams: createLeagueTeams('1. division', [
      { id: 'aalborg', name: 'AaB', logo: '⚫', primaryColor: '#C8102E', secondaryColor: '#FFFFFF', baseRating: 71 },
      { id: 'vejle', name: 'Vejle BK', logo: '🔴', primaryColor: '#B91C1C', secondaryColor: '#FFFFFF', baseRating: 71 },
      { id: 'fredericia', name: 'FC Fredericia', logo: '⚪', primaryColor: '#DC2626', secondaryColor: '#111827', baseRating: 70 },
      { id: 'hvidovre', name: 'Hvidovre IF', logo: '🔴', primaryColor: '#D62828', secondaryColor: '#FFFFFF', baseRating: 69 },
      { id: 'hilleroed', name: 'Hillerød Fodbold', logo: '🟠', primaryColor: '#F97316', secondaryColor: '#111827', baseRating: 69 },
      { id: 'kolding', name: 'Kolding IF', logo: '🔴', primaryColor: '#C8102E', secondaryColor: '#FFFFFF', baseRating: 68 },
      { id: 'esbjerg', name: 'Esbjerg fB', logo: '🔵', primaryColor: '#1D4ED8', secondaryColor: '#FFFFFF', baseRating: 68 },
      { id: 'hobro', name: 'Hobro IK', logo: '🟡', primaryColor: '#F2C300', secondaryColor: '#1E3A8A', baseRating: 67 },
      { id: 'hb-koege', name: 'HB Køge', logo: '🔷', primaryColor: '#2563EB', secondaryColor: '#111827', baseRating: 67 },
      { id: 'vendsyssel', name: 'Vendsyssel FF', logo: '🔵', primaryColor: '#2563EB', secondaryColor: '#FFFFFF', baseRating: 66 },
      { id: 'aarhus-fremad', name: 'Aarhus Fremad', logo: '🟣', primaryColor: '#1D4ED8', secondaryColor: '#F2C300', baseRating: 66 },
      { id: 'ab', name: 'AB', logo: '🟢', primaryColor: '#15803D', secondaryColor: '#FFFFFF', baseRating: 65 },
    ]),
  },
  {
    name: '2. division',
    color: 'from-green-500 to-green-600',
    teams: createLeagueTeams('2. division', [
      { id: 'naestved', name: 'Næstved BK', logo: '🟢', primaryColor: '#15803D', secondaryColor: '#FFFFFF', baseRating: 64 },
      { id: 'roskilde', name: 'FC Roskilde', logo: '🟡', primaryColor: '#F2C300', secondaryColor: '#111827', baseRating: 64 },
      { id: 'fremad-amager', name: 'Fremad Amager', logo: '🔵', primaryColor: '#2563EB', secondaryColor: '#F2C300', baseRating: 63 },
      { id: 'b93', name: 'B.93', logo: '⚪', primaryColor: '#D62828', secondaryColor: '#FFFFFF', baseRating: 63 },
      { id: 'thisted', name: 'Thisted FC', logo: '🔵', primaryColor: '#1D4ED8', secondaryColor: '#FFFFFF', baseRating: 63 },
      { id: 'middelfart', name: 'Middelfart BK', logo: '⚪', primaryColor: '#1E3A8A', secondaryColor: '#FFFFFF', baseRating: 62 },
      { id: 'skive', name: 'Skive IK', logo: '🔵', primaryColor: '#2563EB', secondaryColor: '#FFFFFF', baseRating: 62 },
      { id: 'brabrand', name: 'Brabrand IF', logo: '🟡', primaryColor: '#F2C300', secondaryColor: '#1D4ED8', baseRating: 61 },
      { id: 'vsk-aarhus', name: 'VSK Aarhus', logo: '🔷', primaryColor: '#1E3A8A', secondaryColor: '#FFFFFF', baseRating: 61 },
      { id: 'fa-2000', name: 'FA 2000', logo: '🟣', primaryColor: '#7C3AED', secondaryColor: '#FFFFFF', baseRating: 60 },
      { id: 'hik', name: 'HIK', logo: '⚫', primaryColor: '#111827', secondaryColor: '#F2C300', baseRating: 60 },
      { id: 'nykoebing', name: 'Nykøbing FC', logo: '🟠', primaryColor: '#F97316', secondaryColor: '#FFFFFF', baseRating: 59 },
    ]),
  },
  {
    name: '3. division',
    color: 'from-purple-500 to-purple-600',
    teams: createLeagueTeams('3. division', [
      { id: 'fc-helsingoer', name: 'FC Helsingør', logo: '🔴', primaryColor: '#D62828', secondaryColor: '#FFFFFF', baseRating: 58 },
      { id: 'frem', name: 'BK Frem', logo: '🟠', primaryColor: '#C8102E', secondaryColor: '#0057A6', baseRating: 58 },
      { id: 'holbaek', name: 'Holbæk B&I', logo: '🔵', primaryColor: '#1D4ED8', secondaryColor: '#FFFFFF', baseRating: 57 },
      { id: 'broenshoej', name: 'Brønshøj', logo: '🟡', primaryColor: '#F2C300', secondaryColor: '#111827', baseRating: 57 },
      { id: 'ishoej', name: 'Ishøj IF', logo: '🔴', primaryColor: '#D62828', secondaryColor: '#FFFFFF', baseRating: 56 },
      { id: 'vanloese', name: 'Vanløse IF', logo: '⚪', primaryColor: '#15803D', secondaryColor: '#FFFFFF', baseRating: 56 },
      { id: 'naesby', name: 'Næsby BK', logo: '🟢', primaryColor: '#16A34A', secondaryColor: '#FFFFFF', baseRating: 55 },
      { id: 'holstebro', name: 'Holstebro BK', logo: '🔵', primaryColor: '#1D4ED8', secondaryColor: '#FFFFFF', baseRating: 55 },
      { id: 'asa-aarhus', name: 'ASA Aarhus', logo: '🔷', primaryColor: '#2563EB', secondaryColor: '#FFFFFF', baseRating: 54 },
      { id: 'sundby', name: 'Sundby BK', logo: '🟡', primaryColor: '#F2C300', secondaryColor: '#111827', baseRating: 54 },
      { id: 'ringsted', name: 'Ringsted IF', logo: '🟣', primaryColor: '#7C3AED', secondaryColor: '#FFFFFF', baseRating: 53 },
      { id: 'hoersholm-usseroed', name: 'Hørsholm-Usserød IK', logo: '⚪', primaryColor: '#FFFFFF', secondaryColor: '#15803D', baseRating: 53 },
    ]),
  },
];

const getDifficulty = (rating: number): MatchDifficulty => {
  if (rating > 78) return 'Svær';
  if (rating > 66) return 'Moderat';
  return 'Nem';
};

export const getTeamById = (teamId?: string | null): Team | null => {
  if (!teamId) return null;

  const resolvedTeamId = LEGACY_TEAM_ID_ALIASES[teamId] ?? teamId;

  for (const league of LEAGUES) {
    const team = league.teams.find(candidate => candidate.id === resolvedTeamId);
    if (team) {
      return team;
    }
  }

  return null;
};

export const getLeagueByTeamId = (teamId?: string | null): LeagueDefinition | null => {
  if (!teamId) return null;

  const resolvedTeamId = LEGACY_TEAM_ID_ALIASES[teamId] ?? teamId;
  return LEAGUES.find(league => league.teams.some(team => team.id === resolvedTeamId)) ?? null;
};

const buildRoundRobinFixtures = (teams: Team[]): LeagueFixture[] => {
  if (teams.length < 2 || teams.length % 2 !== 0) {
    return [];
  }

  const rounds = teams.length - 1;
  const halfSize = teams.length / 2;
  let rotation = [...teams];
  const firstHalf: LeagueFixture[] = [];

  for (let round = 0; round < rounds; round += 1) {
    for (let index = 0; index < halfSize; index += 1) {
      const homeCandidate = rotation[index];
      const awayCandidate = rotation[rotation.length - 1 - index];
      const shouldSwap = (round + index) % 2 === 1;
      const homeTeam = shouldSwap ? awayCandidate : homeCandidate;
      const awayTeam = shouldSwap ? homeCandidate : awayCandidate;

      firstHalf.push({
        id: `fixture-${round + 1}-${homeTeam.id}-${awayTeam.id}`,
        week: round + 1,
        homeTeamId: homeTeam.id,
        homeTeamName: homeTeam.name,
        awayTeamId: awayTeam.id,
        awayTeamName: awayTeam.name,
      });
    }

    rotation = [rotation[0], rotation[rotation.length - 1], ...rotation.slice(1, -1)];
  }

  const secondHalf = firstHalf.map(fixture => ({
    id: `fixture-${fixture.week + rounds}-${fixture.awayTeamId}-${fixture.homeTeamId}`,
    week: fixture.week + rounds,
    homeTeamId: fixture.awayTeamId,
    homeTeamName: fixture.awayTeamName,
    awayTeamId: fixture.homeTeamId,
    awayTeamName: fixture.homeTeamName,
  }));

  return [...firstHalf, ...secondHalf];
};

export const getLeagueSeasonSchedule = (selectedTeam: Team | null): LeagueFixture[] => {
  if (!selectedTeam) return [];

  const league = getLeagueByTeamId(selectedTeam.id);
  if (!league) return [];

  return buildRoundRobinFixtures(league.teams).sort((a, b) => a.week - b.week);
};

export const getSeasonFixtures = (selectedTeam: Team | null): ScheduledMatch[] => {
  if (!selectedTeam) return [];

  const currentTeam = getTeamById(selectedTeam.id) ?? selectedTeam;

  return getLeagueSeasonSchedule(currentTeam)
    .filter(fixture => fixture.homeTeamId === currentTeam.id || fixture.awayTeamId === currentTeam.id)
    .map(fixture => {
      const isHome = fixture.homeTeamId === currentTeam.id;
      const opponentId = isHome ? fixture.awayTeamId : fixture.homeTeamId;
      const opponent = getTeamById(opponentId);

      return {
        id: fixture.id,
        week: fixture.week,
        opponentId,
        opponent: opponent?.name ?? (isHome ? fixture.awayTeamName : fixture.homeTeamName),
        isHome,
        difficulty: getDifficulty(opponent?.baseRating ?? 70),
        opponentRating: opponent?.baseRating ?? 70,
      };
    });
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const randomInt = (min: number, max: number, rng: () => number) =>
  Math.floor(rng() * (max - min + 1)) + min;

const simulateScoreWithRng = (homeRating: number, awayRating: number, rng: () => number) => {
  const diff = homeRating - awayRating;
  const winProb = Math.max(0.15, Math.min(0.75, 0.45 + diff / 200));
  const drawProb = 0.22;
  const roll = rng();

  if (roll < winProb) {
    const homeGoals = randomInt(1, 3, rng);
    const awayGoals = randomInt(0, Math.max(0, homeGoals - 1), rng);
    return { homeGoals, awayGoals };
  }

  if (roll < winProb + drawProb) {
    const homeGoals = randomInt(0, 2, rng);
    return { homeGoals, awayGoals: homeGoals };
  }

  const awayGoals = randomInt(1, 3, rng);
  const homeGoals = randomInt(0, Math.max(0, awayGoals - 1), rng);
  return { homeGoals, awayGoals };
};

const buildMinuteSlots = (
  count: number,
  totalMinutes: number,
  rng: () => number,
): number[] => {
  const slots = new Set<number>();

  while (slots.size < count) {
    slots.add(randomInt(1, totalMinutes, rng));
  }

  return Array.from(slots).sort((a, b) => a - b);
};

const getPhaseForMinute = (minute: number, timeline: MatchTimelineConfig): MatchEventPhase =>
  minute <= timeline.firstHalfMinutes ? 'FIRST_HALF' : 'SECOND_HALF';

const summarizeResult = (homeGoals: number, awayGoals: number) => {
  if (homeGoals > awayGoals) {
    return 'hjemmesejr';
  }

  if (homeGoals < awayGoals) {
    return 'udesejr';
  }

  return 'uafgjort';
};

const buildMatchHighlights = (
  events: MatchEvent[],
  homeTeamName: string,
  awayTeamName: string,
  stats: MatchStats,
): string[] => {
  const priorityEvents = events.filter(event =>
    event.type === 'goal'
    || event.type === 'red_card'
    || event.type === 'yellow_card'
    || event.type === 'halftime'
    || event.type === 'full_time',
  );

  const highlights = priorityEvents.map(event => `${event.minute}'. ${event.description}`);
  highlights.push(
    `Boldbesiddelse: ${homeTeamName} ${stats.possessionHome}% • ${awayTeamName} ${stats.possessionAway}%`,
    `Chancer: ${homeTeamName} ${stats.chancesHome} • ${awayTeamName} ${stats.chancesAway}`,
  );

  if (stats.yellowCardsHome > 0 || stats.yellowCardsAway > 0 || stats.redCardsHome > 0 || stats.redCardsAway > 0) {
    highlights.push(
      `Kort: ${homeTeamName} ${stats.yellowCardsHome} gule/${stats.redCardsHome} røde • ${awayTeamName} ${stats.yellowCardsAway} gule/${stats.redCardsAway} røde`,
    );
  }

  return highlights;
};

const normalizeTimeline = (timeline: unknown): MatchTimelineConfig => {
  if (!timeline || typeof timeline !== 'object') {
    return MATCH_TIMELINE;
  }

  const candidate = timeline as Partial<MatchTimelineConfig>;
  return {
    firstHalfMinutes: typeof candidate.firstHalfMinutes === 'number' && candidate.firstHalfMinutes > 0
      ? Math.floor(candidate.firstHalfMinutes)
      : MATCH_TIMELINE.firstHalfMinutes,
    halftimeMinutes: typeof candidate.halftimeMinutes === 'number' && candidate.halftimeMinutes >= 0
      ? Math.floor(candidate.halftimeMinutes)
      : MATCH_TIMELINE.halftimeMinutes,
    secondHalfMinutes: typeof candidate.secondHalfMinutes === 'number' && candidate.secondHalfMinutes > 0
      ? Math.floor(candidate.secondHalfMinutes)
      : MATCH_TIMELINE.secondHalfMinutes,
  };
};

const normalizeMatchStats = (stats: unknown): MatchStats | null => {
  if (!stats || typeof stats !== 'object') {
    return null;
  }

  const candidate = stats as Partial<MatchStats>;
  const numericKeys: Array<keyof MatchStats> = [
    'chancesHome',
    'chancesAway',
    'yellowCardsHome',
    'yellowCardsAway',
    'redCardsHome',
    'redCardsAway',
    'possessionHome',
    'possessionAway',
  ];

  for (const key of numericKeys) {
    if (typeof candidate[key] !== 'number') {
      return null;
    }
  }

  return {
    chancesHome: Math.max(0, Math.floor(candidate.chancesHome ?? 0)),
    chancesAway: Math.max(0, Math.floor(candidate.chancesAway ?? 0)),
    yellowCardsHome: Math.max(0, Math.floor(candidate.yellowCardsHome ?? 0)),
    yellowCardsAway: Math.max(0, Math.floor(candidate.yellowCardsAway ?? 0)),
    redCardsHome: Math.max(0, Math.floor(candidate.redCardsHome ?? 0)),
    redCardsAway: Math.max(0, Math.floor(candidate.redCardsAway ?? 0)),
    possessionHome: clamp(Math.round(candidate.possessionHome ?? 50), 0, 100),
    possessionAway: clamp(Math.round(candidate.possessionAway ?? 50), 0, 100),
  };
};

const normalizeMatchEvents = (events: unknown): MatchEvent[] => {
  if (!Array.isArray(events)) {
    return [];
  }

  return events.reduce((acc, rawEvent) => {
    if (!rawEvent || typeof rawEvent !== 'object') {
      return acc;
    }

    const candidate = rawEvent as Partial<MatchEvent>;
    if (
      typeof candidate.minute !== 'number'
      || typeof candidate.description !== 'string'
      || typeof candidate.homeGoals !== 'number'
      || typeof candidate.awayGoals !== 'number'
      || !candidate.phase
      || !candidate.type
      || !candidate.team
    ) {
      return acc;
    }

    if (!['FIRST_HALF', 'HALFTIME', 'SECOND_HALF', 'FULL_TIME'].includes(candidate.phase)) {
      return acc;
    }

    if (!['chance', 'goal', 'yellow_card', 'red_card', 'halftime', 'second_half', 'full_time'].includes(candidate.type)) {
      return acc;
    }

    if (!['home', 'away', 'neutral'].includes(candidate.team)) {
      return acc;
    }

    acc.push({
      minute: Math.max(0, Math.floor(candidate.minute)),
      phase: candidate.phase,
      type: candidate.type,
      team: candidate.team,
      description: candidate.description,
      homeGoals: Math.max(0, Math.floor(candidate.homeGoals)),
      awayGoals: Math.max(0, Math.floor(candidate.awayGoals)),
    });
    return acc;
  }, [] as MatchEvent[])
    .sort((a, b) =>
      a.minute - b.minute
      || MATCH_EVENT_TYPE_PRIORITY[a.type] - MATCH_EVENT_TYPE_PRIORITY[b.type]
      || a.description.localeCompare(b.description, 'da-DK')
    );
};

const normalizeMatchReport = (report: unknown): MatchReport | null => {
  if (!report || typeof report !== 'object') {
    return null;
  }

  const candidate = report as Partial<MatchReport>;
  if (typeof candidate.summary !== 'string' || !Array.isArray(candidate.highlights)) {
    return null;
  }

  return {
    summary: candidate.summary,
    highlights: candidate.highlights.filter((entry): entry is string => typeof entry === 'string'),
  };
};

const normalizeMatchDetails = (details: unknown): MatchDetails | undefined => {
  if (!details || typeof details !== 'object') {
    return undefined;
  }

  const candidate = details as Partial<MatchDetails>;
  const stats = normalizeMatchStats(candidate.stats);
  const report = normalizeMatchReport(candidate.report);
  const events = normalizeMatchEvents(candidate.events);

  if (!stats || !report || events.length === 0) {
    return undefined;
  }

  return {
    timeline: normalizeTimeline(candidate.timeline),
    stats: {
      ...stats,
      possessionAway: clamp(100 - stats.possessionHome, 0, 100),
    },
    events,
    report,
  };
};

export const normalizeLeagueMatchRecord = (rawMatch: unknown): LeagueMatchRecord | null => {
  if (!rawMatch || typeof rawMatch !== 'object') {
    return null;
  }

  const candidate = rawMatch as Partial<LeagueMatchRecord>;
  if (
    typeof candidate.fixtureId !== 'string'
    || typeof candidate.season !== 'number'
    || typeof candidate.week !== 'number'
    || typeof candidate.homeTeamId !== 'string'
    || typeof candidate.homeTeamName !== 'string'
    || typeof candidate.awayTeamId !== 'string'
    || typeof candidate.awayTeamName !== 'string'
    || typeof candidate.homeGoals !== 'number'
    || typeof candidate.awayGoals !== 'number'
    || typeof candidate.isUserMatch !== 'boolean'
  ) {
    return null;
  }

  return {
    fixtureId: candidate.fixtureId,
    season: Math.max(1, Math.floor(candidate.season)),
    week: Math.max(1, Math.floor(candidate.week)),
    homeTeamId: candidate.homeTeamId,
    homeTeamName: candidate.homeTeamName,
    awayTeamId: candidate.awayTeamId,
    awayTeamName: candidate.awayTeamName,
    homeGoals: Math.max(0, Math.floor(candidate.homeGoals)),
    awayGoals: Math.max(0, Math.floor(candidate.awayGoals)),
    isUserMatch: candidate.isUserMatch,
    details: normalizeMatchDetails(candidate.details),
  };
};

export const normalizeLeagueMatchRecords = (matches: unknown): LeagueMatchRecord[] => {
  if (!Array.isArray(matches)) {
    return [];
  }

  return matches.reduce((acc, rawMatch) => {
    const normalized = normalizeLeagueMatchRecord(rawMatch);
    if (normalized) {
      acc.push(normalized);
    }
    return acc;
  }, [] as LeagueMatchRecord[]);
};

export const simulateDetailedMatch = (
  homeRating: number,
  awayRating: number,
  homeTeamName: string,
  awayTeamName: string,
  rng: () => number = Math.random,
): { homeGoals: number; awayGoals: number; details: MatchDetails } => {
  const score = simulateScoreWithRng(homeRating, awayRating, rng);
  const totalMinutes = MATCH_TIMELINE.firstHalfMinutes + MATCH_TIMELINE.secondHalfMinutes;
  const homeEdge = clamp((homeRating - awayRating) / 3, -8, 8);
  const possessionHome = clamp(Math.round(50 + homeEdge + (rng() * 6 - 3)), 38, 62);
  const chancesHome = Math.max(score.homeGoals + 2, Math.round(4 + possessionHome / 18 + rng() * 3));
  const chancesAway = Math.max(score.awayGoals + 2, Math.round(4 + (100 - possessionHome) / 18 + rng() * 3));
  const yellowCardsHome = randomInt(0, 2 + (score.awayGoals > score.homeGoals ? 1 : 0), rng);
  const yellowCardsAway = randomInt(0, 2 + (score.homeGoals > score.awayGoals ? 1 : 0), rng);
  const redCardsHome = yellowCardsHome > 1 && rng() > 0.9 ? 1 : 0;
  const redCardsAway = yellowCardsAway > 1 && rng() > 0.9 ? 1 : 0;

  const homeGoalMinutes = buildMinuteSlots(score.homeGoals, totalMinutes, rng);
  const awayGoalMinutes = buildMinuteSlots(score.awayGoals, totalMinutes, rng);
  const homeChanceMinutes = buildMinuteSlots(Math.max(0, chancesHome - score.homeGoals), totalMinutes, rng);
  const awayChanceMinutes = buildMinuteSlots(Math.max(0, chancesAway - score.awayGoals), totalMinutes, rng);
  const homeYellowCardMinutes = buildMinuteSlots(yellowCardsHome, totalMinutes, rng);
  const awayYellowCardMinutes = buildMinuteSlots(yellowCardsAway, totalMinutes, rng);
  const homeRedCardMinutes = buildMinuteSlots(redCardsHome, totalMinutes, rng);
  const awayRedCardMinutes = buildMinuteSlots(redCardsAway, totalMinutes, rng);

  const events: MatchEvent[] = [];

  for (const minute of homeChanceMinutes) {
    events.push({
      minute,
      phase: getPhaseForMinute(minute, MATCH_TIMELINE),
      type: 'chance',
      team: 'home',
      description: `Stor chance til ${homeTeamName}, men afslutningen bliver reddet.`,
      homeGoals: 0,
      awayGoals: 0,
    });
  }

  for (const minute of awayChanceMinutes) {
    events.push({
      minute,
      phase: getPhaseForMinute(minute, MATCH_TIMELINE),
      type: 'chance',
      team: 'away',
      description: `${awayTeamName} spiller sig frem til en chance, men brænder.`,
      homeGoals: 0,
      awayGoals: 0,
    });
  }

  for (const minute of homeYellowCardMinutes) {
    events.push({
      minute,
      phase: getPhaseForMinute(minute, MATCH_TIMELINE),
      type: 'yellow_card',
      team: 'home',
      description: `Gult kort til ${homeTeamName} efter en sen tackling.`,
      homeGoals: 0,
      awayGoals: 0,
    });
  }

  for (const minute of awayYellowCardMinutes) {
    events.push({
      minute,
      phase: getPhaseForMinute(minute, MATCH_TIMELINE),
      type: 'yellow_card',
      team: 'away',
      description: `${awayTeamName} får kampens gule kort.`,
      homeGoals: 0,
      awayGoals: 0,
    });
  }

  for (const minute of homeRedCardMinutes) {
    events.push({
      minute,
      phase: getPhaseForMinute(minute, MATCH_TIMELINE),
      type: 'red_card',
      team: 'home',
      description: `Rødt kort! ${homeTeamName} må spille færdig med ti mand.`,
      homeGoals: 0,
      awayGoals: 0,
    });
  }

  for (const minute of awayRedCardMinutes) {
    events.push({
      minute,
      phase: getPhaseForMinute(minute, MATCH_TIMELINE),
      type: 'red_card',
      team: 'away',
      description: `Rødt kort til ${awayTeamName} efter en grov forseelse.`,
      homeGoals: 0,
      awayGoals: 0,
    });
  }

  for (const minute of homeGoalMinutes) {
    events.push({
      minute,
      phase: getPhaseForMinute(minute, MATCH_TIMELINE),
      type: 'goal',
      team: 'home',
      description: `MÅL! ${homeTeamName} bringer sig foran.`,
      homeGoals: 0,
      awayGoals: 0,
    });
  }

  for (const minute of awayGoalMinutes) {
    events.push({
      minute,
      phase: getPhaseForMinute(minute, MATCH_TIMELINE),
      type: 'goal',
      team: 'away',
      description: `MÅL! ${awayTeamName} scorer og ændrer kampbilledet.`,
      homeGoals: 0,
      awayGoals: 0,
    });
  }

  let runningHomeGoals = 0;
  let runningAwayGoals = 0;
  const sortedEvents = events
    .sort((a, b) =>
      a.minute - b.minute
      || MATCH_EVENT_TYPE_PRIORITY[a.type] - MATCH_EVENT_TYPE_PRIORITY[b.type]
      || a.description.localeCompare(b.description, 'da-DK')
    )
    .map(event => {
      if (event.type === 'goal' && event.team === 'home') {
        runningHomeGoals += 1;
      } else if (event.type === 'goal' && event.team === 'away') {
        runningAwayGoals += 1;
      }

      return {
        ...event,
        homeGoals: runningHomeGoals,
        awayGoals: runningAwayGoals,
      };
    });

  const halftimeGoals = sortedEvents
    .filter(event => event.type === 'goal' && event.minute <= MATCH_TIMELINE.firstHalfMinutes)
    .slice(-1)[0];
  const latestGoal = sortedEvents.filter(event => event.type === 'goal').slice(-1)[0];

  sortedEvents.push(
    {
      minute: MATCH_TIMELINE.firstHalfMinutes,
      phase: 'HALFTIME',
      type: 'halftime',
      team: 'neutral',
      description: `Pause efter 15 minutter: ${homeTeamName} ${halftimeGoals?.homeGoals ?? 0}-${halftimeGoals?.awayGoals ?? 0} ${awayTeamName}.`,
      homeGoals: halftimeGoals?.homeGoals ?? 0,
      awayGoals: halftimeGoals?.awayGoals ?? 0,
    },
    {
      minute: MATCH_TIMELINE.firstHalfMinutes + 1,
      phase: 'SECOND_HALF',
      type: 'second_half',
      team: 'neutral',
      description: '2. halvleg er sat i gang.',
      homeGoals: halftimeGoals?.homeGoals ?? 0,
      awayGoals: halftimeGoals?.awayGoals ?? 0,
    },
    {
      minute: totalMinutes,
      phase: 'FULL_TIME',
      type: 'full_time',
      team: 'neutral',
      description: `Slutfløjt: ${homeTeamName} ${score.homeGoals}-${score.awayGoals} ${awayTeamName}.`,
      homeGoals: latestGoal?.homeGoals ?? score.homeGoals,
      awayGoals: latestGoal?.awayGoals ?? score.awayGoals,
    },
  );

  const normalizedEvents = normalizeMatchEvents(sortedEvents);
  const stats: MatchStats = {
    chancesHome,
    chancesAway,
    yellowCardsHome,
    yellowCardsAway,
    redCardsHome,
    redCardsAway,
    possessionHome,
    possessionAway: 100 - possessionHome,
  };

  return {
    homeGoals: score.homeGoals,
    awayGoals: score.awayGoals,
    details: {
      timeline: MATCH_TIMELINE,
      stats,
      events: normalizedEvents,
      report: {
        summary: `${homeTeamName} og ${awayTeamName} spillede ${summarizeResult(score.homeGoals, score.awayGoals)} efter 2x15 minutter og en pause på 5 minutter. Slutresultatet blev ${score.homeGoals}-${score.awayGoals}.`,
        highlights: buildMatchHighlights(normalizedEvents, homeTeamName, awayTeamName, stats),
      },
    },
  };
};

export const simulateScore = (homeRating: number, awayRating: number) =>
  simulateScoreWithRng(homeRating, awayRating, Math.random);

export const buildLeagueStandings = (
  selectedTeam: Team | null,
  season: number,
  matches: LeagueMatchRecord[],
): LeagueStanding[] => {
  if (!selectedTeam) return [];

  const league = getLeagueByTeamId(selectedTeam.id);
  if (!league) return [];

  const standings = new Map<string, LeagueStanding>(
    league.teams.map(team => ([
      team.id,
      {
        teamId: team.id,
        teamName: team.name,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0,
      }
    ]))
  );

  matches
    .filter(match => match.season === season)
    .forEach(match => {
      const home = standings.get(match.homeTeamId);
      const away = standings.get(match.awayTeamId);

      if (!home || !away) return;

      home.played += 1;
      away.played += 1;
      home.goalsFor += match.homeGoals;
      home.goalsAgainst += match.awayGoals;
      away.goalsFor += match.awayGoals;
      away.goalsAgainst += match.homeGoals;

      if (match.homeGoals > match.awayGoals) {
        home.won += 1;
        home.points += 3;
        away.lost += 1;
      } else if (match.homeGoals < match.awayGoals) {
        away.won += 1;
        away.points += 3;
        home.lost += 1;
      } else {
        home.drawn += 1;
        away.drawn += 1;
        home.points += 1;
        away.points += 1;
      }
    });

  return Array.from(standings.values())
    .map(team => ({
      ...team,
      goalDifference: team.goalsFor - team.goalsAgainst,
    }))
    .sort((a, b) =>
      b.points - a.points ||
      b.goalDifference - a.goalDifference ||
      b.goalsFor - a.goalsFor ||
      a.teamName.localeCompare(b.teamName, 'da-DK')
    );
};
