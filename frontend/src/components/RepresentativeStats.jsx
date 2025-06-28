import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Grid,
    Card,
    CardContent,
    Box,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    CircularProgress,
    Divider,
    Alert
} from '@mui/material';
import {
    People as PeopleIcon,
    LocalHospital as DoctorIcon,
    Event as AppointmentIcon,
    TrendingUp as RevenueIcon,
    Phone as PhoneIcon,
    Badge as BadgeIcon
} from '@mui/icons-material';
import { representativeService } from '../services/representativeService';
import { toast } from 'react-toastify';

const RepresentativeStats = ({ open, representative, onClose }) => {
    const { t } = useTranslation();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && representative) {
            fetchStats();
        }
    }, [open, representative]);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const response = await representativeService.getRepresentativeStats(representative._id);
            setStats(response.data);
        } catch (error) {
            console.error('Error fetching representative stats:', error);
            toast.error(t('error.fetchingStats'));
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setStats(null);
        onClose();
    };

    if (!representative) return null;

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <BadgeIcon color="primary" />
                    <Typography variant="h6">
                        {t('representatives.statsTitle', { name: representative.name })}
                    </Typography>
                </Box>
            </DialogTitle>
            <DialogContent>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                        <CircularProgress />
                    </Box>
                ) : stats ? (
                    <Box sx={{ mt: 2 }}>
                        {/* Representative Info */}
                        <Card sx={{ mb: 3 }}>
                            <CardContent>
                                <Grid container spacing={2} alignItems="center">
                                    <Grid item xs={12} md={6}>
                                        <Typography variant="h6" gutterBottom>
                                            {stats.representative.name}
                                        </Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                            <BadgeIcon fontSize="small" color="action" />
                                            <Typography variant="body2" color="text.secondary">
                                                ID: {stats.representative.id}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <PhoneIcon fontSize="small" color="action" />
                                            <Typography variant="body2" color="text.secondary">
                                                {stats.representative.phoneNumber}
                                            </Typography>
                                        </Box>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                                            <Chip
                                                icon={<PeopleIcon />}
                                                label={`${stats.representative.patientsCount} ${t('representatives.patients')}`}
                                                color="primary"
                                                variant="outlined"
                                            />
                                            <Chip
                                                icon={<DoctorIcon />}
                                                label={`${stats.representative.doctorsCount} ${t('representatives.doctors')}`}
                                                color="secondary"
                                                variant="outlined"
                                            />
                                        </Box>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>

                        {/* Summary Stats */}
                        <Grid container spacing={3} sx={{ mb: 3 }}>
                            <Grid item xs={12} sm={6} md={3}>
                                <Card>
                                    <CardContent sx={{ textAlign: 'center' }}>
                                        <PeopleIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                                        <Typography variant="h4" color="primary">
                                            {stats.summary.totalPatients}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {t('representatives.totalPatients')}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Card>
                                    <CardContent sx={{ textAlign: 'center' }}>
                                        <DoctorIcon color="secondary" sx={{ fontSize: 40, mb: 1 }} />
                                        <Typography variant="h4" color="secondary">
                                            {stats.summary.totalDoctors}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {t('representatives.totalDoctors')}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Card>
                                    <CardContent sx={{ textAlign: 'center' }}>
                                        <AppointmentIcon color="info" sx={{ fontSize: 40, mb: 1 }} />
                                        <Typography variant="h4" color="info.main">
                                            {stats.summary.totalAppointments}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {t('representatives.totalAppointments')}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Card>
                                    <CardContent sx={{ textAlign: 'center' }}>
                                        <RevenueIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
                                        <Typography variant="h4" color="success.main">
                                            ${stats.summary.averageRevenuePerAppointment.toFixed(2)}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {t('representatives.avgRevenuePerAppointment')}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>

                        <Divider sx={{ my: 3 }} />

                        {/* Associated Doctors */}
                        <Typography variant="h6" gutterBottom>
                            {t('representatives.associatedDoctors')}
                        </Typography>
                        <TableContainer component={Paper} sx={{ mb: 3 }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>{t('doctors.name')}</TableCell>
                                        <TableCell>{t('doctors.specialization')}</TableCell>
                                        <TableCell>{t('doctors.contactNumber')}</TableCell>
                                        <TableCell>{t('doctors.totalPatientsReferred')}</TableCell>
                                        <TableCell>{t('doctors.totalScansReferred')}</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {stats.doctors.map((doctor) => (
                                        <TableRow key={doctor._id}>
                                            <TableCell>{doctor.name}</TableCell>
                                            <TableCell>{doctor.specialization}</TableCell>
                                            <TableCell>{doctor.contactNumber}</TableCell>
                                            <TableCell>{doctor.totalPatientsReferred}</TableCell>
                                            <TableCell>{doctor.totalScansReferred}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        {/* Associated Patients */}
                        <Typography variant="h6" gutterBottom>
                            {t('representatives.associatedPatients')}
                        </Typography>
                        <TableContainer component={Paper} sx={{ mb: 3 }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>{t('patients.name')}</TableCell>
                                        <TableCell>{t('patients.phoneNumber')}</TableCell>
                                        <TableCell>{t('patients.dateOfBirth')}</TableCell>
                                        <TableCell>{t('patients.gender')}</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {stats.patients.map((patient) => (
                                        <TableRow key={patient._id}>
                                            <TableCell>{patient.name}</TableCell>
                                            <TableCell>{patient.phoneNumber}</TableCell>
                                            <TableCell>
                                                {new Date(patient.dateOfBirth).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>{patient.gender}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        {/* Monthly Stats */}
                        {stats.appointments.monthlyStats.length > 0 && (
                            <>
                                <Typography variant="h6" gutterBottom>
                                    {t('representatives.monthlyStats')}
                                </Typography>
                                <TableContainer component={Paper}>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>{t('common.month')}</TableCell>
                                                <TableCell>{t('representatives.appointmentCount')}</TableCell>
                                                <TableCell>{t('representatives.revenue')}</TableCell>
                                                <TableCell>{t('representatives.profit')}</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {stats.appointments.monthlyStats.map((monthly, index) => (
                                                <TableRow key={index}>
                                                    <TableCell>
                                                        {new Date(monthly._id.year, monthly._id.month - 1).toLocaleDateString('en-US', { 
                                                            year: 'numeric', 
                                                            month: 'long' 
                                                        })}
                                                    </TableCell>
                                                    <TableCell>{monthly.count}</TableCell>
                                                    <TableCell>${monthly.revenue.toFixed(2)}</TableCell>
                                                    <TableCell>${monthly.profit.toFixed(2)}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </>
                        )}
                    </Box>
                ) : (
                    <Alert severity="info">
                        {t('representatives.noStatsAvailable')}
                    </Alert>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>
                    {t('common.close')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default RepresentativeStats; 