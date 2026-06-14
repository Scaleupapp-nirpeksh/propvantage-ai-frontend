import {
  builderReducer, initialBuilderState, actions, buildTemplatePayload, templateToBuilderState,
} from './builderState';

const addBlock = (state, block) => builderReducer(state, actions.addBlock(block));

describe('builderReducer', () => {
  it('adds a block, assigns order, and selects it', () => {
    const s = addBlock(initialBuilderState, { id: 'b1', type: 'kpi.revenue', title: 'Revenue', config: {} });
    expect(s.blocks).toHaveLength(1);
    expect(s.blocks[0]).toMatchObject({ id: 'b1', type: 'kpi.revenue', order: 0 });
    expect(s.selectedBlockId).toBe('b1');
  });

  it('removes a block and reindexes order, clearing selection if removed', () => {
    let s = addBlock(initialBuilderState, { id: 'b1', type: 'kpi.revenue', title: 'R', config: {} });
    s = addBlock(s, { id: 'b2', type: 'kpi.collections', title: 'C', config: {} });
    s = builderReducer(s, actions.removeBlock('b1'));
    expect(s.blocks.map((b) => b.id)).toEqual(['b2']);
    expect(s.blocks[0].order).toBe(0);
  });

  it('reorders blocks and reindexes order', () => {
    let s = addBlock(initialBuilderState, { id: 'b1', type: 'kpi.revenue', title: 'R', config: {} });
    s = addBlock(s, { id: 'b2', type: 'kpi.collections', title: 'C', config: {} });
    s = addBlock(s, { id: 'b3', type: 'kpi.totalLeads', title: 'L', config: {} });
    s = builderReducer(s, actions.reorderBlocks(0, 2)); // move b1 to the end
    expect(s.blocks.map((b) => b.id)).toEqual(['b2', 'b3', 'b1']);
    expect(s.blocks.map((b) => b.order)).toEqual([0, 1, 2]);
  });

  it('updates a block title/config', () => {
    let s = addBlock(initialBuilderState, { id: 'b1', type: 'text.note', title: 'Note', config: { text: '' } });
    s = builderReducer(s, actions.updateBlock('b1', { title: 'Summary', config: { text: 'Hello' } }));
    expect(s.blocks[0].title).toBe('Summary');
    expect(s.blocks[0].config).toEqual({ text: 'Hello' });
  });

  it('sets top-level fields and merges theme', () => {
    let s = builderReducer(initialBuilderState, actions.setField('name', 'Q2 Report'));
    s = builderReducer(s, actions.setTheme({ preset: 'midnight' }));
    expect(s.name).toBe('Q2 Report');
    expect(s.theme.preset).toBe('midnight');
  });

  it('adds and removes image slots', () => {
    let s = builderReducer(initialBuilderState, actions.addImageSlot({ id: 'img1', label: 'Hero', s3Key: 'k', url: 'u' }));
    expect(s.imageSlots).toHaveLength(1);
    s = builderReducer(s, actions.removeImageSlot('img1'));
    expect(s.imageSlots).toHaveLength(0);
  });

  it('merges block config on update, preserving untouched keys', () => {
    let s = builderReducer(initialBuilderState, actions.addBlock({ id: 'b1', type: 'layout.hero', title: 'Hero', config: { subtitle: 'old', imageSlotId: 'img1' } }));
    s = builderReducer(s, actions.updateBlock('b1', { config: { subtitle: 'new' } }));
    expect(s.blocks[0].config).toEqual({ subtitle: 'new', imageSlotId: 'img1' });
  });

  it('hydrates from a fetched template and back to a payload', () => {
    const template = {
      name: 'Loaded', description: 'd',
      scope: { period: { preset: 'qtd' } },
      theme: { preset: 'warm' },
      blocks: [{ id: 'b1', type: 'kpi.revenue', title: 'R', config: {}, order: 0 }],
      imageSlots: [{ id: 'img1', label: 'Hero', s3Key: 'k', url: 'u' }],
    };
    const s = templateToBuilderState(template);
    expect(s.name).toBe('Loaded');
    expect(s.blocks).toHaveLength(1);
    const payload = buildTemplatePayload(s);
    expect(payload.name).toBe('Loaded');
    expect(payload).not.toHaveProperty('selectedBlockId');
    expect(payload.blocks[0]).toMatchObject({ id: 'b1', type: 'kpi.revenue', order: 0 });
  });

  it('has schedule and delivery defaults', () => {
    expect(initialBuilderState.schedule.frequency).toBe('monthly');
    expect(initialBuilderState.schedule.enabled).toBe(false);
    expect(initialBuilderState.delivery.mode).toBe('review_then_send');
    expect(initialBuilderState.delivery.recipients).toEqual([]);
  });

  it('merges schedule and delivery patches', () => {
    let s = builderReducer(initialBuilderState, actions.setSchedule({ enabled: true, frequency: 'weekly', dayOfWeek: 3 }));
    expect(s.schedule).toMatchObject({ enabled: true, frequency: 'weekly', dayOfWeek: 3, time: '09:00' });
    s = builderReducer(s, actions.setDelivery({ mode: 'auto_send', recipients: [{ email: 'a@b.com', name: 'A' }] }));
    expect(s.delivery.mode).toBe('auto_send');
    expect(s.delivery.recipients).toEqual([{ email: 'a@b.com', name: 'A' }]);
  });

  it('has an access gate default and merges access patches', () => {
    expect(initialBuilderState.access.gate).toBe('email');
    const s = builderReducer(initialBuilderState, actions.setAccess({ gate: 'email_otp' }));
    expect(s.access.gate).toBe('email_otp');
  });

  it('round-trips schedule/delivery through hydrate + payload', () => {
    const tpl = {
      name: 'T', blocks: [],
      schedule: { enabled: true, frequency: 'quarterly', time: '08:00' },
      delivery: { mode: 'auto_send', recipients: [{ email: 'x@y.com' }] },
    };
    const s = templateToBuilderState(tpl);
    expect(s.schedule.frequency).toBe('quarterly');
    expect(s.delivery.recipients).toHaveLength(1);
    const payload = buildTemplatePayload(s);
    expect(payload.schedule.frequency).toBe('quarterly');
    expect(payload.delivery.mode).toBe('auto_send');
  });
});
