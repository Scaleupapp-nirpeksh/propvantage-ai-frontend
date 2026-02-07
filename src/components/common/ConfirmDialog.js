import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, CircularProgress,
} from '@mui/material';
import { Warning, ErrorOutline, Info } from '@mui/icons-material';

const variantConfig = {
  danger: { color: 'error', icon: ErrorOutline },
  warning: { color: 'warning', icon: Warning },
  info: { color: 'primary', icon: Info },
};

/**
 * Standardized confirmation dialog.
 *
 * @param {object} props
 * @param {boolean} props.open
 * @param {string} props.title
 * @param {string|React.ReactNode} props.message
 * @param {string} [props.confirmLabel]
 * @param {string} [props.cancelLabel]
 * @param {'danger'|'warning'|'info'} [props.variant]
 * @param {Function} props.onConfirm
 * @param {Function} props.onCancel
 * @param {boolean} [props.loading]
 */
const ConfirmDialog = ({
  open, title, message,
  confirmLabel = 'Confirm', cancelLabel = 'Cancel',
  variant = 'danger', onConfirm, onCancel, loading = false,
}) => {
  const cfg = variantConfig[variant] || variantConfig.info;
  const Icon = cfg.icon;

  return (
    <Dialog open={open} onClose={loading ? undefined : onCancel} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
        <Icon color={cfg.color} />
        {title}
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onCancel} disabled={loading} variant="outlined" color="inherit" size="small">
          {cancelLabel}
        </Button>
        <Button
          onClick={onConfirm}
          disabled={loading}
          variant="contained"
          color={cfg.color}
          size="small"
          startIcon={loading ? <CircularProgress size={14} color="inherit" /> : null}
        >
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDialog;
