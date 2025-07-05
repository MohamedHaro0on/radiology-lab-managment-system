import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Container, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, CircularProgress, IconButton, Snackbar, Alert, Box, Chip,
  FormControl, InputLabel, Select, MenuItem, Grid, Card, CardContent,
  Tabs, Tab, Pagination, InputAdornment, Tooltip, Fab, FormControlLabel, Switch
} from '@mui/material';
import {
  Add, Edit, Delete, Search, FilterList, CalendarMonth, 
  Schedule, Refresh,
  CheckCircle, Cancel, Pending, Warning,
  History as HistoryIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { appointmentAPI, patientAPI, doctorAPI, userAPI, branchAPI, scanAPI } from '../../services/api';
import { representativeService } from '../../services/representativeService';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useRTL } from '../../hooks/useRTL';

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
function AppointmentForm({ open, onClose, onSubmit, initialData, patients, doctors, radiologists, branches, scans }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [form, setForm] = useState(initialData || {
    radiologistId: '',
    patientId: '',
    scans: [{ scan: '', quantity: 1 }],
    referredBy: '',
    branch: '',
    scheduledDate: null,
    scheduledTime: null,
    notes: '',
    priority: 'routine',
    makeHugeSale: false,
    customPrice: null
  });

  const [errors, setErrors] = useState({});
  const [calculatedPrice, setCalculatedPrice] = useState(0);

  useEffect(() => {
    const initialDate = initialData?.scheduledAt ? new Date(initialData.scheduledAt) : null;

    setForm(initialData ? 
        { ...initialData, scheduledDate: initialDate, scheduledTime: initialDate } :
        {
            radiologistId: '',
            patientId: '',
            scans: [{ scan: '', quantity: 1 }],
            referredBy: '',
            branch: '',
            scheduledDate: null,
            scheduledTime: null,
            notes: '',
            priority: 'routine',
            makeHugeSale: false,
            customPrice: null
        }
    );
    setErrors({});
  }, [initialData, open]);

  useEffect(() => {
    if (form.patientId) {
      const selectedPatient = patients.find(p => p._id === form.patientId);
      if (selectedPatient && selectedPatient.doctorReferred) {
        setForm(prev => ({ ...prev, referredBy: selectedPatient.doctorReferred._id }));
      }
    }
  }, [form.patientId, patients]);

  useEffect(() => {
    const total = form.scans.reduce((acc, currentScan) => {
      const scanDetails = scans.find(s => s._id === currentScan.scan);
      const price = scanDetails?.minPrice || 0;
      const quantity = currentScan.quantity || 0;
      return acc + (price * quantity);
    }, 0);
    setCalculatedPrice(total);
  }, [form.scans, scans]);

  // Check if user has makeHugeSale privilege
  const hasHugeSalePrivilege = user?.isSuperAdmin || user?.privileges?.some(p => 
    p.module === 'appointments' && p.operation === 'makeHugeSale'
  );

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setForm(prev => ({ ...prev, [name]: newValue }));
    
    // If makeHugeSale is unchecked, clear customPrice
    if (name === 'makeHugeSale' && !checked) {
      setForm(prev => ({ ...prev, customPrice: null }));
    }
    
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
    if (!form.scheduledDate) newErrors.scheduledDate = t('appointments.dateRequired');
    if (!form.scheduledTime) newErrors.scheduledTime = 'Time is required';
    if (!form.branch) newErrors.branch = t('appointments.branchRequired');
    
    // Validate custom price if huge sale is enabled
    if (form.makeHugeSale && (!form.customPrice || form.customPrice <= 0)) {
      newErrors.customPrice = 'Custom price is required and must be greater than 0';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      const { scheduledDate, scheduledTime, ...restOfForm } = form;
      
      const combinedDateTime = new Date(scheduledDate);
      combinedDateTime.setHours(new Date(scheduledTime).getHours());
      combinedDateTime.setMinutes(new Date(scheduledTime).getMinutes());
      
      const submissionData = {
          ...restOfForm,
          scheduledAt: combinedDateTime.toISOString()
      };
      onSubmit(submissionData);
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
              <FormControl fullWidth error={!!errors.branch}>
                <InputLabel>{t('appointments.branchLabel')}</InputLabel>
                <Select
                  name="branch"
                  value={form.branch}
                  onChange={handleChange}
                  label={t('appointments.branchLabel')}
                >
                  {branches.map(b => (
                    <MenuItem key={b._id} value={b._id}>
                      {b.name}
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
                  {(Array.isArray(radiologists) ? radiologists : []).map(r => (
                    <MenuItem key={r._id} value={r._id}>
                      {r.name}
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
                  label={t('appointments.date')}
                  value={form.scheduledDate}
                  onChange={(newValue) => {
                    setForm(prev => ({ ...prev, scheduledDate: newValue }));
                  }}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: !!errors.scheduledDate,
                      helperText: errors.scheduledDate
                    }
                  }}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <TimePicker
                  label={t('appointments.time')}
                  value={form.scheduledTime}
                  onChange={(newValue) => {
                    setForm(prev => ({ ...prev, scheduledTime: newValue }));
                  }}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: !!errors.scheduledTime,
                      helperText: errors.scheduledTime
                    }
                  }}
                />
              </LocalizationProvider>
            </Grid>

            {/* Huge Sale Section */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">
                  Calculated Price: ${calculatedPrice.toFixed(2)}
                </Typography>
                {hasHugeSalePrivilege && (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={form.makeHugeSale}
                        onChange={handleChange}
                        name="makeHugeSale"
                        color="primary"
                      />
                    }
                    label="Make Huge Sale (Override Price)"
                  />
                )}
              </Box>
            </Grid>

            {form.makeHugeSale && hasHugeSalePrivilege && (
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  name="customPrice"
                  label="Custom Total Price"
                  value={form.customPrice || ''}
                  onChange={handleChange}
                  error={!!errors.customPrice}
                  helperText={errors.customPrice || 'Enter the total price for this appointment'}
                  inputProps={{ min: 0, step: 0.01 }}
                />
              </Grid>
            )}

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
                    {scans.map(s => (
                      <MenuItem key={s._id} value={s._id}>
                        {s.name} - ${s.minPrice}
                      </MenuItem>
                    ))}
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
  const { isRTL, cardGridProps, iconContainerProps, textContainerProps, containerProps } = useRTL();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [radiologists, setRadiologists] = useState([]);
  const [branches, setBranches] = useState([]);
  const [scans, setScans] = useState([]);
  const [representatives, setRepresentatives] = useState([]);
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
    doctorId: '',
    representativeId: ''
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
        ...(filters.representativeId ? { representativeId: filters.representativeId } : {}),
        ...(filters.startDate ? { startDate: filters.startDate } : {}),
        ...(filters.endDate ? { endDate: filters.endDate } : {}),
      };
      const [aptRes, patRes, docRes, radRes, branchRes, scansRes, repsRes] = await Promise.all([
        appointmentAPI.getAllAppointments(params),
        patientAPI.getAll({ page: 1, limit: 100 }),
        doctorAPI.getAll({ page: 1, limit: 100 }),
        userAPI.getRadiologists({ page: 1, limit: 100 }),
        branchAPI.getAll({ status: 'active', limit: 100 }),
        scanAPI.getAll({ page: 1, limit: 100 }),
        representativeService.getRepresentativesForDropdown()
      ]);
      setAppointments(aptRes.data.data?.appointments || aptRes.data.appointments || aptRes.data || []);
      setPatients(patRes.data.data?.patients || []);
      setDoctors(docRes.data.data?.doctors || []);
      // Defensive: always set radiologists as array
      const users = radRes?.data?.data?.data?.users;
      const radiologistList = Array.isArray(users) ? users : [];
      setRadiologists(radiologistList);
      setBranches(branchRes.data.data?.branches || []);
      setScans(scansRes.data.data?.scans || []);
      setRepresentatives(repsRes.data);
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
        await appointmentAPI.updateAppointment(editData._id, form);
        setSnackbar({ open: true, message: t('appointments.updateSuccess'), severity: 'success' });
      } else {
        await appointmentAPI.createAppointment(form);
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
      await appointmentAPI.deleteAppointment(deleteId);
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

  const handleEdit = (appointment) => {
    setEditData(appointment);
    setFormOpen(true);
  };

  const handleViewHistory = (id) => {
    navigate(`/appointments/${id}/history`);
  };

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
    <Container maxWidth="xl" sx={{ ...containerProps }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3,
        flexDirection: isRTL ? 'row-reverse' : 'row'
      }}>
        <Typography 
          variant="h4"
        >
          {t('appointments.title')}
        </Typography>
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
      <Grid container spacing={3} sx={{ mb: 3, ...containerProps }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={cardGridProps}>
                <Box sx={textContainerProps}>
                  <Typography 
                    color="textSecondary" 
                    gutterBottom
                  >
                    {t('common.total')}
                  </Typography>
                  <Typography 
                    variant="h4"
                  >
                    {stats.total}
                  </Typography>
                </Box>
                <Box sx={{ ...iconContainerProps, color: 'primary.main' }}>
                  <Schedule />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={cardGridProps}>
                <Box sx={textContainerProps}>
                  <Typography 
                    color="textSecondary" 
                    gutterBottom
                  >
                    {t('appointments.status.completed')}
                  </Typography>
                  <Typography 
                    variant="h4"
                  >
                    {stats.completed}
                  </Typography>
                </Box>
                <Box sx={{ ...iconContainerProps, color: 'success.main' }}>
                  <CheckCircle />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={cardGridProps}>
                <Box sx={textContainerProps}>
                  <Typography 
                    color="textSecondary" 
                    gutterBottom
                  >
                    {t('appointments.status.pending')}
                  </Typography>
                  <Typography 
                    variant="h4"
                  >
                    {stats.pending}
                  </Typography>
                </Box>
                <Box sx={{ ...iconContainerProps, color: 'warning.main' }}>
                  <Pending />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={cardGridProps}>
                <Box sx={textContainerProps}>
                  <Typography 
                    color="textSecondary" 
                    gutterBottom
                  >
                    {t('appointments.status.cancelled')}
                  </Typography>
                  <Typography 
                    variant="h4"
                  >
                    {stats.cancelled}
                  </Typography>
                </Box>
                <Box sx={{ ...iconContainerProps, color: 'error.main' }}>
                  <Cancel />
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
              sx={{
                '& .MuiInputBase-input': {
                  textAlign: isRTL ? 'right' : 'left',
                  direction: isRTL ? 'rtl' : 'ltr'
                }
              }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel sx={{ textAlign: isRTL ? 'right' : 'left' }}>
                {t('common.status')}
              </InputLabel>
              <Select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                label={t('common.status')}
                sx={{
                  '& .MuiSelect-select': {
                    textAlign: isRTL ? 'right' : 'left',
                    direction: isRTL ? 'rtl' : 'ltr'
                  }
                }}
              >
                <MenuItem value="" sx={{ textAlign: isRTL ? 'right' : 'left' }}>
                  {t('common.all')}
                </MenuItem>
                <MenuItem value="scheduled" sx={{ textAlign: isRTL ? 'right' : 'left' }}>
                  {t('appointments.status.scheduled')}
                </MenuItem>
                <MenuItem value="confirmed" sx={{ textAlign: isRTL ? 'right' : 'left' }}>
                  {t('appointments.status.confirmed')}
                </MenuItem>
                <MenuItem value="in-progress" sx={{ textAlign: isRTL ? 'right' : 'left' }}>
                  {t('appointments.status.inProgress')}
                </MenuItem>
                <MenuItem value="completed" sx={{ textAlign: isRTL ? 'right' : 'left' }}>
                  {t('appointments.status.completed')}
                </MenuItem>
                <MenuItem value="cancelled" sx={{ textAlign: isRTL ? 'right' : 'left' }}>
                  {t('appointments.status.cancelled')}
                </MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel sx={{ textAlign: isRTL ? 'right' : 'left' }}>
                {t('appointments.patient')}
              </InputLabel>
              <Select
                value={filters.patientId}
                onChange={(e) => handleFilterChange('patientId', e.target.value)}
                label={t('appointments.patient')}
                sx={{
                  '& .MuiSelect-select': {
                    textAlign: isRTL ? 'right' : 'left',
                    direction: isRTL ? 'rtl' : 'ltr'
                  }
                }}
              >
                <MenuItem value="" sx={{ textAlign: isRTL ? 'right' : 'left' }}>
                  {t('appointments.allPatients')}
                </MenuItem>
                {patients.map(p => (
                  <MenuItem key={p._id} value={p._id} sx={{ textAlign: isRTL ? 'right' : 'left' }}>
                    {p.name} - {p.phoneNumber}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel sx={{ textAlign: isRTL ? 'right' : 'left' }}>
                {t('appointments.doctor')}
              </InputLabel>
              <Select
                value={filters.doctorId}
                onChange={(e) => handleFilterChange('doctorId', e.target.value)}
                label={t('appointments.doctor')}
                sx={{
                  '& .MuiSelect-select': {
                    textAlign: isRTL ? 'right' : 'left',
                    direction: isRTL ? 'rtl' : 'ltr'
                  }
                }}
              >
                <MenuItem value="" sx={{ textAlign: isRTL ? 'right' : 'left' }}>
                  {t('appointments.allDoctors')}
                </MenuItem>
                {doctors.map(d => (
                  <MenuItem key={d._id} value={d._id} sx={{ textAlign: isRTL ? 'right' : 'left' }}>
                    {d.name} ({d.specialization})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel sx={{ textAlign: isRTL ? 'right' : 'left' }}>
                {t('representatives.title')}
              </InputLabel>
              <Select
                value={filters.representativeId}
                onChange={(e) => handleFilterChange('representativeId', e.target.value)}
                label={t('representatives.title')}
                sx={{
                  '& .MuiSelect-select': {
                    textAlign: isRTL ? 'right' : 'left',
                    direction: isRTL ? 'rtl' : 'ltr'
                  }
                }}
              >
                <MenuItem value="" sx={{ textAlign: isRTL ? 'right' : 'left' }}>
                  {t('representatives.allRepresentatives')}
                </MenuItem>
                {representatives.map(r => (
                  <MenuItem key={r._id} value={r._id} sx={{ textAlign: isRTL ? 'right' : 'left' }}>
                    {r.name} ({r.id})
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
                    textField: { 
                      size: "small",
                      sx: {
                        '& .MuiInputBase-input': {
                          textAlign: isRTL ? 'right' : 'left',
                          direction: isRTL ? 'rtl' : 'ltr'
                        },
                        '& .MuiInputLabel-root': {
                          textAlign: isRTL ? 'right' : 'left'
                        }
                      }
                    }
                  }}
                />
                <DatePicker
                  label={t('appointments.toDate')}
                  value={filters.endDate}
                  onChange={(newValue) => handleFilterChange('endDate', newValue)}
                  slotProps={{
                    textField: { 
                      size: "small",
                      sx: {
                        '& .MuiInputBase-input': {
                          textAlign: isRTL ? 'right' : 'left',
                          direction: isRTL ? 'rtl' : 'ltr'
                        },
                        '& .MuiInputLabel-root': {
                          textAlign: isRTL ? 'right' : 'left'
                        }
                      }
                    }
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
          <Tab 
            value="table" 
            label={t('appointments.tableView')} 
            icon={<FilterList />} 
            sx={{ textAlign: isRTL ? 'right' : 'left' }}
          />
          <Tab 
            value="calendar" 
            label={t('appointments.calendarView')} 
            icon={<CalendarMonth />} 
            sx={{ textAlign: isRTL ? 'right' : 'left' }}
          />
        </Tabs>
      </Box>

      {/* Table View */}
      {viewMode === 'table' && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ textAlign: isRTL ? 'right' : 'left' }}>
                  {t('appointments.patient')}
                </TableCell>
                <TableCell sx={{ textAlign: isRTL ? 'right' : 'left' }}>
                  {t('appointments.doctor')}
                </TableCell>
                <TableCell sx={{ textAlign: isRTL ? 'right' : 'left' }}>
                  {t('appointments.radiologist')}
                </TableCell>
                <TableCell sx={{ textAlign: isRTL ? 'right' : 'left' }}>
                  {t('appointments.branch')}
                </TableCell>
                <TableCell sx={{ textAlign: isRTL ? 'right' : 'left' }}>
                  {t('appointments.dateTime')}
                </TableCell>
                <TableCell sx={{ textAlign: isRTL ? 'right' : 'left' }}>
                  {t('common.status')}
                </TableCell>
                <TableCell sx={{ textAlign: isRTL ? 'right' : 'left' }}>
                  {t('appointments.priorityLabel')}
                </TableCell>
                <TableCell sx={{ textAlign: isRTL ? 'right' : 'left' }}>
                  {t('common.price')}
                </TableCell>
                <TableCell sx={{ textAlign: isRTL ? 'right' : 'left' }}>
                  {t('navigation.scans')}
                </TableCell>
                <TableCell align={isRTL ? "left" : "right"}>
                  {t('common.actions')}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {appointments.map((apt) => (
                <TableRow key={apt._id} hover>
                  <TableCell sx={{ textAlign: isRTL ? 'right' : 'left' }}>
                    <Box>
                      <Typography 
                        variant="body2" 
                        fontWeight="bold"
                        sx={{ textAlign: isRTL ? 'right' : 'left' }}
                      >
                        {apt.patientId?.name || 'Unknown Patient'}
                      </Typography>
                      <Typography 
                        variant="caption" 
                        color="textSecondary"
                        sx={{ textAlign: isRTL ? 'right' : 'left' }}
                      >
                        {apt.patientId?.phoneNumber}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ textAlign: isRTL ? 'right' : 'left' }}>
                    <Box>
                      <Typography 
                        variant="body2" 
                        fontWeight="bold"
                        sx={{ textAlign: isRTL ? 'right' : 'left' }}
                      >
                        {apt.referredBy?.name || 'Unknown Doctor'}
                      </Typography>
                      <Typography 
                        variant="caption" 
                        color="textSecondary"
                        sx={{ textAlign: isRTL ? 'right' : 'left' }}
                      >
                        {apt.referredBy?.specialization}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ textAlign: isRTL ? 'right' : 'left' }}>
                    <Box>
                      <Typography 
                        variant="body2" 
                        fontWeight="bold"
                        sx={{ textAlign: isRTL ? 'right' : 'left' }}
                      >
                        {apt.radiologistId?.name || 'Unknown Radiologist'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ textAlign: isRTL ? 'right' : 'left' }}>
                    <Typography 
                      variant="body2"
                      sx={{ textAlign: isRTL ? 'right' : 'left' }}
                    >
                      {apt.branch?.name || 'Unknown Branch'}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ textAlign: isRTL ? 'right' : 'left' }}>
                    {apt.scheduledAt ? new Date(apt.scheduledAt).toLocaleString() : ''}
                  </TableCell>
                  <TableCell sx={{ textAlign: isRTL ? 'right' : 'left' }}>
                    <Chip
                      icon={statusIcons[apt.status] || <Warning />}
                      label={t(`appointments.status.${apt.status}`) || apt.status}
                      color={statusColors[apt.status] || 'default'}
                      size="small"
                      sx={{ textAlign: isRTL ? 'right' : 'left' }}
                    />
                  </TableCell>
                  <TableCell sx={{ textAlign: isRTL ? 'right' : 'left' }}>
                    <Chip
                      label={t(`appointments.priority.${apt.priority}`) || apt.priority}
                      color={apt.priority === 'emergency' ? 'error' : apt.priority === 'urgent' ? 'warning' : 'default'}
                      size="small"
                      sx={{ textAlign: isRTL ? 'right' : 'left' }}
                    />
                  </TableCell>
                  <TableCell sx={{ textAlign: isRTL ? 'right' : 'left' }}>
                    <Box>
                      <Typography 
                        variant="body2" 
                        fontWeight="bold"
                        sx={{ textAlign: isRTL ? 'right' : 'left' }}
                      >
                        ${apt.price?.toFixed(2) || '0.00'}
                      </Typography>
                      {apt.makeHugeSale && (
                        <Chip
                          label="Huge Sale"
                          color="secondary"
                          size="small"
                          variant="outlined"
                          sx={{ 
                            mt: 0.5,
                            textAlign: isRTL ? 'right' : 'left'
                          }}
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ textAlign: isRTL ? 'right' : 'left' }}>
                    <Box>
                      {apt.scans?.map((scanItem, index) => {
                        const scanData = scans.find(s => s._id === scanItem.scan);
                        return (
                          <Typography 
                            key={index} 
                            variant="caption" 
                            display="block"
                            sx={{ textAlign: isRTL ? 'right' : 'left' }}
                          >
                            {scanData?.name || 'Unknown Scan'} (x{scanItem.quantity})
                          </Typography>
                        );
                      })}
                    </Box>
                  </TableCell>
                  <TableCell align={isRTL ? "left" : "right"}>
                    <Box sx={{ 
                      display: 'flex', 
                      gap: 1,
                      justifyContent: isRTL ? 'flex-start' : 'flex-end'
                    }}>
                      <Tooltip title={t('common.edit')}>
                        <IconButton 
                          onClick={() => handleEdit(apt)}
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
                      <Tooltip title={t('appointments.viewHistory')}>
                        <IconButton 
                          onClick={() => handleViewHistory(apt._id)}
                          size="small"
                        >
                          <HistoryIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
              {appointments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} align="center">
                    <Typography 
                      variant="body1" 
                      color="textSecondary"
                      sx={{ textAlign: isRTL ? 'right' : 'left' }}
                    >
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
          <Typography 
            variant="h6" 
            gutterBottom
            sx={{ textAlign: isRTL ? 'right' : 'left' }}
          >
            {t('appointments.calendarView')}
          </Typography>
          <Typography 
            color="textSecondary"
            sx={{ textAlign: isRTL ? 'right' : 'left' }}
          >
            {t('appointments.calendarViewDescription')}
          </Typography>
        </Paper>
      )}

      {/* Pagination */}
      {pagination.total > pagination.limit && (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          mt: 3,
          flexDirection: isRTL ? 'row-reverse' : 'row'
        }}>
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
        branches={branches}
        scans={scans}
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