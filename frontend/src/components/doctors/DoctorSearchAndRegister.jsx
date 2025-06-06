import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  TextField,
  Autocomplete,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Typography,
  Alert,
} from '@mui/material';
import { useFormik } from 'formik';
import { doctorAPI } from '../../services/api';
import { doctorSchema } from '../../validations/schemas';
import { toast } from 'react-toastify';

const DoctorSearchAndRegister = ({ value, onChange, error, helperText }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);

  // Formik for doctor registration
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
        setRegisterLoading(true);
        const response = await doctorAPI.create(values);
        const newDoctor = response.data;
        setOptions((prev) => [...prev, newDoctor]);
        onChange(newDoctor);
        setShowRegisterForm(false);
        toast.success(t('doctors.createSuccess'));
      } catch (err) {
        toast.error(err.response?.data?.message || t('doctors.error'));
      } finally {
        setRegisterLoading(false);
      }
    },
  });

  useEffect(() => {
    let active = true;

    const fetchDoctors = async () => {
      if (!searchQuery) {
        setOptions([]);
        return;
      }

      setLoading(true);
      try {
        const response = await doctorAPI.search(searchQuery);
        if (active) {
          setOptions(response.data.doctors || []);
        }
      } catch (err) {
        console.error('Error fetching doctors:', err);
        if (active) {
          setOptions([]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    const timeoutId = setTimeout(fetchDoctors, 300);
    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
  }, [searchQuery]);

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setShowRegisterForm(false);
  };

  const handleDoctorNotFound = () => {
    setShowRegisterForm(true);
  };

  return (
    <>
      <Autocomplete
        open={open}
        onOpen={handleOpen}
        onClose={() => setOpen(false)}
        value={value}
        onChange={(event, newValue) => {
          onChange(newValue);
        }}
        onInputChange={(event, newInputValue) => {
          setSearchQuery(newInputValue);
        }}
        isOptionEqualToValue={(option, value) => option._id === value._id}
        getOptionLabel={(option) =>
          option ? `Dr. ${option.firstName} ${option.lastName} - ${option.specialization}` : ''
        }
        options={options}
        loading={loading}
        renderInput={(params) => (
          <TextField
            {...params}
            label={t('patients.selectDoctor')}
            error={error}
            helperText={helperText}
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {loading ? <CircularProgress color="inherit" size={20} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
        renderOption={(props, option) => (
          <Box component="li" {...props}>
            <Box>
              <Typography variant="body1">
                Dr. {option.firstName} {option.lastName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {option.specialization}
              </Typography>
            </Box>
          </Box>
        )}
        noOptionsText={
          searchQuery ? (
            <Box sx={{ p: 1 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {t('doctors.noDoctorsFound')}
              </Typography>
              <Button
                size="small"
                onClick={handleDoctorNotFound}
                sx={{ mt: 1 }}
              >
                {t('doctors.registerNew')}
              </Button>
            </Box>
          ) : (
            t('doctors.startTyping')
          )
        }
      />

      <Dialog
        open={showRegisterForm}
        onClose={() => setShowRegisterForm(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{t('doctors.registerNew')}</DialogTitle>
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
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowRegisterForm(false)}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={formik.handleSubmit}
            variant="contained"
            disabled={registerLoading}
            startIcon={registerLoading && <CircularProgress size={20} />}
          >
            {t('common.create')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default DoctorSearchAndRegister; 