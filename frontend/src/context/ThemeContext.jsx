import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import { getTheme } from '../theme/theme';

const ThemeContext = createContext();

/**
 * Theme Provider component that manages theme state and provides it to the app
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components to render
 */
export const ThemeProvider = ({ children }) => {
  const [mode, setMode] = useState(() => {
    // Check if user has a theme preference in localStorage
    const savedMode = localStorage.getItem('themeMode');
    // Check system preference if no saved preference
    if (!savedMode) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return savedMode;
  });

  // Update theme when mode changes
  useEffect(() => {
    localStorage.setItem('themeMode', mode);
  }, [mode]);

  // Create theme based on current mode
  const theme = useMemo(() => {
    return createTheme(getTheme(mode));
  }, [mode]);

  const toggleTheme = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  const value = {
    mode,
    setMode,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      <MuiThemeProvider theme={theme}>
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

/**
 * Custom hook to use the theme context
 * @returns {Object} Theme context value containing mode, setMode, and toggleTheme
 */
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext; 