import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../context/LanguageContext';
import { useTheme as useAppTheme } from '../context/ThemeContext';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import {
  AppBar,
  Box,
  CssBaseline,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useMediaQuery,
  Avatar,
  Menu,
  MenuItem,
  Select,
  FormControl,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Inventory as InventoryIcon,
  CalendarMonth as CalendarIcon,
  People as PeopleIcon,
  Settings as SettingsIcon,
  AccountCircle as AccountCircleIcon,
  Language as LanguageIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

/**
 * @typedef {Object} MainLayoutProps
 * @property {React.ReactNode} children - Child components to render
 */

/**
 * Menu items configuration
 * @type {Array<{text: string, icon: React.ReactNode, path: string}>}
 */
const menuItems = [
  { text: 'navigation.dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  { text: 'navigation.appointments', icon: <CalendarIcon />, path: '/appointments' },
  { text: 'navigation.doctors', icon: <PeopleIcon />, path: '/doctors' },
  { text: 'navigation.patients', icon: <PeopleIcon />, path: '/patients' },
  { text: 'navigation.stock', icon: <InventoryIcon />, path: '/stock' },
  { text: 'navigation.profile', icon: <AccountCircleIcon />, path: '/profile' },
  { text: 'navigation.settings', icon: <SettingsIcon />, path: '/settings' },
];

/**
 * Main layout component that provides the application shell with navigation
 * @param {MainLayoutProps} props
 */
export const MainLayout = ({ children }) => {
  const { t } = useTranslation();
  const { lang, setLang, isRtl } = useLanguage();
  const { mode, toggleTheme } = useAppTheme();
  const muiTheme = useMuiTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleMenuClose();
    logout();
  };

  const handleLanguageChange = (event) => {
    setLang(event.target.value);
  };

  const drawerWidth = sidebarOpen ? 240 : 65;

  return (
    <Box sx={{ display: 'flex', direction: isRtl ? 'rtl' : 'ltr' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        display="flex"
        justifyContent={isRtl ? 'flex-start' : 'flex-start'}
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          // ...(isRtl ? { right: { sm: `${drawerWidth}px` } } : { left: { sm: `${drawerWidth}px` } }),
          direction: isRtl ? 'rtl' : 'ltr',
          borderRadius: 0,
          boxShadow: 'none',
          borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
          transition: muiTheme.transitions.create(['width', 'margin'], {
            easing: muiTheme.transitions.easing.sharp,
            duration: muiTheme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            // edge={isRtl ? 'end' : 'start'}
            onClick={handleDrawerToggle}
            sx={{
              mr: isRtl ? 0 : 2,
              ml: isRtl ? 2 : 0,
              display: { sm: 'none' }
            }}
          >
            <MenuIcon />
          </IconButton>
          {/* <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {t(menuItems.find((item) => item.path === location.pathname)?.text || 'navigation.dashboard')}
          </Typography> */}

          {/* Theme Toggle Button */}
          <IconButton
            color="inherit"
            onClick={toggleTheme}
            sx={{ ml: 1 }}
          >
            {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>

          {/* Language Selector */}
          <FormControl size="small" sx={{ minWidth: 120, mx: 2 }}>
            <Select
              value={lang}
              onChange={handleLanguageChange}
              sx={{ color: 'inherit' }}
              IconComponent={LanguageIcon}
            >
              <MenuItem value="en">English</MenuItem>
              <MenuItem value="ar">العربية</MenuItem>
            </Select>
          </FormControl>

          <IconButton
            size="large"
            edge="end"
            aria-label="account of current user"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleMenuOpen}
            color="inherit"
          >
            <Avatar sx={{ width: 32, height: 32 }}>
              {user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
            </Avatar>
          </IconButton>
          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: isRtl ? 'left' : 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: isRtl ? 'left' : 'right',
            }}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={() => {
              handleMenuClose();
              navigate('/profile');
            }}>
              <ListItemIcon>
                <AccountCircleIcon fontSize="small" />
              </ListItemIcon>
              {t('auth.profile')}
            </MenuItem>
            <MenuItem onClick={handleLogout}>{t('auth.logout')}</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{
          width: { sm: drawerWidth },
          flexShrink: { sm: 0 },
          order: isRtl ? 2 : 0,
          transition: muiTheme.transitions.create('width', {
            easing: muiTheme.transitions.easing.sharp,
            duration: muiTheme.transitions.duration.enteringScreen,
          }),
        }}
      >
        <Drawer
          variant={isMobile ? 'temporary' : 'permanent'}
          open={isMobile ? mobileOpen : sidebarOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              position: 'fixed',
              height: '100%',
              // [isRtl ? 'right' : 'left']: 0,
              // [isRtl ? 'left' : 'right']: 'auto',
              border: 'none',
              borderRight: isRtl ? 'none' : '1px solid rgba(0, 0, 0, 0.12)',
              borderLeft: isRtl ? '1px solid rgba(0, 0, 0, 0.12)' : 'none',
              transition: muiTheme.transitions.create('width', {
                easing: muiTheme.transitions.easing.sharp,
                duration: muiTheme.transitions.duration.enteringScreen,
              }),
            },
          }}
        >
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            p: 1,
            borderBottom: '1px solid rgba(0, 0, 0, 0.12)'
          }}>
            <IconButton onClick={handleSidebarToggle}>
              {isRtl ? (
                sidebarOpen ? <ChevronRightIcon /> : <ChevronLeftIcon />
              ) : (
                sidebarOpen ? <ChevronLeftIcon /> : <ChevronRightIcon />
              )}
            </IconButton>
          </Box>
          <Box sx={{ overflow: 'auto' }}>
            {sidebarOpen ? (
              <div>
                <Toolbar>
                  <Typography variant="h6" noWrap component="div">
                    {t('common.appName')}
                  </Typography>
                </Toolbar>
                <Divider />
                <List>
                  {menuItems.map((item) => (
                    <ListItem key={item.text} disablePadding>
                      <ListItemButton
                        selected={location.pathname === item.path}
                        onClick={() => {
                          navigate(item.path);
                          if (isMobile) {
                            setMobileOpen(false);
                          }
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: isRtl ? '48px' : '40px' }}>
                          {item.icon}
                        </ListItemIcon>
                        <ListItemText primary={t(item.text)} />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </div>
            ) : (
              <List>
                {menuItems.map((item) => (
                  <ListItem key={item.text} disablePadding>
                    <ListItemButton
                      selected={location.pathname === item.path}
                      onClick={() => {
                        navigate(item.path);
                        if (isMobile) {
                          setMobileOpen(false);
                        }
                      }}
                      sx={{ justifyContent: 'center' }}
                    >
                      <ListItemIcon sx={{ minWidth: 0 }}>
                        {item.icon}
                      </ListItemIcon>
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          // backgroundColor: 'red',
          mt: '64px',
          direction: isRtl ? 'rtl' : 'ltr',
          textAlign: isRtl ? 'right' : 'left',
          // ...(isRtl ? { mr: { sm: `${drawerWidth}px` } } : { ml: { sm: `${drawerWidth}px` } }),
          minHeight: 'calc(100vh - 64px)',
          // backgroundColor: 'background.default',
          transition: muiTheme.transitions.create(['width', 'margin'], {
            easing: muiTheme.transitions.easing.sharp,
            duration: muiTheme.transitions.duration.leavingScreen,
          }),
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default MainLayout; 