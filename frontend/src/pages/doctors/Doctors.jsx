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
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
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
      name: '',
      specialization: '',
      licenseNumber: '',
      contactNumber: '',
      address: {
        street: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'Egypt',
      },
      active: true,
    },
    validationSchema: doctorSchema,
    onSubmit: async (values) => {
      console.log('🚀 Doctor formik onSubmit triggered with values:', values);
      console.log('🔍 Form validation errors:', formik.errors);
      console.log('🔍 Form touched fields:', formik.touched);
      
      try {
        setLoading(true);
        console.log('📝 Preparing doctor submit data...');

        // Map frontend fields to backend schema
        const backendDoctor = {
          name: values.name,
          specialization: values.specialization,
          licenseNumber: values.licenseNumber,
          contactNumber: values.contactNumber,
          address: values.address,
          experience: 0, // Default experience
          isActive: values.active ?? true,
        };

        console.log('📤 Final doctor submit data:', backendDoctor);
        console.log('🎯 Selected doctor for update:', selectedDoctor);

        if (selectedDoctor) {
          console.log('🔄 Updating doctor:', selectedDoctor._id);
          await doctorAPI.update(selectedDoctor._id, backendDoctor);
          toast.success(t('doctors.updateSuccess'));
        } else {
          console.log('➕ Creating new doctor...');
          const response = await doctorAPI.create(backendDoctor);
          console.log('✅ Doctor creation response:', response);
          toast.success(t('doctors.createSuccess'));
        }
        console.log('✅ Doctor API call successful, closing dialog and refreshing data...');
        handleCloseDialog();
        fetchDoctors();
      } catch (err) {
        console.error('❌ Doctor creation/update error:', err);
        console.error('❌ Error response:', err.response);
        console.error('❌ Error data:', err.response?.data);
        
        // Enhanced error handling with more informative messages
        let errorMessage = t('doctors.error');
        
        if (err.response?.data) {
          const errorData = err.response.data;
          
          // Handle validation errors from backend
          if (errorData.errors && Array.isArray(errorData.errors)) {
            const validationErrors = errorData.errors.map(err => err.message).join(', ');
            errorMessage = `Validation errors: ${validationErrors}`;
            
            // Set formik errors for display under inputs
            const formikErrors = {};
            errorData.errors.forEach(error => {
              if (error.field) {
                formikErrors[error.field] = error.message;
              }
            });
            formik.setErrors(formikErrors);
          }
          // Handle specific error messages
          else if (errorData.message) {
            errorMessage = errorData.message;
          }
          // Handle conflict errors (duplicate doctor)
          else if (errorData.status === 'error' && errorData.message) {
            errorMessage = errorData.message;
          }
        } else if (err.message) {
          errorMessage = err.message;
        }
        
        toast.error(`Failed to ${selectedDoctor ? 'update' : 'create'} doctor: ${errorMessage}`);
      } finally {
        setLoading(false);
        console.log('🏁 Doctor form submission completed');
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
      setDoctors(response.data.data.doctors || []);
      setTotal(response.data.data.pagination?.total || 0);
    } catch (err) {
      console.error('❌ fetchDoctors error:', err);
      let errorMessage = t('doctors.fetchError');
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      toast.error(`Failed to fetch doctors: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    setPage(0);
  };

  const handleOpenDialog = (doctor = null) => {
    console.log('🚪 Doctor handleOpenDialog called with doctor:', doctor);
    if (doctor) {
      console.log('✏️ Editing existing doctor:', doctor);
      setSelectedDoctor(doctor);
      formik.setValues({
        name: doctor.name || '',
        specialization: doctor.specialization || '',
        licenseNumber: doctor.licenseNumber || '',
        contactNumber: doctor.contactNumber || '',
        address: doctor.address || {
          street: '',
          city: '',
          state: '',
          postalCode: '',
          country: 'Egypt',
        },
        active: doctor.isActive ?? true,
      });
      console.log('📝 Form values set for editing:', formik.values);
    } else {
      console.log('➕ Creating new doctor');
      setSelectedDoctor(null);
      formik.resetForm();
      console.log('📝 Form reset for new doctor');
    }
    setOpenDialog(true);
    console.log('🚪 Dialog opened');
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
      console.error('❌ Doctor delete error:', err);
      let errorMessage = t('doctors.deleteError');
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      toast.error(`Failed to delete doctor: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !(doctors && doctors.length)) {
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
          onClick={() => {
            console.log('🔘 Add doctor FAB button clicked');
            handleOpenDialog();
          }}
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

      {!doctors || doctors.length === 0 ? (
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
                        {`Dr. ${doctor.name}`}
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
                      label={doctor.isActive ? t('doctors.active') : t('doctors.inactive')}
                      color={doctor.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </Box>
                  
                  <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
                    <Table size="small">
                      <TableBody>
                        {doctor.licenseNumber && (
                          <TableRow>
                            <TableCell component="th" sx={{ fontWeight: 'bold', width: '40%' }}>
                              {t('doctors.license')}
                            </TableCell>
                            <TableCell>
                              {doctor.licenseNumber}
                            </TableCell>
                          </TableRow>
                        )}
                        <TableRow>
                          <TableCell component="th" sx={{ fontWeight: 'bold' }}>
                            {t('doctors.phone')}
                          </TableCell>
                          <TableCell>
                            {doctor.contactNumber}
                          </TableCell>
                        </TableRow>
                        {doctor.email && (
                          <TableRow>
                            <TableCell component="th" sx={{ fontWeight: 'bold' }}>
                              {t('doctors.email')}
                            </TableCell>
                            <TableCell>
                              {doctor.email}
                            </TableCell>
                          </TableRow>
                        )}
                        {doctor.address?.city && (
                          <TableRow>
                            <TableCell component="th" sx={{ fontWeight: 'bold' }}>
                              {t('doctors.address')}
                            </TableCell>
                            <TableCell>
                              {`${doctor.address.city}, ${doctor.address.state}`}
                            </TableCell>
                          </TableRow>
                        )}
                        {typeof doctor.totalPatientsReferred === 'number' && (
                          <TableRow>
                            <TableCell component="th" sx={{ fontWeight: 'bold' }}>
                              Patients Referred
                            </TableCell>
                            <TableCell>
                              {doctor.totalPatientsReferred}
                            </TableCell>
                          </TableRow>
                        )}
                        {typeof doctor.totalScansReferred === 'number' && (
                          <TableRow>
                            <TableCell component="th" sx={{ fontWeight: 'bold' }}>
                              Scans Referred
                            </TableCell>
                            <TableCell>
                              {doctor.totalScansReferred}
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
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
          <Box component="form" id="doctor-form" onSubmit={(e) => {
            console.log('📋 Doctor form onSubmit event triggered');
            console.log('🛑 Preventing default behavior...');
            e.preventDefault();
            e.stopPropagation();
            console.log('🔄 Calling formik.handleSubmit...');
            formik.handleSubmit(e);
          }} noValidate sx={{ mt: 2 }}>
            
            {/* General error display */}
            {Object.keys(formik.errors).length > 0 && (
              <Alert severity="error" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  Please fix the following errors:
                </Typography>
                <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                  {Object.entries(formik.errors).map(([field, error]) => (
                    <li key={field}>
                      <Typography variant="body2">
                        <strong>{field}:</strong> {error}
                      </Typography>
                    </li>
                  ))}
                </ul>
              </Alert>
            )}
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={t('doctors.name')}
                  name="name"
                  value={formik.values.name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.name && Boolean(formik.errors.name)}
                  helperText={formik.touched.name && formik.errors.name}
                  required
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
                  required
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
                  name="contactNumber"
                  value={formik.values.contactNumber}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.contactNumber && Boolean(formik.errors.contactNumber)}
                  helperText={formik.touched.contactNumber && formik.errors.contactNumber}
                  required
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
                  error={formik.touched['address.street'] && Boolean(formik.errors['address.street'])}
                  helperText={formik.touched['address.street'] && formik.errors['address.street']}
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
                  error={formik.touched['address.city'] && Boolean(formik.errors['address.city'])}
                  helperText={formik.touched['address.city'] && formik.errors['address.city']}
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
                  error={formik.touched['address.state'] && Boolean(formik.errors['address.state'])}
                  helperText={formik.touched['address.state'] && formik.errors['address.state']}
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
                  error={formik.touched['address.postalCode'] && Boolean(formik.errors['address.postalCode'])}
                  helperText={formik.touched['address.postalCode'] && formik.errors['address.postalCode']}
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
                  error={formik.touched['address.country'] && Boolean(formik.errors['address.country'])}
                  helperText={formik.touched['address.country'] && formik.errors['address.country']}
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
            type="submit"
            form="doctor-form"
            variant="contained"
            disabled={loading}
            startIcon={loading && <CircularProgress size={20} />}
            onClick={(e) => {
              console.log('🔘 Doctor submit button clicked');
              console.log('🔍 Button event:', e);
              console.log('🔍 Form values:', formik.values);
              console.log('🔍 Form errors:', formik.errors);
              console.log('🔍 Form is valid:', formik.isValid);
              console.log('🔍 Form is dirty:', formik.dirty);
              console.log('🔍 Form ID:', e.target.form?.id);
              console.log('🔍 Form element:', document.getElementById('doctor-form'));
            }}
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