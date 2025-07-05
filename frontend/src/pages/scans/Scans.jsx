import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useFormik } from 'formik';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Fab,
  Chip,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  InputAdornment,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Inventory as InventoryIcon,
  AttachMoney as MoneyIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { scanAPI, stockAPI } from '../../services/api';
import SearchBar from '../../components/common/SearchBar';
import NoContent from '../../components/common/NoContent';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useNavigate } from 'react-router-dom';
import { axiosInstance } from '../../services/api';
import * as Yup from 'yup';

/**
 * Scans component for managing scans
 */
const Scans = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [scans, setScans] = useState([]);
  const [stockItems, setStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stockLoading, setStockLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [openConfirm, setOpenConfirm] = useState(false);
  const [selectedScan, setSelectedScan] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const formik = useFormik({
    initialValues: {
      name: '',
      actualCost: '',
      minPrice: '',
      items: [{ item: '', quantity: 1, price: 0 }],
      description: '',
    },
    validate: (values) => {
      const errors = {};
      if (!values.name) errors.name = t('scans.nameRequired');
      if (!values.minPrice) errors.minPrice = t('scans.minPriceRequired');

      if (!values.items || values.items.length === 0) {
        errors.items = t('scans.itemsRequired');
      } else {
        values.items.forEach((item, index) => {
          if (!item.item) {
            if (!errors.items) errors.items = {};
            errors.items[index] = { item: t('scans.itemNameRequired') };
          }
          if (!item.quantity || item.quantity < 1) {
            if (!errors.items) errors.items = {};
            errors.items[index] = { ...errors.items[index], quantity: t('scans.quantityMinRequired') };
          }
        });
      }

      // Check if actual cost is calculated
      if (!values.actualCost || parseFloat(values.actualCost) === 0) {
        errors.actualCost = t('scans.costCalculationRequired');
      }

      return errors;
    },
    onSubmit: async (values) => {
      try {
        setLoading(true);
        const submitData = {
          ...values,
          actualCost: parseFloat(values.actualCost),
          minPrice: parseFloat(values.minPrice),
          // Only include description if it's not empty
          description: values.description?.trim() || undefined,
          items: values.items.map(item => ({
            item: item.item,
            quantity: parseInt(item.quantity)
          }))
        };

        if (selectedScan) {
          await scanAPI.update(selectedScan._id, submitData);
          toast.success(t('scans.updateSuccess'));
        } else {
          await scanAPI.create(submitData);
          toast.success(t('scans.createSuccess'));
        }
        handleCloseDialog();
        fetchScans();
      } catch (err) {
        console.error('Scan creation/update error:', err);
        const errorMessage = err.response?.data?.message || 
                           err.response?.data?.error || 
                           err.message || 
                           t('scans.saveError');
        toast.error(`${t('scans.saveError')}: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    },
  });

  useEffect(() => {
    fetchScans();
    fetchStockItems();
  }, [page, rowsPerPage, searchQuery]);

  const fetchScans = async () => {
    try {
      setLoading(true);
      const response = await scanAPI.getAll({
        page: page + 1,
        limit: rowsPerPage,
        search: searchQuery,
      });
      setScans(response.data.data.scans || []);
      setTotal(response.data.data.pagination?.total || 0);
    } catch (err) {
      console.error('fetchScans error:', err);
      toast.error(t('scans.fetchError'));
    } finally {
      setLoading(false);
    }
  };

  const fetchStockItems = async () => {
    try {
      setStockLoading(true);
      const response = await stockAPI.getAll({ 
        page: 1,
        limit: 100, // Use maximum allowed limit to get all items
        search: '' // No search filter to get all items
      });
      
      // Handle the response structure the same way as Stock page
      const items = response.data?.data?.stocks || response.data?.stocks || [];
      const stockItemsArray = Array.isArray(items) ? items : [];
      
      setStockItems(stockItemsArray);
    } catch (err) {
      console.error('fetchStockItems error details:', {
        message: err.message,
        response: err.response,
        status: err.response?.status,
        data: err.response?.data,
        config: err.config,
        url: err.config?.url
      });
      
      // More specific error messages
      if (err.response?.status === 404) {
        toast.error('Stock API endpoint not found. Please check if the backend is running.');
      } else if (err.response?.status === 500) {
        toast.error('Server error when fetching stock items. Please try again later.');
      } else if (err.code === 'ECONNREFUSED') {
        toast.error('Cannot connect to the server. Please check if the backend is running.');
      } else {
        toast.error(`Failed to fetch stock items: ${err.message}`);
      }
    } finally {
      setStockLoading(false);
    }
  };

  const calculateTotalCost = (items) => {
    return items.reduce((total, item) => {
      const stockItem = stockItems.find(stock => stock.name === item.item);
      const itemPrice = stockItem ? stockItem.price : 0;
      return total + (itemPrice * item.quantity);
    }, 0);
  };

  // Update calculated cost whenever items or stock items change
  useEffect(() => {
    if (formik.values.items && stockItems.length > 0) {
      updateCalculatedCost(formik.values.items);
    }
  }, [stockItems, formik.values.items]);

  const updateCalculatedCost = (items) => {
    const totalCost = calculateTotalCost(items);
    formik.setFieldValue('actualCost', totalCost.toFixed(2));
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    setPage(0);
  };

  const handleOpenDialog = (scan = null) => {
    if (scan) {
      setSelectedScan(scan);
      formik.setValues({
        name: scan.name || '',
        actualCost: scan.actualCost?.toString() || '',
        minPrice: scan.minPrice?.toString() || '',
        items: scan.items?.length > 0 ? scan.items.map(item => ({
          ...item,
          price: 0 // Will be calculated when stock items are loaded
        })) : [{ item: '', quantity: 1, price: 0 }],
        description: scan.description || '',
      });
    } else {
      setSelectedScan(null);
      formik.resetForm();
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedScan(null);
    formik.resetForm();
  };

  const handleDelete = async () => {
    try {
      await scanAPI.delete(selectedScan._id);
      toast.success('Scan deleted successfully');
      setOpenConfirm(false);
      setSelectedScan(null);
      fetchScans();
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('Failed to delete scan');
    }
  };

  const addItem = () => {
    formik.setFieldValue('items', [...formik.values.items, { item: '', quantity: 1, price: 0 }]);
  };

  const removeItem = (index) => {
    const newItems = formik.values.items.filter((_, i) => i !== index);
    formik.setFieldValue('items', newItems);
    updateCalculatedCost(newItems);
  };

  const updateItem = (index, field, value) => {
    const newItems = [...formik.values.items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // If item name changed, update the price
    if (field === 'item') {
      const stockItem = stockItems.find(stock => stock.name === value);
      newItems[index].price = stockItem ? stockItem.price : 0;
    }
    
    formik.setFieldValue('items', newItems);
    updateCalculatedCost(newItems);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (date) => {
    return format(new Date(date), 'MMM dd, yyyy');
  };

  if (loading && scans.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          {t('scans.title')}
        </Typography>
        <Fab
          color="primary"
          aria-label="add scan"
          onClick={() => handleOpenDialog()}
        >
          <AddIcon />
        </Fab>
      </Box>

      <SearchBar onSearch={handleSearch} placeholder={t('scans.searchPlaceholder')} />

      {scans.length === 0 && !loading ? (
        <NoContent
          icon={<InventoryIcon />}
          title={t('scans.noScansTitle')}
          description={t('scans.noScansDescription')}
          action={
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              {t('scans.addScanButton')}
            </Button>
          }
        />
      ) : (
        <TableContainer component={Paper} sx={{ mt: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{t('scans.name')}</TableCell>
                <TableCell>{t('scans.actualCost')}</TableCell>
                <TableCell>{t('scans.minPrice')}</TableCell>
                <TableCell>{t('scans.items')}</TableCell>
                <TableCell>{t('common.status')}</TableCell>
                <TableCell>{t('scans.created')}</TableCell>
                <TableCell>{t('scans.actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {scans.map((scan) => (
                <TableRow key={scan._id} hover>
                  <TableCell>
                    <Typography variant="subtitle2">{scan.name}</Typography>
                    {scan.description && (
                      <Typography variant="caption" color="textSecondary">
                        {scan.description}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>{formatCurrency(scan.actualCost)}</TableCell>
                  <TableCell>{formatCurrency(scan.minPrice)}</TableCell>
                  <TableCell>
                    <Box>
                      {scan.items?.slice(0, 2).map((item, index) => (
                        <Chip
                          key={index}
                          label={`${item.item} (${item.quantity})`}
                          size="small"
                          sx={{ mr: 0.5, mb: 0.5 }}
                        />
                      ))}
                      {scan.items?.length > 2 && (
                        <Chip
                          label={`+${scan.items.length - 2} ${t('scans.moreItems')}`}
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={scan.isActive ? t('common.active') : t('common.inactive')}
                      color={scan.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{formatDate(scan.createdAt)}</TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => navigate(`/scans/${scan._id}`)}
                    >
                      <ViewIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(scan)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => {
                        setSelectedScan(scan);
                        setOpenConfirm(true);
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Create/Edit Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedScan ? t('scans.editScan') : t('scans.createNewScan')}
        </DialogTitle>
        <form onSubmit={formik.handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="name"
                  label={t('scans.scanName')}
                  value={formik.values.name}
                  onChange={formik.handleChange}
                  error={formik.touched.name && Boolean(formik.errors.name)}
                  helperText={formik.touched.name && formik.errors.name}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  name="actualCost"
                  label={t('scans.calculatedCost')}
                  type="number"
                  value={formik.values.actualCost}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    readOnly: true,
                  }}
                  helperText={t('scans.automaticallyCalculated')}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  name="minPrice"
                  label={t('scans.minimumPrice')}
                  type="number"
                  value={formik.values.minPrice}
                  onChange={formik.handleChange}
                  error={formik.touched.minPrice && Boolean(formik.errors.minPrice)}
                  helperText={formik.touched.minPrice && formik.errors.minPrice}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>
                  {t('scans.items')}
                </Typography>
                {stockItems.length === 0 && !stockLoading && (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    {t('scans.noStockItemsWarning')}
                  </Alert>
                )}
                {formik.values.items?.map((item, index) => (
                  <Box key={index} sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'flex-start' }}>
                    <FormControl sx={{ flexGrow: 1 }}>
                      <InputLabel>{t('scans.selectItem')}</InputLabel>
                      <Select
                        value={item.item}
                        onChange={(e) => updateItem(index, 'item', e.target.value)}
                        error={formik.errors.items?.[index]?.item}
                        label={t('scans.selectItem')}
                        disabled={stockLoading}
                      >
                        {stockLoading ? (
                          <MenuItem disabled>{t('scans.loadingItems')}</MenuItem>
                        ) : stockItems.length === 0 ? (
                          <MenuItem disabled>{t('scans.noStockItemsAvailable')}</MenuItem>
                        ) : (
                          stockItems.map((stockItem) => (
                            <MenuItem key={stockItem._id} value={stockItem.name}>
                              {stockItem.name} - {formatCurrency(stockItem.price)}
                            </MenuItem>
                          ))
                        )}
                      </Select>
                    </FormControl>
                    <TextField
                      label="Quantity"
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                      error={formik.errors.items?.[index]?.quantity}
                      helperText={formik.errors.items?.[index]?.quantity}
                      sx={{ width: 120 }}
                    />
                    <TextField
                      label="Item Cost"
                      type="number"
                      value={formatCurrency(item.price * item.quantity)}
                      InputProps={{
                        readOnly: true,
                      }}
                      sx={{ width: 150 }}
                    />
                    <IconButton
                      onClick={() => removeItem(index)}
                      color="error"
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                ))}
                <Button
                  variant="outlined"
                  onClick={addItem}
                  startIcon={<AddIcon />}
                  sx={{ mt: 2 }}
                >
                  {t('scans.addItem')}
                </Button>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="description"
                  label="Description (Optional)"
                  multiline
                  rows={3}
                  value={formik.values.description}
                  onChange={formik.handleChange}
                  error={formik.touched.description && Boolean(formik.errors.description)}
                  helperText={formik.touched.description && formik.errors.description || "Optional description for the scan"}
                  placeholder="Enter an optional description for this scan..."
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
            >
              {loading ? <CircularProgress size={20} /> : (selectedScan ? 'Update' : 'Create')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={openConfirm}
        title="Delete Scan"
        content="Are you sure you want to delete this scan? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => {
          setOpenConfirm(false);
          setSelectedScan(null);
        }}
      />
    </Box>
  );
};

export default Scans; 