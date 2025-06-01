import { createTheme as createMuiTheme } from '@mui/material/styles';
import rtlPlugin from 'stylis-plugin-rtl';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import { prefixer } from 'stylis';
import i18n from '../i18n/config';

// Create RTL cache
const cacheRtl = createCache({
    key: 'muirtl',
    stylisPlugins: [prefixer, rtlPlugin],
});

// Create LTR cache
const cacheLtr = createCache({
    key: 'mui',
});

// Direction-aware cache provider
export const RtlCacheProvider = ({ children, isRtl }) => (
    <CacheProvider value={isRtl ? cacheRtl : cacheLtr}>
        {children}
    </CacheProvider>
);

/**
 * Get theme configuration based on mode and RTL status
 * @param {string} mode - 'light' or 'dark'
 * @param {boolean} isRtl - Whether the app is in RTL mode
 * @returns {Object} Theme configuration
 */
export const getTheme = (mode = 'light', isRtl = false) => {
    const isDark = mode === 'dark';

    return createMuiTheme({
        direction: isRtl ? 'rtl' : 'ltr',
        palette: {
            mode,
            primary: {
                main: isDark ? '#90caf9' : '#1976d2',
            },
            secondary: {
                main: isDark ? '#f48fb1' : '#dc004e',
            },
            error: {
                main: '#dc2626', // Red
                light: '#f87171',
                dark: '#b91c1c',
            },
            warning: {
                main: '#d97706', // Amber
                light: '#fbbf24',
                dark: '#b45309',
            },
            success: {
                main: '#059669', // Green
                light: '#34d399',
                dark: '#047857',
            },
            neutral: {
                main: '#64748b', // Slate
                light: '#94a3b8',
                dark: '#475569',
                contrastText: '#ffffff',
            },
            background: {
                default: isDark ? '#121212' : '#f5f5f5',
                paper: isDark ? '#1e1e1e' : '#ffffff',
            },
            text: {
                primary: isDark ? '#ffffff' : 'rgba(0, 0, 0, 0.87)',
                secondary: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
            },
        },
        typography: {
            fontFamily: isRtl ? '"Cairo", "Helvetica", "Arial", sans-serif' : '"Inter", "Helvetica", "Arial", sans-serif',
            h1: {
                fontSize: '2.5rem',
                fontWeight: 600,
                lineHeight: 1.2,
            },
            h2: {
                fontSize: '2rem',
                fontWeight: 600,
                lineHeight: 1.2,
            },
            h3: {
                fontSize: '1.75rem',
                fontWeight: 600,
                lineHeight: 1.2,
            },
            h4: {
                fontSize: '1.5rem',
                fontWeight: 600,
                lineHeight: 1.2,
            },
            h5: {
                fontSize: '1.25rem',
                fontWeight: 600,
                lineHeight: 1.2,
            },
            h6: {
                fontSize: '1rem',
                fontWeight: 600,
                lineHeight: 1.2,
            },
            subtitle1: {
                fontSize: '1rem',
                fontWeight: 500,
                lineHeight: 1.5,
            },
            subtitle2: {
                fontSize: '0.875rem',
                fontWeight: 500,
                lineHeight: 1.5,
            },
            body1: {
                fontSize: '1rem',
                lineHeight: 1.5,
            },
            body2: {
                fontSize: '0.875rem',
                lineHeight: 1.5,
            },
            button: {
                textTransform: 'none',
                fontWeight: 500,
            },
        },
        shape: {
            borderRadius: 8,
        },
        components: {
            MuiCssBaseline: {
                styleOverrides: {
                    body: {
                        direction: isRtl ? 'rtl' : 'ltr',
                    },
                },
            },
            MuiButton: {
                styleOverrides: {
                    root: {
                        borderRadius: 8,
                        padding: '8px 16px',
                    },
                    contained: {
                        boxShadow: 'none',
                        '&:hover': {
                            boxShadow: 'none',
                        },
                    },
                },
            },
            MuiCard: {
                styleOverrides: {
                    root: {
                        borderRadius: 12,
                        boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
                        backgroundColor: isDark ? '#1e1e1e' : '#ffffff',
                    },
                },
            },
            MuiPaper: {
                styleOverrides: {
                    root: {
                        borderRadius: 12,
                    },
                },
            },
            MuiDrawer: {
                styleOverrides: {
                    paper: {
                        direction: isRtl ? 'rtl' : 'ltr',
                        backgroundColor: isDark ? '#1e1e1e' : '#ffffff',
                        color: isDark ? '#ffffff' : 'rgba(0, 0, 0, 0.87)',
                    },
                },
            },
            MuiTextField: {
                styleOverrides: {
                    root: {
                        direction: isRtl ? 'rtl' : 'ltr',
                    },
                },
            },
            MuiSelect: {
                styleOverrides: {
                    root: {
                        direction: isRtl ? 'rtl' : 'ltr',
                    },
                },
            },
            MuiInputLabel: {
                styleOverrides: {
                    root: {
                        direction: isRtl ? 'rtl' : 'ltr',
                    },
                },
            },
            MuiInputBase: {
                styleOverrides: {
                    root: {
                        direction: isRtl ? 'rtl' : 'ltr',
                    },
                },
            },
            MuiAppBar: {
                styleOverrides: {
                    root: {
                        backgroundColor: isDark ? '#1e1e1e' : '#ffffff',
                        color: isDark ? '#ffffff' : 'rgba(0, 0, 0, 0.87)',
                    },
                },
            },
        },
    });
};

export default getTheme; 