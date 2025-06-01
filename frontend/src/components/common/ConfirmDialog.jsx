import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  IconButton,
  Box,
  Typography,
  CircularProgress,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

/**
 * @typedef {Object} ConfirmDialogProps
 * @property {boolean} open - Whether the dialog is open
 * @property {() => void} onClose - Function to call when dialog is closed
 * @property {() => void} onConfirm - Function to call when confirmed
 * @property {string} title - Dialog title
 * @property {string} message - Dialog message
 * @property {boolean} [loading=false] - Whether the dialog is in loading state
 * @property {string} [confirmLabel] - Custom label for confirm button
 * @property {string} [cancelLabel] - Custom label for cancel button
 * @property {'primary'|'secondary'|'error'|'info'|'success'|'warning'} [confirmColor='error'] - Color of confirm button
 * @property {'xs'|'sm'|'md'|'lg'|'xl'} [maxWidth='sm'] - Maximum width of dialog
 */

/**
 * A reusable confirmation dialog component
 * @param {ConfirmDialogProps} props
 */
const ConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  loading = false,
  confirmLabel,
  cancelLabel,
  confirmColor = 'error',
  maxWidth = 'sm',
}) => {
  const { t } = useTranslation();

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth={maxWidth}
      PaperProps={{
        component: 'div',
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">{title}</Typography>
          {!loading && (
            <IconButton
              edge="end"
              onClick={onClose}
              aria-label={t('common.close')}
              size="small"
            >
              <CloseIcon />
            </IconButton>
          )}
        </Box>
      </DialogTitle>

      <DialogContent>
        <DialogContentText>{message}</DialogContentText>
      </DialogContent>

      <DialogActions>
        <Button
          onClick={onClose}
          disabled={loading}
          color="inherit"
        >
          {cancelLabel || t('common.cancel')}
        </Button>
        <Button
          onClick={onConfirm}
          disabled={loading}
          color={confirmColor}
          variant="contained"
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {confirmLabel || t('common.confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDialog; 