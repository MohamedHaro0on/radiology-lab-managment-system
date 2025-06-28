import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    FormControl,
    FormControlLabel,
    Switch,
    Grid,
    Alert,
    CircularProgress
} from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { representativeService } from '../services/representativeService';
import { toast } from 'react-toastify';

const RepresentativeDialog = ({ open, representative, onClose }) => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);

    const validationSchema = Yup.object({
        name: Yup.string()
            .min(2, t('validation.minLength', { field: t('representatives.name'), min: 2 }))
            .max(100, t('validation.maxLength', { field: t('representatives.name'), max: 100 }))
            .required(t('validation.required', { field: t('representatives.name') })),
        age: Yup.number()
            .min(18, t('validation.minAge', { min: 18 }))
            .max(100, t('validation.maxAge', { max: 100 }))
            .required(t('validation.required', { field: t('representatives.age') })),
        id: Yup.string()
            .max(50, t('validation.maxLength', { field: t('representatives.id'), max: 50 }))
            .required(t('validation.required', { field: t('representatives.id') })),
        phoneNumber: Yup.string()
            .matches(/^[\+]?[1-9][\d]{0,15}$/, t('validation.phoneNumber'))
            .required(t('validation.required', { field: t('representatives.phoneNumber') })),
        notes: Yup.string()
            .max(500, t('validation.maxLength', { field: t('representatives.notes'), max: 500 }))
    });

    const formik = useFormik({
        initialValues: {
            name: '',
            age: '',
            id: '',
            phoneNumber: '',
            notes: '',
            isActive: true
        },
        validationSchema,
        onSubmit: async (values) => {
            try {
                setLoading(true);
                if (representative) {
                    await representativeService.updateRepresentative(representative._id, values);
                    toast.success(t('success.representativeUpdated'));
                } else {
                    await representativeService.createRepresentative(values);
                    toast.success(t('success.representativeCreated'));
                }
                onClose(true);
            } catch (error) {
                console.error('Error saving representative:', error);
                toast.error(t('error.savingRepresentative'));
            } finally {
                setLoading(false);
            }
        }
    });

    useEffect(() => {
        if (representative) {
            formik.setValues({
                name: representative.name || '',
                age: representative.age || '',
                id: representative.id || '',
                phoneNumber: representative.phoneNumber || '',
                notes: representative.notes || '',
                isActive: representative.isActive !== undefined ? representative.isActive : true
            });
        } else {
            formik.resetForm();
        }
    }, [representative, open]);

    const handleClose = () => {
        if (!loading) {
            formik.resetForm();
            onClose();
        }
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
            <DialogTitle>
                {representative ? t('representatives.editTitle') : t('representatives.createTitle')}
            </DialogTitle>
            <form onSubmit={formik.handleSubmit}>
                <DialogContent>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                name="name"
                                label={t('representatives.name')}
                                value={formik.values.name}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                error={formik.touched.name && Boolean(formik.errors.name)}
                                helperText={formik.touched.name && formik.errors.name}
                                margin="normal"
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                name="age"
                                label={t('representatives.age')}
                                type="number"
                                value={formik.values.age}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                error={formik.touched.age && Boolean(formik.errors.age)}
                                helperText={formik.touched.age && formik.errors.age}
                                margin="normal"
                                inputProps={{ min: 18, max: 100 }}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                name="id"
                                label={t('representatives.id')}
                                value={formik.values.id}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                error={formik.touched.id && Boolean(formik.errors.id)}
                                helperText={formik.touched.id && formik.errors.id}
                                margin="normal"
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                name="phoneNumber"
                                label={t('representatives.phoneNumber')}
                                value={formik.values.phoneNumber}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                error={formik.touched.phoneNumber && Boolean(formik.errors.phoneNumber)}
                                helperText={formik.touched.phoneNumber && formik.errors.phoneNumber}
                                margin="normal"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                name="notes"
                                label={t('representatives.notes')}
                                multiline
                                rows={3}
                                value={formik.values.notes}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                error={formik.touched.notes && Boolean(formik.errors.notes)}
                                helperText={formik.touched.notes && formik.errors.notes}
                                margin="normal"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        name="isActive"
                                        checked={formik.values.isActive}
                                        onChange={formik.handleChange}
                                        color="primary"
                                    />
                                }
                                label={t('common.isActive')}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose} disabled={loading}>
                        {t('common.cancel')}
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={loading || !formik.isValid}
                        startIcon={loading && <CircularProgress size={20} />}
                    >
                        {loading ? t('common.saving') : (representative ? t('common.update') : t('common.create'))}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default RepresentativeDialog; 