import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './styles/toast.css';
import CssBaseline from '@mui/material/CssBaseline';
import { RtlCacheProvider } from './theme/theme';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { MainLayout } from './layouts/MainLayout';
import Login from './pages/auth/Login';
import Dashboard from './pages/dashboard/Dashboard';
import Appointments from './pages/appointments/Appointments';
import Doctors from './pages/doctors/Doctors';
import Patients from './pages/patients/Patients';
import Scans from './pages/scans/Scans';
import ScanDetails from './pages/scans/ScanDetails';
import Stock from './pages/stock/Stock';
import Profile from './pages/profile/Profile';
import Settings from './pages/settings/Settings';
import PatientDetails from './pages/patients/PatientDetails';
import Radiologists from './pages/radiologists/Radiologists';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import TwoFactorAuthPage from './pages/auth/TwoFactorAuthPage';
import PrivilegeManager from './pages/admin/PrivilegeManager';
import Register from './pages/auth/Register';
import './i18n/config';
import { useTranslation } from 'react-i18next';
import BranchManager from './pages/admin/BranchManager';
import AppointmentHistory from './pages/appointments/AppointmentHistory';
import AuditLog from './pages/admin/AuditLog';
import RepresentativeManager from './pages/RepresentativeManager';
import { Box, CircularProgress } from '@mui/material';

/**
 * Protected Route component that ensures user is authenticated
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components to render
 */
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return <MainLayout>{children}</MainLayout>;
};

const SuperAdminRoute = ({ children }) => {
  const { isSuperAdmin, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated || !isSuperAdmin) {
    return <Navigate to="/dashboard" />;
  }

  return <MainLayout>{children}</MainLayout>;
};

const AppContent = () => {
  const { isRtl } = useLanguage();
  const { mode } = useTheme();
  const { i18n } = useTranslation();

  return (
    <RtlCacheProvider isRtl={isRtl}>
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/two-factor-auth" element={<TwoFactorAuthPage />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Navigate to="/dashboard" replace />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/appointments"
              element={
                <ProtectedRoute>
                  <Appointments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/appointments/:id/history"
              element={
                <ProtectedRoute>
                  <AppointmentHistory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctors"
              element={
                <ProtectedRoute>
                  <Doctors />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patients"
              element={
                <ProtectedRoute>
                  <Patients />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patients/:id"
              element={
                <ProtectedRoute>
                  <PatientDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/scans"
              element={
                <ProtectedRoute>
                  <Scans />
                </ProtectedRoute>
              }
            />
            <Route
              path="/scans/:id"
              element={
                <ProtectedRoute>
                  <ScanDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/stock"
              element={
                <ProtectedRoute>
                  <Stock />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/radiologists"
              element={
                <ProtectedRoute>
                  <Radiologists />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/privileges"
              element={
                <SuperAdminRoute>
                  <PrivilegeManager />
                </SuperAdminRoute>
              }
            />
            <Route
              path="/admin/branches"
              element={
                <ProtectedRoute>
                  <BranchManager />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/audit"
              element={
                <SuperAdminRoute>
                  <AuditLog />
                </SuperAdminRoute>
              }
            />
            <Route
              path="/admin/representatives"
              element={
                <SuperAdminRoute>
                  <RepresentativeManager />
                </SuperAdminRoute>
              }
            />
          </Routes>
        </AuthProvider>
        <ToastContainer
          position={isRtl ? 'top-left' : 'top-right'}
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={isRtl}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme={mode}
          toastClassName={isRtl ? 'toast-rtl' : ''}
          bodyClassName={isRtl ? 'toast-body-rtl' : ''}
          enableMultiContainer={false}
          limit={3}
        />
      </Router>
    </RtlCacheProvider>
  );
};

const App = () => {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <CssBaseline />
          <AppContent />
        </LocalizationProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
};

export default App; 