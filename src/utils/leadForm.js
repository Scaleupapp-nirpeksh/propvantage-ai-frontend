// src/utils/leadForm.js
// Pure helpers shared by the lead create/edit wizard (2026-06 refactor).

// Budget ladder: 1-5Cr, then 5Cr steps to 50Cr, then 50Cr+. (1Cr = 10,000,000.)
export const BUDGET_RANGES = [
  '₹1Cr - ₹5Cr',
  '₹6Cr - ₹10Cr',
  '₹11Cr - ₹15Cr',
  '₹16Cr - ₹20Cr',
  '₹21Cr - ₹25Cr',
  '₹26Cr - ₹30Cr',
  '₹31Cr - ₹35Cr',
  '₹36Cr - ₹40Cr',
  '₹41Cr - ₹45Cr',
  '₹46Cr - ₹50Cr',
  '₹50Cr+',
];

const CR = 10000000;
const BUDGET_RANGE_NUMBERS = {
  '₹1Cr - ₹5Cr': { min: 1 * CR, max: 5 * CR },
  '₹6Cr - ₹10Cr': { min: 6 * CR, max: 10 * CR },
  '₹11Cr - ₹15Cr': { min: 11 * CR, max: 15 * CR },
  '₹16Cr - ₹20Cr': { min: 16 * CR, max: 20 * CR },
  '₹21Cr - ₹25Cr': { min: 21 * CR, max: 25 * CR },
  '₹26Cr - ₹30Cr': { min: 26 * CR, max: 30 * CR },
  '₹31Cr - ₹35Cr': { min: 31 * CR, max: 35 * CR },
  '₹36Cr - ₹40Cr': { min: 36 * CR, max: 40 * CR },
  '₹41Cr - ₹45Cr': { min: 41 * CR, max: 45 * CR },
  '₹46Cr - ₹50Cr': { min: 46 * CR, max: 50 * CR },
  '₹50Cr+': { min: 50 * CR, max: null },
};

export const budgetRangeToNumbers = (range) => BUDGET_RANGE_NUMBERS[range] || { min: '', max: '' };

// Occupancy timeline → priority (mirrors backend utils/leadPriority.js).
export const TIMELINE_PRIORITY = {
  immediate: 'High',
  '1-3_months': 'High',
  '3-6_months': 'Medium',
  '6-12_months': 'Low',
  '12+_months': 'Very Low',
};

export const priorityFromTimeline = (timeline) => TIMELINE_PRIORITY[timeline] || 'Very Low';
