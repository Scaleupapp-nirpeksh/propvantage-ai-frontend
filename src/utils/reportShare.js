// File: src/utils/reportShare.js
// Pure helpers for sharing/displaying public reports.

/** Build the public report URL for a slug. `origin` defaults to the current window. */
export const reportShareUrl = (slug, origin = (typeof window !== 'undefined' ? window.location.origin : '')) =>
  slug ? `${origin}/r/${slug}` : '';

/** Human label for a viewer row. */
export const viewerLabel = (view) => (view && view.matchedRecipient ? 'Recipient' : 'Forwarded');
