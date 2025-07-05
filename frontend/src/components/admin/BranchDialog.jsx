import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useRTL } from '../../hooks/useRTL';
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
    Alert,
    InputAdornment
} from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import { branchAPI } from '../../services/api';

const BranchDialog = ({ open, onClose, branch, onSave }) => {
    const { t } = useTranslation();
    const { isRTL, rtlProps, inputProps } = useRTL();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const isEditing = Boolean(branch);

    const validationSchema = Yup.object({
        name: Yup.string()
            .required(t('validation.required', { field: t('branches.name') }))
            .min(3, t('validation.minLength', { field: t('branches.name'), min: 3 }))
            .max(100, t('validation.maxLength', { field: t('branches.name'), max: 100 })),
        location: Yup.string()
            .required(t('validation.required', { field: t('branches.location') }))
            .min(5, t('validation.minLength', { field: t('branches.location'), min: 5 }))
            .max(200, t('validation.maxLength', { field: t('branches.location'), max: 200 })),
        address: Yup.string()
            .required(t('validation.required', { field: t('branches.address') }))
            .min(10, t('validation.minLength', { field: t('branches.address'), min: 10 }))
            .max(500, t('validation.maxLength', { field: t('branches.address'), max: 500 })),
        phone: Yup.string()
            .required(t('validation.required', { field: t('branches.phone') }))
            .matches(/^\d{10}$/, t('validation.phoneNumber')),
        manager: Yup.string()
            .required(t('validation.required', { field: t('branches.manager') }))
            .min(2, t('validation.minLength', { field: t('branches.manager'), min: 2 }))
            .max(100, t('validation.maxLength', { field: t('branches.manager'), max: 100 })),
    });

    const formik = useFormik({
        initialValues: {
            name: branch?.name || '',
            location: branch?.location || '',
            address: branch?.address || '',
            phone: branch?.phone?.startsWith('+20') ? branch.phone.substring(3) : branch?.phone || '',
            manager: branch?.manager || '',
            isActive: branch?.isActive ?? true,
        },
        validationSchema: validationSchema,
        onSubmit: async (values) => {
            setLoading(true);
            setError('');
            console.log('--- Create/Update Branch: Form Values ---');
            console.log(values);
            const submissionValues = { ...values, phone: `+20${values.phone}` };
            try {
                if (isEditing) {
                    await branchAPI.update(branch._id, submissionValues);
                    toast.success(t('branches.updateSuccess'));
                } else {
                    await branchAPI.create(submissionValues);
                    toast.success(t('branches.createSuccess'));
                }
                onSave();
                onClose();
            } catch (err) {
                console.log('--- Create/Update Branch: API Error ---');
                console.error(err);
                const errorMessage = err.response?.data?.message || 
                    (isEditing ? t('branches.updateError') : t('branches.createError'));
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
            <DialogTitle sx={{ textAlign: isRTL ? 'right' : 'left' }}>
                {isEditing ? t('branches.editTitle') : t('branches.addTitle')}
            </DialogTitle>
            
            <form onSubmit={formik.handleSubmit}>
                <DialogContent>
                    <Typography 
                        variant="body2" 
                        color="textSecondary" 
                        sx={{ 
                            mt: -2, 
                            mb: 2,
                            textAlign: isRTL ? 'right' : 'left'
                        }}
                    >
                        {isEditing ? t('branches.updateInfo') : t('branches.createInfo')}
                    </Typography>
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
                                label={t('branches.nameLabel')}
                                value={formik.values.name}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                error={formik.touched.name && Boolean(formik.errors.name)}
                                helperText={formik.touched.name && formik.errors.name}
                                margin="normal"
                                disabled={loading}
                                placeholder={t('branches.namePlaceholder')}
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
                        
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                id="location"
                                name="location"
                                label={t('branches.locationLabel')}
                                value={formik.values.location}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                error={formik.touched.location && Boolean(formik.errors.location)}
                                helperText={formik.touched.location && formik.errors.location}
                                margin="normal"
                                disabled={loading}
                                placeholder={t('branches.locationPlaceholder')}
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
                        
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                id="address"
                                name="address"
                                label={t('branches.addressLabel')}
                                value={formik.values.address}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                error={formik.touched.address && Boolean(formik.errors.address)}
                                helperText={formik.touched.address && formik.errors.address}
                                margin="normal"
                                disabled={loading}
                                placeholder={t('branches.addressPlaceholder')}
                                multiline
                                rows={2}
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
                        
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                id="phone"
                                name="phone"
                                label={t('branches.phoneLabel')}
                                value={formik.values.phone}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                error={formik.touched.phone && Boolean(formik.errors.phone)}
                                helperText={formik.touched.phone && formik.errors.phone}
                                margin="normal"
                                disabled={loading}
                                placeholder={t('branches.phonePlaceholder')}
                                InputProps={{
                                    startAdornment: <InputAdornment position="start">+20</InputAdornment>,
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
                        
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                id="manager"
                                name="manager"
                                label={t('branches.managerLabel')}
                                value={formik.values.manager}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                error={formik.touched.manager && Boolean(formik.errors.manager)}
                                helperText={formik.touched.manager && formik.errors.manager}
                                margin="normal"
                                disabled={loading}
                                placeholder={t('branches.managerPlaceholder')}
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
                                    label={t('branches.isActiveLabel')}
                                    sx={{
                                        flexDirection: isRTL ? 'row-reverse' : 'row',
                                        '& .MuiFormControlLabel-label': {
                                            textAlign: isRTL ? 'right' : 'left'
                                        }
                                    }}
                                />
                                <Typography 
                                    variant="caption" 
                                    display="block" 
                                    color="textSecondary"
                                    sx={{ 
                                        textAlign: isRTL ? 'right' : 'left',
                                        mt: 1
                                    }}
                                >
                                    {isEditing 
                                        ? t('branches.isActiveDescriptionEdit')
                                        : t('branches.isActiveDescriptionAdd')
                                    }
                                </Typography>
                            </Box>
                        </Grid>
                    </Grid>
                </DialogContent>
                
                <DialogActions sx={{ 
                    p: 3, 
                    pt: 1,
                    flexDirection: isRTL ? 'row-reverse' : 'row'
                }}>
                    <Button 
                        onClick={handleClose} 
                        disabled={loading}
                        variant="outlined"
                        sx={{ textAlign: isRTL ? 'right' : 'left' }}
                    >
                        {t('branches.cancelButton')}
                    </Button>
                    <Button 
                        type="submit" 
                        variant="contained" 
                        disabled={loading || !formik.isValid}
                        startIcon={loading ? <CircularProgress size={20} /> : null}
                        sx={{ textAlign: isRTL ? 'right' : 'left' }}
                    >
                        {loading ? t('branches.savingButton') : (isEditing ? t('branches.updateButton') : t('branches.createButton'))}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default BranchDialog; 