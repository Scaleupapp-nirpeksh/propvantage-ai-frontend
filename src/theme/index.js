// File: src/theme/index.js
// Description: Material-UI theme configuration for PropVantage AI
// Version: 2.0 - Enhanced with design tokens, animations, elevation system
// Location: src/theme/index.js

import { createTheme, alpha } from '@mui/material/styles';

// Define our color palette for real estate platform
const colors = {
  // Primary colors - Professional blues
  primary: {
    50: '#e3f2fd',
    100: '#bbdefb',
    200: '#90caf9',
    300: '#64b5f6',
    400: '#42a5f5',
    500: '#2196f3',
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
    500: '#ffc107',
    600: '#ffb300',
    700: '#ffa000',
    800: '#ff8f00',
    900: '#ff6f00',
  },

  // Status colors for units and leads
  success: {
    50: '#e8f5e9',
    100: '#c8e6c9',
    200: '#a5d6a7',
    300: '#81c784',
    400: '#66bb6a',
    500: '#4caf50',
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
    500: '#f44336',
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
    500: '#ff9800',
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
    500: '#03a9f4',
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
      default: '#f8f9fa',
      paper: '#ffffff',
    },
    text: {
      primary: colors.grey[900],
      secondary: colors.grey[600],
      disabled: colors.grey[400],
    },
    divider: colors.grey[200],
  },

  // Typography - Professional and readable
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',

    h1: {
      fontSize: '2rem',
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontSize: '1.75rem',
      fontWeight: 700,
      lineHeight: 1.3,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.4,
      letterSpacing: '-0.01em',
    },
    h4: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.4,
      letterSpacing: '0em',
    },
    h5: {
      fontSize: '1.125rem',
      fontWeight: 600,
      lineHeight: 1.5,
      letterSpacing: '0em',
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
      lineHeight: 1.5,
      letterSpacing: '0em',
    },

    body1: {
      fontSize: '0.938rem',
      fontWeight: 400,
      lineHeight: 1.6,
      letterSpacing: '0em',
    },
    body2: {
      fontSize: '0.813rem',
      fontWeight: 400,
      lineHeight: 1.5,
      letterSpacing: '0em',
    },

    button: {
      fontSize: '0.813rem',
      fontWeight: 500,
      lineHeight: 1.75,
      letterSpacing: '0.01em',
      textTransform: 'none',
    },
    caption: {
      fontSize: '0.75rem',
      fontWeight: 400,
      lineHeight: 1.5,
      letterSpacing: '0.01em',
      color: colors.grey[600],
    },
    overline: {
      fontSize: '0.688rem',
      fontWeight: 600,
      lineHeight: 2,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: colors.grey[500],
    },
    subtitle1: {
      fontSize: '0.938rem',
      fontWeight: 500,
      lineHeight: 1.5,
    },
    subtitle2: {
      fontSize: '0.813rem',
      fontWeight: 500,
      lineHeight: 1.5,
    },
  },

  // Spacing and layout
  spacing: 8,

  // Shape
  shape: {
    borderRadius: 10,
  },

  // Component customizations
  components: {
    // AppBar
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          color: colors.grey[900],
          boxShadow: 'none',
          borderBottom: `1px solid ${colors.grey[200]}`,
        },
      },
    },

    // Card - Clean minimal with subtle hover
    MuiCard: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: `1px solid ${colors.grey[200]}`,
          boxShadow: 'none',
          transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            borderColor: colors.grey[300],
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
          },
        },
      },
    },

    // CardContent - Consistent padding
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: 20,
          '&:last-child': {
            paddingBottom: 20,
          },
        },
      },
    },

    // Button
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 16px',
          fontSize: '0.813rem',
          fontWeight: 500,
          textTransform: 'none',
          transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
          },
        },
        outlined: {
          borderColor: colors.grey[300],
          '&:hover': {
            borderColor: colors.grey[400],
            backgroundColor: colors.grey[50],
          },
        },
        text: {
          '&:hover': {
            backgroundColor: colors.grey[100],
          },
        },
        sizeSmall: {
          padding: '4px 12px',
          fontSize: '0.75rem',
        },
        sizeLarge: {
          padding: '10px 24px',
          fontSize: '0.875rem',
        },
      },
    },

    // IconButton
    MuiIconButton: {
      styleOverrides: {
        root: {
          transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            backgroundColor: alpha(colors.primary[600], 0.08),
          },
        },
      },
    },

    // Chip - Soft variants
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontSize: '0.75rem',
          fontWeight: 500,
          height: 28,
        },
        sizeSmall: {
          height: 24,
          fontSize: '0.688rem',
        },
        colorPrimary: {
          backgroundColor: alpha(colors.primary[600], 0.1),
          color: colors.primary[700],
          border: 'none',
        },
        colorSuccess: {
          backgroundColor: alpha(colors.success[600], 0.1),
          color: colors.success[700],
          border: 'none',
        },
        colorError: {
          backgroundColor: alpha(colors.error[600], 0.1),
          color: colors.error[700],
          border: 'none',
        },
        colorWarning: {
          backgroundColor: alpha(colors.warning[600], 0.1),
          color: colors.warning[800],
          border: 'none',
        },
        colorInfo: {
          backgroundColor: alpha(colors.info[600], 0.1),
          color: colors.info[700],
          border: 'none',
        },
      },
    },

    // Paper
    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        outlined: {
          borderColor: colors.grey[200],
        },
      },
    },

    // Table
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: colors.grey[100],
          padding: '12px 16px',
          fontSize: '0.813rem',
        },
        head: {
          backgroundColor: colors.grey[50],
          fontWeight: 600,
          fontSize: '0.75rem',
          color: colors.grey[600],
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          whiteSpace: 'nowrap',
        },
      },
    },

    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: 'background-color 150ms ease',
          '&:hover': {
            backgroundColor: colors.grey[50],
          },
          '&:last-child td': {
            borderBottom: 0,
          },
        },
      },
    },

    // Drawer
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: `1px solid ${colors.grey[200]}`,
          backgroundColor: '#ffffff',
        },
      },
    },

    // Tabs
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          fontSize: '0.813rem',
          minHeight: 44,
          padding: '8px 16px',
          color: colors.grey[600],
          '&.Mui-selected': {
            color: colors.primary[700],
            fontWeight: 600,
          },
        },
      },
    },

    MuiTabs: {
      styleOverrides: {
        indicator: {
          height: 3,
          borderRadius: '3px 3px 0 0',
        },
      },
    },

    // TextField
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        size: 'small',
      },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            fontSize: '0.875rem',
            transition: 'all 150ms ease',
            '& fieldset': {
              borderColor: colors.grey[300],
            },
            '&:hover fieldset': {
              borderColor: colors.grey[400],
            },
            '&.Mui-focused fieldset': {
              borderWidth: 2,
            },
          },
        },
      },
    },

    // Select
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontSize: '0.875rem',
        },
      },
    },

    // Dialog
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.16)',
        },
      },
    },

    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontSize: '1.125rem',
          fontWeight: 600,
          padding: '20px 24px 12px',
        },
      },
    },

    // Tooltip
    MuiTooltip: {
      defaultProps: {
        arrow: true,
        enterDelay: 300,
      },
      styleOverrides: {
        tooltip: {
          backgroundColor: colors.grey[800],
          fontSize: '0.75rem',
          fontWeight: 400,
          padding: '6px 12px',
          borderRadius: 6,
          maxWidth: 280,
        },
        arrow: {
          color: colors.grey[800],
        },
      },
    },

    // Alert
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          fontSize: '0.813rem',
        },
        standardSuccess: {
          backgroundColor: alpha(colors.success[500], 0.08),
          color: colors.success[800],
        },
        standardError: {
          backgroundColor: alpha(colors.error[500], 0.08),
          color: colors.error[800],
        },
        standardWarning: {
          backgroundColor: alpha(colors.warning[500], 0.08),
          color: colors.warning[900],
        },
        standardInfo: {
          backgroundColor: alpha(colors.info[500], 0.08),
          color: colors.info[800],
        },
      },
    },

    // Avatar
    MuiAvatar: {
      styleOverrides: {
        root: {
          fontSize: '0.813rem',
          fontWeight: 600,
        },
      },
    },

    // Skeleton
    MuiSkeleton: {
      defaultProps: {
        animation: 'wave',
      },
      styleOverrides: {
        root: {
          borderRadius: 6,
        },
        rounded: {
          borderRadius: 10,
        },
      },
    },

    // Badge
    MuiBadge: {
      styleOverrides: {
        badge: {
          fontSize: '0.688rem',
          fontWeight: 600,
          minWidth: 18,
          height: 18,
        },
      },
    },

    // LinearProgress
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          height: 6,
          backgroundColor: colors.grey[200],
        },
      },
    },

    // Menu
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: 10,
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
          border: `1px solid ${colors.grey[200]}`,
          marginTop: 4,
        },
      },
    },

    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontSize: '0.813rem',
          padding: '8px 16px',
          borderRadius: 6,
          margin: '2px 6px',
          transition: 'all 100ms ease',
          '&:hover': {
            backgroundColor: colors.grey[100],
          },
        },
      },
    },

    // Breadcrumbs
    MuiBreadcrumbs: {
      styleOverrides: {
        root: {
          fontSize: '0.813rem',
        },
        separator: {
          color: colors.grey[400],
        },
      },
    },

    // ListItemButton
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '6px 12px',
          transition: 'all 150ms ease',
          '&.Mui-selected': {
            backgroundColor: alpha(colors.primary[600], 0.08),
            '&:hover': {
              backgroundColor: alpha(colors.primary[600], 0.12),
            },
          },
        },
      },
    },

    // Divider
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: colors.grey[200],
        },
      },
    },

    // Switch
    MuiSwitch: {
      styleOverrides: {
        root: {
          width: 42,
          height: 26,
          padding: 0,
        },
        switchBase: {
          padding: 0,
          margin: 3,
          '&.Mui-checked': {
            transform: 'translateX(16px)',
            '& + .MuiSwitch-track': {
              opacity: 1,
            },
          },
        },
        thumb: {
          width: 20,
          height: 20,
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        },
        track: {
          borderRadius: 13,
          opacity: 1,
          backgroundColor: colors.grey[300],
        },
      },
    },

    // Accordion
    MuiAccordion: {
      defaultProps: {
        disableGutters: true,
        elevation: 0,
      },
      styleOverrides: {
        root: {
          border: `1px solid ${colors.grey[200]}`,
          borderRadius: '10px !important',
          '&:before': {
            display: 'none',
          },
          '&.Mui-expanded': {
            margin: 0,
          },
        },
      },
    },
  },

  // Custom theme extensions
  custom: {
    // Status colors for real estate units
    unitStatus: {
      available: colors.success[500],
      sold: colors.info[500],
      blocked: colors.error[500],
      reserved: colors.warning[500],
      booked: colors.primary[500],
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

    // Animation tokens
    transitions: {
      fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
      normal: '250ms cubic-bezier(0.4, 0, 0.2, 1)',
      slow: '400ms cubic-bezier(0.4, 0, 0.2, 1)',
      spring: '500ms cubic-bezier(0.34, 1.56, 0.64, 1)',
    },

    // Elevation system (semantic)
    elevation: {
      card: '0 1px 3px rgba(0, 0, 0, 0.04)',
      cardHover: '0 4px 12px rgba(0, 0, 0, 0.08)',
      dropdown: '0 8px 24px rgba(0, 0, 0, 0.12)',
      modal: '0 24px 48px rgba(0, 0, 0, 0.16)',
    },

    // Sidebar dimensions
    sidebar: {
      width: 260,
      collapsedWidth: 72,
    },

    // Chart color palette (8 harmonious colors)
    chartColors: [
      '#1e88e5', // blue
      '#43a047', // green
      '#fb8c00', // orange
      '#8e24aa', // purple
      '#00acc1', // cyan
      '#e53935', // red
      '#ffb300', // amber
      '#546e7a', // blue-grey
    ],
  },
});

export default theme;
