// File: src/components/layout/DashboardLayout.js
// Description: Simplified dashboard layout - Single User Management section without nested children
// Version: 1.10 - Simplified user management navigation structure
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
  Badge,
  Tooltip,
  Collapse,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Breadcrumbs,
  Link,
  useTheme,
  useMediaQuery,
  Paper,
  Chip,
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
  Apartment,
  LocationCity,
  Domain,
  PersonPin,
  AttachMoney,
  Construction,
  Description,
  Psychology,
  AccountBalance,  
  Receipt,         
  Payment,         
  Assessment,      
  Timeline,        // For Sales Pipeline
  BarChart,        // For Sales Reports
  ShowChart,       // Alternative for Reports
  Handshake,       // For Commission Management
  AccountBalanceWallet, // For Commission Payments & Payment Dashboard
  TrendingUpIcon,  // For Commission Analytics
  MonetizationOn,  // For Payment Dashboard
  Today,           // For Due Payments
  Warning,         // For Overdue Payments
  Speed,           // For Collection Performance
  NoteAdd,         // For Generate Invoice
  ReceiptLong,     // Alternative invoice icon
  // Analytics Icons
  PieChart,        // For KPI Dashboard
  DonutLarge,      // For Budget Analytics
  TrendingFlat,    // For Real-time Financial
  Insights,        // For Analytics Reports Center
  CompareArrows,   // For Budget vs Actual
  Timeline as TimelineIcon, // For Variance Analysis
  AccountTree,     // For Project Budget Analysis
  AutoGraph,       // For Advanced Analytics
  Equalizer,       // For Performance Metrics
  // AI Icons (for future use)
  SmartToy,        // For AI Insights
  Psychology as PsychologyIcon, // For Conversation Analysis
  PsychologyAlt,   // For Predictive Analytics
  Lightbulb,       // For Smart Recommendations
  QueryStats,
  // User Management Icons
  PersonAdd,       // For Invite User
  Email,           // For Pending Invitations  
  Link as LinkIcon, // For Invitation Links
  SupervisorAccount, // For Role Management
  Security,        // For Security Settings
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

// --- Constants ---
const DRAWER_WIDTH = 280;

// --- Helper Functions & Sub-components ---

/**
 * Generates navigation items based on the user's role and permissions.
 * SIMPLIFIED: Removed nested user management structure
 * @param {string} userRole - The role of the current user.
 * @param {object} canAccess - The access control object from useAuth.
 * @returns {Array} - A filtered array of navigation items.
 */
const getNavigationItems = (userRole, canAccess) => {
  const allItems = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      icon: Dashboard,
      path: '/dashboard',
      requiredAccess: () => true, // Everyone can access dashboard
    },
    {
      id: 'projects',
      title: 'Projects',
      icon: Business,
      path: '/projects',
      requiredAccess: () => canAccess.viewAllProjects(),
      children: [
        {
          id: 'projects-list',
          title: 'All Projects',
          icon: Apartment,
          path: '/projects',
        },
        {
          id: 'projects-create',
          title: 'Create Project',
          icon: LocationCity,
          path: '/projects/create',
          requiredAccess: () => canAccess.projectManagement(),
        },
      ],
    },
    {
      id: 'leads',
      title: 'Lead Management',
      icon: People,
      path: '/leads',
      requiredAccess: () => canAccess.leadManagement(),
      children: [
        {
          id: 'leads-list',
          title: 'All Leads',
          icon: PersonPin,
          path: '/leads',
        },
        {
          id: 'leads-pipeline',
          title: 'Sales Pipeline',
          icon: TrendingUp,
          path: '/leads/pipeline',
        },
        {
          id: 'leads-create',
          title: 'Add New Lead',
          icon: PersonPin,
          path: '/leads/create',
        },
      ],
    },
    {
      id: 'sales',
      title: 'Sales & Payments',
      icon: AttachMoney,
      path: '/sales',
      requiredAccess: () => canAccess.salesPipeline(),
      children: [
        {
          id: 'sales-list',
          title: 'All Sales',
          icon: Assignment,
          path: '/sales',
        },
        {
          id: 'sales-create',
          title: 'New Booking',
          icon: Assignment,
          path: '/sales/create',
        },
        {
          id: 'sales-pipeline',
          title: 'Sales Pipeline',
          icon: Timeline,
          path: '/sales/pipeline',
          requiredAccess: () => canAccess.salesPipeline(),
        },
        {
          id: 'sales-reports',
          title: 'Sales Reports',
          icon: BarChart,
          path: '/sales/reports',
          requiredAccess: () => canAccess.salesReports(),
        },
        {
          id: 'payment-reports',
          title: 'Payment Reports',
          icon: Payment,
          path: '/payments/reports',
          requiredAccess: () => canAccess.salesReports(),
        },
        {
          id: 'payment-plans',
          title: 'Payment Plans',
          icon: AccountBalance,
          path: '/sales/payment-plans',
          requiredAccess: () => canAccess.salesPipeline(),
        },
        
        // Commission Management Section
        {
          id: 'commission-management',
          title: 'Commission Management',
          icon: Handshake,
          path: '/sales/commissions',
          requiredAccess: () => canAccess.salesPipeline() || canAccess.viewFinancials(),
          children: [
            {
              id: 'commission-dashboard',
              title: 'Commission Dashboard',
              icon: Dashboard,
              path: '/sales/commissions',
              requiredAccess: () => canAccess.salesPipeline(),
            },
            {
              id: 'commission-list',
              title: 'All Commissions',
              icon: Assignment,
              path: '/sales/commissions/list',
              requiredAccess: () => canAccess.salesPipeline(),
            },
            {
              id: 'commission-structures',
              title: 'Commission Structures',
              icon: Settings,
              path: '/sales/commissions/structures',
              requiredAccess: () => canAccess.projectManagement(),
            },
            {
              id: 'commission-payments',
              title: 'Commission Payments',
              icon: AccountBalanceWallet,
              path: '/sales/commissions/payments',
              requiredAccess: () => canAccess.viewFinancials(),
            },
            {
              id: 'commission-reports',
              title: 'Commission Reports',
              icon: Assessment,
              path: '/sales/commissions/reports',
              requiredAccess: () => canAccess.salesReports(),
            },
          ],
        },
      ],
    },

    // =============================================================================
    // ANALYTICS SECTION
    // =============================================================================
    {
      id: 'analytics',
      title: 'Analytics & Intelligence',
      icon: Analytics,
      path: '/analytics',
      requiredAccess: () => canAccess.salesReports(),
      children: [
        {
          id: 'analytics-dashboard',
          title: 'Analytics Overview',
          icon: Dashboard,
          path: '/analytics',
        },
        {
          id: 'analytics-sales',
          title: 'Sales Analytics',
          icon: TrendingUp,
          path: '/analytics/sales',
        },
        {
          id: 'analytics-revenue',
          title: 'Revenue Analytics',
          icon: AttachMoney,
          path: '/analytics/revenue',
          requiredAccess: () => canAccess.viewFinancials(),
        },
        {
          id: 'analytics-leads',
          title: 'Lead Analytics',
          icon: People,
          path: '/analytics/leads',
        },
        {
          id: 'budget-variance',
          title: 'Budget Planning',
          icon: QueryStats,
          path: '/analytics/budget-variance',
          requiredAccess: () => canAccess.viewFinancials(),
        },

        // Financial Analytics Sub-section
        {
          id: 'financial-analytics',
          title: 'Financial Analytics',
          icon: DonutLarge,
          path: '/analytics/budget',
          requiredAccess: () => canAccess.viewFinancials(),
          children: [
            {
              id: 'budget-dashboard',
              title: 'Budget vs Actual',
              icon: CompareArrows,
              path: '/analytics/budget',
              requiredAccess: () => canAccess.viewFinancials(),
            },
            {
              id: 'financial-realtime',
              title: 'Real-time Financial',
              icon: TrendingFlat,
              path: '/analytics/financial',
              requiredAccess: () => canAccess.viewFinancials(),
            },
          ],
        },
      ],
    },

    // =============================================================================
    // SIMPLIFIED SETTINGS & ADMINISTRATION SECTION
    // =============================================================================
    {
      id: 'settings',
      title: 'Admin Panel',
      icon: Settings,
      path: '/settings',
      requiredAccess: () => canAccess.userManagement() || canAccess.projectManagement(),
      children: [
        // SIMPLIFIED: Single User Management item (no nested children)
        {
          id: 'user-management',
          title: 'User Management',
          icon: People,
          path: '/settings/users',
          requiredAccess: () => canAccess.userManagement(),
        },
        

      ],
    },
  ];

  // Filter items based on access control
  return allItems.filter(item => {
    if (item.requiredAccess && !item.requiredAccess()) {
      return false;
    }
    
    if (item.children) {
      item.children = item.children.filter(child => {
        // Recursively filter nested children (for commission and analytics sub-menus)
        if (child.children) {
          child.children = child.children.filter(grandchild => {
            return !grandchild.requiredAccess || grandchild.requiredAccess();
          });
        }
        return !child.requiredAccess || child.requiredAccess();
      });
    }
    
    return true;
  });
};

/**
 * Renders a single navigation item, handling nesting and active states.
 */
const NavigationItem = ({ item, isActive, onNavigate, isOpen, onToggle, level = 0, openSubMenus = {}, onSubMenuToggle }) => {
  const theme = useTheme();
  const hasChildren = item.children && item.children.length > 0;

  const handleClick = () => {
    if (hasChildren) {
      onToggle();
    } else if (onNavigate) {
      onNavigate(item.path);
    }
  };

  return (
    <>
      <ListItem disablePadding>
        <ListItemButton
          onClick={handleClick}
          selected={isActive && !hasChildren}
          sx={{
            pl: 2 + level * 2,
            borderRadius: 1,
            mx: 1,
            my: 0.5,
            '&.Mui-selected': {
              bgcolor: theme.palette.primary.main,
              color: 'white',
              '&:hover': {
                bgcolor: theme.palette.primary.dark,
              },
              '& .MuiListItemIcon-root': {
                color: 'white',
              },
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 40 }}>
            <item.icon />
          </ListItemIcon>
          <ListItemText 
            primary={item.title}
            primaryTypographyProps={{
              fontSize: level === 0 ? '0.875rem' : '0.8rem',
              fontWeight: isActive ? 600 : 500,
            }}
          />
          {hasChildren && (isOpen ? <ExpandLess /> : <ExpandMore />)}
        </ListItemButton>
      </ListItem>
      
      {hasChildren && (
        <Collapse in={isOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {item.children.map((child) => {
              const childHasChildren = child.children && child.children.length > 0;
              const childIsOpen = openSubMenus && openSubMenus[child.id];
              
              return (
                <NavigationItem
                  key={child.id}
                  item={child}
                  isActive={window.location.pathname === child.path}
                  onNavigate={onNavigate}
                  isOpen={childIsOpen}
                  onToggle={childHasChildren ? () => onSubMenuToggle && onSubMenuToggle(child.id) : undefined}
                  level={level + 1}
                  openSubMenus={openSubMenus}
                  onSubMenuToggle={onSubMenuToggle}
                />
              );
            })}
          </List>
        </Collapse>
      )}
    </>
  );
};

/**
 * Renders the breadcrumb navigation based on the current URL path.
 * SIMPLIFIED: Updated breadcrumb labels for simplified user management
 */
const DashboardBreadcrumbs = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const getBreadcrumbs = () => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    if (pathSegments.length === 0 || (pathSegments.length === 1 && pathSegments[0] === 'dashboard')) {
        return []; // No breadcrumbs on the main dashboard page
    }

    const breadcrumbs = [];
    let currentPath = '';

    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      
      let label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
      
      const labelMap = {
        // Existing labels
        'projects': 'Projects', 
        'leads': 'Leads', 
        'sales': 'Sales',
        'analytics': 'Analytics', 
        'settings': 'Settings', 
        'create': 'Create New',
        'pipeline': 'Pipeline', 
        'reports': 'Reports',
        'ai-insights': 'AI Insights',
        'payment-plans': 'Payment Plans',
        'templates': 'Templates',
        'active': 'Active Plans',
        
        // Commission Management breadcrumb labels
        'commissions': 'Commission Management',
        'list': 'All Commissions',
        'structures': 'Commission Structures',
        'payments': 'Payments',
        'dashboard': 'Dashboard',
        
        // Payment Management breadcrumb labels
        'due-today': 'Due Today',
        'overdue': 'Overdue Payments',
        'collections': 'Collection Performance',
        'record': 'Record Payment',
        'plans': 'Payment Plans',
        
        // Invoice Management breadcrumb labels
        'invoices': 'Invoice Management',
        'generate': 'Generate Invoice',
        'invoice-reports': 'Invoice Reports',

        // Analytics breadcrumb labels
        'budget': 'Budget Analysis',
        'financial': 'Financial Dashboard',
        'kpis': 'KPI Dashboard',
        'variance': 'Variance Analysis',
        'revenue': 'Revenue Analytics',
        'budget-variance': 'Budget Variance Dashboard',
        
        // SIMPLIFIED: User Management breadcrumb labels (no sub-sections)
        'users': 'User Management',
        'organization': 'Organization Settings', 
        'security': 'Security & Access',
        
        // AI Intelligence breadcrumb labels (Phase 2 preparation)
        'conversation': 'Conversation Analysis',
        'predictions': 'Predictive Analytics',
        'recommendations': 'Smart Recommendations',
        'lead-scoring': 'AI Lead Scoring',
      };
      
      label = labelMap[segment] || label;
      
      breadcrumbs.push({
        label,
        path: currentPath,
        isLast: index === pathSegments.length - 1,
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();
  if (breadcrumbs.length === 0) return null;

  return (
    <Breadcrumbs separator={<ChevronRight fontSize="small" />} sx={{ mb: 0 }}>
      <Link
        component="button"
        variant="body2"
        onClick={() => navigate('/dashboard')}
        sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' }, display: 'flex', alignItems: 'center' }}
      >
        <Home sx={{ mr: 0.5, fontSize: 16 }} />
        Dashboard
      </Link>
      {breadcrumbs.map((crumb, index) =>
        crumb.isLast ? (
          <Typography key={index} color="text.primary" variant="body2">
            {crumb.label}
          </Typography>
        ) : (
          <Link
            key={index}
            component="button"
            variant="body2"
            onClick={() => navigate(crumb.path)}
            sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
          >
            {crumb.label}
          </Link>
        )
      )}
    </Breadcrumbs>
  );
};

/**
 * Enhanced user menu with simplified user management shortcuts
 * SIMPLIFIED: Removed specific user management sub-actions from menu
 */
const EnhancedUserMenu = () => {
  const navigate = useNavigate();
  const { user, organization, logout, getUserDisplayName, getOrganizationDisplayName, canAccess } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  const handleProfileClick = () => { navigate('/profile'); handleMenuClose(); };
  const handleSettingsClick = () => { navigate('/settings'); handleMenuClose(); };
  const handleUserManagementClick = () => { navigate('/settings/users'); handleMenuClose(); };
  const handleLogout = async () => { await logout(); handleMenuClose(); };

  return (
    <>
      <Tooltip title="Account menu">
        <IconButton onClick={handleMenuOpen} size="small" sx={{ ml: 2 }}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.dark' }}>
            {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
          </Avatar>
        </IconButton>
      </Tooltip>
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          elevation: 8,
          sx: {
            overflow: 'visible', 
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
            mt: 1.5, 
            minWidth: 260,
            '& .MuiAvatar-root': { width: 32, height: 32, ml: -0.5, mr: 1 },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {/* User Info Header */}
        <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            {getUserDisplayName()}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            {user?.role} @ {getOrganizationDisplayName()}
          </Typography>
        </Box>

        {/* Standard Menu Items */}
        <MenuItem onClick={handleProfileClick} sx={{ py: 1.5 }}>
          <ListItemIcon><AccountCircle fontSize="small" /></ListItemIcon>
          Profile
        </MenuItem>
        
        <MenuItem onClick={handleSettingsClick} sx={{ py: 1.5 }}>
          <ListItemIcon><Settings fontSize="small" /></ListItemIcon>
          Settings
        </MenuItem>

        {/* SIMPLIFIED: Single User Management shortcut (for authorized users only) */}
        {canAccess.userManagement() && (
          <>
            <Divider />
            <MenuItem onClick={handleUserManagementClick} sx={{ py: 1.5 }}>
              <ListItemIcon><People fontSize="small" /></ListItemIcon>
              User Management
            </MenuItem>
          </>
        )}

        <Divider />
        <MenuItem onClick={handleLogout} sx={{ py: 1.5, color: 'error.main' }}>
          <ListItemIcon><Logout fontSize="small" sx={{ color: 'error.main' }} /></ListItemIcon>
          Logout
        </MenuItem>
      </Menu>
    </>
  );
};

// =============================================================================
// MAIN DASHBOARD LAYOUT COMPONENT - SIMPLIFIED
// =============================================================================

const DashboardLayout = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const { user, canAccess } = useAuth();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenus, setOpenMenus] = useState({});
  const [openSubMenus, setOpenSubMenus] = useState({}); // For handling 3-level menus

  // Memoize navigationItems to prevent re-creation on every render
  const navigationItems = useMemo(() => getNavigationItems(user?.role, canAccess), [user?.role, canAccess]);

  // Effect to open the parent menu of the active child on page load
  useEffect(() => {
    const currentPath = location.pathname;
    
    // Check for 3-level nested items (analytics and commission management)
    navigationItems.forEach(item => {
      if (item.children) {
        item.children.forEach(child => {
          if (child.children) {
            const activeGrandchild = child.children.find(grandchild => currentPath === grandchild.path);
            if (activeGrandchild) {
              setOpenMenus(prev => ({ ...prev, [item.id]: true }));
              setOpenSubMenus(prev => ({ ...prev, [child.id]: true }));
            }
          } else if (currentPath === child.path) {
            setOpenMenus(prev => ({ ...prev, [item.id]: true }));
          }
        });
      }
    });
  }, [location.pathname, navigationItems]);

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const handleMenuToggle = (itemId) => {
    setOpenMenus(prev => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  // Handle sub-menu toggle for 3-level menus
  const handleSubMenuToggle = (itemId) => {
    setOpenSubMenus(prev => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const isPathActive = (path) => {
    if (path === '/dashboard') return location.pathname === path;
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const sidebarContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}><Business /></Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1 }}>PropVantage</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>AI POWERED CRM</Typography>
          </Box>
        </Box>
      </Box>

      <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', pt: 1 }}>
        <List>
          {navigationItems.map((item) => (
            <NavigationItem
              key={item.id}
              item={item}
              isActive={isPathActive(item.path)}
              onNavigate={handleNavigation}
              isOpen={!!openMenus[item.id]}
              onToggle={() => handleMenuToggle(item.id)}
              openSubMenus={openSubMenus}
              onSubMenuToggle={handleSubMenuToggle}
            />
          ))}
        </List>
      </Box>

      <Box sx={{ p: 2, mt: 'auto', borderTop: '1px solid', borderColor: 'divider' }}>
        <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', display: 'block' }}>
          PropVantage AI v1.10.0
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
          bgcolor: 'background.paper',
          color: 'text.primary',
          boxShadow: 'none',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Box sx={{ flex: 1 }}><DashboardBreadcrumbs /></Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Tooltip title="Notifications">
              <IconButton size="large" color="inherit">
                <Badge badgeContent={3} color="error"><Notifications /></Badge>
              </IconButton>
            </Tooltip>
            <EnhancedUserMenu />
          </Box>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH, borderRight: 'none' },
          }}
        >
          {sidebarContent}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH, borderRight: 'none' },
          }}
          open
        >
          {sidebarContent}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          height: '100vh',
          overflow: 'auto',
          bgcolor: 'grey.50',
        }}
      >
        <Toolbar />
        <Box sx={{ p: { xs: 2, sm: 3 } }}>{children}</Box>
      </Box>
    </Box>
  );
};

export default DashboardLayout;