import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useFormik } from 'formik';
import {
  Box, Grid, Card, CardContent, CardActions, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, CircularProgress, Fab, Chip, FormControl, InputLabel, Select, MenuItem, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Person as PersonIcon } from '@mui/icons-material';
import { toast } from 'react-toastify';
import { radiologistAPI } from '../../services/api';
// You should define radiologistSchema in validations/schemas.js
import { radiologistSchema } from '../../validations/schemas';

const Radiologists = () => {
  const { t } = useTranslation();
  const [radiologists, setRadiologists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedRadiologist, setSelectedRadiologist] = useState(null);

  const formik = useFormik({
    initialValues: {
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
          await radiologistAPI.update(selectedRadiologist._id, values);
          toast.success(t('radiologists.updateSuccess'));
        } else {
          await radiologistAPI.create(values);
          toast.success(t('radiologists.createSuccess'));
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

  const fetchRadiologists = async () => {
    setLoading(true);
    const response = await radiologistAPI.getAll();
    setRadiologists(response.data.data.radiologists || []);
    setLoading(false);
  };

  useEffect(() => { fetchRadiologists(); }, []);

  const handleOpenDialog = (radiologist = null) => {
    setSelectedRadiologist(radiologist);
    if (radiologist) formik.setValues(radiologist);
    else formik.resetForm();
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedRadiologist(null);
    formik.resetForm();
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      await radiologistAPI.delete(selectedRadiologist._id);
      toast.success(t('radiologists.deleteSuccess'));
      setOpenDialog(false);
      fetchRadiologists();
    } catch (err) {
      toast.error(err.response?.data?.message || t('radiologists.deleteError'));
    } finally {
      setLoading(false);
    }
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
        {radiologists.map((radiologist) => (
          <Grid item xs={12} sm={6} md={4} key={radiologist._id}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <PersonIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
                  <Box>
                    <Typography variant="h6" component="h2">
                      {radiologist.name}
                    </Typography>
                    <Chip
                      label={radiologist.isActive ? t('common.active') : t('common.inactive')}
                      color={radiologist.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </Box>
                </Box>
                
                <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell component="th" sx={{ fontWeight: 'bold', width: '40%' }}>
                          {t('radiologists.gender')}
                        </TableCell>
                        <TableCell>
                          {t(`genders.${radiologist.gender}`)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" sx={{ fontWeight: 'bold' }}>
                          {t('radiologists.age')}
                        </TableCell>
                        <TableCell>
                          {radiologist.age} {t('patients.years')}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" sx={{ fontWeight: 'bold' }}>
                          {t('radiologists.phoneNumber')}
                        </TableCell>
                        <TableCell>
                          {radiologist.phoneNumber}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" sx={{ fontWeight: 'bold' }}>
                          {t('radiologists.licenseId')}
                        </TableCell>
                        <TableCell>
                          {radiologist.licenseId}
                        </TableCell>
                      </TableRow>
                      {radiologist.totalScansPerformed !== undefined && (
                        <TableRow>
                          <TableCell component="th" sx={{ fontWeight: 'bold' }}>
                            {t('radiologists.totalScans')}
                          </TableCell>
                          <TableCell>
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
                <Button size="small" color="error" startIcon={<DeleteIcon />} onClick={handleDelete}>
                  {t('common.delete')}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedRadiologist ? t('radiologists.editTitle') : t('radiologists.addTitle')}</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label={t('radiologists.name') || 'Name'}
              name="name"
              value={formik.values.name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.name && Boolean(formik.errors.name)}
              helperText={formik.touched.name && formik.errors.name}
              required
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth error={formik.touched.gender && Boolean(formik.errors.gender)} sx={{ mb: 2 }}>
              <InputLabel>{t('radiologists.gender') || 'Gender'}</InputLabel>
              <Select
                name="gender"
                value={formik.values.gender}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                label={t('radiologists.gender') || 'Gender'}
              >
                <MenuItem value="male">{t('genders.male')}</MenuItem>
                <MenuItem value="female">{t('genders.female')}</MenuItem>
                <MenuItem value="other">{t('genders.other')}</MenuItem>
              </Select>
              {formik.touched.gender && formik.errors.gender && (
                <Typography color="error" variant="caption">
                  {formik.errors.gender}
                </Typography>
              )}
            </FormControl>
            <TextField
              fullWidth
              label={t('radiologists.age') || 'Age'}
              name="age"
              type="number"
              value={formik.values.age}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.age && Boolean(formik.errors.age)}
              helperText={formik.touched.age && formik.errors.age}
              required
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label={t('radiologists.phoneNumber') || 'Phone Number'}
              name="phoneNumber"
              value={formik.values.phoneNumber}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.phoneNumber && Boolean(formik.errors.phoneNumber)}
              helperText={formik.touched.phoneNumber && formik.errors.phoneNumber}
              required
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label={t('radiologists.licenseId') || 'License ID'}
              name="licenseId"
              value={formik.values.licenseId}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.licenseId && Boolean(formik.errors.licenseId)}
              helperText={formik.touched.licenseId && formik.errors.licenseId}
              required
              sx={{ mb: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>{t('common.cancel')}</Button>
          <Button type="submit" variant="contained" onClick={formik.handleSubmit} disabled={loading}>
            {selectedRadiologist ? t('common.update') : t('common.create')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Radiologists; 