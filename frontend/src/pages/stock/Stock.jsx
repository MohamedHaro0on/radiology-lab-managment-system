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
      itemName: '',
      category: '',
      quantity: '',
      unit: '',
      minimumQuantity: '',
      supplier: {
        name: '',
        contact: '',
        email: '',
        phone: '',
      },
      expiryDate: null,
      batchNumber: '',
      location: '',
      notes: '',
    },
    validationSchema: stockSchema,
    onSubmit: async (values) => {
      try {
        setLoading(true);
        if (selectedItem) {
          await stockAPI.update(selectedItem._id, values);
          toast.success(t('stock.updateSuccess'));
        } else {
          await stockAPI.create(values);
          toast.success(t('stock.createSuccess'));
        }
        handleCloseDialog();
        fetchStockItems();
      } catch (err) {
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
        response = await stockAPI.getLowStock();
      } else if (showExpired) {
        response = await stockAPI.getExpired();
      } else {
        response = await stockAPI.getAll({
          page: page + 1,
          limit: rowsPerPage,
          search: searchQuery,
        });
      }
      setStockItems(response.data.items);
      setTotal(response.data.total);
    } catch (err) {
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
        expiryDate: item.expiryDate ? new Date(item.expiryDate) : null,
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
    return item.quantity <= item.minimumQuantity;
  };

  const isExpired = (item) => {
    if (!item.expiryDate) return false;
    return new Date(item.expiryDate) < new Date();
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

      {stockItems.length === 0 ? (
        <NoContent message={t('stock.noItemsFound')} />
      ) : (
        <Grid container spacing={3}>
          {stockItems.map((item) => (
            <Grid item xs={12} sm={6} md={4} key={item._id}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    <InventoryIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
                    <Box>
                      <Typography variant="h6" component="h2">
                        {item.itemName}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {item.category}
                      </Typography>
                    </Box>
                  </Box>
                  <Box mb={2} display="flex" gap={1}>
                    <Chip
                      label={`${item.quantity} ${item.unit}`}
                      color={isLowStock(item) ? 'warning' : 'success'}
                      size="small"
                    />
                    {item.expiryDate && (
                      <Chip
                        label={format(new Date(item.expiryDate), 'dd/MM/yyyy')}
                        color={isExpired(item) ? 'error' : 'default'}
                        size="small"
                      />
                    )}
                  </Box>
                  <Typography variant="body2" color="textSecondary" paragraph>
                    {t('stock.minimumQuantity')}: {item.minimumQuantity} {item.unit}
                  </Typography>
                  {item.supplier?.name && (
                    <Typography variant="body2" color="textSecondary" paragraph>
                      {t('stock.supplier')}: {item.supplier.name}
                    </Typography>
                  )}
                  {item.batchNumber && (
                    <Typography variant="body2" color="textSecondary" paragraph>
                      {t('stock.batchNumber')}: {item.batchNumber}
                    </Typography>
                  )}
                  {item.location && (
                    <Typography variant="body2" color="textSecondary" noWrap>
                      {t('stock.location')}: {item.location}
                    </Typography>
                  )}
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
          <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('stock.itemName')}
                  name="itemName"
                  value={formik.values.itemName}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.itemName && Boolean(formik.errors.itemName)}
                  helperText={formik.touched.itemName && formik.errors.itemName}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('stock.category')}
                  name="category"
                  value={formik.values.category}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.category && Boolean(formik.errors.category)}
                  helperText={formik.touched.category && formik.errors.category}
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
                  label={t('stock.minimumQuantity')}
                  name="minimumQuantity"
                  type="number"
                  value={formik.values.minimumQuantity}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.minimumQuantity && Boolean(formik.errors.minimumQuantity)}
                  helperText={formik.touched.minimumQuantity && formik.errors.minimumQuantity}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label={t('stock.expiryDate')}
                    value={formik.values.expiryDate}
                    onChange={(date) => formik.setFieldValue('expiryDate', date)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        fullWidth
                        error={formik.touched.expiryDate && Boolean(formik.errors.expiryDate)}
                        helperText={formik.touched.expiryDate && formik.errors.expiryDate}
                      />
                    )}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  {t('stock.supplier')}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('stock.supplier.name')}
                  name="supplier.name"
                  value={formik.values.supplier.name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('stock.supplier.contact')}
                  name="supplier.contact"
                  value={formik.values.supplier.contact}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('stock.supplier.email')}
                  name="supplier.email"
                  type="email"
                  value={formik.values.supplier.email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('stock.supplier.phone')}
                  name="supplier.phone"
                  value={formik.values.supplier.phone}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('stock.batchNumber')}
                  name="batchNumber"
                  value={formik.values.batchNumber}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('stock.location')}
                  name="location"
                  value={formik.values.location}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={t('stock.notes')}
                  name="notes"
                  value={formik.values.notes}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  multiline
                  rows={2}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>{t('common.cancel')}</Button>
          <Button
            onClick={formik.handleSubmit}
            variant="contained"
            disabled={loading}
            startIcon={loading && <CircularProgress size={20} />}
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