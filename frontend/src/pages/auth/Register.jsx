import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFormik } from 'formik';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Button,
  TextField,
  Typography,
  CircularProgress,
  Alert,
  Container,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { QRCodeSVG } from 'qrcode.react';
import { authAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { registerSchema, twoFactorSchema } from '../../validations/schemas';
import { useAuth } from '../../context/AuthContext';

const Register = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { login } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [step, setStep] = useState('register'); // 'register', 'verify2fa'
    const [otpAuthUrl, setOtpAuthUrl] = useState('');
    const [secret, setSecret] = useState('');
    const [userId, setUserId] = useState('');

    const registrationFormik = useFormik({
        initialValues: {
            username: '',
            email: '',
            password: '',
            confirmPassword: '',
            role: 'user'
        },
        validationSchema: registerSchema,
        onSubmit: async (values) => {
            setLoading(true);
            setError('');
            try {
                const response = await authAPI.register(values);
                setOtpAuthUrl(response.data.otpAuthUrl);
                setSecret(response.data.secret);
                setUserId(response.data.userId);
                setStep('verify2fa');
            } catch (err) {
                setError(err.response?.data?.message || 'Registration failed');
            } finally {
                setLoading(false);
            }
        }
    });

    const twoFaFormik = useFormik({
        initialValues: {
            token: ''
        },
        validationSchema: twoFactorSchema,
        onSubmit: async (values) => {
            setLoading(true);
            setError('');
            try {
                const response = await authAPI.verifyRegistration2FA({ userId, token: values.token });
                await login(response.data.token, response.data.user);
                toast.success('Registration and 2FA setup successful!');
                navigate('/dashboard');
            } catch (err) {
                setError(err.response?.data?.message || '2FA verification failed');
            } finally {
                setLoading(false);
            }
        }
    });

    return (
        <Container component="main" maxWidth="xs">
            <Paper elevation={3} sx={{ p: 4, mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
                    {step === 'register' ? 'Register' : 'Set up Two-Factor Authentication'}
                </Typography>
                {error && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{error}</Alert>}

                {step === 'register' ? (
                    <Box component="form" onSubmit={registrationFormik.handleSubmit} sx={{ mt: 1, width: '100%' }}>
                        {/* Registration form fields */}
                        <TextField
                            margin="normal"
                            fullWidth
                            id="username"
                            name="username"
                            label="Username"
                            autoComplete="username"
                            autoFocus
                            value={registrationFormik.values.username}
                            onChange={registrationFormik.handleChange}
                            error={registrationFormik.touched.username && Boolean(registrationFormik.errors.username)}
                            helperText={registrationFormik.touched.username && registrationFormik.errors.username}
                            disabled={loading}
                        />
                        <TextField
                            margin="normal"
                            fullWidth
                            id="email"
                            name="email"
                            label="Email Address"
                            autoComplete="email"
                            value={registrationFormik.values.email}
                            onChange={registrationFormik.handleChange}
                            error={registrationFormik.touched.email && Boolean(registrationFormik.errors.email)}
                            helperText={registrationFormik.touched.email && registrationFormik.errors.email}
                            disabled={loading}
                        />
                        <TextField
                            margin="normal"
                            fullWidth
                            name="password"
                            label="Password"
                            type="password"
                            id="password"
                            autoComplete="new-password"
                            value={registrationFormik.values.password}
                            onChange={registrationFormik.handleChange}
                            error={registrationFormik.touched.password && Boolean(registrationFormik.errors.password)}
                            helperText={registrationFormik.touched.password && registrationFormik.errors.password}
                            disabled={loading}
                        />
                        <TextField
                            margin="normal"
                            fullWidth
                            name="confirmPassword"
                            label="Confirm Password"
                            type="password"
                            id="confirmPassword"
                            autoComplete="new-password"
                            value={registrationFormik.values.confirmPassword}
                            onChange={registrationFormik.handleChange}
                            error={registrationFormik.touched.confirmPassword && Boolean(registrationFormik.errors.confirmPassword)}
                            helperText={registrationFormik.touched.confirmPassword && registrationFormik.errors.confirmPassword}
                            disabled={loading}
                        />
                        <FormControl fullWidth margin="normal">
                            <InputLabel id="user-type-label">User Type</InputLabel>
                            <Select
                                labelId="user-type-label"
                                id="user-type"
                                name="role"
                                value={registrationFormik.values.role}
                                label="User Type"
                                onChange={registrationFormik.handleChange}
                                disabled={loading}
                            >
                                <MenuItem value="user">User</MenuItem>
                                <MenuItem value="superAdmin">Super Admin</MenuItem>
                            </Select>
                        </FormControl>
                        <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }} disabled={loading}>
                            {loading ? <CircularProgress size={24} /> : 'Register'}
                        </Button>
                        <Box sx={{ textAlign: 'center', mt: 2 }}>
                            <Typography variant="body2">
                                {t('auth.hasAccount')} <Link to="/login" style={{ textDecoration: 'none', color: 'primary.main' }}>{t('auth.login')}</Link>
                            </Typography>
                        </Box>
                    </Box>
                ) : (
                    <Box component="form" onSubmit={twoFaFormik.handleSubmit} sx={{ mt: 1, width: '100%' }}>
                        <Typography variant="body1" align="center" sx={{ mb: 2 }}>
                            Scan the QR code with your authenticator app.
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                            {otpAuthUrl && <QRCodeSVG value={otpAuthUrl} size={200} />}
                        </Box>
                        <Typography variant="body2" align="center" sx={{ mb: 2 }}>
                            Or manually enter this secret:
                            <Typography component="p" sx={{ fontFamily: 'monospace', userSelect: 'all', my: 1 }}>{secret}</Typography>
                        </Typography>
                        <TextField
                            margin="normal"
                            fullWidth
                            id="token"
                            name="token"
                            label="Verification Code"
                            value={twoFaFormik.values.token}
                            onChange={twoFaFormik.handleChange}
                            error={twoFaFormik.touched.token && Boolean(twoFaFormik.errors.token)}
                            helperText={twoFaFormik.touched.token && twoFaFormik.errors.token}
                            disabled={loading}
                        />
                        <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }} disabled={loading}>
                            {loading ? <CircularProgress size={24} /> : 'Verify and Complete'}
                        </Button>
                    </Box>
                )}
            </Paper>
        </Container>
    );
};

export default Register; 