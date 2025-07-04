import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useRTL } from '../hooks/useRTL';
import {
    Box,
    Button,
    Card,
    CardContent,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Chip,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Grid,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    CircularProgress,
    Tooltip,
    Badge
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Search as SearchIcon,
    FilterList as FilterIcon,
    Refresh as RefreshIcon,
    Visibility as ViewIcon,
    TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { representativeService } from '../services/representativeService';
import RepresentativeDialog from '../components/RepresentativeDialog';
import RepresentativeStats from '../components/RepresentativeStats';
import { toast } from 'react-toastify';

const RepresentativeManager = () => {
    const { t } = useTranslation();
    const { isRTL } = useRTL();
    const [representatives, setRepresentatives] = useState([]);
    const [loading, setLoading] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [statsDialogOpen, setStatsDialogOpen] = useState(false);
    const [selectedRepresentative, setSelectedRepresentative] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState('desc');
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0
    });

    const fetchRepresentatives = async () => {
        try {
            setLoading(true);
            const params = {
                page: pagination.page,
                limit: pagination.limit,
                search: searchTerm || undefined,
                isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
                sortBy,
                sortOrder
            };

            const response = await representativeService.getAllRepresentatives(params);
            setRepresentatives(response.data.data.representatives || []);
            setPagination(prev => ({
                ...prev,
                total: response.data.data.pagination.total,
                totalPages: response.data.data.pagination.totalPages
            }));
        } catch (error) {
            console.error('Error fetching representatives:', error);
            toast.error(t('error.fetchingRepresentatives'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRepresentatives();
    }, [pagination.page, pagination.limit, searchTerm, statusFilter, sortBy, sortOrder]);

    const handleCreate = () => {
        setSelectedRepresentative(null);
        setDialogOpen(true);
    };

    const handleEdit = (representative) => {
        setSelectedRepresentative(representative);
        setDialogOpen(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm(t('confirm.deleteRepresentative'))) {
            try {
                await representativeService.deleteRepresentative(id);
                toast.success(t('success.representativeDeleted'));
                fetchRepresentatives();
            } catch (error) {
                console.error('Error deleting representative:', error);
                toast.error(t('error.deletingRepresentative'));
            }
        }
    };

    const handleViewStats = (representative) => {
        setSelectedRepresentative(representative);
        setStatsDialogOpen(true);
    };

    const handleRecalculateCounts = async (id) => {
        try {
            await representativeService.recalculateCounts(id);
            toast.success(t('success.countsRecalculated'));
            fetchRepresentatives();
        } catch (error) {
            console.error('Error recalculating counts:', error);
            toast.error(t('error.recalculatingCounts'));
        }
    };

    const handleDialogClose = (refresh = false) => {
        setDialogOpen(false);
        setSelectedRepresentative(null);
        if (refresh) {
            fetchRepresentatives();
        }
    };

    const handleStatsDialogClose = () => {
        setStatsDialogOpen(false);
        setSelectedRepresentative(null);
    };

    const handleSearch = (event) => {
        setSearchTerm(event.target.value);
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const handleStatusFilterChange = (event) => {
        setStatusFilter(event.target.value);
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const handleSortChange = (field) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('desc');
        }
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const handlePageChange = (newPage) => {
        setPagination(prev => ({ ...prev, page: newPage }));
    };

    const getStatusColor = (isActive) => {
        return isActive ? 'success' : 'error';
    };

    const getStatusText = (isActive) => {
        return isActive ? t('status.active') : t('status.inactive');
    };

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
                <Typography 
                    variant="h4" 
                    component="h1"
                    sx={{ textAlign: isRTL ? 'right' : 'left' }}
                >
                    {t('representatives.title')}
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleCreate}
                    sx={{ textAlign: isRTL ? 'right' : 'left' }}
                >
                    {t('representatives.addNew')}
                </Button>
            </Box>

            {/* Filters and Search */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                label={t('common.search')}
                                value={searchTerm}
                                onChange={handleSearch}
                                InputProps={{
                                    startAdornment: <SearchIcon sx={{ mr: isRTL ? 0 : 1, ml: isRTL ? 1 : 0, color: 'text.secondary' }} />
                                }}
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
                        <Grid item xs={12} md={3}>
                            <FormControl fullWidth>
                                <InputLabel sx={{ textAlign: isRTL ? 'right' : 'left' }}>
                                    {t('common.status')}
                                </InputLabel>
                                <Select
                                    value={statusFilter}
                                    onChange={handleStatusFilterChange}
                                    label={t('common.status')}
                                    sx={{
                                        '& .MuiSelect-select': {
                                            textAlign: isRTL ? 'right' : 'left',
                                            direction: isRTL ? 'rtl' : 'ltr'
                                        }
                                    }}
                                >
                                    <MenuItem value="all" sx={{ textAlign: isRTL ? 'right' : 'left' }}>
                                        {t('common.all')}
                                    </MenuItem>
                                    <MenuItem value="active" sx={{ textAlign: isRTL ? 'right' : 'left' }}>
                                        {t('status.active')}
                                    </MenuItem>
                                    <MenuItem value="inactive" sx={{ textAlign: isRTL ? 'right' : 'left' }}>
                                        {t('status.inactive')}
                                    </MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <FormControl fullWidth>
                                <InputLabel sx={{ textAlign: isRTL ? 'right' : 'left' }}>
                                    {t('common.sortBy')}
                                </InputLabel>
                                <Select
                                    value={sortBy}
                                    onChange={(e) => handleSortChange(e.target.value)}
                                    label={t('common.sortBy')}
                                    sx={{
                                        '& .MuiSelect-select': {
                                            textAlign: isRTL ? 'right' : 'left',
                                            direction: isRTL ? 'rtl' : 'ltr'
                                        }
                                    }}
                                >
                                    <MenuItem value="name" sx={{ textAlign: isRTL ? 'right' : 'left' }}>
                                        {t('representatives.name')}
                                    </MenuItem>
                                    <MenuItem value="patientsCount" sx={{ textAlign: isRTL ? 'right' : 'left' }}>
                                        {t('representatives.patientsCount')}
                                    </MenuItem>
                                    <MenuItem value="doctorsCount" sx={{ textAlign: isRTL ? 'right' : 'left' }}>
                                        {t('representatives.doctorsCount')}
                                    </MenuItem>
                                    <MenuItem value="createdAt" sx={{ textAlign: isRTL ? 'right' : 'left' }}>
                                        {t('common.createdAt')}
                                    </MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <Button
                                fullWidth
                                variant="outlined"
                                startIcon={<RefreshIcon />}
                                onClick={fetchRepresentatives}
                                disabled={loading}
                                sx={{ textAlign: isRTL ? 'right' : 'left' }}
                            >
                                {t('common.refresh')}
                            </Button>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {/* Representatives Table */}
            <Card>
                <CardContent>
                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                            <CircularProgress />
                        </Box>
                    ) : (
                        <TableContainer component={Paper} elevation={0}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ textAlign: isRTL ? 'right' : 'left' }}>
                                            {t('representatives.name')}
                                        </TableCell>
                                        <TableCell sx={{ textAlign: isRTL ? 'right' : 'left' }}>
                                            {t('representatives.id')}
                                        </TableCell>
                                        <TableCell sx={{ textAlign: isRTL ? 'right' : 'left' }}>
                                            {t('representatives.phoneNumber')}
                                        </TableCell>
                                        <TableCell sx={{ textAlign: isRTL ? 'right' : 'left' }}>
                                            {t('representatives.age')}
                                        </TableCell>
                                        <TableCell sx={{ textAlign: isRTL ? 'right' : 'left' }}>
                                            {t('representatives.patientsCount')}
                                        </TableCell>
                                        <TableCell sx={{ textAlign: isRTL ? 'right' : 'left' }}>
                                            {t('representatives.doctorsCount')}
                                        </TableCell>
                                        <TableCell sx={{ textAlign: isRTL ? 'right' : 'left' }}>
                                            {t('common.status')}
                                        </TableCell>
                                        <TableCell sx={{ textAlign: isRTL ? 'left' : 'right' }}>
                                            {t('common.actions')}
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {representatives.map((representative) => (
                                        <TableRow key={representative._id} hover>
                                            <TableCell sx={{ textAlign: isRTL ? 'right' : 'left' }}>
                                                <Typography 
                                                    variant="subtitle2"
                                                    sx={{ textAlign: isRTL ? 'right' : 'left' }}
                                                >
                                                    {representative.name}
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={{ textAlign: isRTL ? 'right' : 'left' }}>
                                                {representative.id}
                                            </TableCell>
                                            <TableCell sx={{ textAlign: isRTL ? 'right' : 'left' }}>
                                                {representative.phoneNumber}
                                            </TableCell>
                                            <TableCell sx={{ textAlign: isRTL ? 'right' : 'left' }}>
                                                {representative.age}
                                            </TableCell>
                                            <TableCell sx={{ textAlign: isRTL ? 'right' : 'left' }}>
                                                <Badge badgeContent={representative.patientsCount} color="primary">
                                                    <Chip
                                                        label={representative.patientsCount}
                                                        size="small"
                                                        color="primary"
                                                        variant="outlined"
                                                    />
                                                </Badge>
                                            </TableCell>
                                            <TableCell sx={{ textAlign: isRTL ? 'right' : 'left' }}>
                                                <Badge badgeContent={representative.doctorsCount} color="secondary">
                                                    <Chip
                                                        label={representative.doctorsCount}
                                                        size="small"
                                                        color="secondary"
                                                        variant="outlined"
                                                    />
                                                </Badge>
                                            </TableCell>
                                            <TableCell sx={{ textAlign: isRTL ? 'right' : 'left' }}>
                                                <Chip
                                                    label={getStatusText(representative.isActive)}
                                                    color={getStatusColor(representative.isActive)}
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell sx={{ textAlign: isRTL ? 'left' : 'right' }}>
                                                <Box sx={{ 
                                                    display: 'flex', 
                                                    gap: 1,
                                                    justifyContent: isRTL ? 'flex-start' : 'flex-end'
                                                }}>
                                                    <Tooltip title={t('common.viewStats')}>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleViewStats(representative)}
                                                            color="info"
                                                        >
                                                            <TrendingUpIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title={t('common.edit')}>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleEdit(representative)}
                                                            color="primary"
                                                        >
                                                            <EditIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title={t('common.delete')}>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleDelete(representative._id)}
                                                            color="error"
                                                        >
                                                            <DeleteIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <Box sx={{ 
                            display: 'flex', 
                            justifyContent: 'center', 
                            mt: 2,
                            flexDirection: isRTL ? 'row-reverse' : 'row'
                        }}>
                            <Button
                                disabled={pagination.page === 1}
                                onClick={() => handlePageChange(pagination.page - 1)}
                                sx={{ 
                                    mr: isRTL ? 0 : 2, 
                                    ml: isRTL ? 2 : 0,
                                    textAlign: isRTL ? 'right' : 'left'
                                }}
                            >
                                {t('common.previous')}
                            </Button>
                            <Typography 
                                sx={{ 
                                    mx: 2, 
                                    alignSelf: 'center',
                                    textAlign: isRTL ? 'right' : 'left'
                                }}
                            >
                                {t('common.pageInfo', { current: pagination.page, total: pagination.totalPages })}
                            </Typography>
                            <Button
                                disabled={pagination.page === pagination.totalPages}
                                onClick={() => handlePageChange(pagination.page + 1)}
                                sx={{ 
                                    ml: isRTL ? 0 : 2, 
                                    mr: isRTL ? 2 : 0,
                                    textAlign: isRTL ? 'right' : 'left'
                                }}
                            >
                                {t('common.next')}
                            </Button>
                        </Box>
                    )}
                </CardContent>
            </Card>

            {/* Representative Dialog */}
            <RepresentativeDialog
                open={dialogOpen}
                representative={selectedRepresentative}
                onClose={handleDialogClose}
            />

            {/* Representative Stats Dialog */}
            <RepresentativeStats
                open={statsDialogOpen}
                representative={selectedRepresentative}
                onClose={handleStatsDialogClose}
            />
        </Box>
    );
};

export default RepresentativeManager; 