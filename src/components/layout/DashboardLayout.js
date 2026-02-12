// File: src/components/layout/DashboardLayout.js
// Description: Redesigned layout - collapsible sidebar, command palette, clean minimal design
// Version: 2.0
// Location: src/components/layout/DashboardLayout.js

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Tooltip,
  Collapse,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Breadcrumbs,
  Link,
  useTheme,
  useMediaQuery,
  Chip,
  alpha,
  Fade,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  Business,
  People,
  TrendingUp,
  Analytics,
  Assignment,
  Settings,
  Logout,
  Notifications,
  ExpandLess,
  ExpandMore,
  Home,
  AccountCircle,
  ChevronRight,
  ChevronLeft,
  Apartment,
  LocationCity,
  PersonPin,
  AttachMoney,
  Receipt,
  Payment,
  Assessment,
  Timeline,
  BarChart,
  Handshake,
  AccountBalanceWallet,
  MonetizationOn,
  Today,
  Warning,
  NoteAdd,
  PieChart,
  TrendingFlat,
  CompareArrows,
  AutoGraph,
  PsychologyAlt,
  QueryStats,
  PersonAdd,
  Search,
  AdminPanelSettings,
  AccountTree,
  TaskAlt,
  ViewKanban,
  GroupWork,
  ListAlt,
  Description,
  Leaderboard,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import CommandPalette from '../navigation/CommandPalette';
import NotificationBell from '../notifications/NotificationBell';
import CopilotFAB from '../copilot/CopilotFAB';
import { useCoachMark } from '../onboarding';

// --- Constants ---
const DRAWER_WIDTH = 260;
const COLLAPSED_WIDTH = 72;

// --- Navigation Items ---
const getNavigationItems = (userRole, canAccess) => {
  const allItems = [
    // MAIN
    {
      section: 'MAIN',
      items: [
        {
          id: 'dashboard',
          title: 'Dashboard',
          icon: Dashboard,
          path: '/dashboard',
          requiredAccess: () => true,
        },
      ],
    },
    // OPERATIONS
    {
      section: 'OPERATIONS',
      items: [
        {
          id: 'projects',
          title: 'Projects',
          icon: Business,
          path: '/projects',
          requiredAccess: () => canAccess.viewAllProjects(),
          children: [
            { id: 'projects-list', title: 'All Projects', icon: Apartment, path: '/projects' },
            { id: 'projects-create', title: 'Create Project', icon: LocationCity, path: '/projects/create', requiredAccess: () => canAccess.projectManagement() },
          ],
        },
        {
          id: 'leads',
          title: 'Leads',
          icon: People,
          path: '/leads',
          requiredAccess: () => canAccess.leadManagement(),
          children: [
            { id: 'leads-list', title: 'All Leads', icon: PersonPin, path: '/leads' },
            { id: 'leads-pipeline', title: 'Pipeline', icon: TrendingUp, path: '/leads/pipeline' },
            { id: 'leads-create', title: 'Add Lead', icon: PersonAdd, path: '/leads/create' },
          ],
        },
        {
          id: 'sales',
          title: 'Sales & Bookings',
          icon: AttachMoney,
          path: '/sales',
          requiredAccess: () => canAccess.salesPipeline(),
          children: [
            { id: 'sales-list', title: 'All Sales', icon: Assignment, path: '/sales' },
            { id: 'sales-create', title: 'New Booking', icon: NoteAdd, path: '/sales/create' },
            { id: 'sales-pipeline', title: 'Pipeline', icon: Timeline, path: '/sales/pipeline', requiredAccess: () => canAccess.salesPipeline() },
            { id: 'sales-reports', title: 'Sales Reports', icon: BarChart, path: '/sales/reports', requiredAccess: () => canAccess.salesReports() },
            { id: 'invoices', title: 'Invoices', icon: Receipt, path: '/sales/invoices', requiredAccess: () => canAccess.salesReports() },
            { id: 'commissions', title: 'Commissions', icon: Handshake, path: '/sales/commissions', requiredAccess: () => canAccess.salesPipeline() || canAccess.viewFinancials() },
          ],
        },
        {
          id: 'payments',
          title: 'Payments',
          icon: Payment,
          path: '/payments/dashboard',
          requiredAccess: () => canAccess.salesPipeline(),
          children: [
            { id: 'payment-dashboard', title: 'Overview', icon: MonetizationOn, path: '/payments/dashboard' },
            { id: 'due-today', title: 'Due Today', icon: Today, path: '/payments/due-today' },
            { id: 'overdue', title: 'Overdue', icon: Warning, path: '/payments/overdue' },
            { id: 'payment-reports', title: 'Reports', icon: Assessment, path: '/payments/reports', requiredAccess: () => canAccess.salesReports() },
            { id: 'payment-plans', title: 'Payment Plans', icon: AccountBalanceWallet, path: '/sales/payment-plans', requiredAccess: () => canAccess.salesPipeline() },
          ],
        },
        {
          id: 'tasks',
          title: 'Tasks',
          icon: TaskAlt,
          path: '/tasks',
          requiredAccess: () => canAccess.taskManagement(),
          children: [
            { id: 'my-tasks', title: 'My Tasks', icon: Assignment, path: '/tasks' },
            { id: 'all-tasks', title: 'All Tasks', icon: ListAlt, path: '/tasks/all' },
            { id: 'kanban', title: 'Kanban Board', icon: ViewKanban, path: '/tasks/kanban' },
            { id: 'team-tasks', title: 'Team View', icon: GroupWork, path: '/tasks/team', requiredAccess: () => canAccess.taskTeamView() },
            { id: 'task-analytics', title: 'Analytics', icon: Assessment, path: '/tasks/analytics', requiredAccess: () => canAccess.taskAnalytics() },
            { id: 'task-templates', title: 'Templates', icon: Description, path: '/tasks/templates', requiredAccess: () => canAccess.taskTemplates() },
          ],
        },
      ],
    },
    // INTELLIGENCE
    {
      section: 'INTELLIGENCE',
      items: [
        {
          id: 'leadership',
          title: 'Leadership',
          icon: Leaderboard,
          path: '/analytics/leadership',
          requiredAccess: () => canAccess.projectManagement(),
        },
        {
          id: 'analytics',
          title: 'Analytics',
          icon: Analytics,
          path: '/analytics',
          requiredAccess: () => canAccess.salesReports(),
          children: [
            { id: 'analytics-dashboard', title: 'Overview', icon: PieChart, path: '/analytics' },
            { id: 'analytics-sales', title: 'Sales Analytics', icon: TrendingUp, path: '/analytics/sales' },
            { id: 'analytics-revenue', title: 'Revenue', icon: AttachMoney, path: '/analytics/revenue', requiredAccess: () => canAccess.viewFinancials() },
            { id: 'analytics-leads', title: 'Lead Analytics', icon: People, path: '/analytics/leads' },
            { id: 'budget-variance', title: 'Budget Planning', icon: QueryStats, path: '/analytics/budget-variance', requiredAccess: () => canAccess.viewFinancials() },
            { id: 'budget-vs-actual', title: 'Budget vs Actual', icon: CompareArrows, path: '/analytics/budget', requiredAccess: () => canAccess.viewFinancials() },
            { id: 'financial-realtime', title: 'Real-time Financial', icon: TrendingFlat, path: '/analytics/financial', requiredAccess: () => canAccess.viewFinancials() },
            { id: 'predictive', title: 'Predictions', icon: PsychologyAlt, path: '/analytics/predictions', requiredAccess: () => canAccess.viewFinancials() },
          ],
        },
        {
          id: 'pricing',
          title: 'Pricing',
          icon: MonetizationOn,
          path: '/pricing/dynamic',
          requiredAccess: () => canAccess.viewFinancials(),
          children: [
            { id: 'dynamic-pricing', title: 'Dynamic Pricing', icon: AutoGraph, path: '/pricing/dynamic', requiredAccess: () => canAccess.viewFinancials() },
          ],
        },
      ],
    },
    // SYSTEM
    {
      section: 'SYSTEM',
      items: [
        {
          id: 'settings',
          title: 'Admin',
          icon: Settings,
          path: '/settings',
          requiredAccess: () => canAccess.userManagement() || canAccess.projectManagement(),
          children: [
            { id: 'user-management', title: 'Users', icon: People, path: '/settings/users', requiredAccess: () => canAccess.userManagement() },
            { id: 'roles', title: 'Roles', icon: AdminPanelSettings, path: '/roles', requiredAccess: () => canAccess.systemSettings() },
            { id: 'notification-settings', title: 'Notifications', icon: Notifications, path: '/settings/notifications' },
          ],
        },
        {
          id: 'org-hierarchy',
          title: 'Org Hierarchy',
          icon: AccountTree,
          path: '/org-hierarchy',
        },
      ],
    },
  ];

  // Filter based on access
  return allItems.map(section => ({
    ...section,
    items: section.items.filter(item => {
      if (item.requiredAccess && !item.requiredAccess()) return false;
      if (item.children) {
        item.children = item.children.filter(c => !c.requiredAccess || c.requiredAccess());
      }
      return true;
    }),
  })).filter(section => section.items.length > 0);
};

// --- Navigation Item Component ---
const NavItem = ({ item, isActive, onNavigate, isOpen, onToggle, collapsed, level = 0 }) => {
  const theme = useTheme();
  const hasChildren = item.children && item.children.length > 0;
  const Icon = item.icon;

  const handleClick = () => {
    if (hasChildren && !collapsed) {
      onToggle();
    } else {
      onNavigate(item.path);
    }
  };

  const isChildActive = hasChildren && item.children.some(c =>
    window.location.pathname === c.path || window.location.pathname.startsWith(c.path + '/')
  );
  const active = isActive && !hasChildren;

  return (
    <>
      <Tooltip title={collapsed ? item.title : ''} placement="right" arrow>
        <ListItemButton
          onClick={handleClick}
          sx={{
            minHeight: 38,
            borderRadius: 2,
            mx: collapsed ? 0.75 : 1,
            my: 0.25,
            px: collapsed ? 0 : 1.5,
            justifyContent: collapsed ? 'center' : 'flex-start',
            pl: collapsed ? 0 : 1.5 + level * 2,
            position: 'relative',
            // Active state: left border accent
            ...(active && {
              bgcolor: alpha(theme.palette.primary.main, 0.08),
              '&::before': {
                content: '""',
                position: 'absolute',
                left: 0,
                top: 6,
                bottom: 6,
                width: 3,
                borderRadius: '0 3px 3px 0',
                bgcolor: 'primary.main',
              },
            }),
            // Parent with active child
            ...(isChildActive && !active && {
              bgcolor: alpha(theme.palette.primary.main, 0.04),
            }),
            '&:hover': {
              bgcolor: active
                ? alpha(theme.palette.primary.main, 0.12)
                : alpha(theme.palette.grey[500], 0.08),
            },
          }}
        >
          <ListItemIcon
            sx={{
              minWidth: collapsed ? 0 : 36,
              justifyContent: 'center',
              color: active || isChildActive ? 'primary.main' : 'text.secondary',
            }}
          >
            <Icon sx={{ fontSize: level > 0 ? 18 : 20 }} />
          </ListItemIcon>
          {!collapsed && (
            <>
              <ListItemText
                primary={item.title}
                primaryTypographyProps={{
                  fontSize: level > 0 ? '0.75rem' : '0.813rem',
                  fontWeight: active || isChildActive ? 600 : 400,
                  color: active ? 'primary.main' : 'text.primary',
                  noWrap: true,
                }}
              />
              {hasChildren && (isOpen ? <ExpandLess sx={{ fontSize: 18 }} /> : <ExpandMore sx={{ fontSize: 18 }} />)}
            </>
          )}
        </ListItemButton>
      </Tooltip>

      {hasChildren && !collapsed && (
        <Collapse in={isOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {item.children.map(child => (
              <NavItem
                key={child.id}
                item={child}
                isActive={window.location.pathname === child.path || window.location.pathname.startsWith(child.path + '/')}
                onNavigate={onNavigate}
                isOpen={false}
                onToggle={() => {}}
                collapsed={false}
                level={1}
              />
            ))}
          </List>
        </Collapse>
      )}
    </>
  );
};

// --- Breadcrumbs ---
const DashboardBreadcrumbs = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const labelMap = {
    'projects': 'Projects', 'leads': 'Leads', 'sales': 'Sales',
    'analytics': 'Analytics', 'settings': 'Settings', 'create': 'Create',
    'pipeline': 'Pipeline', 'reports': 'Reports', 'edit': 'Edit',
    'commissions': 'Commissions', 'list': 'All', 'structures': 'Structures',
    'payments': 'Payments', 'dashboard': 'Dashboard',
    'due-today': 'Due Today', 'overdue': 'Overdue',
    'record': 'Record Payment', 'plans': 'Plans',
    'invoices': 'Invoices', 'generate': 'Generate',
    'budget': 'Budget vs Actual', 'financial': 'Financial',
    'revenue': 'Revenue', 'budget-variance': 'Budget Planning',
    'predictions': 'Predictions', 'pricing': 'Pricing',
    'dynamic': 'Dynamic Pricing', 'cost-sheet': 'Cost Sheet',
    'users': 'User Management', 'profile': 'Profile', 'roles': 'Roles', 'org-hierarchy': 'Org Hierarchy',
    'payment-plans': 'Payment Plans', 'collections': 'Collections',
    'tasks': 'Tasks', 'kanban': 'Kanban Board', 'team': 'Team View',
    'templates': 'Templates', 'all': 'All Tasks',
    'notifications': 'Notifications',
    'leadership': 'Leadership Dashboard',
  };

  const segments = location.pathname.split('/').filter(Boolean);
  if (segments.length <= 1 && segments[0] === 'dashboard') return null;

  let path = '';
  const crumbs = segments.map((seg, i) => {
    path += `/${seg}`;
    return {
      label: labelMap[seg] || seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' '),
      path,
      isLast: i === segments.length - 1,
    };
  });

  return (
    <Breadcrumbs separator={<ChevronRight sx={{ fontSize: 16 }} />} sx={{ fontSize: '0.75rem' }}>
      <Link
        component="button"
        variant="body2"
        onClick={() => navigate('/dashboard')}
        underline="hover"
        sx={{ display: 'flex', alignItems: 'center', fontSize: '0.75rem', color: 'text.secondary' }}
      >
        <Home sx={{ fontSize: 15, mr: 0.5 }} />
        Home
      </Link>
      {crumbs.map((c, i) =>
        c.isLast ? (
          <Typography key={i} variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 500, color: 'text.primary' }}>
            {c.label}
          </Typography>
        ) : (
          <Link
            key={i}
            component="button"
            variant="body2"
            onClick={() => navigate(c.path)}
            underline="hover"
            sx={{ fontSize: '0.75rem', color: 'text.secondary' }}
          >
            {c.label}
          </Link>
        )
      )}
    </Breadcrumbs>
  );
};

// --- User Menu ---
const UserMenu = () => {
  const navigate = useNavigate();
  const { user, logout, getUserDisplayName, canAccess } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);

  return (
    <>
      <Tooltip title="Account">
        <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} size="small">
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '0.75rem' }}>
            {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
          </Avatar>
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider', minWidth: 220 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{getUserDisplayName()}</Typography>
          <Typography variant="caption" color="text.secondary">{user?.roleRef?.name || user?.role}</Typography>
        </Box>
        <MenuItem onClick={() => { navigate('/profile'); setAnchorEl(null); }} sx={{ mt: 0.5 }}>
          <ListItemIcon><AccountCircle fontSize="small" /></ListItemIcon>
          Profile
        </MenuItem>
        <MenuItem onClick={() => { navigate('/settings'); setAnchorEl(null); }}>
          <ListItemIcon><Settings fontSize="small" /></ListItemIcon>
          Settings
        </MenuItem>
        {canAccess.userManagement() && (
          <MenuItem onClick={() => { navigate('/settings/users'); setAnchorEl(null); }}>
            <ListItemIcon><People fontSize="small" /></ListItemIcon>
            User Management
          </MenuItem>
        )}
        <Divider />
        <MenuItem onClick={() => { logout(); setAnchorEl(null); }} sx={{ color: 'error.main' }}>
          <ListItemIcon><Logout fontSize="small" sx={{ color: 'error.main' }} /></ListItemIcon>
          Logout
        </MenuItem>
      </Menu>
    </>
  );
};

// =============================================================================
// MAIN LAYOUT
// =============================================================================
const DashboardLayout = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const { user, canAccess } = useAuth();
  const { startFlow, isFlowComplete } = useCoachMark();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem('sidebar_collapsed') === 'true'; } catch { return false; }
  });
  const [openMenus, setOpenMenus] = useState({});
  const [paletteOpen, setPaletteOpen] = useState(false);

  const sections = useMemo(() => getNavigationItems(user?.role, canAccess), [user?.role, canAccess]);

  // Open parent menu of active route
  useEffect(() => {
    sections.forEach(section => {
      section.items.forEach(item => {
        if (item.children) {
          const isActive = item.children.some(c =>
            location.pathname === c.path || location.pathname.startsWith(c.path + '/')
          );
          if (isActive) {
            setOpenMenus(prev => ({ ...prev, [item.id]: true }));
          }
        }
      });
    });
  }, [location.pathname, sections]);

  // Cmd+K
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setPaletteOpen(p => !p);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Auto-start dashboard coach marks for first-time users
  useEffect(() => {
    if (location.pathname === '/dashboard' && !isFlowComplete('dashboard')) {
      startFlow('dashboard');
    }
  }, [location.pathname, isFlowComplete, startFlow]);

  const handleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    try { localStorage.setItem('sidebar_collapsed', String(next)); } catch {}
  };

  const handleNavigate = (path) => {
    navigate(path);
    if (isMobile) setMobileOpen(false);
  };

  const currentWidth = collapsed && !isMobile ? COLLAPSED_WIDTH : DRAWER_WIDTH;

  const sidebarContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.paper' }}>
      {/* Logo */}
      <Box sx={{ p: collapsed ? 1.5 : 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1.5, minHeight: 56 }}>
        <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36, fontSize: '0.813rem', fontWeight: 700 }}>PV</Avatar>
        {!collapsed && (
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.2 }}>PropVantage</Typography>
            <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.625rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              AI CRM
            </Typography>
          </Box>
        )}
      </Box>

      {/* Search shortcut */}
      {!collapsed && !isMobile && (
        <Box sx={{ px: 1.5, py: 1.5 }}>
          <Box
            onClick={() => setPaletteOpen(true)}
            data-coach="search-shortcut"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              px: 1.5,
              py: 0.75,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              cursor: 'pointer',
              '&:hover': { borderColor: 'grey.400', bgcolor: 'grey.50' },
              transition: 'all 150ms ease',
            }}
          >
            <Search sx={{ fontSize: 16, color: 'text.disabled' }} />
            <Typography variant="body2" sx={{ color: 'text.disabled', flex: 1, fontSize: '0.75rem' }}>
              Search...
            </Typography>
            <Chip label="⌘K" size="small" sx={{ height: 20, fontSize: '0.625rem', bgcolor: 'grey.100' }} />
          </Box>
        </Box>
      )}

      {/* Navigation */}
      <Box data-coach="sidebar-nav" sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', py: 0.5 }}>
        {sections.map((section, si) => (
          <React.Fragment key={section.section}>
            {si > 0 && <Divider sx={{ my: 1, mx: collapsed ? 1 : 2 }} />}
            {!collapsed && (
              <Typography
                variant="overline"
                sx={{ px: 2.5, pt: 1.5, pb: 0.5, display: 'block', fontSize: '0.625rem' }}
              >
                {section.section}
              </Typography>
            )}
            <List disablePadding>
              {section.items.map(item => (
                <NavItem
                  key={item.id}
                  item={item}
                  isActive={location.pathname === item.path || location.pathname.startsWith(item.path + '/')}
                  onNavigate={handleNavigate}
                  isOpen={!!openMenus[item.id]}
                  onToggle={() => setOpenMenus(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                  collapsed={collapsed && !isMobile}
                />
              ))}
            </List>
          </React.Fragment>
        ))}
      </Box>

      {/* Footer - collapse toggle */}
      {!isMobile && (
        <Box sx={{ borderTop: '1px solid', borderColor: 'divider', p: 1 }}>
          <Tooltip title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} placement="right">
            <IconButton
              onClick={handleCollapse}
              size="small"
              sx={{ width: '100%', borderRadius: 2, justifyContent: collapsed ? 'center' : 'flex-start', px: collapsed ? 0 : 1.5 }}
            >
              {collapsed ? <ChevronRight sx={{ fontSize: 18 }} /> : <ChevronLeft sx={{ fontSize: 18 }} />}
              {!collapsed && (
                <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>Collapse</Typography>
              )}
            </IconButton>
          </Tooltip>
        </Box>
      )}
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* AppBar */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${currentWidth}px)` },
          ml: { md: `${currentWidth}px` },
          transition: 'width 200ms ease, margin-left 200ms ease',
        }}
      >
        <Toolbar sx={{ minHeight: '56px !important', gap: 1 }}>
          {/* Mobile: hamburger menu */}
          <IconButton
            edge="start"
            onClick={() => setMobileOpen(!mobileOpen)}
            sx={{ display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          {/* Desktop: sidebar collapse toggle */}
          <Tooltip title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
            <IconButton
              edge="start"
              onClick={handleCollapse}
              size="small"
              sx={{ display: { xs: 'none', md: 'flex' } }}
            >
              {collapsed ? <ChevronRight sx={{ fontSize: 20 }} /> : <ChevronLeft sx={{ fontSize: 20 }} />}
            </IconButton>
          </Tooltip>

          <Box sx={{ flex: 1 }}>
            <DashboardBreadcrumbs />
          </Box>

          {/* Search button */}
          <Tooltip title="Search (⌘K)">
            <IconButton size="small" onClick={() => setPaletteOpen(true)}>
              <Search sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>

          {/* Notifications */}
          <NotificationBell />

          <UserMenu />
        </Toolbar>
      </AppBar>

      {/* Sidebar - Mobile */}
      <Box component="nav" sx={{ width: { md: currentWidth }, flexShrink: { md: 0 }, transition: 'width 200ms ease' }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { width: DRAWER_WIDTH, borderRight: 'none' },
          }}
        >
          {sidebarContent}
        </Drawer>

        {/* Sidebar - Desktop */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              width: currentWidth,
              borderRight: '1px solid',
              borderColor: 'divider',
              transition: 'width 200ms ease',
              overflowX: 'hidden',
            },
          }}
          open
        >
          {sidebarContent}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${currentWidth}px)` },
          height: '100vh',
          overflow: 'auto',
          bgcolor: 'background.default',
          transition: 'width 200ms ease',
        }}
      >
        <Toolbar sx={{ minHeight: '56px !important' }} />
        <Fade in timeout={200} key={location.pathname}>
          <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1400, mx: 'auto' }}>
            {children}
          </Box>
        </Fade>
      </Box>

      {/* Command Palette */}
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />

      {/* AI Copilot FAB */}
      <CopilotFAB />
    </Box>
  );
};

export default DashboardLayout;
