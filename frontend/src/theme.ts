import { createTheme } from '@mui/material/styles';

export const getTheme = (direction: 'ltr' | 'rtl') => createTheme({
  direction: direction,
  palette: {
    primary: {
      main: '#2e7d32', // A more Islamic green
    },
    secondary: {
      main: '#ffd700',
    },
    background: {
      default: '#f4f4f4',
    },
  },
  typography: {
    fontFamily: direction === 'rtl' ? 'Arial, sans-serif' : '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});
