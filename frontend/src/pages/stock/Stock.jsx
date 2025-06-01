import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Inventory as InventoryIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { authAPI } from '../../services/api';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import NoContent from '../../components/common/NoContent';

/**
 * Stock component for managing inventory items
 */
const Stock = () => {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openConfirm, setOpenConfirm] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    quantity: '',
    unit: '',
    minQuantity: '',
    price: '',
    supplier: '',
    location: '',
    expiryDate: '',
    notes: '',
  });

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [/* Add dependencies if needed, or keep empty if desired */]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await authAPI.getStockItems();
      if (response.data && response.data.items) {
        setItems(response.data.items);
      } else {
        setItems([]); // Ensure items is always an array
      }
    } catch (error) {
      toast.error(t('stock.fetchError'));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (item = null) => {
    if (item) {
      setFormData({
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        unit: item.unit,
        minQuantity: item.minQuantity,
        price: item.price,
        supplier: item.supplier,
        location: item.location,
        expiryDate: item.expiryDate,
        notes: item.notes,
      });
      setSelectedItem(item);
    } else {
      setFormData({
        name: '',
        category: '',
        quantity: '',
        unit: '',
        minQuantity: '',
        price: '',
        supplier: '',
        location: '',
        expiryDate: '',
        notes: '',
      });
      setSelectedItem(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedItem(null);
    setFormData({
      name: '',
      category: '',
      quantity: '',
      unit: '',
      minQuantity: '',
      price: '',
      supplier: '',
      location: '',
      expiryDate: '',
      notes: '',
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    try {
      if (selectedItem) {
        await authAPI.updateStockItem(selectedItem.id, formData);
        toast.success(t('stock.updateSuccess'));
      } else {
        await authAPI.createStockItem(formData);
        toast.success(t('stock.createSuccess'));
      }
      handleCloseDialog();
      fetchItems();
    } catch (error) {
      toast.error(t('stock.saveError'));
    }
  };

  const handleDelete = async (item) => {
    setSelectedItem(item);
    setOpenConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      await authAPI.deleteStockItem(selectedItem.id);
      toast.success(t('stock.deleteSuccess'));
      fetchItems();
    } catch (error) {
      toast.error(t('stock.deleteError'));
    } finally {
      setOpenConfirm(false);
      setSelectedItem(null);
    }
  };

  const getStockStatus = (quantity, minQuantity) => {
    const qty = parseFloat(quantity);
    const minQty = parseFloat(minQuantity);
    if (qty <= 0) return { label: t('stock.status.outOfStock'), color: 'error' };
    if (qty <= minQty) return { label: t('stock.status.lowStock'), color: 'warning' };
    return { label: t('stock.status.inStock'), color: 'success' };
  };

  // eslint-disable-next-line no-unused-vars
  const getStatusColor = (status) => {
    // ... existing getStatusColor logic ...
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (items.length === 0) {
    return (
      <NoContent message={t('stock.noStockItemsFound')} />
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

      <Grid container spacing={3}>
        {items.map((item) => {
          const status = getStockStatus(item.quantity, item.minQuantity);
          return (
            <Grid item xs={12} sm={6} md={4} key={item.id}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    <InventoryIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
                    <Box>
                      <Typography variant="h6" component="h2">
                        {item.name}
                      </Typography>
                      <Typography color="textSecondary" gutterBottom>
                        {t(`stock.categories.${item.category}`)}
                      </Typography>
                    </Box>
                  </Box>
                  <Box mb={2}>
                    <Chip
                      icon={status.color === 'warning' ? <WarningIcon /> : null}
                      label={status.label}
                      color={status.color}
                      size="small"
                    />
                  </Box>
                  <Typography variant="body2" color="textSecondary" paragraph>
                    {t('stock.quantity')}: {item.quantity} {item.unit}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" paragraph>
                    {t('stock.minQuantity')}: {item.minQuantity} {item.unit}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" paragraph>
                    {t('stock.price')}: ${item.price}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" paragraph>
                    {t('stock.supplier')}: {item.supplier}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" paragraph>
                    {t('stock.location')}: {item.location}
                  </Typography>
                  {item.expiryDate && (
                    <Typography variant="body2" color="textSecondary" paragraph>
                      {t('stock.expiryDate')}: {new Date(item.expiryDate).toLocaleDateString()}
                    </Typography>
                  )}
                  {item.notes && (
                    <Typography variant="body2" color="textSecondary">
                      {t('stock.notes')}: {item.notes}
                    </Typography>
                  )}
                </CardContent>
                <Box display="flex" justifyContent="flex-end" p={1}>
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => handleOpenDialog(item)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDelete(item)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedItem ? t('stock.editTitle') : t('stock.addTitle')}
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label={t('stock.name')}
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              margin="normal"
              required
            />
            <FormControl fullWidth margin="normal" required>
              <InputLabel>{t('stock.category')}</InputLabel>
              <Select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                label={t('stock.category')}
              >
                <MenuItem value="reagents">{t('stock.categories.reagents')}</MenuItem>
                <MenuItem value="consumables">{t('stock.categories.consumables')}</MenuItem>
                <MenuItem value="equipment">{t('stock.categories.equipment')}</MenuItem>
                <MenuItem value="other">{t('stock.categories.other')}</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label={t('stock.quantity')}
              name="quantity"
              type="number"
              value={formData.quantity}
              onChange={handleInputChange}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label={t('stock.unit')}
              name="unit"
              value={formData.unit}
              onChange={handleInputChange}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label={t('stock.minQuantity')}
              name="minQuantity"
              type="number"
              value={formData.minQuantity}
              onChange={handleInputChange}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label={t('stock.price')}
              name="price"
              type="number"
              value={formData.price}
              onChange={handleInputChange}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label={t('stock.supplier')}
              name="supplier"
              value={formData.supplier}
              onChange={handleInputChange}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label={t('stock.location')}
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label={t('stock.expiryDate')}
              name="expiryDate"
              type="date"
              value={formData.expiryDate}
              onChange={handleInputChange}
              margin="normal"
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              label={t('stock.notes')}
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              margin="normal"
              multiline
              rows={3}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>{t('common.cancel')}</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={openConfirm}
        title={t('stock.deleteConfirmTitle')}
        message={t('stock.deleteConfirmMessage')}
        onConfirm={confirmDelete}
        onCancel={() => {
          setOpenConfirm(false);
          setSelectedItem(null);
        }}
      />
    </Box>
  );
};

export default Stock; 