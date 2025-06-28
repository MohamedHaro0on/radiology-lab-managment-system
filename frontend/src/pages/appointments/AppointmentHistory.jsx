import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import {
    Box,
    Typography,
    CircularProgress,
    Alert,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Breadcrumbs,
    Link,
    Accordion,
    AccordionSummary,
    AccordionDetails,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { format } from 'date-fns';
import { appointmentAPI } from '../../services/api';
import { toast } from 'react-toastify';

const AppointmentHistory = () => {
    const { id } = useParams();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const fetchHistory = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const response = await appointmentAPI.getAppointmentHistory(id);
            setHistory(response.data.data);
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Failed to fetch appointment history';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    const renderChanges = (changes) => {
        if (!changes) return <Typography variant="body2">No changes recorded.</Typography>;
    
        return (
            <Box>
                {Object.entries(changes).map(([key, value]) => (
                    <Box key={key} sx={{ mb: 1 }}>
                        <Typography variant="body2" component="span" sx={{ fontWeight: 'bold' }}>{key}: </Typography>
                        <Typography variant="body2" component="span" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                            {JSON.stringify(value, null, 2)}
                        </Typography>
                    </Box>
                ))}
            </Box>
        );
    };

    return (
        <Paper sx={{ p: 3, m: 2 }}>
            <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
                <Link component={RouterLink} underline="hover" color="inherit" to="/appointments">
                    Appointments
                </Link>
                <Typography color="text.primary">History ({id})</Typography>
            </Breadcrumbs>
            
            <Typography variant="h4" gutterBottom>Appointment Change History</Typography>

            {loading && <CircularProgress />}
            {error && <Alert severity="error">{error}</Alert>}

            <TableContainer component={Paper} sx={{ mt: 3 }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Date</TableCell>
                            <TableCell>User</TableCell>
                            <TableCell>Action</TableCell>
                            <TableCell>Changes</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {history.map((entry) => (
                            <TableRow key={entry._id}>
                                <TableCell>{format(new Date(entry.createdAt), 'PPpp')}</TableCell>
                                <TableCell>{entry.user?.username || 'N/A'}</TableCell>
                                <TableCell>{entry.action}</TableCell>
                                <TableCell>
                                    <Accordion>
                                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                            <Typography>View Details</Typography>
                                        </AccordionSummary>
                                        <AccordionDetails>
                                            {renderChanges(entry.changes)}
                                        </AccordionDetails>
                                    </Accordion>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Paper>
    );
};

export default AppointmentHistory; 