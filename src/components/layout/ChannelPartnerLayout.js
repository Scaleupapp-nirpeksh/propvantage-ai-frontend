import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Drawer, AppBar, Toolbar, Typography, List, ListItemButton, ListItemIcon,
  ListItemText, IconButton, Avatar, Menu, MenuItem,
} from '@mui/material';
import {
  Dashboard, Groups, Business, Logout, Menu as MenuIcon, Storefront, Handshake,
  PersonSearch, Domain, AutoAwesome, Payments, FactCheck, Insights as InsightsIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from '../notifications/NotificationBell';
import CpCopilotDrawer from '../ai/CpCopilotDrawer';

const DRAWER_WIDTH = 248;

// Grouped nav. Order: Workspace → Insights → Commission → Network → Settings.
// Each group renders a small uppercase caption above its items. Flat (not
// collapsible) so every item stays one click away.
const NAV_SECTIONS = [
  {
    section: 'Workspace',
    items: [
      { label: 'Dashboard', icon: Dashboard,    path: '/partner/dashboard' },
      { label: 'Prospects', icon: PersonSearch, path: '/partner/prospects' },
    ],
  },
  {
    section: 'Insights',
    items: [
      { label: 'AI Insights',           icon: AutoAwesome,  path: '/partner/insights' },
      { label: 'Developer Performance', icon: InsightsIcon, path: '/partner/developers/performance' },
    ],
  },
  {
    section: 'Commission',
    items: [
      { label: 'Overview',       icon: Payments,  path: '/partner/commission' },
      { label: 'Reconciliation', icon: FactCheck, path: '/partner/commission/reconciliation' },
    ],
  },
  {
    section: 'Network',
    items: [
      { label: 'Marketplace',             icon: Storefront, path: '/partner/marketplace' },
      { label: 'Partnerships',            icon: Handshake,  path: '/partner/partnerships' },
      { label: 'Off-Platform Developers', icon: Domain,     path: '/partner/external-developers' },
    ],
  },
  {
    section: 'Settings',
    items: [
      { label: 'My Team',             icon: Groups,   path: '/partner/team' },
      { label: 'Organization Profile', icon: Business, path: '/partner/profile' },
    ],
  },
];

const ChannelPartnerLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, organization, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  const drawer = (
    <Box>
      <Toolbar>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>PropVantage</Typography>
      </Toolbar>
      <Box sx={{ px: 2, pt: 1, pb: 0.5 }}>
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1.2 }}>
          {organization?.name}
        </Typography>
      </Box>
      <Box sx={{ mt: 0.5 }}>
        {NAV_SECTIONS.map((section, idx) => (
          <Box key={section.section} sx={{ mt: idx === 0 ? 0.5 : 1.5 }}>
            <Typography
              variant="overline"
              sx={{
                px: 2,
                color: 'text.disabled',
                fontSize: '0.65rem',
                fontWeight: 600,
                letterSpacing: 0.8,
                display: 'block',
                lineHeight: 1.8,
              }}
            >
              {section.section}
            </Typography>
            <List dense disablePadding>
              {section.items.map((item) => {
                const isActive =
                  location.pathname === item.path ||
                  // Treat /partner/commission as also "active" when on /reconciliation
                  // child path — but only mark the parent if there's no exact match
                  // on the more-specific child route.
                  (item.path === '/partner/commission' && location.pathname === '/partner/commission');
                return (
                  <ListItemButton
                    key={item.path}
                    selected={isActive}
                    onClick={() => { navigate(item.path); setMobileOpen(false); }}
                    sx={{ py: 0.5, pl: 2.5 }}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <item.icon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{ fontSize: '0.875rem' }}
                    />
                  </ListItemButton>
                );
              })}
            </List>
          </Box>
        ))}
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton color="inherit" edge="start" onClick={() => setMobileOpen(!mobileOpen)}
            sx={{ mr: 2, display: { sm: 'none' } }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>Channel Partner Portal</Typography>
          {/* SP4 — CP-side notification surface (bell + dropdown panel) */}
          <Box sx={{ color: 'inherit', mr: 1 }}>
            <NotificationBell />
          </Box>
          <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} color="inherit">
            <Avatar sx={{ width: 32, height: 32 }}>
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </Avatar>
          </IconButton>
          <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={() => setAnchorEl(null)}>
            <MenuItem onClick={() => { setAnchorEl(null); logout(); }}>
              <ListItemIcon><Logout fontSize="small" /></ListItemIcon> Sign out
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      <Box component="nav" sx={{ width: { sm: DRAWER_WIDTH }, flexShrink: { sm: 0 } }}>
        <Drawer variant="temporary" open={mobileOpen} onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}>
          {drawer}
        </Drawer>
        <Drawer variant="permanent" open
          sx={{ display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}>
          {drawer}
        </Drawer>
      </Box>
      <Box component="main" sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` } }}>
        <Toolbar />
        {children}
      </Box>
      {/* SP5 — CP-side AI Copilot floating button + drawer. Always mounted
          on every CP portal page; toggled via ⌘J or the FAB. */}
      <CpCopilotDrawer />
    </Box>
  );
};

export default ChannelPartnerLayout;
