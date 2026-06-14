// File: src/utils/reportThemes.js
// Visual token sets for the three report themes (Clean / Midnight / Warm).
// These drive the rendered/public report appearance (background, surfaces, text,
// accent, chart palette). The template stores only the preset key; the renderer
// resolves it to tokens here so all three themes look genuinely different.

export const REPORT_THEME_PRESETS = ['clean', 'midnight', 'warm'];

export const REPORT_THEME_LABELS = {
  clean: 'Clean',
  midnight: 'Midnight',
  warm: 'Warm',
};

const THEMES = {
  // Bright, corporate, blue-accented (the default).
  clean: {
    page: '#f4f6f9',
    surface: '#ffffff',
    surfaceBorder: '#e3e7ec',
    text: '#16202b',
    subtext: '#5f6b7a',
    accent: '#1e88e5',
    accentSoft: 'rgba(30,136,229,0.08)',
    chartColors: ['#1e88e5', '#43a047', '#ffb300', '#8e24aa', '#00acc1', '#fb8c00'],
  },
  // Dark, premium, gold-accented.
  midnight: {
    page: '#0c1726',
    surface: '#15263b',
    surfaceBorder: 'rgba(255,255,255,0.10)',
    text: '#e9eef5',
    subtext: '#9fb2c6',
    accent: '#ffca28',
    accentSoft: 'rgba(255,202,40,0.12)',
    chartColors: ['#42a5f5', '#66bb6a', '#ffca28', '#ba68c8', '#26c6da', '#ffa726'],
  },
  // Warm, editorial, terracotta-accented on cream.
  warm: {
    page: '#f7f1e8',
    surface: '#fffdf9',
    surfaceBorder: '#e7dccb',
    text: '#2b2118',
    subtext: '#6f6151',
    accent: '#e07b39',
    accentSoft: 'rgba(224,123,57,0.10)',
    chartColors: ['#e07b39', '#c9a227', '#5b8c5a', '#a8553a', '#7a6f9b', '#cf6b5c'],
  },
};

/**
 * Resolve a report theme to its visual tokens.
 * @param {string|{preset?:string}} preset - the preset key or a theme object
 * @returns {object} token set (falls back to 'clean')
 */
export const getReportTheme = (preset) => {
  const key = typeof preset === 'string' ? preset : preset?.preset;
  return THEMES[key] || THEMES.clean;
};

export default getReportTheme;
