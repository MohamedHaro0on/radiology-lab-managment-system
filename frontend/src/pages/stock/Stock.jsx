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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Fab,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Inventory as InventoryIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { stockAPI } from '../../services/api';
import { stockSchema } from '../../validations/schemas';
import SearchBar from '../../components/common/SearchBar';
import NoContent from '../../components/common/NoContent';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

/**
 * Stock component for managing inventory items
 */
const Stock = () => {
  const { t } = useTranslation();
  const [stockItems, setStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [openConfirm, setOpenConfirm] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLowStock, setShowLowStock] = useState(false);
  const [showExpired, setShowExpired] = useState(false);

  const formik = useFormik({
    initialValues: {
      name: '',
      quantity: '',
      unit: 'pcs',
      minimumThreshold: '',
      price: '',
      validUntil: null,
    },
    validationSchema: stockSchema,
    onSubmit: async (values) => {
      try {
        console.log('Stock form submitted with values:', values);
        setLoading(true);
        if (selectedItem) {
          console.log('Updating stock item:', selectedItem._id);
          await stockAPI.update(selectedItem._id, values);
          toast.success(t('stock.updateSuccess'));
        } else {
          console.log('Creating new stock item');
          await stockAPI.create(values);
          toast.success(t('stock.createSuccess'));
        }
        handleCloseDialog();
        fetchStockItems();
      } catch (err) {
        console.error('Stock form submission error:', err);
        toast.error(err.response?.data?.message || t('stock.error'));
      } finally {
        setLoading(false);
      }
    },
  });

  useEffect(() => {
    fetchStockItems();
  }, [page, rowsPerPage, searchQuery, showLowStock, showExpired]);

  const fetchStockItems = async () => {
    try {
      setLoading(true);
      let response;
      if (showLowStock) {
        response = await stockAPI.getLowStock({
          page: page + 1,
          limit: rowsPerPage,
          search: searchQuery,
        });
      } else if (showExpired) {
        response = await stockAPI.getExpired({
          page: page + 1,
          limit: rowsPerPage,
          search: searchQuery,
        });
      } else {
        response = await stockAPI.getAll({
          page: page + 1,
          limit: rowsPerPage,
          search: searchQuery,
        });
      }
      
      // Handle the response structure from executePaginatedQuery
      const items = response.data?.data?.stocks || response.data?.stocks || [];
      const totalCount = response.data?.data?.pagination?.total || response.data?.pagination?.total || items.length;
      
      setStockItems(Array.isArray(items) ? items : []);
      setTotal(totalCount);
    } catch (err) {
      console.error('Error fetching stock items:', err);
      setStockItems([]);
      setTotal(0);
      toast.error(t('stock.fetchError'));
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    setPage(0);
  };

  const handleOpenDialog = (item = null) => {
    if (item) {
      setSelectedItem(item);
      formik.setValues({
        ...item,
        validUntil: item.validUntil ? new Date(item.validUntil) : null,
      });
    } else {
      setSelectedItem(null);
      formik.resetForm();
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedItem(null);
    formik.resetForm();
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      await stockAPI.delete(selectedItem._id);
      toast.success(t('stock.deleteSuccess'));
      setOpenConfirm(false);
      fetchStockItems();
    } catch (err) {
      toast.error(err.response?.data?.message || t('stock.deleteError'));
    } finally {
      setLoading(false);
    }
  };

  const isLowStock = (item) => {
    return item.quantity <= item.minimumThreshold;
  };

  const isExpired = (item) => {
    if (!item.validUntil) return false;
    return new Date(item.validUntil) < new Date();
  };

  const handleQuantityChange = async (id, change) => {
    try {
      setLoading(true);
      const operation = change > 0 ? 'add' : 'subtract';
      const quantity = Math.abs(change);
      await stockAPI.updateQuantity(id, { quantity, operation });
      toast.success(t('stock.quantityUpdateSuccess'));
      fetchStockItems();
    } catch (err) {
      console.error('Error updating stock quantity:', err);
      toast.error(err.response?.data?.message || t('stock.quantityUpdateError'));
    } finally {
      setLoading(false);
    }
  };

  if (loading && !stockItems.length) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          {t('stock.title')}
        </Typography>
        <Fab
          color="primary"
          aria-label="add"
          onClick={() => handleOpenDialog()}
          size="medium"
        >
          <AddIcon />
        </Fab>
      </Box>

      <Box display="flex" gap={2} mb={3}>
        <SearchBar
          onSearch={handleSearch}
          loading={searchLoading}
          placeholder={t('stock.searchPlaceholder')}
        />
        <Button
          variant={showLowStock ? 'contained' : 'outlined'}
          color="warning"
          startIcon={<WarningIcon />}
          onClick={() => {
            setShowLowStock(!showLowStock);
            setShowExpired(false);
            setPage(0);
          }}
        >
          {t('stock.lowStock')}
        </Button>
        <Button
          variant={showExpired ? 'contained' : 'outlined'}
          color="error"
          startIcon={<WarningIcon />}
          onClick={() => {
            setShowExpired(!showExpired);
            setShowLowStock(false);
            setPage(0);
          }}
        >
          {t('stock.expired')}
        </Button>
      </Box>

      {(stockItems || []).length === 0 ? (
        <NoContent message={t('stock.noItemsFound')} />
      ) : (
        <Grid container spacing={3}>
          {(stockItems || []).map((item) => (
            <Grid item xs={12} sm={6} md={4} key={item._id}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    <InventoryIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
                    <Box>
                      <Typography variant="h6" component="h2">
                        {item.name}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        ${item.price}
                      </Typography>
                    </Box>
                  </Box>
                  <Box mb={2} display="flex" gap={1}>
                    <Chip
                      label={`${item.quantity} ${item.unit || 'pcs'}`}
                      color={isLowStock(item) ? 'warning' : 'success'}
                      size="small"
                    />
                    {item.validUntil && (
                      <Chip
                        label={format(new Date(item.validUntil), 'dd/MM/yyyy')}
                        color={isExpired(item) ? 'error' : 'default'}
                        size="small"
                      />
                    )}
                  </Box>
                  <Typography variant="body2" color="textSecondary" paragraph>
                    {t('stock.minimumThreshold')}: {item.minimumThreshold} {item.unit || 'pcs'}
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleQuantityChange(item._id, -1)}
                      disabled={loading}
                    >
                      -
                    </Button>
                    <Typography variant="body2" sx={{ minWidth: '40px', textAlign: 'center' }}>
                      {item.quantity}
                    </Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleQuantityChange(item._id, 1)}
                      disabled={loading}
                    >
                      +
                    </Button>
                  </Box>
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={() => handleOpenDialog(item)}
                  >
                    {t('common.edit')}
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => {
                      setSelectedItem(item);
                      setOpenConfirm(true);
                    }}
                  >
                    {t('common.delete')}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedItem ? t('stock.editItem') : t('stock.addItem')}
        </DialogTitle>
        <DialogContent>
          <Box component="form" id="stockForm" onSubmit={(e) => { console.log('Form onSubmit event fired'); console.log('Formik errors:', formik.errors); formik.handleSubmit(e); }} sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('stock.name')}
                  name="name"
                  value={formik.values.name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.name && Boolean(formik.errors.name)}
                  helperText={formik.touched.name && formik.errors.name}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('stock.quantity')}
                  name="quantity"
                  type="number"
                  value={formik.values.quantity}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.quantity && Boolean(formik.errors.quantity)}
                  helperText={formik.touched.quantity && formik.errors.quantity}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('stock.unit')}
                  name="unit"
                  value={formik.values.unit}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.unit && Boolean(formik.errors.unit)}
                  helperText={formik.touched.unit && formik.errors.unit}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('stock.minimumThreshold')}
                  name="minimumThreshold"
                  type="number"
                  value={formik.values.minimumThreshold}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.minimumThreshold && Boolean(formik.errors.minimumThreshold)}
                  helperText={formik.touched.minimumThreshold && formik.errors.minimumThreshold}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('stock.price')}
                  name="price"
                  type="number"
                  value={formik.values.price}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.price && Boolean(formik.errors.price)}
                  helperText={formik.touched.price && formik.errors.price}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label={t('stock.validUntil')}
                    value={formik.values.validUntil}
                    onChange={(date) => formik.setFieldValue('validUntil', date)}
                    onBlur={() => formik.setFieldTouched('validUntil', true)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        fullWidth
                        error={formik.touched.validUntil && Boolean(formik.errors.validUntil)}
                        helperText={formik.touched.validUntil && formik.errors.validUntil}
                      />
                    )}
                  />
                </LocalizationProvider>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { console.log('Cancel button clicked'); handleCloseDialog(); }}>{t('common.cancel')}</Button>
          <Button
            type="submit"
            form="stockForm"
            variant="contained"
            disabled={loading}
            startIcon={loading && <CircularProgress size={20} />}
            onClick={() => { console.log('Create/Update button clicked'); }}
          >
            {selectedItem ? t('common.update') : t('common.create')}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={openConfirm}
        title={t('stock.deleteConfirmTitle')}
        message={t('stock.deleteConfirmMessage')}
        onConfirm={handleDelete}
        onCancel={() => setOpenConfirm(false)}
        loading={loading}
      />
    </Box>
  );
};

export default Stock; 