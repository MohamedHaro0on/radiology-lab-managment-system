import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
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
 * @typedef {Object} FormDialogProps
 * @property {boolean} open - Whether the dialog is open
 * @property {() => void} onClose - Function to call when dialog is closed
 * @property {function(React.FormEvent): void} onSubmit - Function to call when form is submitted
 * @property {string} title - Dialog title
 * @property {React.ReactNode} children - Dialog content
 * @property {boolean} [loading=false] - Whether the dialog is in loading state
 * @property {'xs'|'sm'|'md'|'lg'|'xl'} [maxWidth='sm'] - Maximum width of dialog
 * @property {boolean} [fullWidth=true] - Whether the dialog should take full width
 * @property {string} [submitLabel] - Custom label for submit button
 * @property {string} [cancelLabel] - Custom label for cancel button
 * @property {string} [error] - Error message to display
 * @property {boolean} [hideActions=false] - Whether to hide action buttons
 */

/**
 * A reusable form dialog component
 * @param {FormDialogProps} props
 */
const FormDialog = ({
  open,
  onClose,
  onSubmit,
  title,
  children,
  loading = false,
  maxWidth = 'sm',
  fullWidth = true,
  submitLabel,
  cancelLabel,
  error,
  hideActions = false,
}) => {
  const { t } = useTranslation();

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(e);
  };

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      PaperProps={{
        component: 'form',
        onSubmit: handleSubmit,
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

      <DialogContent dividers>
        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}
        {children}
      </DialogContent>

      {!hideActions && (
        <DialogActions>
          <Button
            onClick={onClose}
            disabled={loading}
            color="inherit"
          >
            {cancelLabel || t('common.cancel')}
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {submitLabel || t('common.save')}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
};

export default FormDialog; 