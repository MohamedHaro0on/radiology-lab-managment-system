import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useRTL } from '../../hooks/useRTL';
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  InputAdornment,
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
import { useNavigate } from 'react-router-dom';

/**
 * Patients component for managing patients
 */
const Patients = () => {
  const { t } = useTranslation();
  const { isRTL } = useRTL();
  const navigate = useNavigate();
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
      name: '',
      dateOfBirth: null,
      gender: '',
      phoneNumber: '',
      socialNumber: '',
      address: {
        street: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'Egypt',
      },
      medicalHistory: [],
      doctor: null,
    },
    validationSchema: patientSchema,
    onSubmit: async (values) => {
      console.log('🚀 Formik onSubmit triggered with values:', values);
      try {
        setLoading(true);
        console.log('📝 Preparing submit data...');
        const submitData = {
          ...values,
          phoneNumber: values.phoneNumber ? `+20${values.phoneNumber}` : '',
          // Ensure that the doctor field is only sending the ID if it's an object
          doctorReferred: values.doctor ? values.doctor._id : null,
        };
        // Remove the temporary `doctor` field that holds the full object
        delete submitData.doctor;
        console.log('📤 Final submit data:', submitData);

        if (selectedPatient) {
          console.log('🔄 Updating patient:', selectedPatient._id);
          await patientAPI.update(selectedPatient._id, submitData);
          toast.success(t('patients.updateSuccess'));
        } else {
          console.log('➕ Creating new patient...');
          await patientAPI.create(submitData);
          toast.success(t('patients.createSuccess'));
        }
        console.log('✅ API call successful, closing dialog and refreshing data...');
        handleCloseDialog();
        fetchPatients();
      } catch (err) {
        console.error('❌ Patient creation/update error:', err);
        const errorMessage = err.response?.data?.message || 
                           err.response?.data?.error || 
                           err.message || 
                           t('patients.error');
        toast.error(`Failed to ${selectedPatient ? 'update' : 'create'} patient: ${errorMessage}`);
      } finally {
        setLoading(false);
        console.log('🏁 Form submission completed');
      }
    },
  });

  useEffect(() => {
    fetchPatients();
  }, [page, rowsPerPage, searchQuery]);

  const fetchPatients = async () => {
    console.log('📥 fetchPatients called');
    try {
      setLoading(true);
      const response = await patientAPI.getAll({
        page: page + 1,
        limit: rowsPerPage,
        search: searchQuery,
      });
      // Corrected path to patients array
      setPatients(response.data.data.patients || []);
      setTotal(response.data.data.pagination?.total || 0);
      console.log('✅ fetchPatients completed successfully');
    } catch (err) {
      console.error('❌ fetchPatients error:', err);
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
      const updatedPatient = { ...patient };

      // Ensure doctor object for the form contains only the necessary fields
      if (updatedPatient.doctorReferred) {
        // Explicitly reconstruct the doctor object to only contain relevant fields
        updatedPatient.doctorReferred = {
          _id: updatedPatient.doctorReferred._id,
          name: updatedPatient.doctorReferred.name, // Ensure it uses 'name'
          specialization: updatedPatient.doctorReferred.specialization,
          licenseNumber: updatedPatient.doctorReferred.licenseNumber,
          contactNumber: updatedPatient.doctorReferred.contactNumber,
        };
      }

      formik.setValues({
        name: updatedPatient.name || '',
        dateOfBirth: updatedPatient.dateOfBirth ? new Date(updatedPatient.dateOfBirth) : null,
        gender: updatedPatient.gender || '',
        phoneNumber: updatedPatient.phoneNumber?.startsWith('+20') ? updatedPatient.phoneNumber.substring(3) : updatedPatient.phoneNumber || '',
        socialNumber: updatedPatient.socialNumber || '',
        address: updatedPatient.address || {
          street: '',
          city: '',
          state: '',
          postalCode: '',
          country: 'Egypt',
        },
        medicalHistory: updatedPatient.medicalHistory || [],
        // Map doctorReferred to the 'doctor' field that DoctorSearchAndRegister expects
        doctor: updatedPatient.doctorReferred || null,
      });
    } else {
      setSelectedPatient(null);
      formik.resetForm();
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    console.log('🚪 handleCloseDialog called');
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
      <Grid container spacing={3} dir={isRTL ? 'rtl' : 'ltr'} sx={{ flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: isRTL ? 'flex-end' : 'flex-start', textAlign: isRTL ? 'right' : 'left' }}>
        {patients.map((patient) => (
          <Grid item xs={12} sm={6} md={4} key={patient._id}>
            <Card
              onClick={() => navigate(`/patients/${patient._id}`)}
              style={{ cursor: 'pointer' }}
            >
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <PersonIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
                  <Box>
                    <Typography variant="h6" component="h2">
                        {patient.name}
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
                
                <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }} dir={isRTL ? 'rtl' : 'ltr'}>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell component="th" sx={{ fontWeight: 'bold', width: '40%' }} align={isRTL ? 'right' : 'left'}>
                          {t('patients.phone')}
                        </TableCell>
                        <TableCell align={isRTL ? 'left' : 'right'}>
                          {patient.phoneNumber}
                        </TableCell>
                      </TableRow>
                      {patient.socialNumber && (
                        <TableRow>
                          <TableCell component="th" sx={{ fontWeight: 'bold' }} align={isRTL ? 'right' : 'left'}>
                            {t('patients.socialNumber')}
                          </TableCell>
                          <TableCell align={isRTL ? 'left' : 'right'}>
                            {patient.socialNumber}
                          </TableCell>
                        </TableRow>
                      )}
                      {patient.address?.city && (
                        <TableRow>
                          <TableCell component="th" sx={{ fontWeight: 'bold' }} align={isRTL ? 'right' : 'left'}>
                            {t('patients.address')}
                          </TableCell>
                          <TableCell align={isRTL ? 'left' : 'right'}>
                            {`${patient.address.city}, ${patient.address.state}`}
                          </TableCell>
                        </TableRow>
                      )}
                      {patient.doctorReferred && (
                        <TableRow>
                          <TableCell component="th" sx={{ fontWeight: 'bold' }} align={isRTL ? 'right' : 'left'}>
                            {t('patients.doctor')}
                          </TableCell>
                          <TableCell align={isRTL ? 'left' : 'right'}>
                            {patient.doctorReferred.name}
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
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenDialog(patient);
                  }}
                >
                    {t('common.edit')}
                  </Button>
                  <Button
                  size="small"
                  color="error"
                    startIcon={<DeleteIcon />}
                    onClick={(e) => {
                      e.stopPropagation();
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

      <Dialog 
        open={openDialog} 
        onClose={(e, reason) => {
          console.log('🚪 Dialog onClose triggered, reason:', reason);
          handleCloseDialog();
        }} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          {selectedPatient ? t('patients.editPatient') : t('patients.addPatient')}
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={(e) => {
            console.log('📋 Form onSubmit event triggered');
            console.log('🛑 Preventing default behavior...');
            e.preventDefault();
            e.stopPropagation();
            console.log('🔄 Calling formik.handleSubmit...');
            formik.handleSubmit(e);
          }} noValidate sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={t('patients.name')}
                  name="name"
                  value={formik.values.name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.name && Boolean(formik.errors.name)}
                  helperText={formik.touched.name && formik.errors.name}
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
                  InputProps={{
                    startAdornment: <InputAdornment position="start">+20</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('patients.socialNumber')}
                  name="socialNumber"
                  value={formik.values.socialNumber}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.socialNumber && Boolean(formik.errors.socialNumber)}
                  helperText={formik.touched.socialNumber && formik.errors.socialNumber}
                />
              </Grid>
              <Grid item xs={12}>
                {console.log("formik.values.doctor before rendering DoctorSearchAndRegister:", formik.values.doctor)}
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
            onClick={(e) => {
              console.log('🔘 Submit button clicked');
              console.log('🛑 Preventing default behavior on button...');
              e.preventDefault();
              e.stopPropagation();
              console.log('🔄 Calling formik.handleSubmit from button...');
              formik.handleSubmit(e);
            }}
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