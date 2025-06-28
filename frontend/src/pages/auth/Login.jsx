import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useFormik } from 'formik';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  CircularProgress,
  Alert,
} from '@mui/material';
import { authAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { loginSchema } from '../../validations/schemas';
import { toast } from 'react-toastify';

/**
 * Login component for user authentication
 * @returns {JSX.Element} Login form component
 */
const Login = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const formik = useFormik({
    initialValues: {
      username: '',
      password: '',
    },
    validationSchema: loginSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        setLoading(true);
        setError('');

        // Debug logging
        console.log('=== FRONTEND LOGIN DEBUG ===');
        console.log('Form values:', values);
        console.log('Username:', values.username, 'Type:', typeof values.username);
        console.log('Password:', values.password, 'Type:', typeof values.password);
        console.log('==========================');

        const response = await authAPI.login(values);
        
        // Check if 2FA is required
        if (response.data.twoFactorRequired) {
          navigate('/two-factor-auth', { state: { twoFactorToken: response.data.twoFactorToken } });
        } else {
          // Regular login without 2FA
          await handleLoginSuccess(response.data);
        }
      } catch (err) {
        // Handle rate limiting error
        if (err.response?.status === 429) {
          setError(t('auth.rateLimitError'));
        } else {
          setError(err.response?.data?.message || t('auth.loginError'));
        }
      } finally {
        setLoading(false);
        setSubmitting(false);
      }
    },
  });

  const handleLoginSuccess = async (data) => {
    try {
      console.log('Login: Received data from API:', data);
      console.log('Login: User data:', data.user);
      console.log('Login: User role:', data.user?.role);
      await login(data.token, data.user);
      toast.success(t('auth.loginSuccess'));
      navigate('/dashboard');
    } catch (err) {
      setError(t('auth.loginError'));
    }
  };

  const handleLoginClick = async () => {
    console.log('=== LOGIN CLICK STARTED ===');
    console.log('Loading state:', loading);
    console.log('Formik submitting state:', formik.isSubmitting);
    
    if (loading || formik.isSubmitting) {
      console.log('Login blocked - already loading or submitting');
      return;
    }
    
    // Validate form first
    const errors = await formik.validateForm();
    console.log('Form validation errors:', errors);
    if (Object.keys(errors).length > 0) {
      formik.setTouched(errors);
      console.log('Login blocked - form validation failed');
      return;
    }
    
    console.log('Starting login process...');
    
    try {
      setLoading(true);
      setError('');

      // Debug logging
      console.log('=== FRONTEND LOGIN DEBUG ===');
      console.log('Form values:', formik.values);
      console.log('Username:', formik.values.username, 'Type:', typeof formik.values.username);
      console.log('Password:', formik.values.password, 'Type:', typeof formik.values.password);
      console.log('==========================');

      // Only send username and password to backend
      const loginData = {
        username: formik.values.username,
        password: formik.values.password
      };
      
      console.log('Sending to API:', loginData);
      const response = await authAPI.login(loginData);
      console.log('Login API response:', response);
      
      // Check if 2FA is required
      if (response.data.twoFactorRequired) {
        console.log('2FA required, navigating to 2FA page');
        navigate('/two-factor-auth', { state: { twoFactorToken: response.data.twoFactorToken } });
      } else {
        // Regular login without 2FA
        console.log('Regular login, calling handleLoginSuccess');
        await handleLoginSuccess(response.data);
      }
    } catch (err) {
      console.error('Login error:', err);
      // Handle rate limiting error
      if (err.response?.status === 429) {
        setError(t('auth.rateLimitError'));
      } else {
        setError(err.response?.data?.message || t('auth.loginError'));
      }
    } finally {
      console.log('Login process finished, setting loading to false');
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
            {t('common.appName')}
          </Typography>
          <Typography component="h2" variant="h6" sx={{ mb: 3 }}>
            {t('auth.login')}
          </Typography>

          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ mt: 1, width: '100%' }}>
            <TextField
              margin="normal"
              fullWidth
              id="username"
              name="username"
              label={t('auth.username')}
              autoComplete="username"
              autoFocus
              value={formik.values.username}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.username && Boolean(formik.errors.username)}
              helperText={formik.touched.username && formik.errors.username}
              disabled={loading}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleLoginClick();
                }
              }}
            />
            <TextField
              margin="normal"
              fullWidth
              name="password"
              label={t('auth.password')}
              type="password"
              id="password"
              autoComplete="current-password"
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.password && Boolean(formik.errors.password)}
              helperText={formik.touched.password && formik.errors.password}
              disabled={loading}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleLoginClick();
                }
              }}
            />
            <Button
              type="button"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading || formik.isSubmitting}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleLoginClick();
              }}
            >
              {loading ? <CircularProgress size={24} /> : t('auth.login')}
            </Button>
            <Box sx={{ textAlign: 'center' }}>
              <Link to="/forgot-password" variant="body2">
                {t('auth.forgotPassword')}
              </Link>
            </Box>
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography variant="body2">
                {t('auth.noAccount')} <Link to="/register" style={{ textDecoration: 'none', color: 'primary.main' }}>{t('auth.register')}</Link>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login; 