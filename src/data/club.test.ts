import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import App from '../App';
import ClubView from '../components/ClubView';
import EconomyView from '../components/EconomyView';
import { GameProvider } from '../context/GameContext';
import {
  calculateAttendanceEstimate,
  calculateSeasonSummary,
  calculateTicketRevenue,
  createDefaultEconomyState,
  formatCurrency,
  TICKET_PRICE,
} from '../lib/economy';
import { resolveAppView } from '../lib/navigation';
import type { EconomyTransaction } from '../types/economy';
import { LEAGUES } from './leagues';
import { getTeamSquadRecord } from './players';

const transaction = (overrides: Partial<EconomyTransaction> = {}): EconomyTransaction => ({
  id: 'ticket', season: 2, week: 3, type: 'income', category: 'ticket_sales',
  amount: 100 * TICKET_PRICE, description: 'Billetsalg', ...overrides,
});

describe('club attendance estimates from retained accounting periods', () => {
  it('does not invent an average when the season has no ticket history', () => {
    const estimate = calculateAttendanceEstimate([], 2, 120, 100);
    assert.equal(estimate.average, null);
    assert.equal(estimate.current, 100);
    assert.equal(estimate.occupancy, 100);
    assert.equal(estimate.periodCount, 0);
    assert.equal(estimate.firstWeek, undefined);
  });

  it('filters by season and income category and averages distinct booked weeks', () => {
    const entries = [
      transaction(),
      transaction({ id: 'extra', amount: 50 * TICKET_PRICE }),
      transaction({ id: 'next-week', week: 5, amount: 250 * TICKET_PRICE }),
      transaction({ season: 1, amount: 999 * TICKET_PRICE }),
      transaction({ category: 'sponsor' }),
      transaction({ type: 'expense' }),
    ];
    const estimate = calculateAttendanceEstimate(entries, 2, 300, 400);
    assert.equal(estimate.average, 200);
    assert.equal(estimate.periodCount, 2);
    assert.equal(estimate.firstWeek, 3);
    assert.equal(estimate.lastWeek, 5);
    assert.equal(estimate.occupancy, 50);
    assert.equal(estimate.current, 300);
  });

  it('handles zero sales in legacy transactions without treating them as missing history', () => {
    const estimate = calculateAttendanceEstimate([transaction({ amount: 0 })], 2, 120, 100);
    assert.equal(estimate.average, 0);
    assert.equal(estimate.periodCount, 1);
    assert.equal(estimate.occupancy, 0);
  });

  it('guards invalid capacity and fans and clamps occupancy without rewriting the historical estimate', () => {
    for (const capacity of [0, -10, NaN, Infinity]) {
      const estimate = calculateAttendanceEstimate([transaction()], 2, Infinity, capacity);
      assert.equal(estimate.capacity, 0);
      assert.equal(estimate.current, 0);
      assert.equal(estimate.occupancy, 0);
    }
    const estimate = calculateAttendanceEstimate([transaction()], 2, -10, 50);
    assert.equal(estimate.average, 100);
    assert.equal(estimate.current, 0);
    assert.equal(estimate.occupancy, 100);
    assert.equal(calculateAttendanceEstimate([], 2, NaN, 100).occupancy, 0);
    assert.equal(calculateAttendanceEstimate([transaction({ amount: -1 }), transaction({ amount: NaN })], 2, 10, 100).average, null);
  });

  it('uses the same ticket price as the unchanged revenue rule', () => {
    assert.equal(calculateTicketRevenue(120, 100), 100 * TICKET_PRICE);
    assert.equal(calculateTicketRevenue(-1, 100), 0);
  });
});

describe('season cashflow and Danish currency signs', () => {
  it('keeps loans in income and excludes other seasons', () => {
    const summary = calculateSeasonSummary([
      transaction({ category: 'loan', amount: 500 }),
      transaction({ type: 'expense', category: 'wages', amount: 200 }),
      transaction({ season: 1, amount: 9999 }),
    ], 2);
    assert.equal(summary.income, 500);
    assert.equal(summary.expenses, 200);
    assert.equal(summary.net, 300);
    assert.equal(formatCurrency(summary.net, true), '+300 kr');
  });

  it('displays negative and zero balances correctly, including unsigned negative cash', () => {
    const negative = calculateSeasonSummary([transaction({ type: 'expense', amount: 200 })], 2);
    assert.equal(negative.net, -200);
    assert.equal(formatCurrency(negative.net, true), '-200 kr');
    assert.equal(formatCurrency(-200), '-200 kr');
    assert.equal(formatCurrency(200), '200 kr');
    assert.equal(calculateSeasonSummary([], 2).net, 0);
    assert.equal(formatCurrency(0, true), '0 kr');
    assert.equal(calculateSeasonSummary([transaction(), transaction({ type: 'expense' })], 2).net, 0);
  });
});

describe('club and economy navigation', () => {
  it('preserves new and legacy Danish/English aliases for hash and path routing', () => {
    for (const alias of ['club', 'klub']) {
      assert.equal(resolveAppView(`#${encodeURIComponent(alias)}`, '/'), 'club');
      assert.equal(resolveAppView('', `/${encodeURIComponent(alias)}`), 'club');
    }
    for (const alias of ['economy', 'okonomi', 'økonomi']) {
      assert.equal(resolveAppView(`#${encodeURIComponent(alias)}`, '/club'), 'economy');
      assert.equal(resolveAppView('', `/${encodeURIComponent(alias)}`), 'economy');
    }
    assert.equal(resolveAppView('#KLUB', '/team'), 'club');
    assert.equal(resolveAppView('#%C3%98KONOMI', '/klub'), 'economy');
    assert.equal(resolveAppView('#klub', '/economy'), 'club');
    assert.equal(resolveAppView('#unknown', '/okonomi'), 'economy');
    assert.equal(resolveAppView('#trup', '/club'), 'team');
    assert.equal(resolveAppView('#unknown', '/klub'), 'club');
    assert.equal(resolveAppView('', '/unknown'), 'team');
    assert.equal(resolveAppView('#%E0%A4%A', '/club'), 'club');
    assert.equal(resolveAppView('', '/%E0%A4%A'), 'team');
    for (const view of ['team', 'transfers', 'matches', 'stadium', 'table'] as const) {
      assert.equal(resolveAppView(`#${view}`, '/'), view);
    }
  });
});

describe('club/squad presentation with an existing saved squad', () => {
  const renderSaved = (component: React.ComponentType, location?: { hash: string; pathname: string }) => {
    const club = LEAGUES[0].teams[0];
    const player = { ...Object.values(getTeamSquadRecord(club))[0], name: 'Gemt transferspiller', value: 123456 };
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
    const windowDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'window');
    if (location) {
      Object.defineProperty(globalThis, 'window', { configurable: true, value: { location } });
    }
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: { getItem: () => JSON.stringify({
        selectedClub: club, squad: { clubId: club.id, players: { [player.id]: player } },
        budget: -200, season: 2, week: 3,
        economy: { ...createDefaultEconomyState(club, 3000), transactions: [] },
      }) },
    });
    try {
      return renderToStaticMarkup(React.createElement(GameProvider, null, React.createElement(component)));
    } finally {
      if (descriptor) Object.defineProperty(globalThis, 'localStorage', descriptor);
      else Reflect.deleteProperty(globalThis, 'localStorage');
      if (windowDescriptor) Object.defineProperty(globalThis, 'window', windowDescriptor);
      else Reflect.deleteProperty(globalThis, 'window');
    }
  };

  it('renders the active saved player and individual value without club financial summaries', () => {
    const markup = renderSaved(App);
    assert.match(markup, /Gemt transferspiller/);
    assert.match(markup, /123\.456/);
    assert.match(markup, />Klub<\/button>/);
    assert.match(markup, />Økonomi<\/button>/);
    assert.doesNotMatch(markup, /Kassebeholdning|Trupværdi|Løn\/uge|Stadionkapacitet|Bestyrelse|Sæsonbalance/);
    assert.match(markup, /Tryk på en spiller/);
  });

  it('shows financial sections on the separate economy page', () => {
    const markup = renderSaved(EconomyView);
    const headings = [...markup.matchAll(/<h[12]\b[^>]*>(.*?)<\/h[12]>/g)]
      .map(([, heading]) => heading);
    assert.deepEqual(headings, [
      'Økonomi',
      'Bestyrelse: Presset',
      'Finansiering',
      'Økonomi / sæsonbalance',
      'Indtægter efter kategori',
      'Udgifter efter kategori',
      'Seneste transaktioner',
    ]);
  });

  it('keeps board, financing and cash signs on the economy page', () => {
    const markup = renderSaved(EconomyView);
    assert.match(markup, /Bestyrelse:/);
    assert.match(markup, /Sæsonbalance/);
    assert.match(markup, /Finansiering/);
    assert.match(markup, /-200 kr/);
    assert.match(markup, /pengestrøm, ikke et revideret overskud/);
    assert.match(markup, /123\.456 kr/);
    assert.doesNotMatch(markup, /Stadionaktivitet|stadium-occupancy/);
  });

  it('keeps club identity and honest attendance labels without financial sections', () => {
    const markup = renderSaved(ClubView);
    const headings = [...markup.matchAll(/<h[12]\b[^>]*>(.*?)<\/h[12]>/g)]
      .map(([, heading]) => heading);
    assert.deepEqual(headings, ['Klub', 'Stadionaktivitet']);
    assert.match(markup, new RegExp(LEAGUES[0].teams[0].name));
    assert.match(markup, /Sæson 2 • Uge 3/);
    assert.match(markup, /Endnu ingen tilskuerhistorik/);
    assert.match(markup, /<progress[^>]*max="100"[^>]*value=/);
    assert.match(markup, /for="stadium-occupancy"/);
    assert.doesNotMatch(markup, /Bestyrelse|Finansiering|Sæsonbalance|Kassebeholdning|Lønmasse|Seneste transaktioner/);
  });

  it('renders distinct full-width pages and marks the active main menu destination for direct links', () => {
    for (const location of [
      { hash: '#klub', pathname: '/economy' },
      { hash: '', pathname: '/klub' },
    ]) {
      const markup = renderSaved(App, location);
      assert.match(markup, /aria-label="Hovedmenu"/);
      assert.match(markup, /aria-current="page"[^>]*>Klub<\/button>/);
      assert.match(markup, /Stadionaktivitet/);
      assert.doesNotMatch(markup, /Finansiering|<aside/);
    }
    for (const location of [
      { hash: '#økonomi', pathname: '/klub' },
      { hash: '#economy', pathname: '/' },
      { hash: '', pathname: '/okonomi' },
    ]) {
      const markup = renderSaved(App, location);
      assert.match(markup, /aria-current="page"[^>]*>Økonomi<\/button>/);
      assert.match(markup, /Finansiering/);
      assert.match(markup, /-200 kr/);
      assert.doesNotMatch(markup, /Stadionaktivitet|<aside/);
    }
  });
});
