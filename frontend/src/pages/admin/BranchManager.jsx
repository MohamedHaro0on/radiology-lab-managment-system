import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useRTL } from '../../hooks/useRTL';
import {
    Box,
    Button,
    Typography,
    CircularProgress,
    Alert,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    Card,
    CardContent,
    Grid,
    InputAdornment,
    Tooltip,
    Snackbar
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Search as SearchIcon,
    Refresh as RefreshIcon,
    Business as BusinessIcon,
    LocationOn as LocationIcon,
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { branchAPI } from '../../services/api';
import BranchDialog from '../../components/admin/BranchDialog';

const BranchManager = () => {
    const { t } = useTranslation();
    const { isRTL, rtlProps, inputProps, cardGridProps, iconContainerProps, textContainerProps } = useRTL();
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedBranch, setSelectedBranch] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const fetchBranches = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const response = await branchAPI.getAll();
            setBranches(response.data.data.branches || []);
        } catch (err) {
            const errorMessage = err.response?.data?.message || t('branches.fetchError');
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        fetchBranches();
    }, [fetchBranches]);

    // Filter branches based on search term and status
    const filteredBranches = useMemo(() => {
        return branches.filter(branch => {
            const matchesSearch = branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                branch.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                (branch.address && branch.address.toLowerCase().includes(searchTerm.toLowerCase())) ||
                                (branch.manager && branch.manager.toLowerCase().includes(searchTerm.toLowerCase()));
            const matchesStatus = statusFilter === 'all' || 
                                (statusFilter === 'active' && branch.isActive) ||
                                (statusFilter === 'inactive' && !branch.isActive);
            return matchesSearch && matchesStatus;
        });
    }, [branches, searchTerm, statusFilter]);

    // Calculate statistics
    const stats = useMemo(() => {
        const total = branches.length;
        const active = branches.filter(b => b.isActive).length;
        const inactive = total - active;
        return { total, active, inactive };
    }, [branches]);

    const handleOpenDialog = (branch = null) => {
        setSelectedBranch(branch);
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setSelectedBranch(null);
        setDialogOpen(false);
    };

    const handleSave = () => {
        fetchBranches();
        setSnackbar({
            open: true,
            message: selectedBranch ? t('branches.updateSuccess') : t('branches.createSuccess'),
            severity: 'success'
        });
    };

    const handleDelete = async (id) => {
        if (window.confirm(t('branches.deleteConfirmMessage'))) {
            try {
                await branchAPI.delete(id);
                toast.success(t('branches.deleteSuccess'));
                fetchBranches();
                setSnackbar({
                    open: true,
                    message: t('branches.deleteSuccess'),
                    severity: 'success'
                });
            } catch (err) {
                const errorMessage = err.response?.data?.message || t('branches.deleteError');
                toast.error(errorMessage);
                setSnackbar({
                    open: true,
                    message: errorMessage,
                    severity: 'error'
                });
            }
        }
    };

    const handleRefresh = () => {
        fetchBranches();
        setSnackbar({
            open: true,
            message: t('branches.refreshSuccess'),
            severity: 'info'
        });
    };

    const getStatusColor = (isActive) => {
        return isActive ? 'success' : 'error';
    };

    const getStatusIcon = (isActive) => {
        return isActive ? <CheckCircleIcon /> : <CancelIcon />;
    };

    if (loading && branches.length === 0) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                mb: 3,
                flexDirection: isRTL ? 'row-reverse' : 'row'
            }}>
                <Box sx={{ textAlign: isRTL ? 'right' : 'left' }}>
                    <Typography 
                        variant="h4" 
                        gutterBottom
                        sx={{ textAlign: isRTL ? 'right' : 'left' }}
                    >
                        {t('branches.title')}
                    </Typography>
                    <Typography 
                        variant="body2" 
                        color="textSecondary"
                        sx={{ textAlign: isRTL ? 'right' : 'left' }}
                    >
                        {t('branches.description')}
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={handleRefresh}
                    >
                        {t('common.refresh')}
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => handleOpenDialog()}
                    >
                        {t('branches.addTitle')}
                    </Button>
                </Box>
            </Box>

            {/* Statistics Cards */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={4}>
                    <Card>
                        <CardContent>
                            <Box sx={cardGridProps}>
                                <Box sx={textContainerProps}>
                                    <Typography 
                                        color="textSecondary" 
                                        gutterBottom
                                        sx={{ textAlign: isRTL ? 'right' : 'left' }}
                                    >
                                        {t('branches.totalBranches')}
                                    </Typography>
                                    <Typography 
                                        variant="h4"
                                        sx={{ textAlign: isRTL ? 'right' : 'left' }}
                                    >
                                        {stats.total}
                                    </Typography>
                                </Box>
                                <Box sx={iconContainerProps}>
                                    <BusinessIcon />
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Card>
                        <CardContent>
                            <Box sx={cardGridProps}>
                                <Box sx={textContainerProps}>
                                    <Typography 
                                        color="textSecondary" 
                                        gutterBottom
                                        sx={{ textAlign: isRTL ? 'right' : 'left' }}
                                    >
                                        {t('branches.activeBranches')}
                                    </Typography>
                                    <Typography 
                                        variant="h4"
                                        sx={{ textAlign: isRTL ? 'right' : 'left' }}
                                    >
                                        {stats.active}
                                    </Typography>
                                </Box>
                                <Box sx={{ ...iconContainerProps, color: 'success.main' }}>
                                    <CheckCircleIcon />
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Card>
                        <CardContent>
                            <Box sx={cardGridProps}>
                                <Box sx={textContainerProps}>
                                    <Typography 
                                        color="textSecondary" 
                                        gutterBottom
                                        sx={{ textAlign: isRTL ? 'right' : 'left' }}
                                    >
                                        {t('branches.inactiveBranches')}
                                    </Typography>
                                    <Typography 
                                        variant="h4"
                                        sx={{ textAlign: isRTL ? 'right' : 'left' }}
                                    >
                                        {stats.inactive}
                                    </Typography>
                                </Box>
                                <Box sx={{ ...iconContainerProps, color: 'error.main' }}>
                                    <CancelIcon />
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Filters */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            placeholder={t('branches.searchPlaceholder')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon />
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
                    <Grid item xs={12} md={3}>
                        <FormControl fullWidth>
                            <InputLabel sx={{ textAlign: isRTL ? 'right' : 'left' }}>
                                {t('common.status')}
                            </InputLabel>
                            <Select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                label={t('common.status')}
                                sx={{
                                    '& .MuiSelect-select': {
                                        textAlign: isRTL ? 'right' : 'left',
                                        direction: isRTL ? 'rtl' : 'ltr'
                                    }
                                }}
                            >
                                <MenuItem value="all" sx={{ textAlign: isRTL ? 'right' : 'left' }}>
                                    {t('branches.allBranches')}
                                </MenuItem>
                                <MenuItem value="active" sx={{ textAlign: isRTL ? 'right' : 'left' }}>
                                    {t('branches.activeOnly')}
                                </MenuItem>
                                <MenuItem value="inactive" sx={{ textAlign: isRTL ? 'right' : 'left' }}>
                                    {t('branches.inactiveOnly')}
                                </MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <Typography 
                            variant="body2" 
                            color="textSecondary"
                            sx={{ textAlign: isRTL ? 'right' : 'left' }}
                        >
                            {t('branches.showingResults', { showing: filteredBranches.length, total: branches.length })}
                        </Typography>
                    </Grid>
                </Grid>
            </Paper>

            {/* Error Display */}
            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {/* Branches Table */}
            <Paper>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ textAlign: isRTL ? 'right' : 'left' }}>
                                    {t('branches.branchName')}
                                </TableCell>
                                <TableCell sx={{ textAlign: isRTL ? 'right' : 'left' }}>
                                    {t('branches.location')}
                                </TableCell>
                                <TableCell sx={{ textAlign: isRTL ? 'right' : 'left' }}>
                                    {t('branches.contactInfo')}
                                </TableCell>
                                <TableCell sx={{ textAlign: isRTL ? 'right' : 'left' }}>
                                    {t('branches.manager')}
                                </TableCell>
                                <TableCell sx={{ textAlign: isRTL ? 'right' : 'left' }}>
                                    {t('common.status')}
                                </TableCell>
                                <TableCell sx={{ textAlign: isRTL ? 'right' : 'left' }}>
                                    {t('common.createdAt')}
                                </TableCell>
                                <TableCell align={isRTL ? "left" : "right"}>
                                    {t('common.actions')}
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredBranches.map((branch) => (
                                <TableRow key={branch._id}>
                                    <TableCell sx={{ textAlign: isRTL ? 'right' : 'left' }}>
                                        <Typography 
                                            variant="subtitle2" 
                                            fontWeight="bold"
                                            sx={{ textAlign: isRTL ? 'right' : 'left' }}
                                        >
                                            {branch.name}
                                        </Typography>
                                    </TableCell>
                                    <TableCell sx={{ textAlign: isRTL ? 'right' : 'left' }}>
                                        <Box>
                                            <Typography 
                                                variant="body2" 
                                                display="block"
                                                sx={{ textAlign: isRTL ? 'right' : 'left' }}
                                            >
                                                📍 {branch.location}
                                            </Typography>
                                            {branch.address && (
                                                <Typography 
                                                    variant="caption" 
                                                    color="textSecondary" 
                                                    display="block"
                                                    sx={{ textAlign: isRTL ? 'right' : 'left' }}
                                                >
                                                    {branch.address}
                                                </Typography>
                                            )}
                                        </Box>
                                    </TableCell>
                                    <TableCell sx={{ textAlign: isRTL ? 'right' : 'left' }}>
                                        <Box>
                                            {branch.phone && (
                                                <Typography 
                                                    variant="body2" 
                                                    display="block"
                                                    sx={{ textAlign: isRTL ? 'right' : 'left' }}
                                                >
                                                    📞 {branch.phone}
                                                </Typography>
                                            )}
                                        </Box>
                                    </TableCell>
                                    <TableCell sx={{ textAlign: isRTL ? 'right' : 'left' }}>
                                        <Typography 
                                            variant="body2"
                                            sx={{ textAlign: isRTL ? 'right' : 'left' }}
                                        >
                                            {branch.manager || t('branches.notAssigned')}
                                        </Typography>
                                    </TableCell>
                                    <TableCell sx={{ textAlign: isRTL ? 'right' : 'left' }}>
                                        <Chip
                                            icon={getStatusIcon(branch.isActive)}
                                            label={branch.isActive ? t('branches.active') : t('branches.inactive')}
                                            color={getStatusColor(branch.isActive)}
                                            size="small"
                                            variant={branch.isActive ? 'filled' : 'outlined'}
                                        />
                                    </TableCell>
                                    <TableCell sx={{ textAlign: isRTL ? 'right' : 'left' }}>
                                        <Typography 
                                            variant="body2"
                                            sx={{ textAlign: isRTL ? 'right' : 'left' }}
                                        >
                                            {new Date(branch.createdAt).toLocaleDateString()}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align={isRTL ? "left" : "right"}>
                                        <Box sx={{ 
                                            display: 'flex', 
                                            gap: 1, 
                                            justifyContent: isRTL ? 'flex-start' : 'flex-end' 
                                        }}>
                                            <Tooltip title={t('common.edit')}>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleOpenDialog(branch)}
                                                    color="primary"
                                                >
                                                    <EditIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title={t('common.delete')}>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleDelete(branch._id)}
                                                    color="error"
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filteredBranches.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} align="center">
                                        <Typography 
                                            variant="body1" 
                                            color="textSecondary" 
                                            sx={{ 
                                                py: 3,
                                                textAlign: isRTL ? 'right' : 'left'
                                            }}
                                        >
                                            {searchTerm || statusFilter !== 'all' 
                                                ? t('branches.noBranchesMatchSearch') 
                                                : t('branches.noBranchesFound')}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {/* Branch Dialog */}
            {dialogOpen && (
                <BranchDialog
                    open={dialogOpen}
                    onClose={handleCloseDialog}
                    onSave={handleSave}
                    branch={selectedBranch}
                />
            )}

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar(s => ({ ...s, open: false }))}
            >
                <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default BranchManager;
 