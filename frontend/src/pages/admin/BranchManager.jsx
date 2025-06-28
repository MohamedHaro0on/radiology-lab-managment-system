import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
            const response = await branchAPI.getAllBranches();
            setBranches(response.data.data || response.data || []);
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Failed to fetch branches';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

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
            message: selectedBranch ? 'Branch updated successfully' : 'Branch created successfully',
            severity: 'success'
        });
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this branch? This action cannot be undone.')) {
            try {
                await branchAPI.deleteBranch(id);
                toast.success('Branch deleted successfully');
                fetchBranches();
                setSnackbar({
                    open: true,
                    message: 'Branch deleted successfully',
                    severity: 'success'
                });
            } catch (err) {
                const errorMessage = err.response?.data?.message || 'Failed to delete branch';
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
            message: 'Branches refreshed successfully',
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
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="h4" gutterBottom>
                        Branch Management
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        Manage your laboratory branches and locations
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={handleRefresh}
                    >
                        Refresh
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => handleOpenDialog()}
                    >
                        Add Branch
                    </Button>
                </Box>
            </Box>

            {/* Statistics Cards */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={4}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <BusinessIcon color="primary" sx={{ mr: 2 }} />
                                <Box>
                                    <Typography color="textSecondary" gutterBottom>Total Branches</Typography>
                                    <Typography variant="h4">{stats.total}</Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <CheckCircleIcon color="success" sx={{ mr: 2 }} />
                                <Box>
                                    <Typography color="textSecondary" gutterBottom>Active Branches</Typography>
                                    <Typography variant="h4">{stats.active}</Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <CancelIcon color="error" sx={{ mr: 2 }} />
                                <Box>
                                    <Typography color="textSecondary" gutterBottom>Inactive Branches</Typography>
                                    <Typography variant="h4">{stats.inactive}</Typography>
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
                            placeholder="Search branches by name, location, address, or manager..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <FormControl fullWidth>
                            <InputLabel>Status</InputLabel>
                            <Select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                label="Status"
                            >
                                <MenuItem value="all">All Branches</MenuItem>
                                <MenuItem value="active">Active Only</MenuItem>
                                <MenuItem value="inactive">Inactive Only</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <Typography variant="body2" color="textSecondary">
                            Showing {filteredBranches.length} of {branches.length} branches
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
                                <TableCell>Branch Name</TableCell>
                                <TableCell>Location</TableCell>
                                <TableCell>Contact Info</TableCell>
                                <TableCell>Manager</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Created</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredBranches.map((branch) => (
                                <TableRow key={branch._id} hover>
                                    <TableCell>
                                        <Box>
                                            <Typography variant="body1" fontWeight="bold">
                                                {branch.name}
                                            </Typography>
                                            <Typography variant="caption" color="textSecondary">
                                                ID: {branch._id}
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                                <LocationIcon sx={{ mr: 1, fontSize: 'small' }} />
                                                <Typography variant="body2">
                                                    {branch.location}
                                                </Typography>
                                            </Box>
                                            {branch.address && (
                                                <Typography variant="caption" color="textSecondary">
                                                    {branch.address}
                                                </Typography>
                                            )}
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Box>
                                            {branch.phone && (
                                                <Typography variant="body2" display="block">
                                                    📞 {branch.phone}
                                                </Typography>
                                            )}
                                            {branch.email && (
                                                <Typography variant="body2" display="block">
                                                    ✉️ {branch.email}
                                                </Typography>
                                            )}
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">
                                            {branch.manager || 'Not assigned'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            icon={getStatusIcon(branch.isActive)}
                                            label={branch.isActive ? 'Active' : 'Inactive'}
                                            color={getStatusColor(branch.isActive)}
                                            size="small"
                                            variant={branch.isActive ? 'filled' : 'outlined'}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">
                                            {new Date(branch.createdAt).toLocaleDateString()}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Tooltip title="Edit Branch">
                                            <IconButton
                                                onClick={() => handleOpenDialog(branch)}
                                                color="primary"
                                                size="small"
                                            >
                                                <EditIcon />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Delete Branch">
                                            <IconButton 
                                                onClick={() => handleDelete(branch._id)}
                                                color="error"
                                                size="small"
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filteredBranches.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} align="center">
                                        <Typography variant="body1" color="textSecondary" sx={{ py: 3 }}>
                                            {searchTerm || statusFilter !== 'all' 
                                                ? 'No branches match your search criteria' 
                                                : 'No branches found. Create your first branch to get started.'}
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
 