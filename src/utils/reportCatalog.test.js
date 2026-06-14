import { groupCatalogByCategory } from './reportCatalog';

const catalog = [
  { type: 'kpi.revenue', category: 'Financial', label: 'Total Sales Value', kind: 'kpi' },
  { type: 'layout.hero', category: 'Layout', label: 'Cover / Hero', kind: 'layout' },
  { type: 'kpi.collections', category: 'Financial', label: 'Collected', kind: 'kpi' },
  { type: 'kpi.totalLeads', category: 'Sales', label: 'Total Leads', kind: 'kpi' },
];

describe('groupCatalogByCategory', () => {
  it('groups blocks by category, preserving block order within a group', () => {
    const groups = groupCatalogByCategory(catalog);
    const financial = groups.find((g) => g.category === 'Financial');
    expect(financial.blocks.map((b) => b.type)).toEqual(['kpi.revenue', 'kpi.collections']);
  });

  it('returns one entry per distinct category', () => {
    const cats = groupCatalogByCategory(catalog).map((g) => g.category);
    expect(new Set(cats).size).toBe(cats.length);
    expect(cats).toEqual(expect.arrayContaining(['Financial', 'Sales', 'Layout']));
  });

  it('orders known categories first, then any extras alphabetically', () => {
    const cats = groupCatalogByCategory(catalog).map((g) => g.category);
    expect(cats.indexOf('Financial')).toBeLessThan(cats.indexOf('Layout'));
  });

  it('handles empty / non-array input', () => {
    expect(groupCatalogByCategory([])).toEqual([]);
    expect(groupCatalogByCategory(undefined)).toEqual([]);
  });
});

it('orders the expanded categories ahead of Layout and after the core ones', () => {
  const catalog = [
    { type: 'a', category: 'Layout', label: 'L' },
    { type: 'b', category: 'Operations', label: 'O' },
    { type: 'c', category: 'Financial', label: 'F' },
    { type: 'd', category: 'Channel Partners', label: 'CP' },
    { type: 'e', category: 'Comparison', label: 'Cmp' },
  ];
  const order = groupCatalogByCategory(catalog).map((g) => g.category);
  expect(order).toEqual(['Financial', 'Channel Partners', 'Comparison', 'Operations', 'Layout']);
});
