import { createTheme } from '@mui/material/styles';

export const getTheme = (direction: 'ltr' | 'rtl') => createTheme({
  direction: direction,
  palette: {
    primary: {
      main: '#2e7d32', // Emerald/Islamic Green
      light: '#60ad5e',
      dark: '#005005',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#ffd700', // Gold
      light: '#ffff52',
      dark: '#c7a500',
      contrastText: '#000000',
    },
    background: {
      default: '#f8f9fa',
      paper: '#ffffff',
    },
    text: {
      primary: '#2c3e50',
      secondary: '#546e7a',
    },
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily: direction === 'rtl' ? 'Amiri, Arial, sans-serif' : '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h5: {
      fontWeight: 700,
    },
    h6: {
      fontWeight: 600,
    },
    subtitle1: {
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          border: 'none',
          boxShadow: '0 0 15px rgba(0,0,0,0.1)',
        },
      },
    },
  },
});
