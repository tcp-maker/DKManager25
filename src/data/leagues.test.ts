import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  MATCH_TIMELINE,
  normalizeLeagueMatchRecords,
  simulateDetailedMatch,
} from './leagues';

const createSequenceRng = (values: number[]) => {
  let index = 0;
  return () => {
    const value = values[index % values.length];
    index += 1;
    return value;
  };
};

describe('match simulation details', () => {
  it('builds a 2x15 minute match with halftime, live stats and report highlights', () => {
    const rng = createSequenceRng([
      0.12, 0.45, 0.78, 0.22, 0.61, 0.34, 0.89, 0.17, 0.53, 0.68,
      0.27, 0.74, 0.39, 0.95, 0.08, 0.57, 0.31, 0.83, 0.14, 0.49,
      0.7, 0.25, 0.92, 0.36, 0.63, 0.19, 0.86, 0.41, 0.58, 0.03,
      0.97, 0.11, 0.52, 0.29, 0.66, 0.44, 0.72, 0.21, 0.84, 0.16,
    ]);
    const result = simulateDetailedMatch(81, 74, 'FC København', 'AGF', rng);

    assert.equal(result.details.timeline.firstHalfMinutes, MATCH_TIMELINE.firstHalfMinutes);
    assert.equal(result.details.timeline.halftimeMinutes, MATCH_TIMELINE.halftimeMinutes);
    assert.equal(result.details.timeline.secondHalfMinutes, MATCH_TIMELINE.secondHalfMinutes);
    assert.equal(result.details.stats.possessionHome + result.details.stats.possessionAway, 100);
    assert.ok(result.details.stats.chancesHome >= result.homeGoals);
    assert.ok(result.details.stats.chancesAway >= result.awayGoals);
    assert.equal(result.details.events.some(event => event.type === 'halftime'), true);
    assert.equal(result.details.events.some(event => event.type === 'second_half'), true);
    assert.equal(result.details.events.some(event => event.type === 'full_time'), true);
    assert.match(result.details.report.summary, /2x15 minutter/);
    assert.equal(result.details.report.highlights.some(entry => entry.includes('Boldbesiddelse')), true);
    assert.equal(result.details.report.highlights.some(entry => entry.includes('Chancer')), true);
  });

  it('normalizes saved match records defensively and preserves valid detailed reports', () => {
    const validDetails = simulateDetailedMatch(76, 76, 'Brøndby IF', 'OB', createSequenceRng([
      0.3, 0.5, 0.7, 0.2, 0.8, 0.4, 0.6, 0.1, 0.9, 0.35,
      0.55, 0.75, 0.15, 0.85, 0.25, 0.45, 0.65, 0.05, 0.95, 0.32,
    ])).details;

    const normalized = normalizeLeagueMatchRecords([
      {
        fixtureId: 'legacy-match',
        season: 2,
        week: 4,
        homeTeamId: 'broendby',
        homeTeamName: 'Brøndby IF',
        awayTeamId: 'ob',
        awayTeamName: 'OB',
        homeGoals: 1,
        awayGoals: 1,
        isUserMatch: true,
      },
      {
        fixtureId: 'detailed-match',
        season: 2,
        week: 5,
        homeTeamId: 'broendby',
        homeTeamName: 'Brøndby IF',
        awayTeamId: 'ob',
        awayTeamName: 'OB',
        homeGoals: validDetails.events.filter(event => event.type === 'goal' && event.team === 'home').length,
        awayGoals: validDetails.events.filter(event => event.type === 'goal' && event.team === 'away').length,
        isUserMatch: true,
        details: validDetails,
      },
      {
        fixtureId: 'broken-details',
        season: 2,
        week: 6,
        homeTeamId: 'broendby',
        homeTeamName: 'Brøndby IF',
        awayTeamId: 'ob',
        awayTeamName: 'OB',
        homeGoals: 0,
        awayGoals: 2,
        isUserMatch: true,
        details: {
          timeline: { firstHalfMinutes: 15 },
          stats: { chancesHome: 'many' },
        },
      },
      null,
    ]);

    assert.equal(normalized.length, 3);
    assert.equal(normalized[0].details, undefined);
    assert.ok(normalized[1].details);
    assert.equal(normalized[1].details?.timeline.halftimeMinutes, MATCH_TIMELINE.halftimeMinutes);
    assert.equal(normalized[1].details?.events.some(event => event.type === 'full_time'), true);
    assert.equal(normalized[2].details, undefined);
  });
});
