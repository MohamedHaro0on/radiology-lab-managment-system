import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useRTL } from '../../hooks/useRTL';
import { useFormik } from 'formik';
import {
  Box, Grid, Card, CardContent, CardActions, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, CircularProgress, Fab, Chip, FormControl, InputLabel, Select, MenuItem, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Person as PersonIcon } from '@mui/icons-material';
import { toast } from 'react-toastify';
import { userAPI, authAPI } from '../../services/api';
// You should define radiologistSchema in validations/schemas.js
import { radiologistSchema, registerSchema, twoFactorSchema } from '../../validations/schemas';

const Radiologists = () => {
  const { t } = useTranslation();
  const { isRTL } = useRTL();
  const [radiologists, setRadiologists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedRadiologist, setSelectedRadiologist] = useState(null);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [step, setStep] = useState('register'); // 'register', 'verify2fa', 'edit'
  const [otpAuthUrl, setOtpAuthUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [userId, setUserId] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [radiologistToDelete, setRadiologistToDelete] = useState(null);

  const editFormik = useFormik({
    initialValues: {
      username: '',
      name: '',
      gender: '',
      age: '',
      phoneNumber: '',
      licenseId: '',
      isActive: true,
    },
    validationSchema: radiologistSchema,
    onSubmit: async (values) => {
      try {
        setLoading(true);
        if (selectedRadiologist) {
          await userAPI.update(selectedRadiologist._id, values);
          toast.success(t('radiologists.updateSuccess'));
        }
        handleCloseDialog();
        fetchRadiologists();
      } catch (err) {
        toast.error(err.response?.data?.message || t('radiologists.error'));
      } finally {
        setLoading(false);
      }
    },
  });

  const registerFormik = useFormik({
    initialValues: {
      username: '',
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'radiologist'
    },
    validationSchema: registerSchema,
    onSubmit: async (values, { resetForm }) => {
      try {
        setLoading(true);
        const response = await authAPI.register(values);
        setOtpAuthUrl(response.data.otpAuthUrl);
        setSecret(response.data.secret);
        setUserId(response.data.userId);
        setStep('verify2fa');
        fetchRadiologists();
        resetForm();
      } catch (err) {
        toast.error(err.response?.data?.message || 'Registration failed');
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
      try {
        await authAPI.verifyRegistration2FA({ userId, token: values.token });
        toast.success('2FA setup successful!');
        setStep('register');
        handleCloseDialog();
      } catch (err) {
        toast.error(err.response?.data?.message || '2FA verification failed');
      } finally {
        setLoading(false);
      }
    }
  });

  const formik = isRegisterMode ? registerFormik : editFormik;

  const fetchRadiologists = async () => {
    setLoading(true);
    try {
      const response = await userAPI.getRadiologists({ page: 1, limit: 100 });
      // Safely extract the users array from the deeply nested response
      const users = response?.data?.data?.data?.users;
      const list = Array.isArray(users) ? users : [];
      setRadiologists(list);
    } catch (err) {
      setRadiologists([]); // fallback to empty array on error
    }
    setLoading(false);
  };

  useEffect(() => { fetchRadiologists(); }, []);

  const handleOpenDialog = (radiologist = null) => {
    setSelectedRadiologist(radiologist);
    if (radiologist) {
      setIsRegisterMode(false);
      editFormik.setValues(radiologist);
    } else {
      setIsRegisterMode(true);
      registerFormik.resetForm();
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedRadiologist(null);
    editFormik.resetForm();
    registerFormik.resetForm();
  };

  const handleDelete = async (radiologistId) => {
    try {
      setLoading(true);
      await userAPI.delete(radiologistId);
      toast.success(t('radiologists.deleteSuccess'));
      setDeleteConfirmOpen(false);
      setRadiologistToDelete(null);
      fetchRadiologists();
    } catch (err) {
      toast.error(err.response?.data?.message || t('radiologists.deleteError'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (radiologist) => {
    setRadiologistToDelete(radiologist);
    setDeleteConfirmOpen(true);
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          {t('radiologists.title') || 'Radiologists'}
        </Typography>
        <Fab color="primary" aria-label="add" onClick={() => handleOpenDialog()} size="medium">
          <AddIcon />
        </Fab>
      </Box>
      <Grid container spacing={3}>
        {(Array.isArray(radiologists) ? radiologists : []).map((radiologist) => (
          <Grid item xs={12} sm={6} md={4} key={radiologist?._id || radiologist?.id || Math.random()}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <PersonIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
                  <Box>
                    <Typography variant="h6" component="h2">
                      {radiologist?.name || 'N/A'}
                    </Typography>
                    <Chip
                      label={radiologist?.isActive ? t('common.active') : t('common.inactive')}
                      color={radiologist?.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </Box>
                </Box>
                
                <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }} dir={isRTL ? 'rtl' : 'ltr'}>
                  <Table size="small">
                    <TableBody>
                       {radiologist?.gender && <TableRow>
                        <TableCell component="th" sx={{ fontWeight: 'bold', width: '40%' }} align={isRTL ? 'right' : 'left'}>
                          {t('radiologists.gender')}
                        </TableCell>
                        <TableCell align={isRTL ? 'left' : 'right'}>
                          {t(`genders.${radiologist.gender}`)}
                        </TableCell>
                      </TableRow>}
                      {radiologist?.age && <TableRow>
                        <TableCell component="th" sx={{ fontWeight: 'bold' }} align={isRTL ? 'right' : 'left'}>
                          {t('radiologists.age')}
                        </TableCell>
                        <TableCell align={isRTL ? 'left' : 'right'}>
                          {radiologist.age} {t('patients.years')}
                        </TableCell>
                      </TableRow>}
                      {radiologist?.phoneNumber && <TableRow>
                        <TableCell component="th" sx={{ fontWeight: 'bold' }} align={isRTL ? 'right' : 'left'}>
                          {t('radiologists.phoneNumber')}
                        </TableCell>
                        <TableCell align={isRTL ? 'left' : 'right'}>
                          {radiologist.phoneNumber}
                        </TableCell>
                      </TableRow>}
                      {radiologist?.licenseId && <TableRow>
                        <TableCell component="th" sx={{ fontWeight: 'bold' }} align={isRTL ? 'right' : 'left'}>
                          {t('radiologists.licenseId')}
                        </TableCell>
                        <TableCell align={isRTL ? 'left' : 'right'}>
                          {radiologist.licenseId}
                        </TableCell>
                      </TableRow>}
                      {radiologist?.totalScansPerformed !== undefined && (
                        <TableRow>
                          <TableCell component="th" sx={{ fontWeight: 'bold' }} align={isRTL ? 'right' : 'left'}>
                            {t('radiologists.totalScans')}
                          </TableCell>
                          <TableCell align={isRTL ? 'left' : 'right'}>
                            {radiologist.totalScansPerformed}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
              <CardActions>
                <Button size="small" startIcon={<EditIcon />} onClick={() => handleOpenDialog(radiologist)}>
                  {t('common.edit')}
                </Button>
                <Button size="small" color="error" startIcon={<DeleteIcon />} onClick={() => handleDeleteClick(radiologist)}>
                  {t('common.delete')}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{isRegisterMode ? (step === 'verify2fa' ? 'Verify 2FA' : 'Register New Radiologist') : t('radiologists.editTitle')}</DialogTitle>
        <DialogContent>
          {isRegisterMode ? (
            step === 'verify2fa' ? (
              <Box component="form" onSubmit={twoFaFormik.handleSubmit} sx={{ mt: 2 }}>
                <Typography variant="body1" align="center" sx={{ mb: 2 }}>
                  Scan the QR code with your authenticator app.
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                  {otpAuthUrl && <img src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(otpAuthUrl)}&size=200x200`} alt="2FA QR Code" />}
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
                <DialogActions>
                  <Button onClick={handleCloseDialog}>{t('common.cancel')}</Button>
                  <Button type="submit" variant="contained" disabled={loading}>
                    {loading ? <CircularProgress size={24} /> : 'Verify and Complete'}
                  </Button>
                </DialogActions>
              </Box>
            ) : (
              <Box component="form" onSubmit={registerFormik.handleSubmit} sx={{ mt: 2 }}>
                <TextField
                  fullWidth
                  label="Full Name"
                  name="name"
                  value={registerFormik.values.name}
                  onChange={registerFormik.handleChange}
                  onBlur={registerFormik.handleBlur}
                  error={registerFormik.touched.name && Boolean(registerFormik.errors.name)}
                  helperText={registerFormik.touched.name && registerFormik.errors.name}
                  required
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Username"
                  name="username"
                  value={registerFormik.values.username}
                  onChange={registerFormik.handleChange}
                  onBlur={registerFormik.handleBlur}
                  error={registerFormik.touched.username && Boolean(registerFormik.errors.username)}
                  helperText={registerFormik.touched.username && registerFormik.errors.username}
                  required
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={registerFormik.values.email}
                  onChange={registerFormik.handleChange}
                  onBlur={registerFormik.handleBlur}
                  error={registerFormik.touched.email && Boolean(registerFormik.errors.email)}
                  helperText={registerFormik.touched.email && registerFormik.errors.email}
                  required
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Password"
                  name="password"
                  type="password"
                  value={registerFormik.values.password}
                  onChange={registerFormik.handleChange}
                  onBlur={registerFormik.handleBlur}
                  error={registerFormik.touched.password && Boolean(registerFormik.errors.password)}
                  helperText={registerFormik.touched.password && registerFormik.errors.password}
                  required
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Confirm Password"
                  name="confirmPassword"
                  type="password"
                  value={registerFormik.values.confirmPassword}
                  onChange={registerFormik.handleChange}
                  onBlur={registerFormik.handleBlur}
                  error={registerFormik.touched.confirmPassword && Boolean(registerFormik.errors.confirmPassword)}
                  helperText={registerFormik.touched.confirmPassword && registerFormik.errors.confirmPassword}
                  required
                  sx={{ mb: 2 }}
                />
                <DialogActions>
                  <Button onClick={handleCloseDialog}>{t('common.cancel')}</Button>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={loading}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Register'}
                  </Button>
                </DialogActions>
              </Box>
            )
          ) : (
            <Box component="form" onSubmit={editFormik.handleSubmit} sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label={t('radiologists.name') || 'Name'}
                name="name"
                value={editFormik.values.name}
                onChange={editFormik.handleChange}
                onBlur={editFormik.handleBlur}
                error={editFormik.touched.name && Boolean(editFormik.errors.name)}
                helperText={editFormik.touched.name && editFormik.errors.name}
                required
                sx={{ mb: 2 }}
              />
              <FormControl fullWidth error={editFormik.touched.gender && Boolean(editFormik.errors.gender)} sx={{ mb: 2 }}>
                <InputLabel>{t('radiologists.gender') || 'Gender'}</InputLabel>
                <Select
                  name="gender"
                  value={editFormik.values.gender}
                  onChange={editFormik.handleChange}
                  onBlur={editFormik.handleBlur}
                  label={t('radiologists.gender') || 'Gender'}
                >
                  <MenuItem value="male">{t('genders.male')}</MenuItem>
                  <MenuItem value="female">{t('genders.female')}</MenuItem>
                  <MenuItem value="other">{t('genders.other')}</MenuItem>
                </Select>
                {editFormik.touched.gender && editFormik.errors.gender && (
                  <Typography color="error" variant="caption">
                    {editFormik.errors.gender}
                  </Typography>
                )}
              </FormControl>
              <TextField
                fullWidth
                label={t('radiologists.age') || 'Age'}
                name="age"
                type="number"
                value={editFormik.values.age}
                onChange={editFormik.handleChange}
                onBlur={editFormik.handleBlur}
                error={editFormik.touched.age && Boolean(editFormik.errors.age)}
                helperText={editFormik.touched.age && editFormik.errors.age}
                required
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label={t('radiologists.phoneNumber') || 'Phone Number'}
                name="phoneNumber"
                value={editFormik.values.phoneNumber}
                onChange={editFormik.handleChange}
                onBlur={editFormik.handleBlur}
                error={editFormik.touched.phoneNumber && Boolean(editFormik.errors.phoneNumber)}
                helperText={editFormik.touched.phoneNumber && editFormik.errors.phoneNumber}
                required
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label={t('radiologists.licenseId') || 'License ID'}
                name="licenseId"
                value={editFormik.values.licenseId}
                onChange={editFormik.handleChange}
                onBlur={editFormik.handleBlur}
                error={editFormik.touched.licenseId && Boolean(editFormik.errors.licenseId)}
                helperText={editFormik.touched.licenseId && editFormik.errors.licenseId}
                required
                sx={{ mb: 2 }}
              />
              <DialogActions>
                <Button onClick={handleCloseDialog}>{t('common.cancel')}</Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : t('common.update')}
                </Button>
              </DialogActions>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>{t('radiologists.deleteConfirmTitle') || 'Delete Radiologist'}</DialogTitle>
        <DialogContent>
          <Typography>
            {t('radiologists.deleteConfirmMessage') || 'Are you sure you want to delete this radiologist?'}
            {radiologistToDelete && (
              <Typography component="span" fontWeight="bold">
                {' '}{radiologistToDelete.name}?
              </Typography>
            )}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>
            {t('common.cancel') || 'Cancel'}
          </Button>
          <Button 
            color="error" 
            onClick={() => handleDelete(radiologistToDelete._id)}
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} /> : (t('common.delete') || 'Delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Radiologists; 