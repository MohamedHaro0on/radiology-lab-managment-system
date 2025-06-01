import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { authAPI } from '../../services/api';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { format } from 'date-fns';
import NoContent from '../../components/common/NoContent';

/**
 * Patients component for managing patients
 */
const Patients = () => {
  const { t } = useTranslation();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openConfirm, setOpenConfirm] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    dateOfBirth: '',
    gender: '',
    phone: '',
    email: '',
    address: '',
    medicalHistory: '',
  });

  useEffect(() => {
    fetchPatients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [/* Add dependencies if needed, or keep empty if desired */]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await authAPI.getPatients();
      if (response.data && response.data.patients) {
        setPatients(response.data.patients);
      } else {
        setPatients([]); // Ensure patients is always an array
      }
    } catch (error) {
      toast.error(t('patients.fetchError'));
      console.error('Error fetching patients:', error);
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (patient = null) => {
    if (patient) {
      setFormData({
        name: patient.name,
        dateOfBirth: patient.dateOfBirth,
        gender: patient.gender,
        phone: patient.phone,
        email: patient.email,
        address: patient.address,
        medicalHistory: patient.medicalHistory,
      });
      setSelectedPatient(patient);
    } else {
      setFormData({
        name: '',
        dateOfBirth: '',
        gender: '',
        phone: '',
        email: '',
        address: '',
        medicalHistory: '',
      });
      setSelectedPatient(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedPatient(null);
    setFormData({
      name: '',
      dateOfBirth: '',
      gender: '',
      phone: '',
      email: '',
      address: '',
      medicalHistory: '',
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    try {
      if (selectedPatient) {
        await authAPI.updatePatient(selectedPatient.id, formData);
        toast.success(t('patients.updateSuccess'));
      } else {
        await authAPI.createPatient(formData);
        toast.success(t('patients.createSuccess'));
      }
      handleCloseDialog();
      fetchPatients();
    } catch (error) {
      toast.error(t('patients.saveError'));
    }
  };

  const handleDelete = async (patient) => {
    setSelectedPatient(patient);
    setOpenConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      await authAPI.deletePatient(selectedPatient.id);
      toast.success(t('patients.deleteSuccess'));
      fetchPatients();
    } catch (error) {
      toast.error(t('patients.deleteError'));
    } finally {
      setOpenConfirm(false);
      setSelectedPatient(null);
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

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (patients.length === 0) {
    return (
      <NoContent message={t('patients.noPatientsFound')} />
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

      <Grid container spacing={3}>
        {patients.map((patient) => (
          <Grid item xs={12} sm={6} md={4} key={patient.id}>
            <Card>
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
                    label={patient.gender}
                    color={patient.gender.toLowerCase() === 'male' ? 'primary' : 'secondary'}
                    size="small"
                  />
                </Box>
                <Typography variant="body2" color="textSecondary" paragraph>
                  {t('patients.phone')}: {patient.phone}
                </Typography>
                <Typography variant="body2" color="textSecondary" paragraph>
                  {t('patients.email')}: {patient.email}
                </Typography>
                <Typography variant="body2" color="textSecondary" noWrap>
                  {t('patients.address')}: {patient.address}
                </Typography>
              </CardContent>
              <CardActions>
                <IconButton
                  size="small"
                  color="primary"
                  onClick={() => handleOpenDialog(patient)}
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleDelete(patient)}
                >
                  <DeleteIcon />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedPatient ? t('patients.editTitle') : t('patients.addTitle')}
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label={t('patients.name')}
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label={t('patients.dateOfBirth')}
              name="dateOfBirth"
              type="date"
              value={formData.dateOfBirth}
              onChange={handleInputChange}
              margin="normal"
              required
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              label={t('patients.gender')}
              name="gender"
              select
              value={formData.gender}
              onChange={handleInputChange}
              margin="normal"
              required
              SelectProps={{ native: true }}
            >
              <option value="">{t('common.select')}</option>
              <option value="male">{t('patients.male')}</option>
              <option value="female">{t('patients.female')}</option>
            </TextField>
            <TextField
              fullWidth
              label={t('patients.phone')}
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label={t('patients.email')}
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              margin="normal"
            />
            <TextField
              fullWidth
              label={t('patients.address')}
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              margin="normal"
              multiline
              rows={2}
            />
            <TextField
              fullWidth
              label={t('patients.medicalHistory')}
              name="medicalHistory"
              value={formData.medicalHistory}
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
        title={t('patients.deleteConfirmTitle')}
        message={t('patients.deleteConfirmMessage')}
        onConfirm={confirmDelete}
        onCancel={() => {
          setOpenConfirm(false);
          setSelectedPatient(null);
        }}
      />
    </Box>
  );
};

export default Patients; 