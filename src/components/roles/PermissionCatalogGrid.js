import React, { useMemo, useCallback } from 'react';
import {
  Box,
  Typography,
  Checkbox,
  FormControlLabel,
  Chip,
  alpha,
  useTheme,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import { ExpandMore, CheckCircle } from '@mui/icons-material';

/**
 * Grouped checkbox grid for selecting permissions.
 *
 * @param {object} props
 * @param {{ module: string, label: string, permissions: { key: string, action: string, label: string }[] }[]} props.catalog
 * @param {string[]} props.selectedPermissions - currently selected permission keys
 * @param {(newPermissions: string[]) => void} props.onChange
 * @param {boolean} [props.disabled]
 */
const PermissionCatalogGrid = ({
  catalog = [],
  selectedPermissions = [],
  onChange,
  disabled = false,
}) => {
  const theme = useTheme();

  // Build a Set for O(1) lookups
  const selectedSet = useMemo(
    () => new Set(selectedPermissions),
    [selectedPermissions],
  );

  // Totals for the summary line
  const totalPermissions = useMemo(
    () => catalog.reduce((sum, g) => sum + g.permissions.length, 0),
    [catalog],
  );

  const togglePermission = useCallback(
    (key) => {
      if (disabled) return;
      const next = selectedSet.has(key)
        ? selectedPermissions.filter((k) => k !== key)
        : [...selectedPermissions, key];
      onChange(next);
    },
    [disabled, selectedSet, selectedPermissions, onChange],
  );

  const toggleModule = useCallback(
    (group) => {
      if (disabled) return;
      const keys = group.permissions.map((p) => p.key);
      const allSelected = keys.every((k) => selectedSet.has(k));

      let next;
      if (allSelected) {
        // Deselect every permission in this module
        const removeSet = new Set(keys);
        next = selectedPermissions.filter((k) => !removeSet.has(k));
      } else {
        // Select every permission in this module
        const addSet = new Set(selectedPermissions);
        keys.forEach((k) => addSet.add(k));
        next = Array.from(addSet);
      }
      onChange(next);
    },
    [disabled, selectedSet, selectedPermissions, onChange],
  );

  return (
    <Box>
      {/* Summary */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          mb: 1.5,
          px: 0.5,
        }}
      >
        <CheckCircle
          sx={{
            fontSize: 18,
            color:
              selectedPermissions.length === totalPermissions
                ? theme.palette.success.main
                : theme.palette.text.disabled,
          }}
        />
        <Typography variant="body2" color="text.secondary">
          {selectedPermissions.length} of {totalPermissions} permissions selected
        </Typography>
      </Box>

      {/* Module groups */}
      {catalog.map((group) => {
        const keys = group.permissions.map((p) => p.key);
        const selectedCount = keys.filter((k) => selectedSet.has(k)).length;
        const allSelected = selectedCount === keys.length && keys.length > 0;
        const someSelected = selectedCount > 0 && !allSelected;

        return (
          <Accordion
            key={group.module}
            defaultExpanded
            disableGutters
            elevation={0}
            sx={{
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: '8px !important',
              mb: 1,
              '&:before': { display: 'none' },
              overflow: 'hidden',
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMore />}
              sx={{
                minHeight: 48,
                px: 2,
                backgroundColor: alpha(theme.palette.primary.main, 0.04),
                '& .MuiAccordionSummary-content': {
                  alignItems: 'center',
                  gap: 1,
                  my: 0.5,
                },
              }}
            >
              <Checkbox
                size="small"
                checked={allSelected}
                indeterminate={someSelected}
                disabled={disabled}
                onClick={(e) => e.stopPropagation()}
                onChange={() => toggleModule(group)}
                sx={{ p: 0.5 }}
              />
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {group.label}
              </Typography>
              <Chip
                label={`${selectedCount}/${keys.length}`}
                size="small"
                sx={{
                  height: 22,
                  fontSize: '0.688rem',
                  fontWeight: 600,
                  backgroundColor: allSelected
                    ? alpha(theme.palette.success.main, 0.1)
                    : alpha(theme.palette.text.primary, 0.08),
                  color: allSelected
                    ? theme.palette.success.dark
                    : theme.palette.text.secondary,
                }}
              />
            </AccordionSummary>

            <AccordionDetails sx={{ px: 2, pt: 1, pb: 1.5 }}>
              <Box
                sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 0.5,
                }}
              >
                {group.permissions.map((perm) => (
                  <FormControlLabel
                    key={perm.key}
                    control={
                      <Checkbox
                        size="small"
                        checked={selectedSet.has(perm.key)}
                        disabled={disabled}
                        onChange={() => togglePermission(perm.key)}
                        sx={{ p: 0.5 }}
                      />
                    }
                    label={
                      <Typography variant="body2" sx={{ fontSize: '0.813rem' }}>
                        {perm.label}
                      </Typography>
                    }
                    sx={{
                      mr: 2,
                      ml: 0,
                      minWidth: 160,
                      '& .MuiFormControlLabel-label': { userSelect: 'none' },
                    }}
                  />
                ))}
              </Box>
            </AccordionDetails>
          </Accordion>
        );
      })}
    </Box>
  );
};

export default PermissionCatalogGrid;
