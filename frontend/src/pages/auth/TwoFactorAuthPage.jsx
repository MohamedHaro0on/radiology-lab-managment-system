import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useFormik } from 'formik';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  TextField,
  Typography,
  CircularProgress,
  Alert,
  Container,
  Paper,
} from '@mui/material';
import { QRCodeSVG } from 'qrcode.react';
import { authAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { twoFactorSchema } from '../../validations/schemas';
import { useAuth } from '../../context/AuthContext';

const TwoFactorAuthPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { login: completeLogin } = useAuth();

  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('verify');
  const [tempToken, setTempToken] = useState(location.state?.tempToken || '');

  useEffect(() => {
    if (mode === 'verify' && !tempToken) {
      navigate('/login');
    }
  }, [mode, tempToken, navigate]);

  const formik = useFormik({
    initialValues: {
      token: '',
    },
    validationSchema: twoFactorSchema,
    onSubmit: async (values) => {
      try {
        setLoading(true);
        setError('');

        if (mode === 'setup') {
          const setupResponse = await authAPI.setup2FA();
          setQrCode(setupResponse.data.qrCode);
          setSecret(setupResponse.data.secret);
          
          const verifyResponse = await authAPI.verify2FA(values.token);
          if (verifyResponse.data.success) {
            toast.success(t('auth.2faSetupSuccess'));
            navigate('/dashboard');
          }
        } else if (mode === 'disable') {
          const response = await authAPI.disable2FA({
            password,
            token: values.token
          });
          if (response.data.success) {
            toast.success(t('auth.2faDisableSuccess'));
            navigate('/settings');
          }
        } else {
          const response = await authAPI.verify2FA(values.token);
          if (response.data.token) {
            await completeLogin(response.data.token, response.data.user);
            toast.success(t('auth.loginSuccess'));
            navigate('/dashboard');
          } else {
            setError(t('auth.2faVerificationError'));
          }
        }
      } catch (err) {
        if (err.response?.status === 429) {
          setError(t('auth.2faRateLimitError'));
        } else {
          const backendErrorMessage = err.response?.data?.message;
          if (backendErrorMessage) {
               setError(backendErrorMessage);
          } else {
               setError(t('auth.2faVerificationError'));
          }
        }
        if (mode === 'setup' && err.response?.status !== 429) {
          setQrCode('');
          setSecret('');
        }
      } finally {
        setLoading(false);
      }
    },
  });

  useEffect(() => {
    if (mode === 'setup' && !qrCode && !secret) {
       // Optionally fetch QR code and secret here if needed for a dedicated setup entry point
       // handleSetup2FA();
    }
  }, [mode, qrCode, secret]);

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
            {mode === 'setup' 
              ? t('auth.setup2FA') 
              : mode === 'disable' 
                ? t('auth.disable2FA') 
                : t('auth.verify2FA')}
          </Typography>

          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {error}
            </Alert>
          )}

          {mode === 'setup' && qrCode && (
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {t('auth.scanQRCode')}
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                <QRCodeSVG value={qrCode} size={200} />
              </Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {t('auth.manualEntry')}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontFamily: 'monospace',
                  bgcolor: 'grey.100',
                  p: 1,
                  borderRadius: 1,
                  userSelect: 'all',
                }}
              >
                {secret}
              </Typography>
            </Box>
          )}

          {mode === 'disable' && (
            <TextField
              margin="normal"
              required
              fullWidth
              type="password"
              label={t('auth.password')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={!password && formik.submitCount > 0}
              helperText={!password && formik.submitCount > 0 ? t('auth.passwordRequired') : ''}
              disabled={loading}
            />
          )}

          <Box component="form" onSubmit={formik.handleSubmit} noValidate sx={{ mt: 1, width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="token"
              name="token"
              label={t('auth.verificationCode')}
              value={formik.values.token}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.token && Boolean(formik.errors.token)}
              helperText={formik.touched.token && formik.errors.token}
              disabled={loading}
              inputProps={{
                maxLength: 6,
                pattern: '[0-9]*',
                inputMode: 'numeric',
              }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading || (mode === 'disable' && !password)}
              startIcon={loading && <CircularProgress size={20} />}
            >
              {mode === 'setup' 
                ? t('auth.verifyAndEnable') 
                : mode === 'disable' 
                  ? t('auth.disable') 
                  : t('auth.verify')}
            </Button>
             {mode === 'verify' && !location.state?.fromLogin && (
                <Box sx={{ textAlign: 'center' }}>
                   <Button variant="text" onClick={() => navigate('/login')}>
                     {t('auth.backToLogin')}
                   </Button>
                </Box>
             )}
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default TwoFactorAuthPage; 