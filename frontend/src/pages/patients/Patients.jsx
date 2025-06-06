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
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { patientAPI } from '../../services/api';
import { patientSchema } from '../../validations/schemas';
import SearchBar from '../../components/common/SearchBar';
import NoContent from '../../components/common/NoContent';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import DoctorSearchAndRegister from '../../components/doctors/DoctorSearchAndRegister';

/**
 * Patients component for managing patients
 */
const Patients = () => {
  const { t } = useTranslation();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [openConfirm, setOpenConfirm] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const formik = useFormik({
    initialValues: {
      firstName: '',
      lastName: '',
      dateOfBirth: null,
      gender: '',
      phoneNumber: '',
      email: '',
      address: {
        street: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'India',
      },
      medicalHistory: [],
      doctor: null,
    },
    validationSchema: patientSchema,
    onSubmit: async (values) => {
      try {
        setLoading(true);
        const submitData = {
          ...values,
          doctor: values.doctor._id,
        };
        
        if (selectedPatient) {
          await patientAPI.update(selectedPatient._id, submitData);
          toast.success(t('patients.updateSuccess'));
        } else {
          await patientAPI.create(submitData);
          toast.success(t('patients.createSuccess'));
        }
        handleCloseDialog();
        fetchPatients();
      } catch (err) {
        toast.error(err.response?.data?.message || t('patients.error'));
      } finally {
        setLoading(false);
      }
    },
  });

  useEffect(() => {
    fetchPatients();
  }, [page, rowsPerPage, searchQuery]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await patientAPI.getAll({
        page: page + 1,
        limit: rowsPerPage,
        search: searchQuery,
      });
      setPatients(response.data.patients);
      setTotal(response.data.total);
    } catch (err) {
      toast.error(t('patients.fetchError'));
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    setPage(0);
  };

  const handleOpenDialog = (patient = null) => {
    if (patient) {
      setSelectedPatient(patient);
      formik.setValues({
        ...patient,
        dateOfBirth: new Date(patient.dateOfBirth),
      });
    } else {
      setSelectedPatient(null);
      formik.resetForm();
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedPatient(null);
    formik.resetForm();
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      await patientAPI.delete(selectedPatient._id);
      toast.success(t('patients.deleteSuccess'));
      setOpenConfirm(false);
      fetchPatients();
    } catch (err) {
      toast.error(err.response?.data?.message || t('patients.deleteError'));
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (dateOfBirth) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  if (loading && !patients.length) {
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
          {t('patients.title')}
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
        placeholder={t('patients.searchPlaceholder')}
      />

      {patients.length === 0 ? (
        <NoContent message={t('patients.noPatientsFound')} />
      ) : (
        <Grid container spacing={3}>
          {patients.map((patient) => (
            <Grid item xs={12} sm={6} md={4} key={patient._id}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    <PersonIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
                    <Box>
                      <Typography variant="h6" component="h2">
                        {`${patient.firstName} ${patient.lastName}`}
                      </Typography>
                      <Box display="flex" alignItems="center" gap={1}>
                        <CalendarIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="textSecondary">
                          {format(new Date(patient.dateOfBirth), 'dd/MM/yyyy')} ({calculateAge(patient.dateOfBirth)} {t('patients.years')})
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                  <Box mb={2}>
                    <Chip
                      label={t(`patients.genders.${patient.gender}`)}
                      color={patient.gender === 'male' ? 'primary' : 'secondary'}
                      size="small"
                    />
                  </Box>
                  <Typography variant="body2" color="textSecondary" paragraph>
                    {t('patients.phone')}: {patient.phoneNumber}
                  </Typography>
                  {patient.email && (
                    <Typography variant="body2" color="textSecondary" paragraph>
                      {t('patients.email')}: {patient.email}
                    </Typography>
                  )}
                  {patient.address?.city && (
                    <Typography variant="body2" color="textSecondary" noWrap>
                      {t('patients.address')}: {`${patient.address.city}, ${patient.address.state}`}
                    </Typography>
                  )}
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={() => handleOpenDialog(patient)}
                  >
                    {t('common.edit')}
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => {
                      setSelectedPatient(patient);
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
          {selectedPatient ? t('patients.editPatient') : t('patients.addPatient')}
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('patients.firstName')}
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
                  label={t('patients.lastName')}
                  name="lastName"
                  value={formik.values.lastName}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.lastName && Boolean(formik.errors.lastName)}
                  helperText={formik.touched.lastName && formik.errors.lastName}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label={t('patients.dateOfBirth')}
                    value={formik.values.dateOfBirth}
                    onChange={(date) => formik.setFieldValue('dateOfBirth', date)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        fullWidth
                        error={formik.touched.dateOfBirth && Boolean(formik.errors.dateOfBirth)}
                        helperText={formik.touched.dateOfBirth && formik.errors.dateOfBirth}
                      />
                    )}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={formik.touched.gender && Boolean(formik.errors.gender)}>
                  <InputLabel>{t('patients.gender')}</InputLabel>
                  <Select
                    name="gender"
                    value={formik.values.gender}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    label={t('patients.gender')}
                  >
                    <MenuItem value="male">{t('patients.genders.male')}</MenuItem>
                    <MenuItem value="female">{t('patients.genders.female')}</MenuItem>
                    <MenuItem value="other">{t('patients.genders.other')}</MenuItem>
                  </Select>
                  {formik.touched.gender && formik.errors.gender && (
                    <Typography color="error" variant="caption">
                      {formik.errors.gender}
                    </Typography>
                  )}
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('patients.phoneNumber')}
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
                  label={t('patients.email')}
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
                <DoctorSearchAndRegister
                  value={formik.values.doctor}
                  onChange={(doctor) => formik.setFieldValue('doctor', doctor)}
                  error={formik.touched.doctor && Boolean(formik.errors.doctor)}
                  helperText={formik.touched.doctor && formik.errors.doctor}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  {t('patients.address')}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={t('patients.address.street')}
                  name="address.street"
                  value={formik.values.address.street}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('patients.address.city')}
                  name="address.city"
                  value={formik.values.address.city}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('patients.address.state')}
                  name="address.state"
                  value={formik.values.address.state}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('patients.address.postalCode')}
                  name="address.postalCode"
                  value={formik.values.address.postalCode}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('patients.address.country')}
                  name="address.country"
                  value={formik.values.address.country}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
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
            {selectedPatient ? t('common.update') : t('common.create')}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={openConfirm}
        title={t('patients.deleteConfirmTitle')}
        message={t('patients.deleteConfirmMessage')}
        onConfirm={handleDelete}
        onCancel={() => setOpenConfirm(false)}
        loading={loading}
      />
    </Box>
  );
};

export default Patients; 