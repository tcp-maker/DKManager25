import type { PlayerRole } from '../types/player';

/**
 * Internet-sourced 2025/26 first-team rosters.
 *
 * Provenance: collected with web search (AI search answers with citation URLs) on the date in
 * `ROSTER_RETRIEVED_AT`. Only players explicitly listed for the club's 2025/26 squad were recorded;
 * clubs where no credible roster was found have `status: 'not-found'` and no players. Positions are
 * mapped to the game's roles, and `age` is the age on 2025-07-01 (`null` when the source gave none).
 *
 * Ratings are NOT sourced from the internet: every player is quantified deterministically in
 * `src/data/players.ts` from club level, role, age and a stable per-player variation.
 *
 * Players already present in the repository (`TEAM_PLAYER_SEEDS` in players.ts) keep their existing
 * data and IDs; matching names listed here are merged into those records instead of duplicated.
 */

export const ROSTER_SEASON = '2025/26';
export const ROSTER_RETRIEVED_AT = '2026-10-05';

export type RosterCoverage = 'found' | 'partial' | 'not-found';

/** [name, age on 2025-07-01 or null, role] */
export type InternetRosterPlayer = readonly [name: string, age: number | null, role: PlayerRole];

export interface InternetClubRoster {
  status: RosterCoverage;
  sources: readonly string[];
  players: readonly InternetRosterPlayer[];
}

export const INTERNET_ROSTERS_2025_26: Record<string, InternetClubRoster> = {
};
