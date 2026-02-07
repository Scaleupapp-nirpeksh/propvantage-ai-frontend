import React, { useState } from 'react';
import {
  Box, TextField, FormControl, InputLabel, Select, MenuItem,
  Button, IconButton, Badge, Drawer, Typography, Divider,
  useTheme, useMediaQuery, InputAdornment,
} from '@mui/material';
import { FilterList, Search, Close, Clear } from '@mui/icons-material';

/**
 * Responsive filter bar — horizontal on desktop, bottom-sheet drawer on mobile.
 *
 * @param {object} props
 * @param {Array<{key:string, type:'search'|'select', label:string, options?:Array<{value:any,label:string}>, placeholder?:string}>} props.filters
 * @param {object} props.values - current filter values keyed by filter.key
 * @param {(key:string, value:any)=>void} props.onChange
 * @param {()=>void} [props.onClear]
 * @param {React.ReactNode} [props.extraActions] - additional buttons (export, etc.)
 */
const FilterBar = ({ filters = [], values = {}, onChange, onClear, extraActions }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(false);

  const activeCount = Object.values(values).filter(v => v !== '' && v !== undefined && v !== null).length;

  const renderFilter = (filter) => {
    const value = values[filter.key] ?? '';

    if (filter.type === 'search') {
      return (
        <TextField
          key={filter.key}
          placeholder={filter.placeholder || `Search ${filter.label}...`}
          value={value}
          onChange={(e) => onChange(filter.key, e.target.value)}
          size="small"
          sx={{ minWidth: isMobile ? '100%' : 220 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ fontSize: 18, color: 'text.disabled' }} />
              </InputAdornment>
            ),
            endAdornment: value ? (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => onChange(filter.key, '')}>
                  <Close sx={{ fontSize: 16 }} />
                </IconButton>
              </InputAdornment>
            ) : null,
          }}
        />
      );
    }

    if (filter.type === 'select') {
      return (
        <FormControl key={filter.key} size="small" sx={{ minWidth: isMobile ? '100%' : 160 }}>
          <InputLabel>{filter.label}</InputLabel>
          <Select
            value={value}
            label={filter.label}
            onChange={(e) => onChange(filter.key, e.target.value)}
          >
            <MenuItem value="">All</MenuItem>
            {(filter.options || []).map(opt => (
              <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
      );
    }

    return null;
  };

  // Mobile: filter button + drawer
  if (isMobile) {
    return (
      <>
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          {/* Always show search on mobile */}
          {filters.filter(f => f.type === 'search').map(renderFilter)}

          <Badge badgeContent={activeCount} color="primary" overlap="circular">
            <IconButton
              onClick={() => setDrawerOpen(true)}
              sx={{
                border: '1px solid',
                borderColor: activeCount ? 'primary.main' : 'divider',
                borderRadius: 2,
                px: 1.5,
              }}
            >
              <FilterList sx={{ fontSize: 20 }} />
            </IconButton>
          </Badge>

          {extraActions}
        </Box>

        <Drawer
          anchor="bottom"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          PaperProps={{
            sx: { borderRadius: '16px 16px 0 0', maxHeight: '70vh', p: 3 },
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>Filters</Typography>
            <IconButton onClick={() => setDrawerOpen(false)}>
              <Close />
            </IconButton>
          </Box>
          <Divider sx={{ mb: 2 }} />

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {filters.filter(f => f.type !== 'search').map(renderFilter)}
          </Box>

          <Box sx={{ display: 'flex', gap: 1, mt: 3 }}>
            {onClear && (
              <Button variant="outlined" fullWidth onClick={() => { onClear(); setDrawerOpen(false); }}>
                Clear All
              </Button>
            )}
            <Button variant="contained" fullWidth onClick={() => setDrawerOpen(false)}>
              Apply
            </Button>
          </Box>
        </Drawer>
      </>
    );
  }

  // Desktop: horizontal row
  return (
    <Box data-coach="filter-bar" sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap', mb: 2 }}>
      {filters.map(renderFilter)}

      {onClear && activeCount > 0 && (
        <Button
          size="small"
          startIcon={<Clear sx={{ fontSize: 16 }} />}
          onClick={onClear}
          sx={{ color: 'text.secondary' }}
        >
          Clear
        </Button>
      )}

      {extraActions && (
        <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
          {extraActions}
        </Box>
      )}
    </Box>
  );
};

export default FilterBar;
