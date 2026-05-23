import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Drawer, AppBar, Toolbar, Typography, List, ListItemButton, ListItemIcon,
  ListItemText, IconButton, Avatar, Menu, MenuItem,
} from '@mui/material';
import {
  Dashboard, Groups, Business, Logout, Menu as MenuIcon, Storefront, Handshake,
  PersonSearch, Domain,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

const DRAWER_WIDTH = 248;
const NAV = [
  { label: 'Dashboard', icon: Dashboard, path: '/partner/dashboard' },
  { label: 'Prospects', icon: PersonSearch, path: '/partner/prospects' },
  { label: 'Marketplace', icon: Storefront, path: '/partner/marketplace' },
  { label: 'Partnerships', icon: Handshake, path: '/partner/partnerships' },
  { label: 'Off-Platform Developers', icon: Domain, path: '/partner/external-developers' },
  { label: 'My Team', icon: Groups, path: '/partner/team' },
  { label: 'Organization Profile', icon: Business, path: '/partner/profile' },
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
      <Typography variant="caption" sx={{ px: 2, color: 'text.secondary', mt: 1 }}>
        {organization?.name}
      </Typography>
      <List sx={{ mt: 1 }}>
        {NAV.map((item) => (
          <ListItemButton key={item.path}
            selected={location.pathname === item.path}
            onClick={() => { navigate(item.path); setMobileOpen(false); }}>
            <ListItemIcon><item.icon /></ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
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
    </Box>
  );
};

export default ChannelPartnerLayout;
