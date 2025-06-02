import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useFormik } from 'formik';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Fab,
  Chip,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Work as WorkIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { doctorAPI } from '../../services/api';
import { doctorSchema } from '../../validations/schemas';
import SearchBar from '../../components/common/SearchBar';
import NoContent from '../../components/common/NoContent';
import ConfirmDialog from '../../components/common/ConfirmDialog';

/**
 * Doctors component for managing doctors
 */
const Doctors = () => {
  const { t } = useTranslation();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [openConfirm, setOpenConfirm] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const formik = useFormik({
    initialValues: {
      firstName: '',
      lastName: '',
      specialization: '',
      licenseNumber: '',
      phoneNumber: '',
      email: '',
      address: {
        street: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'India',
      },
      qualifications: [],
      active: true,
    },
    validationSchema: doctorSchema,
    onSubmit: async (values) => {
      try {
        setLoading(true);
        if (selectedDoctor) {
          await doctorAPI.update(selectedDoctor._id, values);
          toast.success(t('doctors.updateSuccess'));
        } else {
          await doctorAPI.create(values);
          toast.success(t('doctors.createSuccess'));
        }
        handleCloseDialog();
        fetchDoctors();
      } catch (err) {
        toast.error(err.response?.data?.message || t('doctors.error'));
      } finally {
        setLoading(false);
      }
    },
  });

  useEffect(() => {
    fetchDoctors();
  }, [page, rowsPerPage, searchQuery]);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const response = await doctorAPI.getAll({
        page: page + 1,
        limit: rowsPerPage,
        search: searchQuery,
      });
      setDoctors(response.data.doctors);
      setTotal(response.data.total);
    } catch (err) {
      toast.error(t('doctors.fetchError'));
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    setPage(0);
  };

  const handleOpenDialog = (doctor = null) => {
    if (doctor) {
      setSelectedDoctor(doctor);
      formik.setValues(doctor);
    } else {
      setSelectedDoctor(null);
      formik.resetForm();
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedDoctor(null);
    formik.resetForm();
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      await doctorAPI.delete(selectedDoctor._id);
      toast.success(t('doctors.deleteSuccess'));
      setOpenConfirm(false);
      fetchDoctors();
    } catch (err) {
      toast.error(err.response?.data?.message || t('doctors.deleteError'));
    } finally {
      setLoading(false);
    }
  };

  if (loading && !doctors.length) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          {t('doctors.title')}
        </Typography>
        <Fab
          color="primary"
          aria-label="add"
          onClick={() => handleOpenDialog()}
          size="medium"
        >
          <AddIcon />
        </Fab>
      </Box>

      <SearchBar
        onSearch={handleSearch}
        loading={searchLoading}
        placeholder={t('doctors.searchPlaceholder')}
      />

      {doctors.length === 0 ? (
        <NoContent message={t('doctors.noDoctorsFound')} />
      ) : (
        <Grid container spacing={3}>
          {doctors.map((doctor) => (
            <Grid item xs={12} sm={6} md={4} key={doctor._id}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    <PersonIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
                    <Box>
                      <Typography variant="h6" component="h2">
                        {`Dr. ${doctor.firstName} ${doctor.lastName}`}
                      </Typography>
                      <Box display="flex" alignItems="center" gap={1}>
                        <WorkIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="textSecondary">
                          {doctor.specialization}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                  <Box mb={2}>
                    <Chip
                      label={doctor.active ? t('doctors.active') : t('doctors.inactive')}
                      color={doctor.active ? 'success' : 'default'}
                      size="small"
                    />
                  </Box>
                  <Typography variant="body2" color="textSecondary" paragraph>
                    {t('doctors.license')}: {doctor.licenseNumber}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" paragraph>
                    {t('doctors.phone')}: {doctor.phoneNumber}
                  </Typography>
                  {doctor.email && (
                    <Typography variant="body2" color="textSecondary" paragraph>
                      {t('doctors.email')}: {doctor.email}
                    </Typography>
                  )}
                  {doctor.address?.city && (
                    <Typography variant="body2" color="textSecondary" noWrap>
                      {t('doctors.address')}: {`${doctor.address.city}, ${doctor.address.state}`}
                    </Typography>
                  )}
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={() => handleOpenDialog(doctor)}
                  >
                    {t('common.edit')}
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => {
                      setSelectedDoctor(doctor);
                      setOpenConfirm(true);
                    }}
                  >
                    {t('common.delete')}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedDoctor ? t('doctors.editDoctor') : t('doctors.addDoctor')}
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('doctors.firstName')}
                  name="firstName"
                  value={formik.values.firstName}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.firstName && Boolean(formik.errors.firstName)}
                  helperText={formik.touched.firstName && formik.errors.firstName}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('doctors.lastName')}
                  name="lastName"
                  value={formik.values.lastName}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.lastName && Boolean(formik.errors.lastName)}
                  helperText={formik.touched.lastName && formik.errors.lastName}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('doctors.specialization')}
                  name="specialization"
                  value={formik.values.specialization}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.specialization && Boolean(formik.errors.specialization)}
                  helperText={formik.touched.specialization && formik.errors.specialization}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('doctors.licenseNumber')}
                  name="licenseNumber"
                  value={formik.values.licenseNumber}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.licenseNumber && Boolean(formik.errors.licenseNumber)}
                  helperText={formik.touched.licenseNumber && formik.errors.licenseNumber}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('doctors.phoneNumber')}
                  name="phoneNumber"
                  value={formik.values.phoneNumber}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.phoneNumber && Boolean(formik.errors.phoneNumber)}
                  helperText={formik.touched.phoneNumber && formik.errors.phoneNumber}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('doctors.email')}
                  name="email"
                  type="email"
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.email && Boolean(formik.errors.email)}
                  helperText={formik.touched.email && formik.errors.email}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  {t('doctors.address')}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={t('doctors.address.street')}
                  name="address.street"
                  value={formik.values.address.street}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('doctors.address.city')}
                  name="address.city"
                  value={formik.values.address.city}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('doctors.address.state')}
                  name="address.state"
                  value={formik.values.address.state}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('doctors.address.postalCode')}
                  name="address.postalCode"
                  value={formik.values.address.postalCode}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('doctors.address.country')}
                  name="address.country"
                  value={formik.values.address.country}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={t('doctors.qualifications')}
                  name="qualifications"
                  value={formik.values.qualifications.join(', ')}
                  onChange={(e) => {
                    const qualifications = e.target.value.split(',').map(q => q.trim());
                    formik.setFieldValue('qualifications', qualifications);
                  }}
                  onBlur={formik.handleBlur}
                  helperText={t('doctors.qualificationsHelp')}
                  multiline
                  rows={2}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formik.values.active}
                      onChange={(e) => formik.setFieldValue('active', e.target.checked)}
                      name="active"
                    />
                  }
                  label={t('doctors.active')}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>{t('common.cancel')}</Button>
          <Button
            onClick={formik.handleSubmit}
            variant="contained"
            disabled={loading}
            startIcon={loading && <CircularProgress size={20} />}
          >
            {selectedDoctor ? t('common.update') : t('common.create')}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={openConfirm}
        title={t('doctors.deleteConfirmTitle')}
        message={t('doctors.deleteConfirmMessage')}
        onConfirm={handleDelete}
        onCancel={() => setOpenConfirm(false)}
        loading={loading}
      />
    </Box>
  );
};

export default Doctors; 