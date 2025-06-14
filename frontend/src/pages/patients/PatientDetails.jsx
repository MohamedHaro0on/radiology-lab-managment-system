import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { patientAPI, patientHistoryAPI } from '../../services/api';
import { Box, Typography, CircularProgress, Card, CardContent, Divider, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';

const PatientDetails = () => {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      try {
        const patientRes = await patientAPI.getById(id);
        setPatient(patientRes.data.data);
        const historyRes = await patientHistoryAPI.getAll({ patientId: id });
        const histories = Array.isArray(historyRes.data.data?.histories)
          ? historyRes.data.data.histories
          : Array.isArray(historyRes.data.data)
          ? historyRes.data.data
          : [];
        setHistory(histories);
      } catch (err) {
        setPatient(null);
        setHistory([]);
      }
      setLoading(false);
    };
    fetchDetails();
  }, [id]);

  if (loading) return <Box display="flex" justifyContent="center"><CircularProgress /></Box>;
  if (!patient) return <Typography color="error">Patient not found or an error occurred.</Typography>;

  return (
    <Box>
      <TableContainer component={Paper} sx={{ mb: 2, maxWidth: 500 }}>
        <Table>
          <TableBody>
            <TableRow>
              <TableCell variant="head">Name</TableCell>
              <TableCell>{patient.name}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell variant="head">Gender</TableCell>
              <TableCell>{patient.gender}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell variant="head">DOB</TableCell>
              <TableCell>{new Date(patient.dateOfBirth).toLocaleDateString()}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell variant="head">Phone</TableCell>
              <TableCell>{patient.phoneNumber}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
      <Divider sx={{ my: 2 }} />
      <Typography variant="h6" sx={{ mb: 2 }}>Patient History</Typography>
      {history.length === 0 ? (
        <Typography>No history found.</Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Diagnosis</TableCell>
                <TableCell>Treatment</TableCell>
                <TableCell>Notes</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {history.map((h) => (
                <TableRow key={h._id}>
                  <TableCell>{h.date ? new Date(h.date).toLocaleDateString() : ''}</TableCell>
                  <TableCell>{h.diagnosis}</TableCell>
                  <TableCell>{h.treatment}</TableCell>
                  <TableCell>{h.notes}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default PatientDetails; 