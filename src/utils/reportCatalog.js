// Pure helpers for the report block catalog (builder palette).

// Preferred display order; unknown categories are appended alphabetically after these.
const CATEGORY_ORDER = ['Financial', 'Sales', 'Inventory', 'Channel Partners', 'Invoicing', 'Construction', 'Comparison', 'Operations', 'Team', 'AI', 'Layout'];

/**
 * Group a flat catalog array into [{ category, blocks }], ordered by CATEGORY_ORDER
 * (then alphabetically for any categories not listed). Block order within a group
 * follows the input order.
 * @param {Array<{type,category,label,kind}>} catalog
 * @returns {Array<{category: string, blocks: Array}>}
 */
export const groupCatalogByCategory = (catalog) => {
  if (!Array.isArray(catalog)) return [];
  const map = new Map();
  for (const block of catalog) {
    const cat = block?.category || 'Other';
    if (!map.has(cat)) map.set(cat, []);
    map.get(cat).push(block);
  }
  const rank = (cat) => {
    const i = CATEGORY_ORDER.indexOf(cat);
    return i === -1 ? CATEGORY_ORDER.length : i;
  };
  return [...map.keys()]
    .sort((a, b) => (rank(a) - rank(b)) || a.localeCompare(b))
    .map((category) => ({ category, blocks: map.get(category) }));
};
