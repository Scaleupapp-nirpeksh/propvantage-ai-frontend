// File: src/utils/review.js
// Pure helpers for the report review screen.

/** Which review actions are available for a status (approve/request-changes need approver rights). */
export const availableReviewActions = (status, canApprove) => {
  switch (status) {
    case 'draft':
    case 'changes_requested':
      return { submit: true, approve: false, requestChanges: false };
    case 'in_review':
      return { submit: false, approve: !!canApprove, requestChanges: !!canApprove };
    case 'approved':
    default:
      return { submit: false, approve: false, requestChanges: false };
  }
};

const setPath = (obj, path, value) => {
  const clone = JSON.parse(JSON.stringify(obj));
  const keys = String(path).split('.');
  let cur = clone;
  for (let i = 0; i < keys.length - 1; i++) {
    if (cur[keys[i]] == null || typeof cur[keys[i]] !== 'object') cur[keys[i]] = {};
    cur = cur[keys[i]];
  }
  cur[keys[keys.length - 1]] = value;
  return clone;
};

/** Apply review overrides to snapshot blocks for display. Pure (input unchanged). */
export const applyOverrides = (blocks = [], overrides = []) => {
  if (!overrides || overrides.length === 0) return blocks;
  const byBlock = new Map();
  for (const o of overrides) {
    if (!byBlock.has(o.blockId)) byBlock.set(o.blockId, []);
    byBlock.get(o.blockId).push(o);
  }
  return blocks.map((b) => {
    const ovs = byBlock.get(b.id);
    if (!ovs) return b;
    let nb = b;
    for (const o of ovs) nb = setPath(nb, o.fieldPath, o.newValue);
    return nb;
  });
};
