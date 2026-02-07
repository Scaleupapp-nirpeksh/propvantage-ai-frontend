import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog, Box, TextField, Typography, List, ListItemButton,
  ListItemIcon, ListItemText, Chip, InputAdornment, Fade, alpha, useTheme,
} from '@mui/material';
import {
  Search, Dashboard, Business, People, AttachMoney, Analytics,
  MonetizationOn, Settings, Add, TrendingUp, Receipt, Payment,
  Assessment, PersonAdd, NoteAdd, Handshake,
} from '@mui/icons-material';

// Static page list
const PAGES = [
  { label: 'Dashboard', path: '/dashboard', icon: Dashboard, section: 'Pages' },
  { label: 'All Projects', path: '/projects', icon: Business, section: 'Pages' },
  { label: 'All Leads', path: '/leads', icon: People, section: 'Pages' },
  { label: 'Sales Pipeline', path: '/leads/pipeline', icon: TrendingUp, section: 'Pages' },
  { label: 'All Sales', path: '/sales', icon: AttachMoney, section: 'Pages' },
  { label: 'Sales Pipeline', path: '/sales/pipeline', icon: TrendingUp, section: 'Pages' },
  { label: 'Sales Reports', path: '/sales/reports', icon: Assessment, section: 'Pages' },
  { label: 'Invoices', path: '/sales/invoices', icon: Receipt, section: 'Pages' },
  { label: 'Commissions', path: '/sales/commissions', icon: Handshake, section: 'Pages' },
  { label: 'Payment Dashboard', path: '/payments/dashboard', icon: Payment, section: 'Pages' },
  { label: 'Due Today', path: '/payments/due-today', icon: Payment, section: 'Pages' },
  { label: 'Overdue Payments', path: '/payments/overdue', icon: Payment, section: 'Pages' },
  { label: 'Analytics Overview', path: '/analytics', icon: Analytics, section: 'Pages' },
  { label: 'Sales Analytics', path: '/analytics/sales', icon: TrendingUp, section: 'Pages' },
  { label: 'Revenue Analytics', path: '/analytics/revenue', icon: AttachMoney, section: 'Pages' },
  { label: 'Budget Variance', path: '/analytics/budget-variance', icon: Assessment, section: 'Pages' },
  { label: 'Predictive Analytics', path: '/analytics/predictions', icon: Analytics, section: 'Pages' },
  { label: 'Dynamic Pricing', path: '/pricing/dynamic', icon: MonetizationOn, section: 'Pages' },
  { label: 'User Management', path: '/settings/users', icon: Settings, section: 'Pages' },
  { label: 'Profile', path: '/profile', icon: Settings, section: 'Pages' },
];

const ACTIONS = [
  { label: 'Create New Lead', path: '/leads/create', icon: PersonAdd, section: 'Actions' },
  { label: 'Create New Project', path: '/projects/create', icon: Add, section: 'Actions' },
  { label: 'New Booking / Sale', path: '/sales/create', icon: NoteAdd, section: 'Actions' },
  { label: 'Record Payment', path: '/payments/record', icon: Payment, section: 'Actions' },
  { label: 'Generate Invoice', path: '/sales/invoices/generate', icon: Receipt, section: 'Actions' },
];

const RECENT_KEY = 'propvantage_recent_pages';

const getRecentPages = () => {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]').slice(0, 5);
  } catch { return []; }
};

const addRecentPage = (path, label) => {
  try {
    const recent = getRecentPages().filter(r => r.path !== path);
    recent.unshift({ path, label });
    localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, 5)));
  } catch { /* ignore */ }
};

/**
 * Cmd+K command palette for searching pages and quick actions.
 */
const CommandPalette = ({ open, onClose }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const theme = useTheme();
  const inputRef = useRef(null);

  // Filter results
  const results = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) {
      const recent = getRecentPages();
      const recentItems = recent.map(r => {
        const page = PAGES.find(p => p.path === r.path);
        return page ? { ...page, section: 'Recent' } : { label: r.label, path: r.path, icon: Dashboard, section: 'Recent' };
      });
      return [...recentItems, ...ACTIONS.slice(0, 3)];
    }
    const all = [...PAGES, ...ACTIONS];
    return all.filter(item => item.label.toLowerCase().includes(q)).slice(0, 10);
  }, [query]);

  // Reset on open
  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      const item = results[selectedIndex];
      addRecentPage(item.path, item.label);
      navigate(item.path);
      onClose();
    }
  }, [results, selectedIndex, navigate, onClose]);

  const handleSelect = (item) => {
    addRecentPage(item.path, item.label);
    navigate(item.path);
    onClose();
  };

  // Group results by section
  const sections = useMemo(() => {
    const map = {};
    results.forEach(r => {
      if (!map[r.section]) map[r.section] = [];
      map[r.section].push(r);
    });
    return map;
  }, [results]);

  let flatIndex = 0;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          mt: '10vh',
          alignSelf: 'flex-start',
          maxHeight: '60vh',
          overflow: 'hidden',
        },
      }}
      TransitionComponent={Fade}
      transitionDuration={150}
    >
      <Box sx={{ p: 0 }}>
        {/* Search input */}
        <TextField
          inputRef={inputRef}
          fullWidth
          placeholder="Search pages, actions..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
          onKeyDown={handleKeyDown}
          variant="standard"
          InputProps={{
            disableUnderline: true,
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: 'text.secondary', ml: 1 }} />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <Chip label="ESC" size="small" sx={{ mr: 1, height: 22, fontSize: '0.688rem' }} />
              </InputAdornment>
            ),
            sx: { fontSize: '0.938rem', py: 1.5, px: 1 },
          }}
        />

        {/* Results */}
        <Box sx={{ borderTop: '1px solid', borderColor: 'divider', maxHeight: 'calc(60vh - 60px)', overflow: 'auto' }}>
          {results.length === 0 ? (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">No results found</Typography>
            </Box>
          ) : (
            <List dense sx={{ py: 1 }}>
              {Object.entries(sections).map(([section, items]) => (
                <React.Fragment key={section}>
                  <Typography
                    variant="overline"
                    sx={{ px: 2, pt: 1, pb: 0.5, display: 'block', color: 'text.secondary' }}
                  >
                    {section}
                  </Typography>
                  {items.map((item) => {
                    const idx = flatIndex++;
                    const Icon = item.icon;
                    return (
                      <ListItemButton
                        key={item.path + item.label}
                        selected={idx === selectedIndex}
                        onClick={() => handleSelect(item)}
                        sx={{
                          mx: 1,
                          borderRadius: 1.5,
                          py: 0.75,
                          '&.Mui-selected': {
                            bgcolor: alpha(theme.palette.primary.main, 0.08),
                          },
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <Icon sx={{ fontSize: 18, color: item.section === 'Actions' ? 'primary.main' : 'text.secondary' }} />
                        </ListItemIcon>
                        <ListItemText
                          primary={item.label}
                          primaryTypographyProps={{ fontSize: '0.813rem', fontWeight: idx === selectedIndex ? 600 : 400 }}
                        />
                        {item.section === 'Actions' && (
                          <Chip label="Action" size="small" color="primary" sx={{ height: 20, fontSize: '0.625rem' }} />
                        )}
                      </ListItemButton>
                    );
                  })}
                </React.Fragment>
              ))}
            </List>
          )}
        </Box>
      </Box>
    </Dialog>
  );
};

export default CommandPalette;
