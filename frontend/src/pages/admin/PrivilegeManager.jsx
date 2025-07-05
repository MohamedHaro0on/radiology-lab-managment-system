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
    Grid
} from '@mui/material';
import {
    Edit as EditIcon,
    AdminPanelSettings as AdminIcon,
    Person as PersonIcon,
    CheckCircle as CheckIcon,
    Cancel as CancelIcon
} from '@mui/icons-material';
import { userAPI, metaAPI } from '../../services/api';
import { toast } from 'react-toastify';
import PrivilegeDialog from '../../components/admin/PrivilegeDialog';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useRTL } from '../../hooks/useRTL';

const PrivilegeManager = () => {
    const { t } = useTranslation();
    const { isRTL, cardGridProps, iconContainerProps, textContainerProps } = useRTL();
    const { user, isSuperAdmin } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [isDialogOpen, setDialogOpen] = useState(false);
    const [privilegeModules, setPrivilegeModules] = useState([]);

    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            const response = await userAPI.getAll();
            // Safely extract users array from any possible API response structure, including deeply nested
            const usersArr =
              Array.isArray(response.data?.data)
                ? response.data.data
                : Array.isArray(response.data?.data?.users)
                  ? response.data.data.users
                  : Array.isArray(response.data?.data?.data?.users)
                    ? response.data.data.data.users
                    : Array.isArray(response.data?.users)
                      ? response.data.users
                      : [];
            const formattedUsers = usersArr.map(u => ({ ...u, id: u._id }));
            setUsers(formattedUsers);
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Error fetching users';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchPrivilegeModules = useCallback(async () => {
        try {
            const response = await metaAPI.getPrivilegeModules();
            setPrivilegeModules(response.data.data);
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Error fetching privilege modules';
            setError(errorMessage);
            toast.error(errorMessage);
        }
    }, []);

    useEffect(() => {
        if (isSuperAdmin) {
            fetchUsers();
            fetchPrivilegeModules();
        }
    }, [isSuperAdmin, fetchUsers, fetchPrivilegeModules]);

    const handleOpenDialog = (user) => {
        if (isSuperAdmin) {
            setSelectedUser(user);
            setDialogOpen(true);
        } else {
            toast.error('You do not have permission to manage privileges');
        }
    };

    const handleCloseDialog = (shouldRefresh) => {
        setDialogOpen(false);
        setSelectedUser(null);
        if (shouldRefresh) {
            fetchUsers();
        }
    };

    const getPrivilegeCount = (user) => {
        return user.privileges?.length || 0;
    };

    const getStatusChip = (user) => {
        if (user.userType === 'superAdmin' || user.isSuperAdmin) {
            return <Chip icon={<AdminIcon />} label="Super Admin" color="error" size="small" />;
        }
        return user.isActive ? 
            <Chip icon={<CheckIcon />} label="Active" color="success" size="small" /> :
            <Chip icon={<CancelIcon />} label="Inactive" color="default" size="small" />;
    };

    if (loading && users.length === 0) {
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
                {t('privilegeManagement')}
            </Typography>
            
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {/* Summary Cards */}
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
                                        {t('common.totalUsers')}
                                    </Typography>
                                    <Typography 
                                        variant="h4"
                                        sx={{ textAlign: isRTL ? 'right' : 'left' }}
                                    >
                                        {users.length}
                                    </Typography>
                                </Box>
                                <Box sx={iconContainerProps}>
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
                                        {t('privilegeManagement')} (
                                            {users.filter(u => (u.userType === 'superAdmin' || u.isSuperAdmin)).length}
                                            {' '}
                                            {t('common.superAdmins')}
                                        )
                                    </Typography>
                                    <Typography 
                                        variant="h4"
                                        sx={{ textAlign: isRTL ? 'right' : 'left' }}
                                    >
                                        {users.filter(u => (u.userType === 'superAdmin' || u.isSuperAdmin)).length}
                                    </Typography>
                                </Box>
                                <Box sx={{ ...iconContainerProps, color: 'error.main' }}>
                                    <AdminIcon />
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
                                        {t('common.activeUsers')}
                                    </Typography>
                                    <Typography 
                                        variant="h4"
                                        sx={{ textAlign: isRTL ? 'right' : 'left' }}
                                    >
                                        {users.filter(u => u.isActive).length}
                                    </Typography>
                                </Box>
                                <Box sx={{ ...iconContainerProps, color: 'success.main' }}>
                                    <CheckIcon />
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
                                        {t('common.averagePrivileges')}
                                    </Typography>
                                    <Typography 
                                        variant="h4"
                                        sx={{ textAlign: isRTL ? 'right' : 'left' }}
                                    >
                                        {users.length > 0 ? 
                                            Math.round(users.reduce((sum, u) => sum + getPrivilegeCount(u), 0) / users.length) : 
                                            0
                                        }
                                    </Typography>
                                </Box>
                                <Box sx={{ ...iconContainerProps, color: 'info.main' }}>
                                    <EditIcon />
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Paper sx={{ overflow: 'hidden' }}>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ backgroundColor: 'primary.main' }}>
                                <TableCell sx={{ color: 'white', fontWeight: 'bold', textAlign: isRTL ? 'right' : 'left' }}>
                                    {t('common.user')}
                                </TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 'bold', textAlign: isRTL ? 'right' : 'left' }}>
                                    {t('common.status')}
                                </TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 'bold', textAlign: isRTL ? 'right' : 'left' }}>
                                    {t('common.privileges')}
                                </TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 'bold', textAlign: isRTL ? 'right' : 'left' }}>
                                    {t('common.lastLogin')}
                                </TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 'bold', textAlign: isRTL ? 'left' : 'right' }}>
                                    {t('common.actions')}
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {users.map((user) => (
                                <TableRow key={user.id} hover>
                                    <TableCell sx={{ textAlign: isRTL ? 'right' : 'left' }}>
                                        <Box>
                                            <Typography 
                                                variant="subtitle2" 
                                                fontWeight="bold"
                                                sx={{ textAlign: isRTL ? 'right' : 'left' }}
                                            >
                                                {user.username}
                                            </Typography>
                                            <Typography 
                                                variant="body2" 
                                                color="textSecondary"
                                                sx={{ textAlign: isRTL ? 'right' : 'left' }}
                                            >
                                                {user.email}
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell sx={{ textAlign: isRTL ? 'right' : 'left' }}>
                                        {getStatusChip(user)}
                                    </TableCell>
                                    <TableCell sx={{ textAlign: isRTL ? 'right' : 'left' }}>
                                        <Box>
                                            <Typography 
                                                variant="body2"
                                                sx={{ textAlign: isRTL ? 'right' : 'left' }}
                                            >
                                                {getPrivilegeCount(user)} {t('common.modules')}
                                            </Typography>
                                            <Box sx={{ mt: 0.5 }}>
                                                {user.privileges?.slice(0, 3).map(priv => (
                                                    <Chip 
                                                        key={priv.module}
                                                        label={priv.module} 
                                                        size="small" 
                                                        variant="outlined"
                                                        sx={{ 
                                                            mr: isRTL ? 0 : 0.5, 
                                                            ml: isRTL ? 0.5 : 0, 
                                                            mb: 0.5 
                                                        }}
                                                    />
                                                ))}
                                                {user.privileges?.length > 3 && (
                                                    <Chip 
                                                        label={`+${user.privileges.length - 3} ${t('common.more')}`}
                                                        size="small"
                                                        variant="outlined"
                                                        color="primary"
                                                    />
                                                )}
                                            </Box>
                                        </Box>
                                    </TableCell>
                                    <TableCell sx={{ textAlign: isRTL ? 'right' : 'left' }}>
                                        <Typography 
                                            variant="body2"
                                            sx={{ textAlign: isRTL ? 'right' : 'left' }}
                                        >
                                            {user.lastLogin ? 
                                                new Date(user.lastLogin).toLocaleDateString() : 
                                                t('common.never')
                                            }
                                        </Typography>
                                    </TableCell>
                                    <TableCell sx={{ textAlign: isRTL ? 'left' : 'right' }}>
                                        <Tooltip title={t('common.managePrivileges')}>
                                            <IconButton
                                                color="primary"
                                                onClick={() => handleOpenDialog(user)}
                                                disabled={user.userType === 'superAdmin' || user.isSuperAdmin}
                                            >
                                                <EditIcon />
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {selectedUser && (
                <PrivilegeDialog
                    open={isDialogOpen}
                    onClose={handleCloseDialog}
                    user={selectedUser}
                />
            )}
        </Box>
    );
};

export default PrivilegeManager; 