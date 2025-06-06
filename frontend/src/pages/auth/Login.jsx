import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Link,
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
      email: '',
      password: '',
    },
    validationSchema: loginSchema,
    onSubmit: async (values) => {
      try {
        setLoading(true);
        setError('');

        const response = await authAPI.login(values);
        
        // Check if 2FA is required
        if (response.data.requires2FA) {
          navigate('/two-factor-auth', { state: { tempToken: response.data.tempToken } });
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
      }
    },
  });

  const handleLoginSuccess = async (data) => {
    try {
      await login(data.token, data.user);
      toast.success(t('auth.loginSuccess'));
      navigate('/dashboard');
    } catch (err) {
      setError(t('auth.loginError'));
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

          <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 1, width: '100%' }}>
            <TextField
              margin="normal"
              fullWidth
              id="email"
              name="email"
              label={t('auth.email')}
              autoComplete="email"
              autoFocus
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.email && Boolean(formik.errors.email)}
              helperText={formik.touched.email && formik.errors.email}
              disabled={loading}
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
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : t('auth.login')}
            </Button>
            <Box sx={{ textAlign: 'center' }}>
              <Link href="/forgot-password" variant="body2">
                {t('auth.forgotPassword')}
              </Link>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login; 