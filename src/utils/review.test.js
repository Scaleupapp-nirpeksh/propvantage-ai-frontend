import { availableReviewActions, applyOverrides } from './review';

describe('availableReviewActions', () => {
  it('offers submit in draft/changes_requested', () => {
    expect(availableReviewActions('draft', true)).toEqual({ submit: true, approve: false, requestChanges: false });
    expect(availableReviewActions('changes_requested', false)).toEqual({ submit: true, approve: false, requestChanges: false });
  });
  it('offers approve/request-changes only to approvers when in_review', () => {
    expect(availableReviewActions('in_review', true)).toEqual({ submit: false, approve: true, requestChanges: true });
    expect(availableReviewActions('in_review', false)).toEqual({ submit: false, approve: false, requestChanges: false });
  });
  it('offers nothing when approved', () => {
    expect(availableReviewActions('approved', true)).toEqual({ submit: false, approve: false, requestChanges: false });
  });
});

describe('applyOverrides', () => {
  const blocks = [
    { id: 'b1', type: 'kpi.revenue', kind: 'kpi', data: { value: 100, unit: 'currency' } },
    { id: 'b2', type: 'text.note', kind: 'layout', data: { text: 'hi' } },
  ];
  it('patches the targeted field without mutating input', () => {
    const out = applyOverrides(blocks, [{ blockId: 'b1', fieldPath: 'data.value', newValue: 250 }]);
    expect(out[0].data.value).toBe(250);
    expect(out[0].data.unit).toBe('currency');
    expect(blocks[0].data.value).toBe(100); // input untouched
  });
  it('returns input when no overrides', () => {
    expect(applyOverrides(blocks, [])).toBe(blocks);
  });
});
