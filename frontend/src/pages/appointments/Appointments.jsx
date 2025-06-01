import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
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
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Event as EventIcon,
  Person as PersonIcon,
  LocalHospital as DoctorIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { authAPI } from '../../services/api';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { format, parseISO } from 'date-fns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useNavigate } from 'react-router-dom';
// eslint-disable-next-line no-unused-vars
import NoContent from '../../components/common/NoContent';

/**
 * Appointments component for managing appointments
 */
const Appointments = () => {
  const { t } = useTranslation();
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openConfirm, setOpenConfirm] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [formData, setFormData] = useState({
    patientId: '',
    doctorId: '',
    date: null,
    time: null,
    type: '',
    status: 'scheduled',
    notes: '',
  });

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [/* Add dependencies if needed, or keep empty if desired */]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [appointmentsRes, doctorsRes, patientsRes] = await Promise.all([
        authAPI.getAppointments(),
        authAPI.getDoctors(),
        authAPI.getPatients(),
      ]);
      if (appointmentsRes.data && appointmentsRes.data.appointments) {
        setAppointments(appointmentsRes.data.appointments);
      } else {
        setAppointments([]); // Ensure appointments is always an array
      }
      if (doctorsRes.data && doctorsRes.data.doctors) {
        setDoctors(doctorsRes.data.doctors);
      } else {
        setDoctors([]); // Ensure doctors is always an array
      }
      if (patientsRes.data && patientsRes.data.patients) {
        setPatients(patientsRes.data.patients);
      } else {
        setPatients([]); // Ensure patients is always an array
      }
    } catch (error) {
      // Don't show error toast for session expiration as it's handled by the API service
      if (error.isSessionExpired) {
        return;
      }
      // Use the error message from the API error object
      const errorMessage = error.isApiError ? error.message : t('appointments.fetchError');
      toast.error(errorMessage);
      console.error('Error fetching data:', error);
      // Clear the data arrays since we couldn't fetch them
      setAppointments([]);
      setDoctors([]);
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (appointment = null) => {
    if (appointment) {
      setFormData({
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
        date: parseISO(appointment.date),
        time: parseISO(appointment.time),
        type: appointment.type,
        status: appointment.status,
        notes: appointment.notes,
      });
      setSelectedAppointment(appointment);
    } else {
      setFormData({
        patientId: '',
        doctorId: '',
        date: null,
        time: null,
        type: '',
        status: 'scheduled',
        notes: '',
      });
      setSelectedAppointment(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedAppointment(null);
    setFormData({
      patientId: '',
      doctorId: '',
      date: null,
      time: null,
      type: '',
      status: 'scheduled',
      notes: '',
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDateChange = (date) => {
    setFormData((prev) => ({
      ...prev,
      date,
    }));
  };

  const handleTimeChange = (time) => {
    setFormData((prev) => ({
      ...prev,
      time,
    }));
  };

  const handleSubmit = async () => {
    try {
      const appointmentData = {
        ...formData,
        date: format(formData.date, 'yyyy-MM-dd'),
        time: format(formData.time, 'HH:mm:ss'),
      };

      if (selectedAppointment) {
        await authAPI.updateAppointment(selectedAppointment.id, appointmentData);
        toast.success(t('appointments.updateSuccess'));
      } else {
        await authAPI.createAppointment(appointmentData);
        toast.success(t('appointments.createSuccess'));
      }
      handleCloseDialog();
      fetchData();
    } catch (error) {
      // Don't show error toast for session expiration as it's handled by the API service
      if (error.isSessionExpired) {
        return;
      }
      // Use the error message from the API error object
      const errorMessage = error.isApiError ? error.message : t('appointments.saveError');
      toast.error(errorMessage);
      console.error('Error saving appointment:', error);
    }
  };

  const handleDelete = async (appointment) => {
    setSelectedAppointment(appointment);
    setOpenConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      await authAPI.deleteAppointment(selectedAppointment.id);
      toast.success(t('appointments.deleteSuccess'));
      fetchData();
    } catch (error) {
      // Don't show error toast for session expiration as it's handled by the API service
      if (error.isSessionExpired) {
        return;
      }
      // Use the error message from the API error object
      const errorMessage = error.isApiError ? error.message : t('appointments.deleteError');
      toast.error(errorMessage);
      console.error('Error deleting appointment:', error);
    } finally {
      setOpenConfirm(false);
      setSelectedAppointment(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled':
        return 'primary';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getPatientName = (patientId) => {
    const patient = patients.find((p) => p.id === patientId);
    return patient ? patient.name : '';
  };

  const getDoctorName = (doctorId) => {
    const doctor = doctors.find((d) => d.id === doctorId);
    return doctor ? doctor.name : '';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (appointments.length === 0) {
    return (
      <NoContent message={t('appointments.noAppointmentsFound')} />
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          {t('appointments.title')}
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

      <Grid container spacing={3}>
        {appointments.map((appointment) => (
          <Grid item xs={12} sm={6} md={4} key={appointment.id}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <EventIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
                  <Box>
                    <Typography variant="h6" component="h2">
                      {format(parseISO(appointment.date), 'dd/MM/yyyy')}
                    </Typography>
                    <Typography color="textSecondary">
                      {format(parseISO(appointment.time), 'HH:mm')}
                    </Typography>
                  </Box>
                </Box>
                <Box mb={2}>
                  <Chip
                    label={t(`appointments.status.${appointment.status}`)}
                    color={getStatusColor(appointment.status)}
                    size="small"
                  />
                </Box>
                <Box display="flex" alignItems="center" mb={1}>
                  <PersonIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2" color="textSecondary">
                    {getPatientName(appointment.patientId)}
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" mb={1}>
                  <DoctorIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2" color="textSecondary">
                    {getDoctorName(appointment.doctorId)}
                  </Typography>
                </Box>
                <Typography variant="body2" color="textSecondary" paragraph>
                  {t('appointments.type')}: {t(`appointments.types.${appointment.type}`)}
                </Typography>
                {appointment.notes && (
                  <Typography variant="body2" color="textSecondary">
                    {t('appointments.notes')}: {appointment.notes}
                  </Typography>
                )}
              </CardContent>
              <Box display="flex" justifyContent="flex-end" p={1}>
                <IconButton
                  size="small"
                  color="primary"
                  onClick={() => handleOpenDialog(appointment)}
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleDelete(appointment)}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedAppointment ? t('appointments.editTitle') : t('appointments.addTitle')}
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <FormControl fullWidth margin="normal" required>
              <InputLabel>{t('appointments.patient')}</InputLabel>
              <Select
                name="patientId"
                value={formData.patientId}
                onChange={handleInputChange}
                label={t('appointments.patient')}
              >
                {patients.map((patient) => (
                  <MenuItem key={patient.id} value={patient.id}>
                    {patient.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth margin="normal" required>
              <InputLabel>{t('appointments.doctor')}</InputLabel>
              <Select
                name="doctorId"
                value={formData.doctorId}
                onChange={handleInputChange}
                label={t('appointments.doctor')}
              >
                {doctors.map((doctor) => (
                  <MenuItem key={doctor.id} value={doctor.id}>
                    {doctor.name} - {doctor.specialization}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <Box sx={{ mt: 2, mb: 2 }}>
                <DatePicker
                  label={t('appointments.date')}
                  value={formData.date}
                  onChange={handleDateChange}
                  slotProps={{ textField: { fullWidth: true, required: true } }}
                />
              </Box>

              <Box sx={{ mt: 2, mb: 2 }}>
                <TimePicker
                  label={t('appointments.time')}
                  value={formData.time}
                  onChange={handleTimeChange}
                  slotProps={{ textField: { fullWidth: true, required: true } }}
                />
              </Box>
            </LocalizationProvider>

            <FormControl fullWidth margin="normal" required>
              <InputLabel>{t('appointments.type')}</InputLabel>
              <Select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                label={t('appointments.type')}
              >
                <MenuItem value="xray">{t('appointments.types.xray')}</MenuItem>
                <MenuItem value="ct">{t('appointments.types.ct')}</MenuItem>
                <MenuItem value="mri">{t('appointments.types.mri')}</MenuItem>
                <MenuItem value="ultrasound">{t('appointments.types.ultrasound')}</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth margin="normal" required>
              <InputLabel>{t('appointments.status')}</InputLabel>
              <Select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                label={t('appointments.status')}
              >
                <MenuItem value="scheduled">{t('appointments.status.scheduled')}</MenuItem>
                <MenuItem value="completed">{t('appointments.status.completed')}</MenuItem>
                <MenuItem value="cancelled">{t('appointments.status.cancelled')}</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label={t('appointments.notes')}
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              margin="normal"
              multiline
              rows={3}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>{t('common.cancel')}</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={openConfirm}
        title={t('appointments.deleteConfirmTitle')}
        message={t('appointments.deleteConfirmMessage')}
        onConfirm={confirmDelete}
        onCancel={() => {
          setOpenConfirm(false);
          setSelectedAppointment(null);
        }}
      />
    </Box>
  );
};

export default Appointments; 