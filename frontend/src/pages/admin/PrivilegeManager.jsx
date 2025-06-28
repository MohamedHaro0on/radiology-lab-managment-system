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

const PrivilegeManager = () => {
    const { t } = useTranslation();
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
            // The API might return users without an `id` field, so we map `_id` to `id`
            const formattedUsers = response.data.data.map(u => ({ ...u, id: u._id }));
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
        <Box>
            <Typography variant="h4" gutterBottom>
                Privilege Manager
            </Typography>
            
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {/* Summary Cards */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Total Users
                            </Typography>
                            <Typography variant="h4">
                                {users.length}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                {t('privilegeManagement')} ({users.filter(u => u.userType === 'superAdmin' || u.isSuperAdmin).length} {t('common.superAdmins')})
                            </Typography>
                            <Typography variant="h4">
                                {users.filter(u => u.userType === 'superAdmin' || u.isSuperAdmin).length}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Active Users
                            </Typography>
                            <Typography variant="h4">
                                {users.filter(u => u.isActive).length}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Average Privileges
                            </Typography>
                            <Typography variant="h4">
                                {users.length > 0 ? 
                                    Math.round(users.reduce((sum, u) => sum + getPrivilegeCount(u), 0) / users.length) : 
                                    0
                                }
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Paper sx={{ overflow: 'hidden' }}>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ backgroundColor: 'primary.main' }}>
                                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>User</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Status</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Privileges</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Last Login</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {users.map((user) => (
                                <TableRow key={user.id} hover>
                                    <TableCell>
                                        <Box>
                                            <Typography variant="subtitle2" fontWeight="bold">
                                                {user.username}
                                            </Typography>
                                            <Typography variant="body2" color="textSecondary">
                                                {user.email}
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        {getStatusChip(user)}
                                    </TableCell>
                                    <TableCell>
                                        <Box>
                                            <Typography variant="body2">
                                                {getPrivilegeCount(user)} modules
                                            </Typography>
                                            <Box sx={{ mt: 0.5 }}>
                                                {user.privileges?.slice(0, 3).map(priv => (
                                                    <Chip 
                                                        key={priv.module}
                                                        label={priv.module} 
                                                        size="small" 
                                                        variant="outlined"
                                                        sx={{ mr: 0.5, mb: 0.5 }}
                                                    />
                                                ))}
                                                {user.privileges?.length > 3 && (
                                                    <Chip 
                                                        label={`+${user.privileges.length - 3} more`}
                                                        size="small"
                                                        variant="outlined"
                                                        color="primary"
                                                    />
                                                )}
                                            </Box>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">
                                            {user.lastLogin ? 
                                                new Date(user.lastLogin).toLocaleDateString() : 
                                                'Never'
                                            }
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Tooltip title="Manage Privileges">
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