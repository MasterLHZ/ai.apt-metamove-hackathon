// theme.ts
import { createTheme } from '@mui/material/styles';

const defaulttheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#9C27B0', // Purple for active cards
    },
    secondary: {
      main: '#4a4a4a', // Dark gray for expired cards
    },
    background: {
      default: '#1E1F25',
      paper: '#2A2C36',
    },
    success: {
      main: '#4CAF50', // Green for YES
    },
    error: {
      main: '#E91E63', // Pink for NO
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '1.5rem',
      fontWeight: 600,
    },
    body1: {
      fontSize: '0.9rem',
    },
    body2: {
      fontSize: '0.8rem',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backgroundColor: '#2A2C36',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
  },
});

export default defaulttheme;