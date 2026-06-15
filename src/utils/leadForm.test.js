import { BUDGET_RANGES, budgetRangeToNumbers, TIMELINE_PRIORITY, priorityFromTimeline } from './leadForm';

describe('lead form helpers', () => {
  it('budget ladder starts at 1-5Cr, steps by 5Cr to 50Cr, then 50Cr+', () => {
    expect(BUDGET_RANGES[0]).toBe('₹1Cr - ₹5Cr');
    expect(BUDGET_RANGES).toContain('₹6Cr - ₹10Cr');
    expect(BUDGET_RANGES).toContain('₹46Cr - ₹50Cr');
    expect(BUDGET_RANGES[BUDGET_RANGES.length - 1]).toBe('₹50Cr+');
  });
  it('budgetRangeToNumbers maps to rupee min/max (1Cr = 1e7)', () => {
    expect(budgetRangeToNumbers('₹1Cr - ₹5Cr')).toEqual({ min: 10000000, max: 50000000 });
    expect(budgetRangeToNumbers('₹6Cr - ₹10Cr')).toEqual({ min: 60000000, max: 100000000 });
    expect(budgetRangeToNumbers('₹50Cr+')).toEqual({ min: 500000000, max: null });
    expect(budgetRangeToNumbers('nonsense')).toEqual({ min: '', max: '' });
  });
  it('priorityFromTimeline: immediate/1-3 → High, 3-6 → Medium, 6-12 → Low, 12+ → Very Low', () => {
    expect(priorityFromTimeline('immediate')).toBe('High');
    expect(priorityFromTimeline('1-3_months')).toBe('High');
    expect(priorityFromTimeline('3-6_months')).toBe('Medium');
    expect(priorityFromTimeline('6-12_months')).toBe('Low');
    expect(priorityFromTimeline('12+_months')).toBe('Very Low');
    expect(priorityFromTimeline('')).toBe('Very Low');
  });
});
