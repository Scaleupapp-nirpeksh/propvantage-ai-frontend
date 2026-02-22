// File: src/pages/approvals/ApprovalPoliciesPage.js
// Policy management for approval system — list, toggle, edit thresholds

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  Button,
  TextField,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Divider,
  IconButton,
  alpha,
} from '@mui/material';
import {
  ArrowBack,
  Percent,
  Cancel,
  TrendingUp,
  Replay,
  EditCalendar,
  Paid,
  Receipt,
  Edit,
  Save,
  Refresh,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { approvalsAPI } from '../../services/api';
import { PageHeader, TableSkeleton } from '../../components/common';

const APPROVAL_TYPE_CONFIG = {
  DISCOUNT_APPROVAL:        { label: 'Discount Approval',        icon: Percent,      color: '#f57c00' },
  SALE_CANCELLATION:        { label: 'Sale Cancellation',        icon: Cancel,       color: '#e53935' },
  PRICE_OVERRIDE:           { label: 'Price Override',            icon: TrendingUp,   color: '#8e24aa' },
  REFUND_APPROVAL:          { label: 'Refund Approval',          icon: Replay,       color: '#00897b' },
  INSTALLMENT_MODIFICATION: { label: 'Installment Modification', icon: EditCalendar, color: '#1e88e5' },
  COMMISSION_PAYOUT:        { label: 'Commission Payout',        icon: Paid,         color: '#43a047' },
  INVOICE_APPROVAL:         { label: 'Invoice Approval',         icon: Receipt,      color: '#3949ab' },
};

const ApprovalPoliciesPage = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editPolicy, setEditPolicy] = useState(null);
  const [editData, setEditData] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchPolicies = useCallback(async () => {
    try {
      setLoading(true);
      const res = await approvalsAPI.getPolicies();
      setPolicies(res.data?.data || res.data || []);
    } catch (error) {
      enqueueSnackbar('Failed to load policies', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  useEffect(() => { fetchPolicies(); }, [fetchPolicies]);

  const handleToggleEnabled = async (policy) => {
    try {
      await approvalsAPI.updatePolicy(policy._id, { isEnabled: !policy.isEnabled });
      setPolicies(prev => prev.map(p => p._id === policy._id ? { ...p, isEnabled: !p.isEnabled } : p));
      enqueueSnackbar(`${policy.displayName} ${!policy.isEnabled ? 'enabled' : 'disabled'}`, { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Failed to update policy', { variant: 'error' });
    }
  };

  const openEdit = (policy) => {
    setEditPolicy(policy);
    setEditData({
      slaHours: policy.slaHours,
      requiredApprovals: policy.requiredApprovals,
      escalationConfig: { ...policy.escalationConfig },
      discountThresholds: policy.discountThresholds ? [...policy.discountThresholds.map(t => ({ ...t }))] : [],
      priceOverrideThresholdPercent: policy.priceOverrideThresholdPercent,
      amountThresholds: policy.amountThresholds ? [...policy.amountThresholds.map(t => ({ ...t }))] : [],
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const updatePayload = {
        slaHours: editData.slaHours,
        requiredApprovals: editData.requiredApprovals,
        escalationConfig: editData.escalationConfig,
      };

      if (editPolicy.approvalType === 'DISCOUNT_APPROVAL') {
        updatePayload.discountThresholds = editData.discountThresholds;
      }
      if (editPolicy.approvalType === 'PRICE_OVERRIDE') {
        updatePayload.priceOverrideThresholdPercent = editData.priceOverrideThresholdPercent;
      }
      if (editPolicy.approvalType === 'REFUND_APPROVAL') {
        updatePayload.amountThresholds = editData.amountThresholds;
      }

      await approvalsAPI.updatePolicy(editPolicy._id, updatePayload);
      enqueueSnackbar('Policy updated successfully', { variant: 'success' });
      setEditPolicy(null);
      fetchPolicies();
    } catch (error) {
      enqueueSnackbar(error.response?.data?.message || 'Failed to update policy', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <TableSkeleton />;

  return (
    <Box>
      <PageHeader
        title="Approval Policies"
        subtitle="Configure approval workflows and thresholds"
        actions={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton onClick={fetchPolicies}><Refresh /></IconButton>
            <Button variant="outlined" startIcon={<ArrowBack />} onClick={() => navigate('/approvals')}>
              Back to Approvals
            </Button>
          </Box>
        }
      />

      {/* Policy List */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {policies.map((policy) => {
          const cfg = APPROVAL_TYPE_CONFIG[policy.approvalType] || { label: policy.approvalType, color: '#757575' };
          const Icon = cfg.icon;
          return (
            <Card key={policy._id} variant="outlined">
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', py: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: alpha(cfg.color, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {Icon && <Icon sx={{ color: cfg.color }} />}
                </Box>
                <Box sx={{ flex: 1, minWidth: 200 }}>
                  <Typography variant="subtitle1" fontWeight={600}>{policy.displayName}</Typography>
                  {policy.description && (
                    <Typography variant="caption" color="text.secondary">{policy.description}</Typography>
                  )}
                </Box>
                <Chip label={`SLA: ${policy.slaHours}h`} size="small" variant="outlined" />
                <Chip label={`${policy.requiredApprovals} approver${policy.requiredApprovals > 1 ? 's' : ''}`} size="small" variant="outlined" />
                <Switch
                  checked={policy.isEnabled}
                  onChange={() => handleToggleEnabled(policy)}
                  color="success"
                />
                <IconButton size="small" onClick={() => openEdit(policy)}>
                  <Edit fontSize="small" />
                </IconButton>
              </CardContent>
            </Card>
          );
        })}
      </Box>

      {/* Edit Dialog */}
      <Dialog open={!!editPolicy} onClose={() => setEditPolicy(null)} maxWidth="md" fullWidth>
        <DialogTitle>Edit: {editPolicy?.displayName}</DialogTitle>
        <DialogContent>
          {editData && (
            <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Common fields */}
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <TextField
                  label="SLA Hours"
                  type="number"
                  size="small"
                  value={editData.slaHours}
                  onChange={(e) => setEditData(prev => ({ ...prev, slaHours: Number(e.target.value) }))}
                  sx={{ width: 140 }}
                />
                <TextField
                  label="Required Approvals"
                  type="number"
                  size="small"
                  value={editData.requiredApprovals}
                  onChange={(e) => setEditData(prev => ({ ...prev, requiredApprovals: Number(e.target.value) }))}
                  sx={{ width: 160 }}
                />
              </Box>

              {/* Escalation config */}
              <Box>
                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Escalation</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <Typography variant="body2">Enabled</Typography>
                  <Switch
                    checked={editData.escalationConfig?.enabled || false}
                    onChange={(e) => setEditData(prev => ({
                      ...prev,
                      escalationConfig: { ...prev.escalationConfig, enabled: e.target.checked },
                    }))}
                    size="small"
                  />
                </Box>
                {editData.escalationConfig?.enabled && (
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <TextField label="Level 1 after (hours)" type="number" size="small" value={editData.escalationConfig.level1AfterHours || ''} onChange={(e) => setEditData(prev => ({ ...prev, escalationConfig: { ...prev.escalationConfig, level1AfterHours: Number(e.target.value) } }))} sx={{ width: 160 }} />
                    <TextField label="Level 2 after (hours)" type="number" size="small" value={editData.escalationConfig.level2AfterHours || ''} onChange={(e) => setEditData(prev => ({ ...prev, escalationConfig: { ...prev.escalationConfig, level2AfterHours: Number(e.target.value) } }))} sx={{ width: 160 }} />
                    <TextField label="Level 3 after (hours)" type="number" size="small" value={editData.escalationConfig.level3AfterHours || ''} onChange={(e) => setEditData(prev => ({ ...prev, escalationConfig: { ...prev.escalationConfig, level3AfterHours: Number(e.target.value) } }))} sx={{ width: 160 }} />
                  </Box>
                )}
              </Box>

              <Divider />

              {/* Type-specific: Discount Thresholds */}
              {editPolicy?.approvalType === 'DISCOUNT_APPROVAL' && editData.discountThresholds?.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Role-Based Discount Limits</Typography>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Role</TableCell>
                        <TableCell>Level</TableCell>
                        <TableCell>Max Discount %</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {editData.discountThresholds.map((t, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{t.roleSlug?.replace(/-/g, ' ')}</TableCell>
                          <TableCell>{t.roleLevel}</TableCell>
                          <TableCell>
                            <TextField
                              type="number"
                              size="small"
                              value={t.maxDiscountPercentage}
                              onChange={(e) => {
                                const updated = [...editData.discountThresholds];
                                updated[idx] = { ...updated[idx], maxDiscountPercentage: Number(e.target.value) };
                                setEditData(prev => ({ ...prev, discountThresholds: updated }));
                              }}
                              sx={{ width: 80 }}
                              inputProps={{ min: 0, max: 100 }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              )}

              {/* Type-specific: Price Override Threshold */}
              {editPolicy?.approvalType === 'PRICE_OVERRIDE' && (
                <Box>
                  <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Price Deviation Threshold</Typography>
                  <TextField
                    label="Threshold %"
                    type="number"
                    size="small"
                    value={editData.priceOverrideThresholdPercent}
                    onChange={(e) => setEditData(prev => ({ ...prev, priceOverrideThresholdPercent: Number(e.target.value) }))}
                    sx={{ width: 140 }}
                    helperText="Price changes exceeding this % from base price will require approval"
                  />
                </Box>
              )}

              {/* Type-specific: Refund Amount Brackets */}
              {editPolicy?.approvalType === 'REFUND_APPROVAL' && editData.amountThresholds?.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Amount Brackets</Typography>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Min Amount</TableCell>
                        <TableCell>Max Amount</TableCell>
                        <TableCell>Approver Role</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {editData.amountThresholds.map((t, idx) => (
                        <TableRow key={idx}>
                          <TableCell>
                            <TextField
                              type="number"
                              size="small"
                              value={t.minAmount}
                              onChange={(e) => {
                                const updated = [...editData.amountThresholds];
                                updated[idx] = { ...updated[idx], minAmount: Number(e.target.value) };
                                setEditData(prev => ({ ...prev, amountThresholds: updated }));
                              }}
                              sx={{ width: 120 }}
                            />
                          </TableCell>
                          <TableCell>
                            {t.maxAmount == null ? 'Unlimited' : (
                              <TextField
                                type="number"
                                size="small"
                                value={t.maxAmount}
                                onChange={(e) => {
                                  const updated = [...editData.amountThresholds];
                                  updated[idx] = { ...updated[idx], maxAmount: Number(e.target.value) };
                                  setEditData(prev => ({ ...prev, amountThresholds: updated }));
                                }}
                                sx={{ width: 120 }}
                              />
                            )}
                          </TableCell>
                          <TableCell>{t.approverRoleSlug?.replace(/-/g, ' ')}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditPolicy(null)}>Cancel</Button>
          <Button variant="contained" startIcon={<Save />} onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ApprovalPoliciesPage;
