import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  IconButton,
  Chip,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { authAPI } from '../../services/api';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import NoContent from '../../components/common/NoContent';

/**
 * Reports component for managing medical reports
 */
const Reports = () => {
  const { t } = useTranslation();
  const [reports, setReports] = useState([]);
  const [doctors, setDoctors] = useState([]); // Kept for potential future use in dialog
  const [patients, setPatients] = useState([]); // Kept for potential future use in dialog
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [/* Add dependencies if needed, or keep empty if desired */]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Only fetch reports for the table view for now
      const reportsRes = await authAPI.getReports();
      setReports(reportsRes.data || []);
      // Removed fetching doctors and patients here as they are not used in the table view
    } catch (error) {
      toast.error(t('reports.fetchError'));
      console.error('Error fetching reports:', error);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (report) => {
    try {
      // Assuming authAPI.downloadReport is implemented and returns a Blob or similar
      const response = await authAPI.downloadReport(report.id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      // Assuming report object has a 'type' or 'id' property to name the file
      link.setAttribute('download', `report-${report.id || report.type || 'file'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast.error(t('reports.downloadError'));
      console.error('Error downloading report:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'draft':
        return 'default';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (reports.length === 0) {
    return (
      <NoContent message={t('reports.noReportsFound')} />
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          {t('reports.title')}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardHeader 
              title={t('reports.recentReports')}
              subheader={t('reports.recentReportsSubtitle')}
            />
            <Divider />
            <CardContent>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>{t('reports.patientName')}</TableCell>
                      <TableCell>{t('reports.date')}</TableCell>
                      <TableCell>{t('reports.type')}</TableCell>
                      <TableCell>{t('reports.status')}</TableCell>
                      <TableCell align="right">{t('reports.actions')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reports.map((report) => (
                      <TableRow key={report.id}>
                        {/* Using optional chaining as patient might be null if not fetched */}
                        <TableCell>{report.patient?.name || '-'}</TableCell>
                        <TableCell>
                          {/* Assuming createdAt is available and a valid date string */}
                          {new Date(report.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{report.type || '-'}</TableCell>
                        <TableCell>
                          <Chip
                            label={t(`reports.status.${report.status}`) || report.status}
                            color={getStatusColor(report.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => {/* Handle view - to be implemented */}}
                          >
                            <ViewIcon />
                          </IconButton>
                          {/* Assuming a downloadReport method exists in authAPI */}
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleDownload(report)}
                          >
                            <DownloadIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Reports; 