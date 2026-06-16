// src/pages/workspace/filterBuilder.helpers.test.js
import { OP_LABELS, opNeedsValue, defaultValueForField } from './FilterBuilder';

describe('FilterBuilder helpers', () => {
  it('labels every supported operator key', () => {
    ['is', 'in', 'notIn', 'gt', 'lt', 'gte', 'lte', 'between', 'lastNDays', 'isEmpty', 'isNotEmpty', 'contains']
      .forEach((op) => expect(OP_LABELS[op]).toBeTruthy());
  });

  it('isEmpty / isNotEmpty take no value', () => {
    expect(opNeedsValue('isEmpty')).toBe(false);
    expect(opNeedsValue('isNotEmpty')).toBe(false);
    expect(opNeedsValue('is')).toBe(true);
  });

  it('defaults a sensible value per field type/operator', () => {
    expect(defaultValueForField({ type: 'number' }, 'gte')).toBe(0);
    expect(defaultValueForField({ type: 'date' }, 'lastNDays')).toBe(7);
    expect(defaultValueForField({ type: 'enum', enumValues: ['A', 'B'] }, 'in')).toEqual([]);
    expect(defaultValueForField({ type: 'string' }, 'contains')).toBe('');
  });

  it('defaultValueForField returns a 2-element array for between', () => {
    expect(defaultValueForField({ type: 'number' }, 'between')).toEqual([null, null]);
    expect(defaultValueForField({ type: 'date' }, 'between')).toEqual([null, null]);
  });

  it('defaultValueForField returns scalar defaults when switching away from between', () => {
    expect(defaultValueForField({ type: 'number' }, 'gt')).toBe(0);
    expect(defaultValueForField({ type: 'date' }, 'is')).toBe('');
  });

  it('defaultValueForField returns null for no-value operators', () => {
    expect(defaultValueForField({ type: 'number' }, 'isEmpty')).toBeNull();
    expect(defaultValueForField({ type: 'string' }, 'isNotEmpty')).toBeNull();
  });
});
