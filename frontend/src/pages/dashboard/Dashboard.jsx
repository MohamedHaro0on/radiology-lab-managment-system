import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import {
  TrendingUp,
  People,
  AttachMoney,
  Schedule,
  Star,
  LocalHospital,
} from '@mui/icons-material';
import { dashboardAPI } from '../../services/api';
import { useTranslation } from 'react-i18next';
import { useRTL } from '../../hooks/useRTL';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const Dashboard = () => {
  const { t } = useTranslation();
  const { isRTL, cardGridProps, iconContainerProps, textContainerProps, containerProps } = useRTL();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState('week');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      console.log('Dashboard: Starting to fetch analytics...');
      setLoading(true);
      const response = await dashboardAPI.getAnalytics();
      console.log('Dashboard: Analytics response:', response);
      setAnalytics(response.data.data);
      setError('');
    } catch (err) {
      console.error('Dashboard: Error fetching analytics:', err);
      console.error('Dashboard: Error response:', err.response);
      setError(err.response?.data?.message || t('dashboard.fetchError'));
    } finally {
      console.log('Dashboard: Finished fetching analytics');
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <Container maxWidth="xl">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl">
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  if (!analytics) {
    return (
      <Container maxWidth="xl">
        <Alert severity="info" sx={{ mt: 2 }}>
          {t('common.noData')}
        </Alert>
      </Container>
    );
  }

  // Prepare data for charts
  const monthlyIncomeData = analytics.monthlyIncomeTrend?.map(item => ({
    month: `${item._id.year}-${item._id.month.toString().padStart(2, '0')}`,
    income: item.totalIncome,
    appointments: item.appointmentCount,
  })) || [];

  const scanData = analytics.mostRequestedScans?.map(scan => ({
    name: scan.categoryName,
    count: scan.count,
    revenue: scan.totalRevenue,
  })) || [];

  const appointmentStatusData = [
    { name: t('appointments.status.scheduled'), value: analytics.recentAppointments?.filter(apt => apt.status === 'scheduled').length || 0 },
    { name: t('appointments.status.completed'), value: analytics.recentAppointments?.filter(apt => apt.status === 'completed').length || 0 },
    { name: t('appointments.status.cancelled'), value: analytics.recentAppointments?.filter(apt => apt.status === 'cancelled').length || 0 },
  ];

  return (
    <Container maxWidth="xl" sx={{ mt: 3, mb: 3, ...containerProps }}>
      <Typography 
        variant="h4" 
        component="h1" 
        gutterBottom
      >
        {t('navigation.dashboard')}
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4, ...containerProps }} dir={isRTL ? 'rtl' : 'ltr'}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={cardGridProps}>
                <Box sx={textContainerProps}>
                  <Typography 
                    color="textSecondary" 
                    gutterBottom
                  >
                    {t('dashboard.dailyIncome')}
                  </Typography>
                  <Typography 
                    variant="h5" 
                    component="div"
                  >
                    {formatCurrency(analytics.daily.income)}
                  </Typography>
                </Box>
                <Box sx={{ ...iconContainerProps, color: 'primary.main' }}>
                  <AttachMoney />
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
                  >
                    {t('dashboard.dailyAppointments')}
                  </Typography>
                  <Typography 
                    variant="h5" 
                    component="div"
                  >
                    {analytics.daily.appointments}
                  </Typography>
                </Box>
                <Box sx={{ ...iconContainerProps, color: 'primary.main' }}>
                  <Schedule />
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
                  >
                    {t('dashboard.weeklyIncome')}
                  </Typography>
                  <Typography 
                    variant="h5" 
                    component="div"
                  >
                    {formatCurrency(analytics.weekly.income)}
                  </Typography>
                </Box>
                <Box sx={{ ...iconContainerProps, color: 'primary.main' }}>
                  <TrendingUp />
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
                  >
                    {t('dashboard.weeklyAppointments')}
                  </Typography>
                  <Typography 
                    variant="h5" 
                    component="div"
                  >
                    {analytics.weekly.appointments}
                  </Typography>
                </Box>
                <Box sx={{ ...iconContainerProps, color: 'primary.main' }}>
                  <People />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={3} sx={{ mb: 4, ...containerProps }}>
        {/* Monthly Income Trend */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, ...containerProps }}>
            <Typography 
              variant="h6" 
              gutterBottom
            >
              {t('dashboard.monthlyIncomeTrend')}
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyIncomeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="income"
                  stroke="#8884d8"
                  fill="#8884d8"
                  fillOpacity={0.3}
                  name={t('dashboard.totalIncome')}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Most Requested Scans */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, ...containerProps }}>
            <Typography 
              variant="h6" 
              gutterBottom
            >
              {t('dashboard.mostRequestedScans')}
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={scanData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={80} />
                <Tooltip formatter={(value) => [value, t('common.count')]} />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Second Row */}
      <Grid container spacing={3} sx={{ mb: 4, ...containerProps }}>
        {/* Appointment Status Distribution */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, ...containerProps }}>
            <Typography 
              variant="h6" 
              gutterBottom
            >
              {t('dashboard.appointmentStatus')}
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={appointmentStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {appointmentStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Top Rated Doctors */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, ...containerProps }}>
            <Typography 
              variant="h6" 
              gutterBottom
            >
              {t('dashboard.topRatedDoctors')}
            </Typography>
            <List>
              {analytics.topRatedDoctors?.map((doctor, index) => {
                const doctorName = doctor.name || t('common.unknown');
                return (
                  <React.Fragment key={doctor._id}>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: COLORS[index % COLORS.length] }}>
                          {doctorName.charAt(0) || 'D'}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography>
                            {doctorName}
                          </Typography>
                        }
                        secondary={
                          <React.Fragment>
                            <Typography 
                              variant="body2" 
                              color="textSecondary" 
                              component="span" 
                              display="block"
                            >
                              {doctor.specialization}
                            </Typography>
                            <Typography 
                              variant="body2" 
                              component="span" 
                              display="block" 
                              sx={{ mt: 1 }}
                            >
                              <Star sx={{ 
                                color: '#FFD700', 
                                fontSize: 16, 
                                verticalAlign: 'middle', 
                                mr: isRTL ? 0 : 0.5,
                                ml: isRTL ? 0.5 : 0
                              }} />
                              {t('common.rating')}: {(doctor.rating * 100).toFixed(1)}%
                            </Typography>
                            <Chip
                              size="small"
                              label={`${doctor.completedAppointments}/${doctor.appointmentCount} ${t('appointments.status.completed')}`}
                              color="primary"
                              variant="outlined"
                              sx={{ mt: 0.5 }}
                            />
                          </React.Fragment>
                        }
                      />
                    </ListItem>
                    {index < analytics.topRatedDoctors.length - 1 && <Divider />}
                  </React.Fragment>
                );
              })}
            </List>
          </Paper>
        </Grid>
      </Grid>

      {/* Third Row - Top Representatives */}
      <Grid container spacing={3} sx={{ mb: 4, ...containerProps }}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3, ...containerProps }}>
            <Typography 
              variant="h6" 
              gutterBottom
            >
              {t('dashboard.topRepresentatives')}
            </Typography>
            <Grid container spacing={2}>
              {analytics.topRepresentatives?.map((representative, index) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={representative._id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box display="flex" alignItems="center" mb={2}>
                        <Avatar sx={{ 
                          bgcolor: COLORS[index % COLORS.length], 
                          mr: isRTL ? 0 : 2,
                          ml: isRTL ? 2 : 0
                        }}>
                          {representative.name.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography 
                            variant="subtitle1" 
                            fontWeight="bold"
                          >
                            {representative.name}
                          </Typography>
                          <Typography 
                            variant="body2" 
                            color="textSecondary"
                          >
                            ID: {representative.id}
                          </Typography>
                        </Box>
                      </Box>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Box>
                          <Chip
                            size="small"
                            label={`${representative.patientsCount} ${t('representatives.patients')}`}
                            color="primary"
                            variant="outlined"
                            sx={{ 
                              mr: isRTL ? 0 : 1,
                              ml: isRTL ? 1 : 0,
                            }}
                          />
                          <Chip
                            size="small"
                            label={`${representative.doctorsCount} ${t('representatives.doctors')}`}
                            color="secondary"
                            variant="outlined"
                          />
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      {/* Total Statistics */}
      <Grid container spacing={3} sx={{ mb: 4, ...containerProps }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={cardGridProps}>
                <Box sx={textContainerProps}>
                  <Typography 
                    color="textSecondary" 
                    gutterBottom
                  >
                    {t('dashboard.totalIncome')}
                  </Typography>
                  <Typography 
                    variant="h4" 
                    component="div" 
                    color="primary"
                  >
                    {formatCurrency(analytics.total.income)}
                  </Typography>
                </Box>
                <Box sx={{ ...iconContainerProps, color: 'primary.main' }}>
                  <AttachMoney />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={cardGridProps}>
                <Box sx={textContainerProps}>
                  <Typography 
                    color="textSecondary" 
                    gutterBottom
                  >
                    {t('dashboard.totalAppointments')}
                  </Typography>
                  <Typography 
                    variant="h4" 
                    component="div" 
                    color="primary"
                  >
                    {analytics.total.appointments}
                  </Typography>
                </Box>
                <Box sx={{ ...iconContainerProps, color: 'primary.main' }}>
                  <People />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Appointments */}
      <Paper sx={{ p: 3, ...containerProps }}>
        <Typography 
          variant="h6" 
          gutterBottom
        >
          {t('dashboard.recentAppointments')}
        </Typography>
        <List>
          {analytics.recentAppointments?.map((appointment, index) => (
            <React.Fragment key={appointment._id}>
              <ListItem>
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: COLORS[index % COLORS.length] }}>
                    <LocalHospital />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography>
                      {appointment.patient?.name || t('patients.title')}
                    </Typography>
                  }
                  secondary={
                    <React.Fragment>
                      <Typography 
                        variant="body2" 
                        color="textSecondary" 
                        component="span" 
                        display="block"
                      >
                        {t('appointments.doctor')}: {appointment.doctor?.name || t('common.unknown')} ({appointment.doctor?.specialization})
                      </Typography>
                      <Typography 
                        variant="body2" 
                        color="textSecondary" 
                        component="span" 
                        display="block"
                      >
                        {t('navigation.scans')}: {appointment.scan?.category?.name} - {formatCurrency(appointment.scan?.category?.price)}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        color="textSecondary" 
                        component="span" 
                        display="block" 
                        sx={{ mt: 1 }}
                      >
                        <Chip
                          size="small"
                          label={t(`appointments.status.${appointment.status}`)}
                          color={
                            appointment.status === 'completed' ? 'success' :
                            appointment.status === 'scheduled' ? 'primary' : 'error'
                          }
                          sx={{ 
                            mr: isRTL ? 0 : 1,
                            ml: isRTL ? 1 : 0,
                          }}
                        />
                        {formatDate(appointment.appointmentDate)}
                      </Typography>
                    </React.Fragment>
                  }
                />
              </ListItem>
              {index < analytics.recentAppointments.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      </Paper>
    </Container>
  );
};

export default Dashboard; 