import { reportShareUrl, viewerLabel } from './reportShare';

describe('reportShareUrl', () => {
  it('builds a /r/:slug URL from an explicit origin', () => {
    expect(reportShareUrl('abc123', 'https://app.prop-vantage.com')).toBe('https://app.prop-vantage.com/r/abc123');
  });
  it('returns empty string for a missing slug', () => {
    expect(reportShareUrl('', 'https://x.com')).toBe('');
    expect(reportShareUrl(undefined, 'https://x.com')).toBe('');
  });
});

describe('viewerLabel', () => {
  it('labels matched recipients vs forwarded', () => {
    expect(viewerLabel({ matchedRecipient: true })).toBe('Recipient');
    expect(viewerLabel({ matchedRecipient: false })).toBe('Forwarded');
  });
});
