// Pure state model for the report template builder. No I/O, no DnD imports.

export const initialBuilderState = {
  name: '',
  description: '',
  scope: { projects: [], period: { preset: 'last_30d' } },
  theme: { preset: 'clean', primaryColor: '', accentColor: '', logoS3Key: '', coverImageS3Key: '' },
  blocks: [],          // [{ id, type, title, config, order }]
  imageSlots: [],      // [{ id, label, s3Key, url }]
  selectedBlockId: null,
  schedule: { enabled: false, frequency: 'monthly', dayOfWeek: 1, dayOfMonth: 1, time: '09:00', timezone: 'Asia/Kolkata' },
  delivery: { mode: 'review_then_send', recipients: [], reviewers: [] },
};

// Action type constants
export const T = {
  LOAD: 'LOAD', SET_FIELD: 'SET_FIELD', SET_THEME: 'SET_THEME',
  ADD_BLOCK: 'ADD_BLOCK', REMOVE_BLOCK: 'REMOVE_BLOCK', REORDER_BLOCKS: 'REORDER_BLOCKS',
  SELECT_BLOCK: 'SELECT_BLOCK', UPDATE_BLOCK: 'UPDATE_BLOCK',
  ADD_IMAGE_SLOT: 'ADD_IMAGE_SLOT', REMOVE_IMAGE_SLOT: 'REMOVE_IMAGE_SLOT',
  SET_SCHEDULE: 'SET_SCHEDULE', SET_DELIVERY: 'SET_DELIVERY',
};

// Action creators (callers pre-generate ids so the reducer stays pure/deterministic)
export const actions = {
  load: (state) => ({ type: T.LOAD, state }),
  setField: (field, value) => ({ type: T.SET_FIELD, field, value }),
  setTheme: (patch) => ({ type: T.SET_THEME, patch }),
  addBlock: (block) => ({ type: T.ADD_BLOCK, block }),
  removeBlock: (id) => ({ type: T.REMOVE_BLOCK, id }),
  reorderBlocks: (from, to) => ({ type: T.REORDER_BLOCKS, from, to }),
  selectBlock: (id) => ({ type: T.SELECT_BLOCK, id }),
  updateBlock: (id, patch) => ({ type: T.UPDATE_BLOCK, id, patch }),
  addImageSlot: (slot) => ({ type: T.ADD_IMAGE_SLOT, slot }),
  removeImageSlot: (id) => ({ type: T.REMOVE_IMAGE_SLOT, id }),
  setSchedule: (patch) => ({ type: T.SET_SCHEDULE, patch }),
  setDelivery: (patch) => ({ type: T.SET_DELIVERY, patch }),
};

const reindex = (blocks) => blocks.map((b, i) => ({ ...b, order: i }));

export const builderReducer = (state, action) => {
  switch (action.type) {
    case T.LOAD:
      return action.state;
    case T.SET_FIELD:
      return { ...state, [action.field]: action.value };
    case T.SET_THEME:
      return { ...state, theme: { ...state.theme, ...action.patch } };
    case T.ADD_BLOCK: {
      const block = { config: {}, ...action.block, order: state.blocks.length };
      return { ...state, blocks: [...state.blocks, block], selectedBlockId: block.id };
    }
    case T.REMOVE_BLOCK: {
      const blocks = reindex(state.blocks.filter((b) => b.id !== action.id));
      return {
        ...state,
        blocks,
        selectedBlockId: state.selectedBlockId === action.id ? null : state.selectedBlockId,
      };
    }
    case T.REORDER_BLOCKS: {
      const next = [...state.blocks];
      const [moved] = next.splice(action.from, 1);
      if (moved === undefined) return state;
      next.splice(action.to, 0, moved);
      return { ...state, blocks: reindex(next) };
    }
    case T.SELECT_BLOCK:
      return { ...state, selectedBlockId: action.id };
    case T.UPDATE_BLOCK:
      return {
        ...state,
        blocks: state.blocks.map((b) =>
          b.id === action.id
            ? { ...b, ...action.patch, config: action.patch.config ? { ...b.config, ...action.patch.config } : b.config }
            : b
        ),
      };
    case T.ADD_IMAGE_SLOT:
      return { ...state, imageSlots: [...state.imageSlots, action.slot] };
    case T.REMOVE_IMAGE_SLOT:
      return { ...state, imageSlots: state.imageSlots.filter((s) => s.id !== action.id) };
    case T.SET_SCHEDULE:
      return { ...state, schedule: { ...state.schedule, ...action.patch } };
    case T.SET_DELIVERY:
      return { ...state, delivery: { ...state.delivery, ...action.patch } };
    default:
      return state;
  }
};

/** Hydrate builder state from a fetched ReportTemplate document. */
export const templateToBuilderState = (template = {}) => ({
  ...initialBuilderState,
  name: template.name || '',
  description: template.description || '',
  scope: template.scope || initialBuilderState.scope,
  theme: { ...initialBuilderState.theme, ...(template.theme || {}) },
  blocks: reindex((template.blocks || []).map((b) => ({
    id: b.id, type: b.type, title: b.title || '', config: b.config || {}, order: b.order || 0,
  }))),
  imageSlots: template.imageSlots || [],
  selectedBlockId: null,
  schedule: { ...initialBuilderState.schedule, ...(template.schedule || {}) },
  delivery: { ...initialBuilderState.delivery, ...(template.delivery || {}) },
});

/** Build the API payload (create/update) from builder state. */
export const buildTemplatePayload = (state) => ({
  name: state.name,
  description: state.description,
  scope: state.scope,
  theme: state.theme,
  blocks: state.blocks.map(({ id, type, title, config, order }) => ({ id, type, title, config, order })),
  imageSlots: state.imageSlots,
  schedule: state.schedule,
  delivery: state.delivery,
});

/** Generate a unique block/slot id (browser crypto, with a safe fallback). */
let state_counter = 0;
export const makeId = (prefix = 'b') => {
  try {
    return `${prefix}_${window.crypto.randomUUID()}`;
  } catch (_e) {
    return `${prefix}_${performance.now()}_${state_counter++}`;
  }
};
