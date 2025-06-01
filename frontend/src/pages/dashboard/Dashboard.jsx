import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
} from '@mui/material';
import {
  People as PeopleIcon,
  CalendarMonth as CalendarIcon,
  Description as DescriptionIcon,
  Inventory as InventoryIcon,
} from '@mui/icons-material';
import { authAPI } from '../../services/api';
import { toast } from 'react-toastify';

const Dashboard = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPatients: 0,
    todayAppointments: 0,
    pendingReports: 0,
    lowStockItems: 0,
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [patients, appointments, reports, stock] = await Promise.all([
          authAPI.getPatients(),
          authAPI.getAppointments(),
          authAPI.getDoctors(),
          authAPI.getStockItems(),
        ]);

        const today = new Date().toISOString().split('T')[0];
        const todayAppointments = appointments.filter(
          (apt) => apt.date.split('T')[0] === today
        );

        const lowStockItems = stock.filter(
          (item) => item.quantity <= item.minQuantity
        );

        setStats({
          totalPatients: patients.length,
          todayAppointments: todayAppointments.length,
          pendingReports: reports.filter((r) => r.status === 'draft').length,
          lowStockItems: lowStockItems.length,
        });
      } catch (error) {
        toast.error(t('dashboard.fetchError'));
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [t]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  const statCards = [
    {
      title: t('dashboard.totalPatients'),
      value: stats.totalPatients,
      icon: <PeopleIcon sx={{ fontSize: 40 }} />,
      color: '#1976d2',
    },
    {
      title: t('dashboard.todayAppointments'),
      value: stats.todayAppointments,
      icon: <CalendarIcon sx={{ fontSize: 40 }} />,
      color: '#2e7d32',
    },
    {
      title: t('dashboard.pendingReports'),
      value: stats.pendingReports,
      icon: <DescriptionIcon sx={{ fontSize: 40 }} />,
      color: '#ed6c02',
    },
    {
      title: t('dashboard.lowStock'),
      value: stats.lowStockItems,
      icon: <InventoryIcon sx={{ fontSize: 40 }} />,
      color: '#d32f2f',
    },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {t('dashboard.welcome')}
      </Typography>
      <Grid container spacing={3}>
        {statCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                },
              }}
            >
              <CardContent>
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  mb={2}
                >
                  <Typography variant="h6" color="text.secondary">
                    {card.title}
                  </Typography>
                  <Box sx={{ color: card.color }}>{card.icon}</Box>
                </Box>
                <Typography variant="h4" component="div">
                  {card.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Dashboard; 