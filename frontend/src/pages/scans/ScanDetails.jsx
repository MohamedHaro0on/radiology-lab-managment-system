import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Grid,
  Chip,
  Divider,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
  Alert,
  MenuItem,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Image as ImageIcon,
  AttachMoney as MoneyIcon,
  Inventory as InventoryIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { scanAPI } from '../../services/api';
import ConfirmDialog from '../../components/common/ConfirmDialog';

/**
 * ScanDetails component for viewing detailed scan information
 */
const ScanDetails = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [scan, setScan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openImageDialog, setOpenImageDialog] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    actualCost: '',
    minPrice: '',
    description: '',
  });
  const [newImage, setNewImage] = useState({
    url: '',
    type: 'jpeg',
    description: '',
  });

  useEffect(() => {
    if (id) {
      fetchScan();
    }
  }, [id]);

  const fetchScan = async () => {
    try {
      setLoading(true);
      const response = await scanAPI.getById(id);
      setScan(response.data.data);
    } catch (err) {
      console.error('Error fetching scan:', err);
      toast.error('Failed to fetch scan details');
      navigate('/scans');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setEditForm({
      name: scan.name || '',
      actualCost: scan.actualCost?.toString() || '',
      minPrice: scan.minPrice?.toString() || '',
      description: scan.description || '',
    });
    setOpenEditDialog(true);
  };

  const handleUpdate = async () => {
    try {
      const updateData = {
        ...editForm,
        actualCost: parseFloat(editForm.actualCost),
        minPrice: parseFloat(editForm.minPrice),
        // Only include description if it's not empty
        description: editForm.description?.trim() || undefined,
      };

      await scanAPI.update(id, updateData);
      toast.success('Scan updated successfully');
      setOpenEditDialog(false);
      fetchScan();
    } catch (err) {
      console.error('Update error:', err);
      toast.error('Failed to update scan');
    }
  };

  const handleDelete = async () => {
    try {
      await scanAPI.delete(id);
      toast.success('Scan deleted successfully');
      navigate('/scans');
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('Failed to delete scan');
    }
  };

  const handleAddImage = async () => {
    try {
      await scanAPI.addImage(id, { image: newImage });
      toast.success('Image added successfully');
      setOpenImageDialog(false);
      setNewImage({ url: '', type: 'jpeg', description: '' });
      fetchScan();
    } catch (err) {
      console.error('Add image error:', err);
      toast.error('Failed to add image');
    }
  };

  const handleRemoveImage = async (imageId) => {
    try {
      await scanAPI.removeImage(id, imageId);
      toast.success('Image removed successfully');
      fetchScan();
    } catch (err) {
      console.error('Remove image error:', err);
      toast.error('Failed to remove image');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (date) => {
    return format(new Date(date), 'MMM dd, yyyy HH:mm');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!scan) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Scan not found</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" alignItems="center" mb={3}>
        <IconButton onClick={() => navigate('/scans')} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
          {scan.name}
        </Typography>
        <IconButton onClick={handleEdit} sx={{ mr: 1 }}>
          <EditIcon />
        </IconButton>
        <IconButton onClick={() => setOpenDeleteDialog(true)}>
          <DeleteIcon />
        </IconButton>
      </Box>

      <Grid container spacing={3}>
        {/* Basic Information */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Basic Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Name
                  </Typography>
                  <Typography variant="body1">{scan.name}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Status
                  </Typography>
                  <Chip
                    label={scan.isActive ? 'Active' : 'Inactive'}
                    color={scan.isActive ? 'success' : 'default'}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Actual Cost
                  </Typography>
                  <Typography variant="body1" color="primary">
                    {formatCurrency(scan.actualCost)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Minimum Price
                  </Typography>
                  <Typography variant="body1" color="primary">
                    {formatCurrency(scan.minPrice)}
                  </Typography>
                </Grid>
                {scan.description && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Description
                    </Typography>
                    <Typography variant="body1">{scan.description}</Typography>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Timestamps */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Timestamps
              </Typography>
              <Box>
                <Typography variant="subtitle2" color="textSecondary">
                  Created
                </Typography>
                <Typography variant="body2">
                  {formatDate(scan.createdAt)}
                </Typography>
              </Box>
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" color="textSecondary">
                  Last Updated
                </Typography>
                <Typography variant="body2">
                  {formatDate(scan.updatedAt)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Items */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Items
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Item Name</TableCell>
                      <TableCell align="right">Quantity</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {scan.items?.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.item}</TableCell>
                        <TableCell align="right">{item.quantity}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Images */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  Images
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => setOpenImageDialog(true)}
                >
                  Add Image
                </Button>
              </Box>
              {scan.images?.length > 0 ? (
                <Grid container spacing={2}>
                  {scan.images.map((image, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                      <Card variant="outlined">
                        <CardContent>
                          <Box display="flex" alignItems="center" mb={1}>
                            <ImageIcon sx={{ mr: 1 }} />
                            <Typography variant="subtitle2">
                              {image.type.toUpperCase()}
                            </Typography>
                          </Box>
                          <img
                            src={image.url}
                            alt={image.description || 'Scan image'}
                            style={{
                              width: '100%',
                              height: 200,
                              objectFit: 'cover',
                              borderRadius: 4,
                            }}
                          />
                          {image.description && (
                            <Typography variant="body2" sx={{ mt: 1 }}>
                              {image.description}
                            </Typography>
                          )}
                          <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
                            <Typography variant="caption" color="textSecondary">
                              {formatDate(image.uploadedAt)}
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={() => handleRemoveImage(image._id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Typography variant="body2" color="textSecondary">
                  No images uploaded yet.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Edit Dialog */}
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Scan</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Actual Cost"
                type="number"
                value={editForm.actualCost}
                onChange={(e) => setEditForm({ ...editForm, actualCost: e.target.value })}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Minimum Price"
                type="number"
                value={editForm.minPrice}
                onChange={(e) => setEditForm({ ...editForm, minPrice: e.target.value })}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description (Optional)"
                multiline
                rows={3}
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                helperText="Optional description for the scan"
                placeholder="Enter an optional description for this scan..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)}>Cancel</Button>
          <Button onClick={handleUpdate} variant="contained">Update</Button>
        </DialogActions>
      </Dialog>

      {/* Add Image Dialog */}
      <Dialog open={openImageDialog} onClose={() => setOpenImageDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Image</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Image URL"
                value={newImage.url}
                onChange={(e) => setNewImage({ ...newImage, url: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Image Type"
                value={newImage.type}
                onChange={(e) => setNewImage({ ...newImage, type: e.target.value })}
              >
                <MenuItem value="jpeg">JPEG</MenuItem>
                <MenuItem value="png">PNG</MenuItem>
                <MenuItem value="dicom">DICOM</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={2}
                value={newImage.description}
                onChange={(e) => setNewImage({ ...newImage, description: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenImageDialog(false)}>Cancel</Button>
          <Button onClick={handleAddImage} variant="contained">Add Image</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={openDeleteDialog}
        title="Delete Scan"
        content="Are you sure you want to delete this scan? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setOpenDeleteDialog(false)}
      />
    </Box>
  );
};

export default ScanDetails; 