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
  FormControlLabel,
  Switch,
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
      name: '',
      specialization: '',
      licenseNumber: '',
      contactNumber: '',
      address: {
        street: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'India',
      },
      active: true,
      experience: 0,
    },
    validationSchema: doctorSchema,
    onSubmit: async (values) => {
      try {
        setRegisterLoading(true);
        // Map frontend fields to backend schema for new doctor creation
        const backendDoctor = {
          name: values.name,
          specialization: values.specialization,
          licenseNumber: values.licenseNumber,
          contactNumber: values.contactNumber,
          address: values.address,
          experience: values.experience || 0,
          isActive: values.active ?? true,
          // createdBy will be handled by backend if user context is available
        };
        
        const response = await doctorAPI.create(backendDoctor);
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
        console.log("Search query empty, options set to:", []);
        return;
      }

      setLoading(true);
      try {
        const response = await doctorAPI.search(searchQuery);
        console.log("Doctor API search response:", response.data);
        if (active) {
          const fetchedDoctors = response.data.data.doctors || [];
          setOptions(fetchedDoctors);
          console.log("Options set to:", fetchedDoctors);
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
          option ? `Dr. ${option.name} - ${option.specialization}` : ''
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
                Dr. {option.name}
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
          <Box component="form" id="doctor-register-form" onSubmit={formik.handleSubmit} sx={{ mt: 2 }}>
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
                  label={t('doctors.contactNumber')}
                  name="contactNumber"
                  value={formik.values.contactNumber}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.contactNumber && Boolean(formik.errors.contactNumber)}
                  helperText={formik.touched.contactNumber && formik.errors.contactNumber}
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
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('doctors.experience')}
                  name="experience"
                  type="number"
                  value={formik.values.experience}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.experience && Boolean(formik.errors.experience)}
                  helperText={formik.touched.experience && formik.errors.experience}
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
            type="submit"
            form="doctor-register-form"
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