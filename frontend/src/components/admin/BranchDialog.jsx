import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    CircularProgress,
    FormControlLabel,
    Switch,
    Grid,
    Box,
    Typography,
    Alert
} from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import { branchAPI } from '../../services/api';

const validationSchema = Yup.object({
    name: Yup.string()
        .required('Branch name is required')
        .min(3, 'Name must be at least 3 characters')
        .max(100, 'Name cannot exceed 100 characters'),
    location: Yup.string()
        .required('Location is required')
        .min(5, 'Location must be at least 5 characters')
        .max(200, 'Location cannot exceed 200 characters'),
    address: Yup.string()
        .required('Address is required')
        .min(10, 'Address must be at least 10 characters')
        .max(500, 'Address cannot exceed 500 characters'),
    phone: Yup.string()
        .required('Phone number is required')
        .matches(/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number'),
    email: Yup.string()
        .email('Please enter a valid email address')
        .required('Email is required'),
    manager: Yup.string()
        .required('Manager name is required')
        .min(2, 'Manager name must be at least 2 characters')
        .max(100, 'Manager name cannot exceed 100 characters'),
});

const BranchDialog = ({ open, onClose, branch, onSave }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const isEditing = Boolean(branch);

    const formik = useFormik({
        initialValues: {
            name: branch?.name || '',
            location: branch?.location || '',
            address: branch?.address || '',
            phone: branch?.phone || '',
            email: branch?.email || '',
            manager: branch?.manager || '',
            isActive: branch?.isActive ?? true,
        },
        validationSchema: validationSchema,
        onSubmit: async (values) => {
            setLoading(true);
            setError('');
            try {
                if (isEditing) {
                    await branchAPI.updateBranch(branch._id, values);
                    toast.success('Branch updated successfully');
                } else {
                    await branchAPI.createBranch(values);
                    toast.success('Branch created successfully');
                }
                onSave();
                onClose();
            } catch (err) {
                const errorMessage = err.response?.data?.message || 
                    (isEditing ? 'Failed to update branch' : 'Failed to create branch');
                setError(errorMessage);
                toast.error(errorMessage);
            } finally {
                setLoading(false);
            }
        },
        enableReinitialize: true,
    });

    const handleClose = () => {
        if (!loading) {
            formik.resetForm();
            setError('');
            onClose();
        }
    };

    return (
        <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
            <DialogTitle>
                <Typography variant="h6">
                    {isEditing ? 'Edit Branch' : 'Add New Branch'}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                    {isEditing ? 'Update branch information' : 'Create a new laboratory branch'}
                </Typography>
            </DialogTitle>
            
            <form onSubmit={formik.handleSubmit}>
                <DialogContent>
                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}
                    
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                id="name"
                                name="name"
                                label="Branch Name"
                                value={formik.values.name}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                error={formik.touched.name && Boolean(formik.errors.name)}
                                helperText={formik.touched.name && formik.errors.name}
                                margin="normal"
                                disabled={loading}
                                placeholder="Enter branch name"
                            />
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                id="location"
                                name="location"
                                label="Location/City"
                                value={formik.values.location}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                error={formik.touched.location && Boolean(formik.errors.location)}
                                helperText={formik.touched.location && formik.errors.location}
                                margin="normal"
                                disabled={loading}
                                placeholder="Enter city or location"
                            />
                        </Grid>
                        
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                id="address"
                                name="address"
                                label="Full Address"
                                value={formik.values.address}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                error={formik.touched.address && Boolean(formik.errors.address)}
                                helperText={formik.touched.address && formik.errors.address}
                                margin="normal"
                                disabled={loading}
                                placeholder="Enter complete address"
                                multiline
                                rows={2}
                            />
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                id="phone"
                                name="phone"
                                label="Phone Number"
                                value={formik.values.phone}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                error={formik.touched.phone && Boolean(formik.errors.phone)}
                                helperText={formik.touched.phone && formik.errors.phone}
                                margin="normal"
                                disabled={loading}
                                placeholder="Enter phone number"
                            />
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                id="email"
                                name="email"
                                label="Email Address"
                                type="email"
                                value={formik.values.email}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                error={formik.touched.email && Boolean(formik.errors.email)}
                                helperText={formik.touched.email && formik.errors.email}
                                margin="normal"
                                disabled={loading}
                                placeholder="Enter email address"
                            />
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                id="manager"
                                name="manager"
                                label="Branch Manager"
                                value={formik.values.manager}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                error={formik.touched.manager && Boolean(formik.errors.manager)}
                                helperText={formik.touched.manager && formik.errors.manager}
                                margin="normal"
                                disabled={loading}
                                placeholder="Enter manager name"
                            />
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                            <Box sx={{ mt: 2 }}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={formik.values.isActive}
                                            onChange={formik.handleChange}
                                            name="isActive"
                                            color="primary"
                                            disabled={loading}
                                        />
                                    }
                                    label="Branch Active"
                                />
                                <Typography variant="caption" display="block" color="textSecondary">
                                    {isEditing 
                                        ? 'Toggle to activate or deactivate this branch'
                                        : 'New branches are active by default'
                                    }
                                </Typography>
                            </Box>
                        </Grid>
                    </Grid>
                </DialogContent>
                
                <DialogActions sx={{ p: 3, pt: 1 }}>
                    <Button 
                        onClick={handleClose} 
                        disabled={loading}
                        variant="outlined"
                    >
                        Cancel
                    </Button>
                    <Button 
                        type="submit" 
                        variant="contained" 
                        disabled={loading || !formik.isValid}
                        startIcon={loading ? <CircularProgress size={20} /> : null}
                    >
                        {loading ? 'Saving...' : (isEditing ? 'Update Branch' : 'Create Branch')}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default BranchDialog; 