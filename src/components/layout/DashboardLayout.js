// File: src/components/layout/DashboardLayout.js
// Description: Main dashboard layout component for PropVantage AI - Complete app shell with navigation
// Version: 1.0 - Professional dashboard layout with role-based navigation and responsive design
// Location: src/components/layout/DashboardLayout.js

import React, { useState, useEffect } from 'react';
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

} from '@mui/icons-material';

import { useAuth } from '../../context/AuthContext';

// Sidebar width constants
const DRAWER_WIDTH = 280;
const MINI_DRAWER_WIDTH = 72;

// Navigation items based on user roles
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
      title: 'Sales',
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
      ],
    },
    {
      id: 'analytics',
      title: 'Analytics',
      icon: Analytics,
      path: '/analytics',
      requiredAccess: () => canAccess.salesReports(),
      children: [
        {
          id: 'analytics-dashboard',
          title: 'Overview',
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
      ],
    },
    {
      id: 'ai-insights',
      title: 'AI Insights',
      icon: Psychology,
      path: '/ai-insights',
      requiredAccess: () => canAccess.leadManagement(),
      children: [
        {
          id: 'ai-conversation',
          title: 'Conversation Analysis',
          icon: Psychology,
          path: '/ai-insights/conversation',
        },
        {
          id: 'ai-predictions',
          title: 'Predictive Analytics',
          icon: Analytics,
          path: '/ai-insights/predictions',
        },
      ],
    },
    {
      id: 'construction',
      title: 'Construction',
      icon: Construction,
      path: '/construction',
      requiredAccess: () => canAccess.constructionManagement(),
      children: [
        {
          id: 'construction-milestones',
          title: 'Milestones',
          icon: Assignment,
          path: '/construction/milestones',
        },
        {
          id: 'construction-contractors',
          title: 'Contractors',
          icon: People,
          path: '/construction/contractors',
        },
      ],
    },
    {
      id: 'documents',
      title: 'Documents',
      icon: Description,
      path: '/documents',
      requiredAccess: () => canAccess.viewAllProjects(),
    },
    {
      id: 'settings',
      title: 'Settings',
      icon: Settings,
      path: '/settings',
      requiredAccess: () => canAccess.projectManagement(),
      children: [
        {
          id: 'settings-general',
          title: 'General',
          icon: Settings,
          path: '/settings',
        },
        {
          id: 'settings-users',
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
    
    // Filter children if they exist
    if (item.children) {
      item.children = item.children.filter(child => {
        return !child.requiredAccess || child.requiredAccess();
      });
    }
    
    return true;
  });
};

// Navigation Item Component
const NavigationItem = ({ item, isActive, onClick, isOpen, onToggle, level = 0 }) => {
  const theme = useTheme();
  const hasChildren = item.children && item.children.length > 0;

  return (
    <>
      <ListItem disablePadding>
        <ListItemButton
          onClick={hasChildren ? onToggle : onClick}
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
              fontSize: '0.875rem',
              fontWeight: isActive ? 600 : 500,
            }}
          />
          {hasChildren && (isOpen ? <ExpandLess /> : <ExpandMore />)}
        </ListItemButton>
      </ListItem>
      
      {hasChildren && (
        <Collapse in={isOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {item.children.map((child) => (
              <NavigationItem
                key={child.id}
                item={child}
                isActive={isActive && child.path === window.location.pathname}
                onClick={() => onClick(child.path)}
                level={level + 1}
              />
            ))}
          </List>
        </Collapse>
      )}
    </>
  );
};

// Breadcrumb Component
const DashboardBreadcrumbs = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const getBreadcrumbs = () => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs = [{ label: 'Dashboard', path: '/dashboard' }];

    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      
      let label = segment.charAt(0).toUpperCase() + segment.slice(1);
      
      // Custom labels for better UX
      const labelMap = {
        'projects': 'Projects',
        'leads': 'Leads',
        'sales': 'Sales',
        'analytics': 'Analytics',
        'settings': 'Settings',
        'create': 'Create New',
        'pipeline': 'Pipeline',
      };
      
      label = labelMap[segment] || label;
      
      breadcrumbs.push({
        label,
        path: currentPath,
        isLast: index === pathSegments.length - 1,
      });
    });

    return breadcrumbs.slice(1); // Remove duplicate dashboard
  };

  const breadcrumbs = getBreadcrumbs();

  if (breadcrumbs.length === 0) return null;

  return (
    <Breadcrumbs
      separator={<ChevronRight fontSize="small" />}
      sx={{ mb: 2 }}
    >
      <Link
        component="button"
        variant="body2"
        onClick={() => navigate('/dashboard')}
        sx={{
          textDecoration: 'none',
          '&:hover': { textDecoration: 'underline' },
        }}
      >
        <Home sx={{ mr: 0.5, fontSize: 16 }} />
        Dashboard
      </Link>
      {breadcrumbs.map((crumb, index) => (
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
            sx={{
              textDecoration: 'none',
              '&:hover': { textDecoration: 'underline' },
            }}
          >
            {crumb.label}
          </Link>
        )
      ))}
    </Breadcrumbs>
  );
};

// User Menu Component
const UserMenu = () => {
  const navigate = useNavigate();
  const { user, organization, logout, getUserDisplayName, getOrganizationDisplayName } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleProfileClick = () => {
    navigate('/profile');
    handleMenuClose();
  };

  const handleSettingsClick = () => {
    navigate('/settings');
    handleMenuClose();
  };

  const handleLogout = async () => {
    await logout();
    handleMenuClose();
  };

  return (
    <>
      <Tooltip title="Account menu">
        <IconButton
          onClick={handleMenuOpen}
          size="small"
          sx={{ ml: 2 }}
        >
          <Avatar sx={{ width: 32, height: 32 }}>
            {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
          </Avatar>
        </IconButton>
      </Tooltip>
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        onClick={handleMenuClose}
        PaperProps={{
          elevation: 8,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
            mt: 1.5,
            minWidth: 200,
            '& .MuiAvatar-root': {
              width: 32,
              height: 32,
              ml: -0.5,
              mr: 1,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ px: 2, py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            {getUserDisplayName()}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {user?.role}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            {getOrganizationDisplayName()}
          </Typography>
        </Box>
        
        <MenuItem onClick={handleProfileClick}>
          <AccountCircle sx={{ mr: 2 }} />
          Profile
        </MenuItem>
        
        <MenuItem onClick={handleSettingsClick}>
          <Settings sx={{ mr: 2 }} />
          Settings
        </MenuItem>
        
        <Divider />
        
        <MenuItem onClick={handleLogout}>
          <Logout sx={{ mr: 2 }} />
          Logout
        </MenuItem>
      </Menu>
    </>
  );
};

// Main Dashboard Layout Component
const DashboardLayout = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const { user, canAccess } = useAuth();

  // Layout state
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenus, setOpenMenus] = useState({});

  // Get navigation items based on user role
  const navigationItems = getNavigationItems(user?.role, canAccess);

  // Handle drawer toggle
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // Handle navigation
  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  // Handle menu toggle
  const handleMenuToggle = (itemId) => {
    setOpenMenus(prev => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  // Check if path is active
  const isPathActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // Sidebar content
  const sidebarContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo Section */}
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
            <Business />
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1 }}>
              PropVantage
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
              AI POWERED CRM
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* User Info Section */}
      <Paper sx={{ m: 2, p: 2, bgcolor: 'primary.50', borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36 }}>
            {user?.firstName?.charAt(0)}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1 }}>
              {user?.firstName} {user?.lastName}
            </Typography>
            <Chip 
              label={user?.role} 
              size="small" 
              sx={{ 
                fontSize: '0.7rem', 
                height: 20,
                bgcolor: 'primary.main',
                color: 'white',
              }} 
            />
          </Box>
        </Box>
      </Paper>

      {/* Navigation Menu */}
      <Box sx={{ flex: 1, overflow: 'auto', px: 1 }}>
        <List>
          {navigationItems.map((item) => (
            <NavigationItem
              key={item.id}
              item={item}
              isActive={isPathActive(item.path)}
              onClick={() => handleNavigation(item.path)}
              isOpen={openMenus[item.id]}
              onToggle={() => handleMenuToggle(item.id)}
            />
          ))}
        </List>
      </Box>

      {/* Footer */}
      <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', display: 'block' }}>
          PropVantage AI v1.0
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
          bgcolor: 'background.paper',
          color: 'text.primary',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
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

          {/* Page Title and Breadcrumbs */}
          <Box sx={{ flex: 1 }}>
            <DashboardBreadcrumbs />
          </Box>

          {/* Header Actions */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Tooltip title="Notifications">
              <IconButton size="large" color="inherit">
                <Badge badgeContent={3} color="error">
                  <Notifications />
                </Badge>
              </IconButton>
            </Tooltip>

            <UserMenu />
          </Box>
        </Toolbar>
      </AppBar>

      {/* Sidebar Drawer */}
      <Box
        component="nav"
        sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
      >
        {/* Mobile Drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
              bgcolor: 'background.paper',
              borderRight: '1px solid',
              borderColor: 'divider',
            },
          }}
        >
          {sidebarContent}
        </Drawer>

        {/* Desktop Drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
              bgcolor: 'background.paper',
              borderRight: '1px solid',
              borderColor: 'divider',
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
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          height: '100vh',
          overflow: 'auto',
          bgcolor: 'grey.50',
        }}
      >
        {/* Toolbar Spacer */}
        <Toolbar />

        {/* Page Content */}
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default DashboardLayout;