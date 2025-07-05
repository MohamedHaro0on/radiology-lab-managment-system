import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
    CircularProgress,
    Alert,
    Chip,
    IconButton,
    Tooltip,
    Card,
    CardContent,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Divider
} from '@mui/material';
import {
    Refresh as RefreshIcon,
    FilterList as FilterIcon,
    Visibility as ViewIcon,
    ExpandMore as ExpandMoreIcon,
    Timeline as TimelineIcon,
    Person as PersonIcon,
    CalendarToday as CalendarIcon,
    Assignment as AssignmentIcon
} from '@mui/icons-material';
import { auditAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { useRTL } from '../../hooks/useRTL';

const AuditLog = () => {
    const { t } = useTranslation();
    const { isRTL, cardGridProps, iconContainerProps, textContainerProps } = useRTL();
    const [logs, setLogs] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(false);
    const [statsLoading, setStatsLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedLog, setSelectedLog] = useState(null);
    const [isDialogOpen, setDialogOpen] = useState(false);
    
    // Filters
    const [filters, setFilters] = useState({
        action: '',
        startDate: '',
        endDate: '',
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc'
    });

    const fetchLogs = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            
            // Clean up filters to remove empty values
            const cleanFilters = { ...filters };
            if (!cleanFilters.action || cleanFilters.action.trim() === '') {
                delete cleanFilters.action;
            }
            if (!cleanFilters.startDate || cleanFilters.startDate.trim() === '') {
                delete cleanFilters.startDate;
            }
            if (!cleanFilters.endDate || cleanFilters.endDate.trim() === '') {
                delete cleanFilters.endDate;
            }
            
            const response = await auditAPI.getAppointmentLogs(cleanFilters);
            setLogs(response.data.data.logs);
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Error fetching audit logs';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    const fetchStats = useCallback(async () => {
        try {
            setStatsLoading(true);
            
            // Clean up date filters
            const cleanStatsParams = {};
            if (filters.startDate && filters.startDate.trim() !== '') {
                cleanStatsParams.startDate = filters.startDate;
            }
            if (filters.endDate && filters.endDate.trim() !== '') {
                cleanStatsParams.endDate = filters.endDate;
            }
            
            const response = await auditAPI.getAuditStats(cleanStatsParams);
            setStats(response.data.data);
        } catch (err) {
            console.error('Error fetching stats:', err);
        } finally {
            setStatsLoading(false);
        }
    }, [filters.startDate, filters.endDate]);

    useEffect(() => {
        fetchLogs();
        fetchStats();
    }, [fetchLogs, fetchStats]);

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({
            ...prev,
            [field]: value,
            page: 1 // Reset to first page when filters change
        }));
    };

    const handlePageChange = (newPage) => {
        setFilters(prev => ({
            ...prev,
            page: newPage
        }));
    };

    const handleOpenDialog = (log) => {
        setSelectedLog(log);
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setSelectedLog(null);
    };

    const getActionChip = (action) => {
        const colors = {
            CREATE: 'success',
            UPDATE: 'primary',
            DELETE: 'error',
            STATUS_CHANGE: 'warning'
        };
        
        return (
            <Chip 
                label={action} 
                color={colors[action] || 'default'} 
                size="small" 
                variant="outlined"
            />
        );
    };

    const formatChanges = (changes) => {
        if (!changes) return 'No changes recorded';
        
        if (typeof changes === 'object') {
            if (changes.before && changes.after) {
                return 'Updated appointment details';
            } else if (changes.deleted) {
                return 'Appointment deleted';
            } else if (changes.from && changes.to) {
                return `Status changed from ${changes.from} to ${changes.to}`;
            } else {
                return 'Appointment created';
            }
        }
        
        return 'Changes recorded';
    };

    if (loading && logs.length === 0) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Typography 
                variant="h4" 
                gutterBottom
                sx={{ textAlign: isRTL ? 'right' : 'left' }}
            >
                {t('appointmentAuditLog')}
            </Typography>
            
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {/* Statistics Cards */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box sx={cardGridProps}>
                                <Box sx={textContainerProps}>
                                    <Typography 
                                        color="textSecondary" 
                                        gutterBottom
                                        sx={{ textAlign: isRTL ? 'right' : 'left' }}
                                    >
                                        {t('totalLogs')}
                                    </Typography>
                                    <Typography 
                                        variant="h4"
                                        sx={{ textAlign: isRTL ? 'right' : 'left' }}
                                    >
                                        {statsLoading ? <CircularProgress size={24} /> : stats.totalLogs || 0}
                                    </Typography>
                                </Box>
                                <Box sx={iconContainerProps}>
                                    <TimelineIcon />
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
                                        sx={{ textAlign: isRTL ? 'right' : 'left' }}
                                    >
                                        {t('mostActiveUser')}
                                    </Typography>
                                    <Typography 
                                        variant="h6"
                                        sx={{ textAlign: isRTL ? 'right' : 'left' }}
                                    >
                                        {statsLoading ? <CircularProgress size={20} /> : 
                                            stats.userStats?.[0]?.username || 'N/A'}
                                    </Typography>
                                </Box>
                                <Box sx={{ ...iconContainerProps, color: 'primary.main' }}>
                                    <PersonIcon />
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
                                        sx={{ textAlign: isRTL ? 'right' : 'left' }}
                                    >
                                        {t('mostCommonAction')}
                                    </Typography>
                                    <Typography 
                                        variant="h6"
                                        sx={{ textAlign: isRTL ? 'right' : 'left' }}
                                    >
                                        {statsLoading ? <CircularProgress size={20} /> : 
                                            stats.actionStats?.[0]?._id || 'N/A'}
                                    </Typography>
                                </Box>
                                <Box sx={{ ...iconContainerProps, color: 'secondary.main' }}>
                                    <AssignmentIcon />
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
                                        sx={{ textAlign: isRTL ? 'right' : 'left' }}
                                    >
                                        {t('dateRange')}
                                    </Typography>
                                    <Typography 
                                        variant="h6"
                                        sx={{ textAlign: isRTL ? 'right' : 'left' }}
                                    >
                                        {filters.startDate && filters.endDate ? 
                                            `${filters.startDate} to ${filters.endDate}` : t('allTime')}
                                    </Typography>
                                </Box>
                                <Box sx={{ ...iconContainerProps, color: 'info.main' }}>
                                    <CalendarIcon />
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Filters */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Typography 
                    variant="h6" 
                    gutterBottom
                    sx={{ textAlign: isRTL ? 'right' : 'left' }}
                >
                    <FilterIcon sx={{ mr: isRTL ? 0 : 1, ml: isRTL ? 1 : 0, verticalAlign: 'middle' }} />
                    {t('filters')}
                </Typography>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={6} md={2}>
                        <FormControl fullWidth size="small">
                            <InputLabel sx={{ textAlign: isRTL ? 'right' : 'left' }}>
                                {t('action')}
                            </InputLabel>
                            <Select
                                value={filters.action}
                                onChange={(e) => handleFilterChange('action', e.target.value)}
                                label={t('action')}
                                sx={{
                                    '& .MuiSelect-select': {
                                        textAlign: isRTL ? 'right' : 'left',
                                        direction: isRTL ? 'rtl' : 'ltr'
                                    }
                                }}
                            >
                                <MenuItem value="" sx={{ textAlign: isRTL ? 'right' : 'left' }}>
                                    {t('allActions')}
                                </MenuItem>
                                <MenuItem value="CREATE" sx={{ textAlign: isRTL ? 'right' : 'left' }}>
                                    {t('create')}
                                </MenuItem>
                                <MenuItem value="UPDATE" sx={{ textAlign: isRTL ? 'right' : 'left' }}>
                                    {t('update')}
                                </MenuItem>
                                <MenuItem value="DELETE" sx={{ textAlign: isRTL ? 'right' : 'left' }}>
                                    {t('delete')}
                                </MenuItem>
                                <MenuItem value="STATUS_CHANGE" sx={{ textAlign: isRTL ? 'right' : 'left' }}>
                                    {t('statusChange')}
                                </MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
                        <TextField
                            fullWidth
                            size="small"
                            type="date"
                            label={t('startDate')}
                            value={filters.startDate}
                            onChange={(e) => handleFilterChange('startDate', e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            sx={{
                                '& .MuiInputBase-input': {
                                    textAlign: isRTL ? 'right' : 'left',
                                    direction: isRTL ? 'rtl' : 'ltr'
                                },
                                '& .MuiInputLabel-root': {
                                    textAlign: isRTL ? 'right' : 'left'
                                }
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
                        <TextField
                            fullWidth
                            size="small"
                            type="date"
                            label={t('endDate')}
                            value={filters.endDate}
                            onChange={(e) => handleFilterChange('endDate', e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            sx={{
                                '& .MuiInputBase-input': {
                                    textAlign: isRTL ? 'right' : 'left',
                                    direction: isRTL ? 'rtl' : 'ltr'
                                },
                                '& .MuiInputLabel-root': {
                                    textAlign: isRTL ? 'right' : 'left'
                                }
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
                        <FormControl fullWidth size="small">
                            <InputLabel sx={{ textAlign: isRTL ? 'right' : 'left' }}>
                                {t('sortBy')}
                            </InputLabel>
                            <Select
                                value={filters.sortBy}
                                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                                label={t('sortBy')}
                                sx={{
                                    '& .MuiSelect-select': {
                                        textAlign: isRTL ? 'right' : 'left',
                                        direction: isRTL ? 'rtl' : 'ltr'
                                    }
                                }}
                            >
                                <MenuItem value="createdAt" sx={{ textAlign: isRTL ? 'right' : 'left' }}>
                                    {t('timestamp')}
                                </MenuItem>
                                <MenuItem value="action" sx={{ textAlign: isRTL ? 'right' : 'left' }}>
                                    {t('action')}
                                </MenuItem>
                                <MenuItem value="user" sx={{ textAlign: isRTL ? 'right' : 'left' }}>
                                    {t('user')}
                                </MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
                        <FormControl fullWidth size="small">
                            <InputLabel sx={{ textAlign: isRTL ? 'right' : 'left' }}>
                                {t('order')}
                            </InputLabel>
                            <Select
                                value={filters.sortOrder}
                                onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                                label={t('order')}
                                sx={{
                                    '& .MuiSelect-select': {
                                        textAlign: isRTL ? 'right' : 'left',
                                        direction: isRTL ? 'rtl' : 'ltr'
                                    }
                                }}
                            >
                                <MenuItem value="desc" sx={{ textAlign: isRTL ? 'right' : 'left' }}>
                                    {t('newestFirst')}
                                </MenuItem>
                                <MenuItem value="asc" sx={{ textAlign: isRTL ? 'right' : 'left' }}>
                                    {t('oldestFirst')}
                                </MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
                        <Button
                            variant="outlined"
                            startIcon={<RefreshIcon />}
                            onClick={() => {
                                setFilters({
                                    action: '',
                                    startDate: '',
                                    endDate: '',
                                    page: 1,
                                    limit: 20,
                                    sortBy: 'createdAt',
                                    sortOrder: 'desc'
                                });
                            }}
                            fullWidth
                            sx={{ textAlign: isRTL ? 'right' : 'left' }}
                        >
                            {t('reset')}
                        </Button>
                    </Grid>
                </Grid>
            </Paper>

            {/* Audit Logs Table */}
            <Paper sx={{ overflow: 'hidden' }}>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ backgroundColor: 'primary.main' }}>
                                <TableCell sx={{ color: 'white', fontWeight: 'bold', textAlign: isRTL ? 'right' : 'left' }}>
                                    {t('action')}
                                </TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 'bold', textAlign: isRTL ? 'right' : 'left' }}>
                                    {t('user')}
                                </TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 'bold', textAlign: isRTL ? 'right' : 'left' }}>
                                    {t('appointment')}
                                </TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 'bold', textAlign: isRTL ? 'right' : 'left' }}>
                                    {t('changes')}
                                </TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 'bold', textAlign: isRTL ? 'right' : 'left' }}>
                                    {t('timestamp')}
                                </TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 'bold', textAlign: isRTL ? 'left' : 'right' }}>
                                    {t('actions')}
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {logs.map((log) => (
                                <TableRow key={log.id} hover>
                                    <TableCell sx={{ textAlign: isRTL ? 'right' : 'left' }}>
                                        {getActionChip(log.action)}
                                    </TableCell>
                                    <TableCell sx={{ textAlign: isRTL ? 'right' : 'left' }}>
                                        {log.user ? (
                                            <Box>
                                                <Typography 
                                                    variant="subtitle2" 
                                                    fontWeight="bold"
                                                    sx={{ textAlign: isRTL ? 'right' : 'left' }}
                                                >
                                                    {log.user.username}
                                                </Typography>
                                                <Typography 
                                                    variant="body2" 
                                                    color="textSecondary"
                                                    sx={{ textAlign: isRTL ? 'right' : 'left' }}
                                                >
                                                    {log.user.email}
                                                </Typography>
                                            </Box>
                                        ) : (
                                            <Typography 
                                                variant="body2" 
                                                color="textSecondary"
                                                sx={{ textAlign: isRTL ? 'right' : 'left' }}
                                            >
                                                {t('unknownUser')}
                                            </Typography>
                                        )}
                                    </TableCell>
                                    <TableCell sx={{ textAlign: isRTL ? 'right' : 'left' }}>
                                        <Typography 
                                            variant="body2"
                                            sx={{ textAlign: isRTL ? 'right' : 'left' }}
                                        >
                                            {log.appointment ? (
                                                <Box>
                                                    <Typography 
                                                        variant="body2"
                                                        sx={{ textAlign: isRTL ? 'right' : 'left' }}
                                                    >
                                                        {t('appointment')} #{log.appointment.id.slice(-6)}
                                                    </Typography>
                                                    <Typography 
                                                        variant="caption" 
                                                        color="textSecondary"
                                                        sx={{ textAlign: isRTL ? 'right' : 'left' }}
                                                    >
                                                        {log.appointment.scheduledAt ? 
                                                            new Date(log.appointment.scheduledAt).toLocaleDateString() : 
                                                            t('noDate')}
                                                    </Typography>
                                                </Box>
                                            ) : (
                                                t('appointmentDeleted')
                                            )}
                                        </Typography>
                                    </TableCell>
                                    <TableCell sx={{ textAlign: isRTL ? 'right' : 'left' }}>
                                        <Typography 
                                            variant="body2"
                                            sx={{ textAlign: isRTL ? 'right' : 'left' }}
                                        >
                                            {log.changes ? (
                                                <Box>
                                                    {log.action === 'CREATE' && (
                                                        <Typography 
                                                            variant="caption" 
                                                            color="success.main"
                                                            sx={{ textAlign: isRTL ? 'right' : 'left' }}
                                                        >
                                                            {t('appointmentCreated')}
                                                        </Typography>
                                                    )}
                                                    {log.action === 'DELETE' && (
                                                        <Typography 
                                                            variant="caption" 
                                                            color="error.main"
                                                            sx={{ textAlign: isRTL ? 'right' : 'left' }}
                                                        >
                                                            {t('appointmentDeleted')}
                                                        </Typography>
                                                    )}
                                                    {log.action === 'UPDATE' && (
                                                        <Typography 
                                                            variant="caption" 
                                                            color="info.main"
                                                            sx={{ textAlign: isRTL ? 'right' : 'left' }}
                                                        >
                                                            {t('updatedAppointmentDetails')}
                                                        </Typography>
                                                    )}
                                                    {log.action === 'STATUS_CHANGE' && (
                                                        <Typography 
                                                            variant="caption" 
                                                            color="warning.main"
                                                            sx={{ textAlign: isRTL ? 'right' : 'left' }}
                                                        >
                                                            {t('statusChange')}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            ) : (
                                                <Typography 
                                                    variant="caption" 
                                                    color="textSecondary"
                                                    sx={{ textAlign: isRTL ? 'right' : 'left' }}
                                                >
                                                    {t('noChangesRecorded')}
                                                </Typography>
                                            )}
                                        </Typography>
                                    </TableCell>
                                    <TableCell sx={{ textAlign: isRTL ? 'right' : 'left' }}>
                                        <Typography 
                                            variant="body2"
                                            sx={{ textAlign: isRTL ? 'right' : 'left' }}
                                        >
                                            {log.formattedTimestamp}
                                        </Typography>
                                    </TableCell>
                                    <TableCell sx={{ textAlign: isRTL ? 'left' : 'right' }}>
                                        <Tooltip title={t('viewDetails')}>
                                            <IconButton
                                                color="primary"
                                                onClick={() => handleOpenDialog(log)}
                                                size="small"
                                            >
                                                <ViewIcon />
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {/* Pagination */}
            {logs.length > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                    <Button
                        disabled={filters.page === 1}
                        onClick={() => handlePageChange(filters.page - 1)}
                        sx={{ mr: 1 }}
                    >
                        {t('previous')}
                    </Button>
                    <Typography variant="body2" sx={{ alignSelf: 'center', mx: 2 }}>
                        {t('page')} {filters.page}
                    </Typography>
                    <Button
                        disabled={logs.length < filters.limit}
                        onClick={() => handlePageChange(filters.page + 1)}
                        sx={{ ml: 1 }}
                    >
                        {t('next')}
                    </Button>
                </Box>
            )}

            {/* Details Dialog */}
            {selectedLog && (
                <Dialog open={isDialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                    <DialogTitle>
                        <Typography variant="h6">
                            {t('auditLogDetails')}
                        </Typography>
                    </DialogTitle>
                    <DialogContent>
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                    {t('actionInformation')}
                                </Typography>
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" color="textSecondary">
                                        {t('actionType')}
                                    </Typography>
                                    {getActionChip(selectedLog.action)}
                                </Box>
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" color="textSecondary">
                                        {t('timestamp')}
                                    </Typography>
                                    <Typography variant="body1">
                                        {selectedLog.formattedTimestamp}
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                    {t('userInformation')}
                                </Typography>
                                {selectedLog.user ? (
                                    <Box>
                                        <Typography variant="body2" color="textSecondary">
                                            {t('username')}
                                        </Typography>
                                        <Typography variant="body1" gutterBottom>
                                            {selectedLog.user.username}
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            {t('email')}
                                        </Typography>
                                        <Typography variant="body1">
                                            {selectedLog.user.email}
                                        </Typography>
                                    </Box>
                                ) : (
                                    <Typography variant="body2" color="textSecondary">
                                        {t('userInfoNotAvailable')}
                                    </Typography>
                                )}
                            </Grid>
                            <Grid item xs={12}>
                                <Divider sx={{ my: 2 }} />
                                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                    {t('changesDetails')}
                                </Typography>
                                <Box>
                                    <Button
                                        variant="outlined"
                                        startIcon={<ViewIcon />}
                                        onClick={() => {
                                            console.log('Changes:', selectedLog.changes);
                                            // You can implement a more detailed view here
                                        }}
                                    >
                                        {t('viewChanges')}
                                    </Button>
                                </Box>
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDialog}>
                            {t('close')}
                        </Button>
                    </DialogActions>
                </Dialog>
            )}
        </Box>
    );
};

export default AuditLog; 