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
    AccordionDetails
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

const AuditLog = () => {
    const { t } = useTranslation();
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
        <Box>
            <Typography variant="h4" gutterBottom>
                Appointment Audit Log
            </Typography>
            
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {/* Statistics Cards */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Total Logs
                            </Typography>
                            <Typography variant="h4">
                                {statsLoading ? <CircularProgress size={24} /> : stats.totalLogs || 0}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Most Active User
                            </Typography>
                            <Typography variant="h6">
                                {statsLoading ? <CircularProgress size={20} /> : 
                                    stats.userStats?.[0]?.username || 'N/A'}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Most Common Action
                            </Typography>
                            <Typography variant="h6">
                                {statsLoading ? <CircularProgress size={20} /> : 
                                    stats.actionStats?.[0]?._id || 'N/A'}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Date Range
                            </Typography>
                            <Typography variant="h6">
                                {filters.startDate && filters.endDate ? 
                                    `${filters.startDate} to ${filters.endDate}` : 'All Time'}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Filters */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    <FilterIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Filters
                </Typography>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={6} md={2}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Action</InputLabel>
                            <Select
                                value={filters.action}
                                onChange={(e) => handleFilterChange('action', e.target.value)}
                                label="Action"
                            >
                                <MenuItem value="">All Actions</MenuItem>
                                <MenuItem value="CREATE">Create</MenuItem>
                                <MenuItem value="UPDATE">Update</MenuItem>
                                <MenuItem value="DELETE">Delete</MenuItem>
                                <MenuItem value="STATUS_CHANGE">Status Change</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
                        <TextField
                            fullWidth
                            size="small"
                            type="date"
                            label="Start Date"
                            value={filters.startDate}
                            onChange={(e) => handleFilterChange('startDate', e.target.value)}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
                        <TextField
                            fullWidth
                            size="small"
                            type="date"
                            label="End Date"
                            value={filters.endDate}
                            onChange={(e) => handleFilterChange('endDate', e.target.value)}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Sort By</InputLabel>
                            <Select
                                value={filters.sortBy}
                                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                                label="Sort By"
                            >
                                <MenuItem value="createdAt">Date</MenuItem>
                                <MenuItem value="action">Action</MenuItem>
                                <MenuItem value="user">User</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Order</InputLabel>
                            <Select
                                value={filters.sortOrder}
                                onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                                label="Order"
                            >
                                <MenuItem value="desc">Newest First</MenuItem>
                                <MenuItem value="asc">Oldest First</MenuItem>
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
                        >
                            Reset
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
                                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Action</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>User</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Appointment</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Changes</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Timestamp</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {logs.map((log) => (
                                <TableRow key={log.id} hover>
                                    <TableCell>
                                        {getActionChip(log.action)}
                                    </TableCell>
                                    <TableCell>
                                        {log.user ? (
                                            <Box>
                                                <Typography variant="subtitle2" fontWeight="bold">
                                                    {log.user.username}
                                                </Typography>
                                                <Typography variant="body2" color="textSecondary">
                                                    {log.user.email}
                                                </Typography>
                                            </Box>
                                        ) : (
                                            <Typography variant="body2" color="textSecondary">
                                                Unknown User
                                            </Typography>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {log.appointment ? (
                                            <Box>
                                                <Typography variant="subtitle2" fontWeight="bold">
                                                    ID: {log.appointment.id.slice(-8)}
                                                </Typography>
                                                <Typography variant="body2" color="textSecondary">
                                                    {log.appointment.scheduledAt ? 
                                                        new Date(log.appointment.scheduledAt).toLocaleDateString() : 
                                                        'N/A'
                                                    }
                                                </Typography>
                                                <Chip 
                                                    label={log.appointment.status} 
                                                    size="small" 
                                                    variant="outlined"
                                                />
                                            </Box>
                                        ) : (
                                            <Typography variant="body2" color="textSecondary">
                                                Appointment Deleted
                                            </Typography>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" noWrap>
                                            {formatChanges(log.changes)}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">
                                            {log.formattedTimestamp}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Tooltip title="View Details">
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
                        Previous
                    </Button>
                    <Typography variant="body2" sx={{ alignSelf: 'center', mx: 2 }}>
                        Page {filters.page}
                    </Typography>
                    <Button
                        disabled={logs.length < filters.limit}
                        onClick={() => handlePageChange(filters.page + 1)}
                        sx={{ ml: 1 }}
                    >
                        Next
                    </Button>
                </Box>
            )}

            {/* Details Dialog */}
            {selectedLog && (
                <Dialog open={isDialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                    <DialogTitle>
                        <Typography variant="h6">
                            Audit Log Details
                        </Typography>
                    </DialogTitle>
                    <DialogContent>
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                    Action Information
                                </Typography>
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" color="textSecondary">
                                        Action Type
                                    </Typography>
                                    {getActionChip(selectedLog.action)}
                                </Box>
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" color="textSecondary">
                                        Timestamp
                                    </Typography>
                                    <Typography variant="body1">
                                        {selectedLog.formattedTimestamp}
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                    User Information
                                </Typography>
                                {selectedLog.user ? (
                                    <Box>
                                        <Typography variant="body2" color="textSecondary">
                                            Username
                                        </Typography>
                                        <Typography variant="body1" gutterBottom>
                                            {selectedLog.user.username}
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            Email
                                        </Typography>
                                        <Typography variant="body1">
                                            {selectedLog.user.email}
                                        </Typography>
                                    </Box>
                                ) : (
                                    <Typography variant="body2" color="textSecondary">
                                        User information not available
                                    </Typography>
                                )}
                            </Grid>
                            <Grid item xs={12}>
                                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                    Changes Details
                                </Typography>
                                <Accordion>
                                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                        <Typography>View Changes</Typography>
                                    </AccordionSummary>
                                    <AccordionDetails>
                                        <pre style={{ 
                                            backgroundColor: '#f5f5f5', 
                                            padding: '10px', 
                                            borderRadius: '4px',
                                            overflow: 'auto',
                                            fontSize: '12px'
                                        }}>
                                            {JSON.stringify(selectedLog.changes, null, 2)}
                                        </pre>
                                    </AccordionDetails>
                                </Accordion>
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDialog}>Close</Button>
                    </DialogActions>
                </Dialog>
            )}
        </Box>
    );
};

export default AuditLog; 