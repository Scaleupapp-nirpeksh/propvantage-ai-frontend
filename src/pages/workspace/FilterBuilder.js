// src/pages/workspace/FilterBuilder.js
import React from 'react';
import {
  Box, Button, IconButton, FormControl, InputLabel, Select, MenuItem,
  TextField, Typography, Chip, Stack,
} from '@mui/material';
import { Add, DeleteOutline } from '@mui/icons-material';

// Human labels for the canonical operator keys (workspace spec §3.2).
export const OP_LABELS = {
  is: 'is',
  in: 'is any of',
  notIn: 'is none of',
  gt: '>',
  lt: '<',
  gte: '>=',
  lte: '<=',
  between: 'between',
  lastNDays: 'in the last N days',
  isEmpty: 'is empty',
  isNotEmpty: 'is not empty',
  contains: 'contains',
};

// Operators that don't need a value input.
export const opNeedsValue = (op) => op !== 'isEmpty' && op !== 'isNotEmpty';

// Sensible default value when a field/operator is first chosen.
export const defaultValueForField = (field, op) => {
  if (!opNeedsValue(op)) return null;
  if (op === 'lastNDays') return 7;
  if (op === 'between') return [null, null];
  if (op === 'in' || op === 'notIn') return [];
  switch (field?.type) {
    case 'number': return 0;
    case 'boolean': return true;
    case 'date': return '';
    default: return '';
  }
};

const FilterBuilder = ({ catalog, plan, onChange }) => {
  const fields = catalog?.fields || [];

  const updateFilters = (filters) => onChange({ ...plan, filters });

  const addRow = () => {
    const first = fields[0];
    if (!first) return;
    const op = (first.operators || [])[0] || 'is';
    updateFilters([
      ...(plan.filters || []),
      { field: first.key, op, value: defaultValueForField(first, op) },
    ]);
  };

  const removeRow = (idx) =>
    updateFilters((plan.filters || []).filter((_, i) => i !== idx));

  const patchRow = (idx, patch) =>
    updateFilters((plan.filters || []).map((row, i) => (i === idx ? { ...row, ...patch } : row)));

  const fieldFor = (key) => fields.find((f) => f.key === key);

  const onFieldChange = (idx, key) => {
    const f = fieldFor(key);
    const op = (f?.operators || [])[0] || 'is';
    patchRow(idx, { field: key, op, value: defaultValueForField(f, op) });
  };

  const onOpChange = (idx, op) => {
    const row = plan.filters[idx];
    const f = fieldFor(row.field);
    patchRow(idx, { op, value: defaultValueForField(f, op) });
  };

  const renderValueInput = (row, idx) => {
    const f = fieldFor(row.field);
    if (!opNeedsValue(row.op)) return null;

    // enum / ref → dropdown(s) from enumValues
    if ((f?.type === 'enum' || f?.type === 'ref') && Array.isArray(f.enumValues)) {
      const multi = row.op === 'in' || row.op === 'notIn';
      return (
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Value</InputLabel>
          <Select
            multiple={multi}
            value={multi ? (row.value || []) : (row.value ?? '')}
            label="Value"
            onChange={(e) => patchRow(idx, { value: e.target.value })}
            renderValue={(v) => (Array.isArray(v) ? v.join(', ') : v)}
          >
            {f.enumValues.map((opt) => (
              <MenuItem key={opt} value={opt}>{opt}</MenuItem>
            ))}
          </Select>
        </FormControl>
      );
    }

    if (row.op === 'lastNDays' || f?.type === 'number') {
      return (
        <TextField
          size="small"
          type="number"
          label={row.op === 'lastNDays' ? 'Days' : 'Value'}
          value={row.value ?? ''}
          onChange={(e) => patchRow(idx, { value: e.target.value === '' ? '' : Number(e.target.value) })}
          sx={{ width: 140 }}
        />
      );
    }

    if (f?.type === 'date') {
      return (
        <TextField
          size="small"
          type="date"
          label="Date"
          InputLabelProps={{ shrink: true }}
          value={row.value || ''}
          onChange={(e) => patchRow(idx, { value: e.target.value })}
          sx={{ width: 180 }}
        />
      );
    }

    if (f?.type === 'boolean') {
      return (
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Value</InputLabel>
          <Select
            value={row.value === undefined ? true : row.value}
            label="Value"
            onChange={(e) => patchRow(idx, { value: e.target.value })}
          >
            <MenuItem value={true}>Yes</MenuItem>
            <MenuItem value={false}>No</MenuItem>
          </Select>
        </FormControl>
      );
    }

    // string default
    return (
      <TextField
        size="small"
        label="Value"
        value={row.value ?? ''}
        onChange={(e) => patchRow(idx, { value: e.target.value })}
        sx={{ minWidth: 180 }}
      />
    );
  };

  if (!catalog) {
    return <Typography variant="body2" color="text.secondary">Choose a module to load its fields.</Typography>;
  }

  return (
    <Box>
      <Stack direction="row" alignItems="center" sx={{ mb: 1 }} spacing={1}>
        <Typography variant="caption" color="text.secondary">
          All conditions must match
        </Typography>
        <Chip label="AND" size="small" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700 }} />
      </Stack>

      <Stack spacing={1.5}>
        {(plan.filters || []).map((row, idx) => (
          <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Field</InputLabel>
              <Select
                value={row.field}
                label="Field"
                onChange={(e) => onFieldChange(idx, e.target.value)}
              >
                {fields.map((f) => (
                  <MenuItem key={f.key} value={f.key}>
                    {f.label}{f.derived ? ' ·' : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Operator</InputLabel>
              <Select
                value={row.op}
                label="Operator"
                onChange={(e) => onOpChange(idx, e.target.value)}
              >
                {(fieldFor(row.field)?.operators || []).map((op) => (
                  <MenuItem key={op} value={op}>{OP_LABELS[op] || op}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {renderValueInput(row, idx)}

            <IconButton size="small" onClick={() => removeRow(idx)} sx={{ ml: 'auto' }}>
              <DeleteOutline fontSize="small" />
            </IconButton>
          </Box>
        ))}
      </Stack>

      <Button
        size="small"
        startIcon={<Add />}
        onClick={addRow}
        disabled={fields.length === 0}
        sx={{ mt: 1.5, textTransform: 'none' }}
      >
        Add condition
      </Button>
    </Box>
  );
};

export default FilterBuilder;
