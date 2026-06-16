// src/pages/workspace/starterCards.test.js
import { STARTER_CARDS, getStarterCardsForRole } from './starterCards';

describe('starterCards', () => {
  it('every starter card is a valid QueryPlan-bearing definition', () => {
    Object.values(STARTER_CARDS).flat().forEach((card) => {
      expect(typeof card.title).toBe('string');
      expect(['leads', 'sales', 'payments', 'tasks', 'channelPartners']).toContain(card.module);
      expect(['list', 'metric']).toContain(card.renderMode);
      expect(card.queryPlan.module).toBe(card.module);
      expect(card.queryPlan.logic).toBe('AND');
      expect(Array.isArray(card.queryPlan.filters)).toBe(true);
    });
  });

  it('maps a known role to its starter set', () => {
    const cards = getStarterCardsForRole('Sales Manager');
    expect(cards.length).toBeGreaterThan(0);
    expect(cards.map((c) => c.title)).toContain('Stale CP leads');
  });

  it('falls back to a generic set for an unknown role', () => {
    const cards = getStarterCardsForRole('Some Future Role');
    expect(Array.isArray(cards)).toBe(true);
    expect(cards.length).toBeGreaterThan(0);
  });
});
