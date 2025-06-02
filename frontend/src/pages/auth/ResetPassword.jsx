import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFormik } from 'formik';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  CircularProgress,
  Alert,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { authAPI } from '../../services/api';
import { resetPasswordSchema } from '../../validations/schemas';
import { toast } from 'react-toastify';

const ResetPassword = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const token = searchParams.get('token');

  const formik = useFormik({
    initialValues: {
      password: '',
      confirmPassword: '',
    },
    validationSchema: resetPasswordSchema,
    validateOnChange: true,
    validateOnBlur: true,
    validateOnMount: false,
    onSubmit: async (values) => {
      if (!token) {
        setError(t('auth.invalidResetToken'));
        return;
      }

      try {
        setLoading(true);
        setError('');
        await authAPI.resetPassword(token, values.password);
        toast.success(t('auth.passwordResetSuccess'));
        navigate('/login');
      } catch (err) {
        setError(err.response?.data?.message || t('auth.passwordResetError'));
      } finally {
        setLoading(false);
      }
    },
  });

  // Reset validation for confirm password when password changes
  React.useEffect(() => {
    if (formik.values.password !== formik.values.confirmPassword) {
      formik.setFieldTouched('confirmPassword', false);
    }
  }, [formik.values.password]);

  // Handle password field change with validation reset
  const handlePasswordChange = (e) => {
    const { value } = e.target;
    formik.setFieldValue('password', value);
    
    // Reset confirm password if it doesn't match
    if (value !== formik.values.confirmPassword) {
      formik.setFieldValue('confirmPassword', '');
    }
  };

  // Handle confirm password field change
  const handleConfirmPasswordChange = (e) => {
    const { value } = e.target;
    formik.setFieldValue('confirmPassword', value);
  };

  const handleClickShowPassword = () => {
    setShowPassword((show) => !show);
  };

  const handleClickShowConfirmPassword = () => {
    setShowConfirmPassword((show) => !show);
  };

  if (!token) {
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
            <Alert severity="error" sx={{ width: '100%' }}>
              {t('auth.invalidResetToken')}
            </Alert>
            <Button
              variant="contained"
              sx={{ mt: 3 }}
              onClick={() => navigate('/forgot-password')}
            >
              {t('auth.backToForgotPassword')}
            </Button>
          </Paper>
        </Box>
      </Container>
    );
  }

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
          <Typography component="h1" variant="h5" gutterBottom>
            {t('auth.resetPassword')}
          </Typography>

          {/* Temporarily display token for debugging */}
          <Alert severity="info" sx={{ width: '100%', mb: 2 }}>
            Token: {token || 'No token found'}
          </Alert>

          {/* Removed temporary Formik errors display */}

          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {/* Changed back to just show the error */} {error}
            </Alert>
          )}

          <Box component="form" onSubmit={formik.handleSubmit} sx={{ width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label={t('auth.newPassword')}
              type={showPassword ? 'text' : 'password'}
              id="password"
              value={formik.values.password}
              onChange={handlePasswordChange}
              onBlur={formik.handleBlur}
              error={formik.touched.password && Boolean(formik.errors.password)}
              helperText={formik.touched.password && formik.errors.password}
              disabled={loading}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleClickShowPassword}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label={t('auth.confirmPassword')}
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              value={formik.values.confirmPassword}
              onChange={handleConfirmPasswordChange}
              onBlur={formik.handleBlur}
              error={formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword)}
              helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
              disabled={loading}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle confirm password visibility"
                      onClick={handleClickShowConfirmPassword}
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
              startIcon={loading && <CircularProgress size={20} />}
            >
              {t('auth.resetPassword')}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default ResetPassword; 