import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { patientAPI, patientHistoryAPI } from '../../services/api';
import { Box, Typography, CircularProgress, Card, CardContent, Divider, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, Button } from '@mui/material';
import { Download as DownloadIcon, Visibility as ViewIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useRTL } from '../../hooks/useRTL';

const PatientDetails = () => {
  const { id } = useParams();
  const { t } = useTranslation();
  const [patient, setPatient] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isRTL, rtlProps, inputProps, cardProps } = useRTL();

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      try {
        const patientRes = await patientAPI.getById(id);
        setPatient(patientRes.data.data);
        
        // Fetch patient history from appointments
        const historyRes = await patientHistoryAPI.getByPatientId(id);
        const histories = Array.isArray(historyRes.data.data)
          ? historyRes.data.data
          : [];
        setHistory(histories);
      } catch (err) {
        console.error('Error fetching patient details:', err);
        setPatient(null);
        setHistory([]);
      }
      setLoading(false);
    };
    fetchDetails();
  }, [id]);

  const backendBaseUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3000';

  const handleViewPDF = (pdfPath) => {
    if (pdfPath) {
      window.open(`${backendBaseUrl}${pdfPath}`, '_blank');
    }
  };

  const handleDownloadPDF = (pdfPath) => {
    if (pdfPath) {
      const link = document.createElement('a');
      link.href = `${backendBaseUrl}${pdfPath}`;
      link.download = `report_${new Date().getTime()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (loading) return <Box display="flex" justifyContent="center"><CircularProgress /></Box>;
  if (!patient) return <Typography color="error">Patient not found or an error occurred.</Typography>;

  return (
    <Box>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            {t('patients.patientDetails')}
          </Typography>
          <TableContainer component={Paper} sx={{ mb: 2 }} dir={isRTL ? 'rtl' : 'ltr'}>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell variant="head" sx={{ fontWeight: 'bold', width: '30%' }} align={isRTL ? 'right' : 'left'}>
                    {t('patients.name')}
                  </TableCell>
                  <TableCell align={isRTL ? 'left' : 'right'}>{patient.name}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell variant="head" sx={{ fontWeight: 'bold' }} align={isRTL ? 'right' : 'left'}>
                    {t('patients.gender')}
                  </TableCell>
                  <TableCell align={isRTL ? 'left' : 'right'}>
                    <Chip 
                      label={t(`patients.genders.${patient.gender}`)}
                      color={patient.gender === 'male' ? 'primary' : 'secondary'}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell variant="head" sx={{ fontWeight: 'bold' }} align={isRTL ? 'right' : 'left'}>
                    {t('patients.dateOfBirth')}
                  </TableCell>
                  <TableCell align={isRTL ? 'left' : 'right'}>{new Date(patient.dateOfBirth).toLocaleDateString()}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell variant="head" sx={{ fontWeight: 'bold' }} align={isRTL ? 'right' : 'left'}>
                    {t('patients.phone')}
                  </TableCell>
                  <TableCell align={isRTL ? 'left' : 'right'}>{patient.phoneNumber}</TableCell>
                </TableRow>
                {patient.socialNumber && (
                  <TableRow>
                    <TableCell variant="head" sx={{ fontWeight: 'bold' }} align={isRTL ? 'right' : 'left'}>
                      {t('patients.socialNumber')}
                    </TableCell>
                    <TableCell align={isRTL ? 'left' : 'right'}>{patient.socialNumber}</TableCell>
                  </TableRow>
                )}
                {patient.doctorReferred && (
                  <TableRow>
                    <TableCell variant="head" sx={{ fontWeight: 'bold' }} align={isRTL ? 'right' : 'left'}>
                      {t('patients.referringDoctor')}
                    </TableCell>
                    <TableCell align={isRTL ? 'left' : 'right'}>{patient.doctorReferred.name}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Divider sx={{ my: 2 }} />
      
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {t('patients.medicalHistory')}
          </Typography>
          {history.length === 0 ? (
            <Typography color="textSecondary">
              {t('patients.noHistoryFound')}
            </Typography>
          ) : (
            <TableContainer component={Paper} dir={isRTL ? 'rtl' : 'ltr'}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell align={isRTL ? 'right' : 'left'}>{t('patients.date')}</TableCell>
                    <TableCell align={isRTL ? 'right' : 'left'}>{t('patients.diagnosis')}</TableCell>
                    <TableCell align={isRTL ? 'right' : 'left'}>{t('patients.treatment')}</TableCell>
                    <TableCell align={isRTL ? 'right' : 'left'}>{t('patients.notes')}</TableCell>
                    <TableCell align={isRTL ? 'right' : 'left'}>{t('patients.scans')}</TableCell>
                    <TableCell align={isRTL ? 'right' : 'left'}>{t('patients.pdfReport')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {history.map((h) => (
                    <TableRow key={h.id || h._id}>
                      <TableCell align={isRTL ? 'right' : 'left'}>
                        {h.date ? new Date(h.date).toLocaleDateString() : ''}
                      </TableCell>
                      <TableCell align={isRTL ? 'right' : 'left'}>{h.diagnosis}</TableCell>
                      <TableCell align={isRTL ? 'right' : 'left'}>{h.treatment}</TableCell>
                      <TableCell align={isRTL ? 'right' : 'left'}>{h.notes}</TableCell>
                      <TableCell align={isRTL ? 'right' : 'left'}>
                        {h.scans && h.scans.length > 0 ? (
                          <Box>
                            {h.scans.map((scan, index) => (
                              <Chip 
                                key={index}
                                label={`${scan.scan} (${scan.quantity})`}
                                size="small"
                                sx={{ mr: 0.5, mb: 0.5 }}
                              />
                            ))}
                          </Box>
                        ) : (
                          <Typography variant="body2" color="textSecondary">
                            {t('patients.noScans')}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align={isRTL ? 'right' : 'left'}>
                        {h.pdfReport ? (
                          <Box>
                            <Button
                              size="small"
                              startIcon={<ViewIcon />}
                              onClick={() => handleViewPDF(h.pdfReport)}
                              sx={{ mr: 1 }}
                            >
                              {t('common.view')}
                            </Button>
                            <Button
                              size="small"
                              startIcon={<DownloadIcon />}
                              onClick={() => handleDownloadPDF(h.pdfReport)}
                            >
                              {t('common.download')}
                            </Button>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="textSecondary">
                            {t('patients.noPDF')}
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default PatientDetails; 