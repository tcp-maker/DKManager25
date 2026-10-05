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
import type { EconomyState, EconomyTransaction } from '../types/economy';
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
      assert.equal(resolveAppView('', `/${encodeURIComponent(alias)}/`), 'economy');
    }
    assert.equal(resolveAppView('#%C3%98KONOMI', '/club'), 'economy');
    assert.equal(resolveAppView('#klub', '/economy'), 'club');
    assert.equal(resolveAppView('#unknown', '/okonomi'), 'economy');
    assert.equal(resolveAppView('#KLUB', '/team'), 'club');
    assert.equal(resolveAppView('#trup', '/club'), 'team');
    assert.equal(resolveAppView('#unknown', '/klub'), 'club');
    assert.equal(resolveAppView('', '/unknown'), 'team');
    for (const view of ['team', 'transfers', 'matches', 'stadium', 'table'] as const) {
      assert.equal(resolveAppView(`#${view}`, '/'), view);
    }
  });
});

describe('club/squad presentation with an existing saved squad', () => {
  const renderSaved = (
    component: React.ComponentType,
    economyOverrides: Partial<EconomyState> = {},
    location?: { hash: string; pathname: string },
  ) => {
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
        economy: { ...createDefaultEconomyState(club, 3000), transactions: [], ...economyOverrides },
      }) },
    });
    try {
      return renderToStaticMarkup(React.createElement(GameProvider, null, React.createElement(component)));
    } finally {
      if (descriptor) Object.defineProperty(globalThis, 'localStorage', descriptor);
      else Reflect.deleteProperty(globalThis, 'localStorage');
      if (location) {
        if (windowDescriptor) Object.defineProperty(globalThis, 'window', windowDescriptor);
        else Reflect.deleteProperty(globalThis, 'window');
      }
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

  it('keeps club identity, non-financial context and board status on the club page', () => {
    const markup = renderSaved(ClubView);
    assert.match(markup, /FC København/);
    assert.match(markup, /Superliga/);
    assert.match(markup, /Sæson 2 • Uge 3/);
    assert.match(markup, /Kluboverblik/);
    assert.match(markup, /Spillere i truppen<\/dt><dd[^>]*>1<\/dd>/);
    for (const label of ['Fans', 'Fanhumør', 'Stadionkapacitet']) {
      assert.ok(markup.includes(label));
    }
    assert.match(markup, /Bestyrelse:/);
    for (const label of ['Advarsler', 'Anbefalinger', 'Begrænsninger']) {
      assert.ok(markup.includes(label));
    }
    assert.doesNotMatch(markup, /Kassebeholdning|Sæsonbalance|Finansiering|Egenkapital|Lønmasse|Trupværdi|Seneste transaktioner|<progress/);
  });

  it('moves all financial summaries and honest attendance labels to the economy page', () => {
    const markup = renderSaved(EconomyView);
    assert.match(markup, />Økonomi<\/h1>/);
    for (const label of [
      'Kassebeholdning', 'Ugens indtægter', 'Ugens udgifter', 'Ugens resultat',
      'Sæsonbalance', 'Gæld', 'Rente pr. uge', 'Egenkapital', 'Lønmasse',
      'Trupværdi', 'Stadionværdi', 'Finansiering', 'Optag lån på',
      'Indtægter efter kategori', 'Udgifter efter kategori', 'Seneste transaktioner',
    ]) {
      assert.ok(markup.includes(label), `Missing financial section: ${label}`);
    }
    assert.doesNotMatch(markup, /Bestyrelse:|Kluboverblik/);
    assert.match(markup, /-200 kr/);
    assert.match(markup, /Endnu ingen tilskuerhistorik/);
    assert.match(markup, /pengestrøm, ikke et revideret overskud/);
    assert.match(markup, /<progress[^>]*max="100"[^>]*value=/);
    assert.match(markup, /for="stadium-occupancy"/);
  });

  it('renders retained saved transactions, balances and category totals in economy', () => {
    const markup = renderSaved(EconomyView, {
      debt: 400000,
      transactions: [
        transaction({ amount: 45000, description: 'Gemt billetsalg' }),
        transaction({ id: 'wages', type: 'expense', category: 'wages', amount: 12000, description: 'Gemte lønninger' }),
      ],
    });
    for (const amount of ['45.000 kr', '12.000 kr', '+33.000 kr', '400.000 kr']) {
      assert.ok(markup.includes(amount), `Missing saved amount: ${amount}`);
    }
    assert.match(markup, /Gemt billetsalg/);
    assert.match(markup, /Gemte lønninger/);
    assert.doesNotMatch(markup, /Endnu ingen tilskuerhistorik/);
  });

  it('preserves the saved weekly loan lock in economy', () => {
    const markup = renderSaved(EconomyView, { lastLoanWeekKey: '2-3' });
    assert.match(markup, /<button[^>]*disabled=""[^>]*>Lån allerede optaget denne uge<\/button>/);
    assert.match(markup, /Vent til næste uge/);
  });

  it('renders distinct full-width club and economy views from direct URLs', () => {
    for (const location of [
      { hash: '#economy', pathname: '/' },
      { hash: '#okonomi', pathname: '/club' },
      { hash: '#%C3%B8konomi', pathname: '/' },
      { hash: '', pathname: '/%C3%B8konomi' },
    ]) {
      const markup = renderSaved(App, {}, location);
      assert.match(markup, />Økonomi<\/h1>/);
      assert.match(markup, /Finansiering/);
      assert.doesNotMatch(markup, /Kluboverblik|Bestyrelse:|<aside/);
    }
    const markup = renderSaved(App, {}, { hash: '#klub', pathname: '/economy' });
    assert.match(markup, />Klub<\/h1>/);
    assert.match(markup, /Bestyrelse:/);
    assert.doesNotMatch(markup, /Finansiering|Kassebeholdning|<aside/);
  });
});
