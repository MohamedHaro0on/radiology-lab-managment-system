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
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { authAPI } from '../../services/api';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import NoContent from '../../components/common/NoContent';

/**
 * Doctors component for managing doctors
 */
const Doctors = () => {
  const { t } = useTranslation();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openConfirm, setOpenConfirm] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    specialization: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    fetchDoctors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const response = await authAPI.getDoctors();
      if (response.data && response.data.doctors) {
        setDoctors(response.data.doctors);
      } else {
        setDoctors([]); // Ensure doctors is always an array
      }
    } catch (error) {
      toast.error(t('doctors.fetchError'));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (doctor = null) => {
    if (doctor) {
      setFormData({
        name: doctor.name,
        specialization: doctor.specialization,
        email: doctor.email,
        phone: doctor.phone,
      });
      setSelectedDoctor(doctor);
    } else {
      setFormData({
        name: '',
        specialization: '',
        email: '',
        phone: '',
      });
      setSelectedDoctor(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedDoctor(null);
    setFormData({
      name: '',
      specialization: '',
      email: '',
      phone: '',
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
      if (selectedDoctor) {
        await authAPI.updateDoctor(selectedDoctor.id, formData);
        toast.success(t('doctors.updateSuccess'));
      } else {
        await authAPI.createDoctor(formData);
        toast.success(t('doctors.createSuccess'));
      }
      handleCloseDialog();
      fetchDoctors();
    } catch (error) {
      toast.error(t('doctors.saveError'));
    }
  };

  const handleDelete = async (doctor) => {
    setSelectedDoctor(doctor);
    setOpenConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      await authAPI.deleteDoctor(selectedDoctor.id);
      toast.success(t('doctors.deleteSuccess'));
      fetchDoctors();
    } catch (error) {
      toast.error(t('doctors.deleteError'));
    } finally {
      setOpenConfirm(false);
      setSelectedDoctor(null);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (doctors.length === 0) {
    return (
      <NoContent message={t('doctors.noDoctorsFound')} />
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

      <Grid container spacing={3}>
        {doctors.map((doctor) => (
          <Grid item xs={12} sm={6} md={4} key={doctor.id}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <PersonIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
                  <Box>
                    <Typography variant="h6" component="h2">
                      {doctor.name}
                    </Typography>
                    <Typography color="textSecondary" gutterBottom>
                      {doctor.specialization}
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="body2" color="textSecondary" paragraph>
                  {t('doctors.email')}: {doctor.email}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {t('doctors.phone')}: {doctor.phone}
                </Typography>
              </CardContent>
              <CardActions>
                <IconButton
                  size="small"
                  color="primary"
                  onClick={() => handleOpenDialog(doctor)}
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleDelete(doctor)}
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
          {selectedDoctor ? t('doctors.editTitle') : t('doctors.addTitle')}
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label={t('doctors.name')}
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label={t('doctors.specialization')}
              name="specialization"
              value={formData.specialization}
              onChange={handleInputChange}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label={t('doctors.email')}
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label={t('doctors.phone')}
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              margin="normal"
              required
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
        title={t('doctors.deleteConfirmTitle')}
        message={t('doctors.deleteConfirmMessage')}
        onConfirm={confirmDelete}
        onCancel={() => {
          setOpenConfirm(false);
          setSelectedDoctor(null);
        }}
      />
    </Box>
  );
};

export default Doctors; 