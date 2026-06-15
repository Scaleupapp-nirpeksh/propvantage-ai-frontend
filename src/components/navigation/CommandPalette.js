import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog, Box, TextField, Typography, List, ListItemButton,
  ListItemIcon, ListItemText, Chip, InputAdornment, Fade, alpha, useTheme,
  CircularProgress,
} from '@mui/material';
import {
  Search, Dashboard, Business, People, AttachMoney, Analytics,
  MonetizationOn, Settings, TrendingUp, Receipt, Payment,
  Assessment, Handshake, TaskAlt, ViewKanban,
  GroupWork, Assignment, Notifications, Leaderboard, Chat as ChatIcon,
  Insights, AutoGraph, Person, MeetingRoom,
} from '@mui/icons-material';
import { searchAPI } from '../../services/api';

// Static page list — kept as a secondary "Go to page" group (navigating to a
// page by name is search, not an action). The static quick-ACTIONS list was
// removed (2026-06 refactor) in favour of live entity search via /api/search.
const PAGES = [
  { label: 'Dashboard', path: '/dashboard', icon: Dashboard, section: 'Pages' },
  { label: 'All Projects', path: '/projects', icon: Business, section: 'Pages' },
  { label: 'All Leads', path: '/leads', icon: People, section: 'Pages' },
  { label: 'Funnel', path: '/leads/pipeline', icon: TrendingUp, section: 'Pages' },
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
  { label: 'Leadership Dashboard', path: '/analytics/leadership', icon: Leaderboard, section: 'Pages' },
  { label: 'Dynamic Pricing', path: '/pricing/dynamic', icon: MonetizationOn, section: 'Pages' },
  { label: 'User Management', path: '/settings/users', icon: Settings, section: 'Pages' },
  { label: 'Profile', path: '/profile', icon: Settings, section: 'Pages' },
  { label: 'My Tasks', path: '/tasks', icon: TaskAlt, section: 'Pages' },
  { label: 'All Tasks', path: '/tasks/all', icon: Assignment, section: 'Pages' },
  { label: 'Task Kanban Board', path: '/tasks/kanban', icon: ViewKanban, section: 'Pages' },
  { label: 'Team Tasks', path: '/tasks/team', icon: GroupWork, section: 'Pages' },
  { label: 'Task Analytics', path: '/tasks/analytics', icon: Assessment, section: 'Pages' },
  { label: 'Task Templates', path: '/tasks/templates', icon: TaskAlt, section: 'Pages' },
  { label: 'Notifications', path: '/notifications', icon: Notifications, section: 'Pages' },
  { label: 'Notification Settings', path: '/settings/notifications', icon: Notifications, section: 'Pages' },
  { label: 'Chat', path: '/chat', icon: ChatIcon, section: 'Pages' },
  { label: 'Competitive Analysis', path: '/competitive-analysis', icon: Insights, section: 'Pages', beta: true },
  { label: 'Competitor List', path: '/competitive-analysis/competitors', icon: Business, section: 'Pages', beta: true },
  { label: 'Market Overview', path: '/competitive-analysis/market/overview', icon: TrendingUp, section: 'Pages', beta: true },
  { label: 'Market Trends', path: '/competitive-analysis/market/trends', icon: Analytics, section: 'Pages', beta: true },
  { label: 'AI Analysis', path: '/competitive-analysis/analysis', icon: AutoGraph, section: 'Pages', beta: true },
];

// Icon per entity-result group.
const ENTITY_ICONS = {
  leads: People,
  projects: Business,
  units: MeetingRoom,
  people: Person,
};

// Display order + headers for the live entity groups.
const ENTITY_GROUPS = [
  { key: 'leads', label: 'Leads' },
  { key: 'projects', label: 'Projects' },
  { key: 'units', label: 'Units' },
  { key: 'people', label: 'People' },
];

// Derived from ENTITY_GROUPS so the empty shape can't drift from the group set.
const EMPTY_RESULTS = Object.fromEntries(ENTITY_GROUPS.map((g) => [g.key, []]));

const SEARCH_DEBOUNCE_MS = 250;
const MIN_QUERY_LEN = 2;

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
 * Cmd+K command palette: live natural-language-ish entity search.
 *
 * Wired to GET /api/search — typing a name/keyword surfaces grouped live
 * results (Leads / Projects / Units / People) that navigate to the entity on
 * select. The local PAGES list is kept only as a secondary "Pages" nav group.
 */
const CommandPalette = ({ open, onClose }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [results, setResults] = useState(EMPTY_RESULTS);
  const [searching, setSearching] = useState(false);
  const navigate = useNavigate();
  const theme = useTheme();
  const inputRef = useRef(null);

  // Monotonic request counter — only the latest in-flight query's response is
  // applied, so out-of-order/stale responses are ignored.
  const reqIdRef = useRef(0);

  // Debounced live entity search. Fires only for queries >= MIN_QUERY_LEN; for
  // shorter queries we clear the entity results (the Pages group still filters
  // locally below).
  useEffect(() => {
    const q = query.trim();
    if (q.length < MIN_QUERY_LEN) {
      reqIdRef.current += 1; // invalidate any in-flight response
      setSearching(false);
      setResults(EMPTY_RESULTS);
      return;
    }

    const myReqId = ++reqIdRef.current;
    setSearching(true);
    // Clear the prior query's results immediately so the debounce window can't
    // show — or let Enter navigate to — a stale result from a previous query.
    setResults(EMPTY_RESULTS);
    const timer = setTimeout(async () => {
      try {
        const res = await searchAPI.search(q);
        // Drop stale responses — a newer query has superseded this one.
        if (myReqId !== reqIdRef.current) return;
        setResults(res?.data?.results || EMPTY_RESULTS);
      } catch {
        if (myReqId !== reqIdRef.current) return;
        setResults(EMPTY_RESULTS);
      } finally {
        if (myReqId === reqIdRef.current) setSearching(false);
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query]);

  // Reset on open.
  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setResults(EMPTY_RESULTS);
      setSearching(false);
      reqIdRef.current += 1;
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // Pages filtered by the current query (secondary nav group). When the query
  // is empty we show recently-visited pages instead.
  const pageRows = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) {
      return getRecentPages().map((r) => {
        const page = PAGES.find((p) => p.path === r.path);
        return page
          ? { ...page, section: 'Recent' }
          : { label: r.label, path: r.path, icon: Dashboard, section: 'Recent' };
      });
    }
    return PAGES.filter((p) => p.label.toLowerCase().includes(q)).slice(0, 8);
    // `open` is a dep so reopening the palette (query stays '') re-reads the
    // recent-pages list and reflects the latest navigation each time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, open]);

  // Build the grouped, flattened list of visible rows. Each row is normalised
  // to { key, label, sublabel, icon, target, beta, isPage } so keyboard nav and
  // selection work uniformly across entity results and pages.
  const groups = useMemo(() => {
    const out = [];

    ENTITY_GROUPS.forEach(({ key, label }) => {
      const items = Array.isArray(results[key]) ? results[key] : [];
      if (items.length === 0) return;
      out.push({
        key,
        header: label,
        rows: items.map((item) => ({
          key: `${key}-${item.id}`,
          label: item.label,
          sublabel: item.sublabel,
          icon: ENTITY_ICONS[key] || Search,
          target: item.url,
          isPage: false,
        })),
      });
    });

    if (pageRows.length > 0) {
      out.push({
        key: 'pages',
        header: pageRows[0].section === 'Recent' ? 'Recent' : 'Pages',
        rows: pageRows.map((p) => ({
          key: `page-${p.path}`,
          label: p.label,
          sublabel: undefined,
          icon: p.icon || Dashboard,
          target: p.path,
          beta: p.beta,
          isPage: true,
          pageLabel: p.label,
        })),
      });
    }

    return out;
  }, [results, pageRows]);

  // Flattened visible rows (in render order) for keyboard up/down/Enter.
  const flatRows = useMemo(() => groups.flatMap((g) => g.rows), [groups]);

  // Keep the selection in-bounds whenever the visible list changes.
  useEffect(() => {
    setSelectedIndex((i) => {
      if (flatRows.length === 0) return 0;
      return Math.min(i, flatRows.length - 1);
    });
  }, [flatRows.length]);

  const handleSelect = useCallback((row) => {
    if (!row || !row.target) return;
    if (row.isPage) addRecentPage(row.target, row.pageLabel || row.label);
    navigate(row.target);
    onClose();
  }, [navigate, onClose]);

  // Keyboard navigation across the flattened visible rows.
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, flatRows.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && flatRows[selectedIndex]) {
      e.preventDefault();
      handleSelect(flatRows[selectedIndex]);
    }
  }, [flatRows, selectedIndex, handleSelect]);

  const trimmedQuery = query.trim();
  const hasQuery = trimmedQuery.length >= MIN_QUERY_LEN;
  // Empty state only once a real (>=2 char) query has settled with no rows.
  const showEmptyState = hasQuery && !searching && flatRows.length === 0;

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
          placeholder="Search leads, projects, people…"
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
                {searching && <CircularProgress size={16} sx={{ mr: 1.5 }} />}
                <Chip label="ESC" size="small" sx={{ mr: 1, height: 22, fontSize: '0.688rem' }} />
              </InputAdornment>
            ),
            sx: { fontSize: '0.938rem', py: 1.5, px: 1 },
          }}
        />

        {/* Results */}
        <Box sx={{ borderTop: '1px solid', borderColor: 'divider', maxHeight: 'calc(60vh - 60px)', overflow: 'auto' }}>
          {showEmptyState ? (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No results for “{trimmedQuery}”
              </Typography>
            </Box>
          ) : flatRows.length === 0 ? (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                {searching ? 'Searching…' : 'Type to search leads, projects, units and people'}
              </Typography>
            </Box>
          ) : (
            <List dense sx={{ py: 1 }}>
              {groups.map((group) => (
                <React.Fragment key={group.key || group.header}>
                  <Typography
                    variant="overline"
                    sx={{ px: 2, pt: 1, pb: 0.5, display: 'block', color: 'text.secondary' }}
                  >
                    {group.header}
                  </Typography>
                  {group.rows.map((row) => {
                    const idx = flatIndex++;
                    const Icon = row.icon;
                    return (
                      <ListItemButton
                        key={row.key}
                        selected={idx === selectedIndex}
                        onClick={() => handleSelect(row)}
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
                          <Icon sx={{ fontSize: 18, color: 'text.secondary' }} />
                        </ListItemIcon>
                        <ListItemText
                          primary={row.label}
                          secondary={row.sublabel || undefined}
                          primaryTypographyProps={{ fontSize: '0.813rem', fontWeight: idx === selectedIndex ? 600 : 400 }}
                          secondaryTypographyProps={{ fontSize: '0.719rem', color: 'text.secondary', noWrap: true }}
                        />
                        {row.beta && (
                          <Chip label="BETA" size="small" sx={{ height: 18, fontSize: '0.55rem', fontWeight: 700, bgcolor: 'warning.main', color: '#fff', mr: 0.5 }} />
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
