import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    FormGroup,
    FormControlLabel,
    Checkbox,
    CircularProgress,
    Alert,
    Divider,
    Chip
} from '@mui/material';
import { userAPI, metaAPI } from '../../services/api';
import { toast } from 'react-toastify';

const PrivilegeDialog = ({ open, onClose, user }) => {
    const [modules, setModules] = useState({});
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [userPrivileges, setUserPrivileges] = useState({});

    // Load available modules
    useEffect(() => {
        const loadModules = async () => {
            try {
                const response = await metaAPI.getPrivilegeModules();
                setModules(response.data);
            } catch (err) {
                console.error('Error loading modules:', err);
                setError('Failed to load available modules');
            }
        };

        if (open) {
            loadModules();
        }
    }, [open]);

    // Initialize user privileges when user changes
    useEffect(() => {
        if (user && open) {
            const privileges = {};
            user.privileges?.forEach(priv => {
                privileges[priv.module] = priv.operations;
            });
            setUserPrivileges(privileges);
        }
    }, [user, open]);

    const handlePrivilegeChange = (module, operation, checked) => {
        setUserPrivileges(prev => {
            const current = prev[module] || [];
            const updated = checked 
                ? [...current, operation]
                : current.filter(op => op !== operation);
            
            return {
                ...prev,
                [module]: updated
            };
        });
    };

    const handleSave = async () => {
        if (!user) return;

        setSaving(true);
        setError('');

        try {
            // Get all modules that have privileges
            const modulesToUpdate = Object.keys(userPrivileges);
            
            for (const module of modulesToUpdate) {
                const operations = userPrivileges[module];
                
                if (operations.length > 0) {
                    // Grant privileges
                    await userAPI.grantPrivileges(user.id, {
                        module,
                        operations
                    });
                } else {
                    // Revoke all privileges for this module
                    await userAPI.revokePrivileges(user.id, {
                        module,
                        operations: ['view', 'create', 'update', 'delete']
                    });
                }
            }

            toast.success('Privileges updated successfully');
            onClose(true); // Refresh the user list
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Failed to update privileges';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setSaving(false);
        }
    };

    const handleClose = () => {
        if (!saving) {
            setError('');
            setUserPrivileges({});
            onClose();
        }
    };

    if (!user) return null;

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
            <DialogTitle>
                <Typography variant="h6">
                    Manage Privileges for {user.username}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                    {user.email}
                </Typography>
            </DialogTitle>
            
            <DialogContent>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {loading ? (
                    <Box display="flex" justifyContent="center" p={3}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <Box>
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                            Select the operations this user can perform for each module:
                        </Typography>

                        {Object.entries(modules).map(([moduleKey, moduleInfo]) => {
                            const currentPrivileges = userPrivileges[moduleKey] || [];
                            
                            return (
                                <Box key={moduleKey} sx={{ mb: 3 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                            {moduleInfo.name}
                                        </Typography>
                                        <Chip 
                                            label={moduleInfo.description} 
                                            size="small" 
                                            sx={{ ml: 1 }}
                                            variant="outlined"
                                        />
                                    </Box>
                                    
                                    <FormGroup row>
                                        {moduleInfo.operations.map(operation => (
                                            <FormControlLabel
                                                key={operation}
                                                control={
                                                    <Checkbox
                                                        checked={currentPrivileges.includes(operation)}
                                                        onChange={(e) => handlePrivilegeChange(moduleKey, operation, e.target.checked)}
                                                        disabled={saving}
                                                    />
                                                }
                                                label={operation.charAt(0).toUpperCase() + operation.slice(1)}
                                                sx={{ minWidth: 120 }}
                                            />
                                        ))}
                                    </FormGroup>
                                    
                                    <Divider sx={{ mt: 1 }} />
                                </Box>
                            );
                        })}
                    </Box>
                )}
            </DialogContent>
            
            <DialogActions sx={{ p: 3, pt: 1 }}>
                <Button 
                    onClick={handleClose} 
                    disabled={saving}
                    variant="outlined"
                >
                    Cancel
                </Button>
                <Button 
                    onClick={handleSave} 
                    variant="contained" 
                    disabled={saving || loading}
                    startIcon={saving ? <CircularProgress size={20} /> : null}
                >
                    {saving ? 'Saving...' : 'Save Privileges'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default PrivilegeDialog; 