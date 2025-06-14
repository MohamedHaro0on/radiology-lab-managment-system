import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Container, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, CircularProgress, IconButton, Snackbar, Alert, Box, Chip,
  FormControl, InputLabel, Select, MenuItem, Grid, Card, CardContent,
  Tabs, Tab, Pagination, InputAdornment, Tooltip, Fab
} from '@mui/material';
import {
  Add, Edit, Delete, Search, FilterList, CalendarMonth, 
  Schedule, Refresh,
  CheckCircle, Cancel, Pending, Warning
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { appointmentAPI, patientAPI, doctorAPI, radiologistAPI } from '../../services/api';
import { useTranslation } from 'react-i18next';

// Status color mapping
const statusColors = {
  scheduled: 'primary',
  confirmed: 'info',
  'in-progress': 'warning',
  'inProgress': 'warning',
  completed: 'success',
  cancelled: 'error',
  'no-show': 'default',
  pending: 'warning'
};

const statusIcons = {
  scheduled: <Schedule />,
  confirmed: <Pending />,
  'in-progress': <Warning />,
  'inProgress': <Warning />,
  completed: <CheckCircle />,
  cancelled: <Cancel />,
  'no-show': <Cancel />,
  pending: <Pending />
};

// Advanced Appointment Form Component
function AppointmentForm({ open, onClose, onSubmit, initialData, patients, doctors, radiologists }) {
  const { t } = useTranslation();
  const [form, setForm] = useState(initialData || {
    radiologistId: '',
    patientId: '',
    scans: [{ scan: '', quantity: 1 }],
    referredBy: '',
    scheduledAt: '',
    notes: '',
    priority: 'routine'
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    setForm(initialData || {
      radiologistId: '',
      patientId: '',
      scans: [{ scan: '', quantity: 1 }],
      referredBy: '',
      scheduledAt: '',
      notes: '',
      priority: 'routine'
    });
    setErrors({});
  }, [initialData, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleScanChange = (index, field, value) => {
    const newScans = [...form.scans];
    newScans[index] = { ...newScans[index], [field]: value };
    setForm(prev => ({ ...prev, scans: newScans }));
  };

  const addScan = () => {
    setForm(prev => ({
      ...prev,
      scans: [...prev.scans, { scan: '', quantity: 1 }]
    }));
  };

  const removeScan = (index) => {
    if (form.scans.length > 1) {
      setForm(prev => ({
        ...prev,
        scans: prev.scans.filter((_, i) => i !== index)
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!form.radiologistId) newErrors.radiologistId = t('appointments.radiologistRequired');
    if (!form.patientId) newErrors.patientId = t('appointments.patientRequired');
    if (!form.referredBy) newErrors.referredBy = t('appointments.referredByRequired');
    if (!form.scheduledAt) newErrors.scheduledAt = t('appointments.dateRequired');
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(form);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {initialData ? t('appointments.editTitle') : t('appointments.addTitle')}
      </DialogTitle>
      <DialogContent>
        <form onSubmit={handleSubmit} id="appointment-form">
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!errors.patientId}>
                <InputLabel>{t('appointments.patient')}</InputLabel>
                <Select
                  name="patientId"
                  value={form.patientId}
                  onChange={handleChange}
                  label={t('appointments.patient')}
                >
                  {patients.map(p => (
                    <MenuItem key={p._id} value={p._id}>
                      {p.name} - {p.phoneNumber}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!errors.referredBy}>
                <InputLabel>{t('appointments.referredBy')}</InputLabel>
                <Select
                  name="referredBy"
                  value={form.referredBy}
                  onChange={handleChange}
                  label={t('appointments.referredBy')}
                >
                  {doctors.map(d => (
                    <MenuItem key={d._id} value={d._id}>
                      {d.name} ({d.specialization})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!errors.radiologistId}>
                <InputLabel>{t('appointments.radiologist')}</InputLabel>
                <Select
                  name="radiologistId"
                  value={form.radiologistId}
                  onChange={handleChange}
                  label={t('appointments.radiologist')}
                >
                  {radiologists.map(r => (
                    <MenuItem key={r._id} value={r._id}>
                      {r.name} ({r.licenseId})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>{t('appointments.priorityLabel')}</InputLabel>
                <Select
                  name="priority"
                  value={form.priority}
                  onChange={handleChange}
                  label={t('appointments.priorityLabel')}
                >
                  <MenuItem value="routine">{t('appointments.priority.routine')}</MenuItem>
                  <MenuItem value="urgent">{t('appointments.priority.urgent')}</MenuItem>
                  <MenuItem value="emergency">{t('appointments.priority.emergency')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label={t('appointments.dateTime')}
                  value={form.scheduledAt ? new Date(form.scheduledAt) : null}
                  onChange={(newValue) => {
                    setForm(prev => ({ ...prev, scheduledAt: newValue?.toISOString() }));
                  }}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: !!errors.scheduledAt
                    }
                  }}
                />
              </LocalizationProvider>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>{t('navigation.scans')}</Typography>
              {form.scans.map((scan, index) => (
                <Box key={index} sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <TextField
                    select
                    label={t('appointments.scanType')}
                    value={scan.scan}
                    onChange={(e) => handleScanChange(index, 'scan', e.target.value)}
                    sx={{ flexGrow: 1 }}
                  >
                    <MenuItem value="xray">{t('appointments.types.xray')}</MenuItem>
                    <MenuItem value="mri">{t('appointments.types.mri')}</MenuItem>
                    <MenuItem value="ct">{t('appointments.types.ct')}</MenuItem>
                    <MenuItem value="ultrasound">{t('appointments.types.ultrasound')}</MenuItem>
                  </TextField>
                  <TextField
                    type="number"
                    label={t('common.quantity')}
                    value={scan.quantity}
                    onChange={(e) => handleScanChange(index, 'quantity', parseInt(e.target.value))}
                    sx={{ width: 120 }}
                    inputProps={{ min: 1 }}
                  />
                  {form.scans.length > 1 && (
                    <IconButton onClick={() => removeScan(index)} color="error">
                      <Delete />
                    </IconButton>
                  )}
                </Box>
              ))}
              <Button onClick={addScan} startIcon={<Add />}>
                {t('appointments.addScan')}
              </Button>
            </Grid>

            <Grid item xs={12}>
              <TextField
                label={t('common.notes')}
                name="notes"
                value={form.notes}
                onChange={handleChange}
                fullWidth
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </form>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button type="submit" form="appointment-form" variant="contained">
          {initialData ? t('common.update') : t('common.create')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// Main Appointments Component
export default function Appointments() {
  const { t } = useTranslation();
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [radiologists, setRadiologists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // Advanced filtering and pagination
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    startDate: null,
    endDate: null,
    patientId: '',
    doctorId: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0
  });
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'calendar'

  // Fetch all data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Only include non-empty filters
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...(filters.search ? { search: filters.search } : {}),
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.patientId ? { patientId: filters.patientId } : {}),
        ...(filters.doctorId ? { doctorId: filters.doctorId } : {}),
        ...(filters.startDate ? { startDate: filters.startDate } : {}),
        ...(filters.endDate ? { endDate: filters.endDate } : {}),
      };
      const [aptRes, patRes, docRes, radRes] = await Promise.all([
        appointmentAPI.getAll(params),
        patientAPI.getAll(),
        doctorAPI.getAll(),
        radiologistAPI.getAll()
      ]);
      setAppointments(aptRes.data.data?.appointments || aptRes.data.appointments || aptRes.data || []);
      setPatients(patRes.data.data?.patients || patRes.data.patients || patRes.data || []);
      setDoctors(docRes.data.data?.doctors || docRes.data.doctors || docRes.data || []);
      setRadiologists(radRes.data.data?.radiologists || radRes.data.radiologists || radRes.data || []);
      if (aptRes.data.data?.pagination || aptRes.data.pagination) {
        const paginationData = aptRes.data.data?.pagination || aptRes.data.pagination;
        setPagination(prev => ({ ...prev, total: paginationData.total }));
      }
    } catch (err) {
      console.error('Fetch data error:', err);
      setSnackbar({ open: true, message: t('appointments.fetchError'), severity: 'error' });
    }
    setLoading(false);
  }, [pagination.page, pagination.limit, filters]);

  useEffect(() => {
    fetchData();
  }, [pagination.page, pagination.limit, filters, fetchData]);

  // Create or update appointment
  const handleFormSubmit = async (form) => {
    try {
      if (editData) {
        await appointmentAPI.update(editData._id, form);
        setSnackbar({ open: true, message: t('appointments.updateSuccess'), severity: 'success' });
      } else {
        await appointmentAPI.create(form);
        setSnackbar({ open: true, message: t('appointments.createSuccess'), severity: 'success' });
      }
      setFormOpen(false);
      setEditData(null);
      fetchData();
    } catch (err) {
      setSnackbar({ 
        open: true, 
        message: err.response?.data?.message || t('appointments.saveError'), 
        severity: 'error' 
      });
    }
  };

  // Delete appointment
  const handleDelete = async () => {
    try {
      await appointmentAPI.delete(deleteId);
      setSnackbar({ open: true, message: t('appointments.deleteSuccess'), severity: 'success' });
      setDeleteId(null);
      fetchData();
    } catch (err) {
      setSnackbar({ 
        open: true, 
        message: err.response?.data?.message || t('appointments.deleteError'), 
        severity: 'error' 
      });
    }
  };

  // Filter handlers
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Statistics
  const stats = useMemo(() => {
    const total = appointments.length;
    const completed = appointments.filter(apt => apt.status === 'completed').length;
    const pending = appointments.filter(apt => ['scheduled', 'confirmed'].includes(apt.status)).length;
    const cancelled = appointments.filter(apt => apt.status === 'cancelled').length;
    
    return { total, completed, pending, cancelled };
  }, [appointments]);

  if (loading && appointments.length === 0) {
    return (
      <Container>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">{t('appointments.title')}</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchData}
          >
            {t('common.refresh')}
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => { setFormOpen(true); setEditData(null); }}
          >
            {t('appointments.addTitle')}
          </Button>
        </Box>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Schedule color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>{t('common.total')}</Typography>
                  <Typography variant="h4">{stats.total}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CheckCircle color="success" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>{t('appointments.status.completed')}</Typography>
                  <Typography variant="h4">{stats.completed}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Pending color="warning" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>{t('appointments.status.pending')}</Typography>
                  <Typography variant="h4">{stats.pending}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Cancel color="error" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>{t('appointments.status.cancelled')}</Typography>
                  <Typography variant="h4">{stats.cancelled}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              placeholder={t('appointments.searchPlaceholder')}
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>{t('common.status')}</InputLabel>
              <Select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                label={t('common.status')}
              >
                <MenuItem value="">{t('common.all')}</MenuItem>
                <MenuItem value="scheduled">{t('appointments.status.scheduled')}</MenuItem>
                <MenuItem value="confirmed">{t('appointments.status.confirmed')}</MenuItem>
                <MenuItem value="in-progress">{t('appointments.status.inProgress')}</MenuItem>
                <MenuItem value="completed">{t('appointments.status.completed')}</MenuItem>
                <MenuItem value="cancelled">{t('appointments.status.cancelled')}</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>{t('appointments.patient')}</InputLabel>
              <Select
                value={filters.patientId}
                onChange={(e) => handleFilterChange('patientId', e.target.value)}
                label={t('appointments.patient')}
              >
                <MenuItem value="">{t('appointments.allPatients')}</MenuItem>
                {patients.map(p => (
                  <MenuItem key={p._id} value={p._id}>
                    {p.name} - {p.phoneNumber}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>{t('appointments.doctor')}</InputLabel>
              <Select
                value={filters.doctorId}
                onChange={(e) => handleFilterChange('doctorId', e.target.value)}
                label={t('appointments.doctor')}
              >
                <MenuItem value="">{t('appointments.allDoctors')}</MenuItem>
                {doctors.map(d => (
                  <MenuItem key={d._id} value={d._id}>
                    {d.name} ({d.specialization})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label={t('appointments.fromDate')}
                  value={filters.startDate}
                  onChange={(newValue) => handleFilterChange('startDate', newValue)}
                  slotProps={{
                    textField: { size: "small" }
                  }}
                />
                <DatePicker
                  label={t('appointments.toDate')}
                  value={filters.endDate}
                  onChange={(newValue) => handleFilterChange('endDate', newValue)}
                  slotProps={{
                    textField: { size: "small" }
                  }}
                />
              </LocalizationProvider>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* View Mode Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={viewMode} onChange={(e, newValue) => setViewMode(newValue)}>
          <Tab value="table" label={t('appointments.tableView')} icon={<FilterList />} />
          <Tab value="calendar" label={t('appointments.calendarView')} icon={<CalendarMonth />} />
        </Tabs>
      </Box>

      {/* Table View */}
      {viewMode === 'table' && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{t('appointments.patient')}</TableCell>
                <TableCell>{t('appointments.doctor')}</TableCell>
                <TableCell>{t('appointments.radiologist')}</TableCell>
                <TableCell>{t('appointments.dateTime')}</TableCell>
                <TableCell>{t('common.status')}</TableCell>
                <TableCell>{t('appointments.priorityLabel')}</TableCell>
                <TableCell>{t('navigation.scans')}</TableCell>
                <TableCell align="right">{t('common.actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {appointments.map((apt) => (
                <TableRow key={apt._id} hover>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        {apt.patientId?.name || 'Unknown Patient'}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {apt.patientId?.phoneNumber}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        {apt.referredBy?.name || 'Unknown Doctor'}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {apt.referredBy?.specialization}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        {apt.radiologistId?.name || 'Unknown Radiologist'}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {apt.radiologistId?.licenseId}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {apt.scheduledAt ? new Date(apt.scheduledAt).toLocaleString() : ''}
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={statusIcons[apt.status] || <Warning />}
                      label={t(`appointments.status.${apt.status}`) || apt.status}
                      color={statusColors[apt.status] || 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={t(`appointments.priority.${apt.priority}`) || apt.priority}
                      color={apt.priority === 'emergency' ? 'error' : apt.priority === 'urgent' ? 'warning' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box>
                      {apt.scans?.map((scan, index) => (
                        <Typography key={index} variant="caption" display="block">
                          {t(`appointments.types.${scan.scan}`) || scan.scan} (x{scan.quantity})
                        </Typography>
                      ))}
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title={t('common.edit')}>
                      <IconButton 
                        onClick={() => { setEditData(apt); setFormOpen(true); }}
                        size="small"
                      >
                        <Edit />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={t('common.delete')}>
                      <IconButton 
                        color="error" 
                        onClick={() => setDeleteId(apt._id)}
                        size="small"
                      >
                        <Delete />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {appointments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography variant="body1" color="textSecondary">
                      {t('appointments.noAppointmentsFound')}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <Paper sx={{ p: 3, minHeight: 400 }}>
          <Typography variant="h6" gutterBottom>{t('appointments.calendarView')}</Typography>
          <Typography color="textSecondary">
            {t('appointments.calendarViewDescription')}
          </Typography>
        </Paper>
      )}

      {/* Pagination */}
      {pagination.total > pagination.limit && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={Math.ceil(pagination.total / pagination.limit)}
            page={pagination.page}
            onChange={(e, page) => setPagination(prev => ({ ...prev, page }))}
            color="primary"
          />
        </Box>
      )}

      {/* Create/Edit Modal */}
      <AppointmentForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditData(null); }}
        onSubmit={handleFormSubmit}
        initialData={editData}
        patients={patients}
        doctors={doctors}
        radiologists={radiologists}
      />

      {/* Delete Confirmation */}
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)}>
        <DialogTitle>{t('appointments.deleteConfirmTitle')}</DialogTitle>
        <DialogContent>
          <Typography>
            {t('appointments.deleteConfirmMessage')}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>{t('common.cancel')}</Button>
          <Button color="error" onClick={handleDelete}>{t('common.delete')}</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Floating Action Button for quick add */}
      <Fab
        color="primary"
        aria-label={t('appointments.addTitle')}
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => { setFormOpen(true); setEditData(null); }}
      >
        <Add />
      </Fab>
    </Container>
  );
} 