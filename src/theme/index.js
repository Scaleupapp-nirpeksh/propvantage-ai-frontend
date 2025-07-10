// File: src/theme/index.js
// Description: Material-UI theme configuration for PropVantage AI - Professional Real Estate CRM
// Version: 1.0 - Complete theme setup with professional real estate styling
// Location: src/theme/index.js

import { createTheme } from '@mui/material/styles';

// Define our color palette for real estate platform
const colors = {
  // Primary colors - Professional blues
  primary: {
    50: '#e3f2fd',
    100: '#bbdefb',
    200: '#90caf9',
    300: '#64b5f6',
    400: '#42a5f5',
    500: '#2196f3', // Main primary
    600: '#1e88e5',
    700: '#1976d2',
    800: '#1565c0',
    900: '#0d47a1',
  },
  
  // Secondary colors - Real estate gold/amber
  secondary: {
    50: '#fff8e1',
    100: '#ffecb3',
    200: '#ffe082',
    300: '#ffd54f',
    400: '#ffca28',
    500: '#ffc107', // Main secondary
    600: '#ffb300',
    700: '#ffa000',
    800: '#ff8f00',
    900: '#ff6f00',
  },
  
  // Status colors for units and leads
  success: {
    50: '#e8f5e8',
    100: '#c8e6c8',
    200: '#a5d6a5',
    300: '#81c784',
    400: '#66bb6a',
    500: '#4caf50', // Available units
    600: '#43a047',
    700: '#388e3c',
    800: '#2e7d32',
    900: '#1b5e20',
  },
  
  error: {
    50: '#ffebee',
    100: '#ffcdd2',
    200: '#ef9a9a',
    300: '#e57373',
    400: '#ef5350',
    500: '#f44336', // Blocked/unavailable
    600: '#e53935',
    700: '#d32f2f',
    800: '#c62828',
    900: '#b71c1c',
  },
  
  warning: {
    50: '#fff3e0',
    100: '#ffe0b2',
    200: '#ffcc80',
    300: '#ffb74d',
    400: '#ffa726',
    500: '#ff9800', // Pending/under review
    600: '#fb8c00',
    700: '#f57c00',
    800: '#ef6c00',
    900: '#e65100',
  },
  
  info: {
    50: '#e1f5fe',
    100: '#b3e5fc',
    200: '#81d4fa',
    300: '#4fc3f7',
    400: '#29b6f6',
    500: '#03a9f4', // Sold units
    600: '#039be5',
    700: '#0288d1',
    800: '#0277bd',
    900: '#01579b',
  },
  
  // Neutral grays
  grey: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#eeeeee',
    300: '#e0e0e0',
    400: '#bdbdbd',
    500: '#9e9e9e',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  }
};

// Create the theme
const theme = createTheme({
  // Color palette
  palette: {
    mode: 'light',
    primary: {
      main: colors.primary[600],
      light: colors.primary[400],
      dark: colors.primary[800],
      contrastText: '#ffffff',
    },
    secondary: {
      main: colors.secondary[600],
      light: colors.secondary[400],
      dark: colors.secondary[800],
      contrastText: '#000000',
    },
    success: {
      main: colors.success[600],
      light: colors.success[400],
      dark: colors.success[800],
      contrastText: '#ffffff',
    },
    error: {
      main: colors.error[600],
      light: colors.error[400],
      dark: colors.error[800],
      contrastText: '#ffffff',
    },
    warning: {
      main: colors.warning[600],
      light: colors.warning[400],
      dark: colors.warning[800],
      contrastText: '#000000',
    },
    info: {
      main: colors.info[600],
      light: colors.info[400],
      dark: colors.info[800],
      contrastText: '#ffffff',
    },
    grey: colors.grey,
    background: {
      default: '#fafafa',
      paper: '#ffffff',
    },
    text: {
      primary: colors.grey[900],
      secondary: colors.grey[700],
      disabled: colors.grey[500],
    },
  },

  // Typography - Professional and readable
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    
    // Headlines
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
      lineHeight: 1.2,
      letterSpacing: '-0.01562em',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      lineHeight: 1.3,
      letterSpacing: '-0.00833em',
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      lineHeight: 1.4,
      letterSpacing: '0em',
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.4,
      letterSpacing: '0.00735em',
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.5,
      letterSpacing: '0em',
    },
    h6: {
      fontSize: '1.125rem',
      fontWeight: 600,
      lineHeight: 1.5,
      letterSpacing: '0.0075em',
    },
    
    // Body text
    body1: {
      fontSize: '1rem',
      fontWeight: 400,
      lineHeight: 1.6,
      letterSpacing: '0.00938em',
    },
    body2: {
      fontSize: '0.875rem',
      fontWeight: 400,
      lineHeight: 1.5,
      letterSpacing: '0.01071em',
    },
    
    // UI elements
    button: {
      fontSize: '0.875rem',
      fontWeight: 500,
      lineHeight: 1.75,
      letterSpacing: '0.02857em',
      textTransform: 'none', // Remove uppercase transformation
    },
    caption: {
      fontSize: '0.75rem',
      fontWeight: 400,
      lineHeight: 1.66,
      letterSpacing: '0.03333em',
    },
    overline: {
      fontSize: '0.75rem',
      fontWeight: 500,
      lineHeight: 2.66,
      letterSpacing: '0.08333em',
      textTransform: 'uppercase',
    },
  },

  // Spacing and layout
  spacing: 8, // Base spacing unit (8px)

  // Shape (border radius)
  shape: {
    borderRadius: 8,
  },

  // Component customizations
  components: {
    // App Bar customization
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          color: colors.grey[900],
          boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.12)',
          borderBottom: `1px solid ${colors.grey[200]}`,
        },
      },
    },

    // Card customization
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
          borderRadius: 12,
          border: `1px solid ${colors.grey[200]}`,
        },
      },
    },

    // Button customization
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '10px 24px',
          fontSize: '0.875rem',
          fontWeight: 500,
          textTransform: 'none',
        },
        contained: {
          boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
          '&:hover': {
            boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.15)',
          },
        },
      },
    },

    // Chip customization (for status indicators)
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          fontSize: '0.75rem',
          fontWeight: 500,
        },
      },
    },

    // Paper customization
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        elevation1: {
          boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
        },
        elevation2: {
          boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.12)',
        },
      },
    },

    // Table customization
    MuiTableCell: {
      styleOverrides: {
        head: {
          backgroundColor: colors.grey[50],
          fontWeight: 600,
          fontSize: '0.875rem',
          color: colors.grey[900],
        },
      },
    },

    // Drawer customization
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: `1px solid ${colors.grey[200]}`,
          backgroundColor: colors.grey[50],
        },
      },
    },
  },

  // Custom theme extensions for our app
  custom: {
    // Status colors for real estate units
    unitStatus: {
      available: colors.success[500],
      sold: colors.info[500],
      blocked: colors.error[500],
      reserved: colors.warning[500],
    },
    
    // Lead status colors
    leadStatus: {
      new: colors.info[500],
      contacted: colors.warning[500],
      qualified: colors.secondary[600],
      siteVisit: colors.primary[500],
      negotiating: colors.warning[700],
      closed: colors.success[500],
      lost: colors.error[500],
    },
    
    // Dashboard metrics colors
    metrics: {
      revenue: colors.success[600],
      target: colors.primary[600],
      pending: colors.warning[600],
      overdue: colors.error[600],
    },
  },
});

export default theme;