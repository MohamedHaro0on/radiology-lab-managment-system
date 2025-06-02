import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFormik } from 'formik';
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import { QRCodeSVG } from 'qrcode.react';
import { authAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { twoFactorSchema } from '../../validations/schemas';

const TwoFactorAuth = ({ open, onClose, onSuccess, mode = 'verify' }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');

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
          // First, enable 2FA with password
          const setupResponse = await authAPI.setup2FA();
          setQrCode(setupResponse.data.qrCode);
          setSecret(setupResponse.data.secret);
          
          // Then verify the token
          const verifyResponse = await authAPI.verify2FA(values.token);
          if (verifyResponse.data.success) {
            toast.success(t('auth.2faSetupSuccess'));
            onSuccess();
          }
        } else if (mode === 'disable') {
          // Disable 2FA requires both password and token
          const response = await authAPI.disable2FA({
            password,
            token: values.token
          });
          if (response.data.success) {
            toast.success(t('auth.2faDisableSuccess'));
            onSuccess();
          }
        } else {
          // Regular verification
          const response = await authAPI.verify2FA(values.token);
          if (response.data.success) {
            onSuccess();
          }
        }
      } catch (err) {
        // Handle rate limiting error
        if (err.response?.status === 429) {
          setError(t('auth.2faRateLimitError'));
        } else {
          setError(err.response?.data?.message || t('auth.2faVerificationError'));
        }
        // If setup fails, reset QR code and secret
        if (mode === 'setup' && err.response?.status !== 429) {
          setQrCode('');
          setSecret('');
        }
      } finally {
        setLoading(false);
      }
    },
  });

  const handleSetup2FA = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await authAPI.setup2FA();
      setQrCode(response.data.qrCode);
      setSecret(response.data.secret);
    } catch (err) {
      setError(err.response?.data?.message || t('auth.2faSetupError'));
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (open && mode === 'setup') {
      handleSetup2FA();
    }
  }, [open, mode]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {mode === 'setup' 
          ? t('auth.setup2FA') 
          : mode === 'disable' 
            ? t('auth.disable2FA') 
            : t('auth.verify2FA')}
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
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

        <Box component="form" onSubmit={formik.handleSubmit} noValidate>
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
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          {t('common.cancel')}
        </Button>
        <Button
          onClick={formik.handleSubmit}
          variant="contained"
          disabled={loading || (mode === 'disable' && !password)}
          startIcon={loading && <CircularProgress size={20} />}
        >
          {mode === 'setup' 
            ? t('auth.verifyAndEnable') 
            : mode === 'disable' 
              ? t('auth.disable') 
              : t('auth.verify')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TwoFactorAuth; 