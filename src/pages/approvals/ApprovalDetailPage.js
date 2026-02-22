// File: src/pages/approvals/ApprovalDetailPage.js
// Detail view for a single approval request with approve/reject/cancel actions

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  TextField,
  Avatar,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Cancel,
  Percent,
  TrendingUp,
  Replay,
  EditCalendar,
  Paid,
  Receipt,
  ArrowBack,
  ExpandMore,
  ThumbUp,
  ThumbDown,
  AccessTime,
  Link as LinkIcon,
  Refresh,
  Schedule,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { approvalsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { PageHeader, DetailPageSkeleton } from '../../components/common';
import { formatDate, fmtCurrency } from '../../utils/formatters';

// Approval type display config
const APPROVAL_TYPE_CONFIG = {
  DISCOUNT_APPROVAL:        { label: 'Discount Approval',        icon: Percent,      color: '#f57c00' },
  SALE_CANCELLATION:        { label: 'Sale Cancellation',        icon: Cancel,       color: '#e53935' },
  PRICE_OVERRIDE:           { label: 'Price Override',            icon: TrendingUp,   color: '#8e24aa' },
  REFUND_APPROVAL:          { label: 'Refund Approval',          icon: Replay,       color: '#00897b' },
  INSTALLMENT_MODIFICATION: { label: 'Installment Modification', icon: EditCalendar, color: '#1e88e5' },
  COMMISSION_PAYOUT:        { label: 'Commission Payout',        icon: Paid,         color: '#43a047' },
  INVOICE_APPROVAL:         { label: 'Invoice Approval',         icon: Receipt,      color: '#3949ab' },
};

const STATUS_COLORS = { pending: 'warning', approved: 'success', rejected: 'error', cancelled: 'default', expired: 'default' };
const PRIORITY_COLORS = { Critical: 'error', High: 'warning', Medium: 'info', Low: 'default' };

const getUserName = (u) => {
  if (!u) return 'Unknown';
  if (typeof u === 'object') return `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Unknown';
  return 'Unknown';
};

// Request details card — different layout per approvalType
const RequestDetailsCard = ({ approval }) => {
  const { approvalType, requestData } = approval;
  if (!requestData) return null;

  const DetailRow = ({ label, value }) => (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75, borderBottom: '1px solid', borderColor: 'divider' }}>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="body2" fontWeight={600}>{value}</Typography>
    </Box>
  );

  const renderDetails = () => {
    switch (approvalType) {
      case 'DISCOUNT_APPROVAL':
        return (
          <>
            <DetailRow label="Original Price" value={fmtCurrency(requestData.originalPrice)} />
            <DetailRow label="Discount" value={`${requestData.discountPercentage}% (${fmtCurrency(requestData.discountAmount)})`} />
            <DetailRow label="Sale Price" value={fmtCurrency(requestData.salePrice)} />
            {requestData.userRoleSlug && <DetailRow label="Requester's Limit" value={`${requestData.userRoleSlug} (Level ${requestData.userRoleLevel})`} />}
          </>
        );
      case 'SALE_CANCELLATION':
        return (
          <>
            {requestData.salePriceAtCancellation && <DetailRow label="Sale Value" value={fmtCurrency(requestData.salePriceAtCancellation)} />}
            {requestData.cancellationReason && <DetailRow label="Reason" value={requestData.cancellationReason} />}
          </>
        );
      case 'PRICE_OVERRIDE':
        return (
          <>
            <DetailRow label="Base Price" value={fmtCurrency(requestData.basePrice)} />
            <DetailRow label="Current Price" value={fmtCurrency(requestData.currentPrice)} />
            <DetailRow label="Proposed Price" value={fmtCurrency(requestData.proposedPrice)} />
            <DetailRow label="Deviation" value={`${requestData.deviationPercentage?.toFixed(1)}%`} />
          </>
        );
      case 'REFUND_APPROVAL':
        return (
          <>
            <DetailRow label="Refund Amount" value={fmtCurrency(requestData.refundAmount)} />
            <DetailRow label="Original Payment" value={fmtCurrency(requestData.originalPaymentAmount)} />
            {requestData.refundReason && <DetailRow label="Reason" value={requestData.refundReason} />}
          </>
        );
      case 'INSTALLMENT_MODIFICATION':
        return (
          <>
            <DetailRow label="Modification Type" value={requestData.modificationType?.replace(/_/g, ' ')} />
            <DetailRow label="Original Value" value={String(requestData.originalValue)} />
            <DetailRow label="Proposed Value" value={String(requestData.proposedValue)} />
          </>
        );
      case 'INVOICE_APPROVAL':
        return (
          <>
            <DetailRow label="Invoice Amount" value={fmtCurrency(requestData.invoiceAmount)} />
            {requestData.invoiceType && <DetailRow label="Invoice Type" value={requestData.invoiceType} />}
          </>
        );
      default:
        return <Typography variant="body2" color="text.secondary">No additional details</Typography>;
    }
  };

  return (
    <Card variant="outlined" sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>Request Details</Typography>
        {renderDetails()}
      </CardContent>
    </Card>
  );
};

const ApprovalDetailPage = () => {
  const { approvalId } = useParams();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { user, canAccess } = useAuth();
  const theme = useTheme();

  const [approval, setApproval] = useState(null);
  const [loading, setLoading] = useState(true);

  // Dialog state
  const [approveDialog, setApproveDialog] = useState(false);
  const [rejectDialog, setRejectDialog] = useState(false);
  const [cancelDialog, setCancelDialog] = useState(false);
  const [comment, setComment] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchApproval = useCallback(async () => {
    try {
      setLoading(true);
      const res = await approvalsAPI.getApproval(approvalId);
      setApproval(res.data?.data || res.data);
    } catch (error) {
      enqueueSnackbar('Failed to load approval details', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [approvalId, enqueueSnackbar]);

  useEffect(() => { fetchApproval(); }, [fetchApproval]);

  if (loading) return <DetailPageSkeleton />;
  if (!approval) return <Typography>Approval not found</Typography>;

  const typeCfg = APPROVAL_TYPE_CONFIG[approval.approvalType] || { label: approval.approvalType, color: '#757575' };

  // Permission checks
  const canAct = approval.approverActions?.some(
    (a) => (typeof a.approver === 'object' ? a.approver._id : a.approver) === user?._id && a.action === 'pending'
  ) && canAccess.approvalsApprove();
  const canCancelReq = (typeof approval.requestedBy === 'object' ? approval.requestedBy._id : approval.requestedBy) === user?._id && approval.status === 'pending';

  // Action handlers
  const handleApprove = async () => {
    try {
      setActionLoading(true);
      await approvalsAPI.approve(approvalId, { comment: comment || undefined });
      enqueueSnackbar('Request approved successfully', { variant: 'success' });
      setApproveDialog(false);
      setComment('');
      fetchApproval();
    } catch (error) {
      enqueueSnackbar(error.response?.data?.message || 'Failed to approve', { variant: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!comment.trim()) {
      enqueueSnackbar('Rejection reason is required', { variant: 'warning' });
      return;
    }
    try {
      setActionLoading(true);
      await approvalsAPI.reject(approvalId, { comment });
      enqueueSnackbar('Request rejected', { variant: 'success' });
      setRejectDialog(false);
      setComment('');
      fetchApproval();
    } catch (error) {
      enqueueSnackbar(error.response?.data?.message || 'Failed to reject', { variant: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    try {
      setActionLoading(true);
      await approvalsAPI.cancel(approvalId, { reason: comment || undefined });
      enqueueSnackbar('Request cancelled', { variant: 'success' });
      setCancelDialog(false);
      setComment('');
      fetchApproval();
    } catch (error) {
      enqueueSnackbar(error.response?.data?.message || 'Failed to cancel', { variant: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  // Entity link
  const getEntityLink = () => {
    switch (approval.entityType) {
      case 'Sale': return `/sales/${approval.entityId}`;
      case 'Unit': return null; // Unit needs project context — skip
      case 'Invoice': return `/sales/invoices/${approval.entityId}`;
      default: return null;
    }
  };

  const entityLink = getEntityLink();

  // SLA display
  const SlaDisplay = () => {
    if (approval.status !== 'pending') return null;
    if (approval.isOverdue) {
      return <Chip label="OVERDUE" color="error" size="small" sx={{ fontWeight: 700 }} />;
    }
    if (approval.hoursUntilDeadline != null) {
      const hours = Math.floor(approval.hoursUntilDeadline);
      const color = hours > 12 ? 'success' : 'warning';
      return <Chip icon={<AccessTime />} label={`${hours}h remaining`} color={color} size="small" variant="outlined" />;
    }
    return null;
  };

  return (
    <Box>
      <PageHeader
        title={`${approval.requestNumber} | ${typeCfg.label}`}
        subtitle={`Requested by ${getUserName(approval.requestedBy)} \u2022 ${formatDate(approval.createdAt)}`}
        icon={typeCfg.icon}
        actions={
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
            <SlaDisplay />
            <Chip label={approval.status} color={STATUS_COLORS[approval.status] || 'default'} sx={{ textTransform: 'capitalize', fontWeight: 600 }} />
            <Chip label={approval.priority} color={PRIORITY_COLORS[approval.priority] || 'default'} variant="outlined" size="small" />
            <Tooltip title="Refresh"><IconButton onClick={fetchApproval}><Refresh /></IconButton></Tooltip>
            <IconButton onClick={() => navigate('/approvals')}><ArrowBack /></IconButton>
          </Box>
        }
      />

      {/* Action Buttons */}
      {(canAct || canCancelReq) && (
        <Card variant="outlined" sx={{ mb: 3, bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
          <CardContent sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', py: 2, '&:last-child': { pb: 2 } }}>
            <Typography variant="subtitle2" color="text.secondary">Actions:</Typography>
            {canAct && (
              <>
                <Button variant="contained" color="success" startIcon={<ThumbUp />} onClick={() => { setComment(''); setApproveDialog(true); }}>
                  Approve
                </Button>
                <Button variant="contained" color="error" startIcon={<ThumbDown />} onClick={() => { setComment(''); setRejectDialog(true); }}>
                  Reject
                </Button>
              </>
            )}
            {canCancelReq && (
              <Button variant="outlined" color="error" startIcon={<Cancel />} onClick={() => { setComment(''); setCancelDialog(true); }}>
                Cancel Request
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Description */}
      {approval.description && (
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="body2">{approval.description}</Typography>
          </CardContent>
        </Card>
      )}

      {/* Request Details */}
      <RequestDetailsCard approval={approval} />

      {/* Project & Entity Links */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>References</Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {approval.project && (
              <Chip icon={<LinkIcon />} label={`Project: ${approval.project.name || approval.project}`} variant="outlined" size="small" />
            )}
            {entityLink && (
              <Chip
                icon={<LinkIcon />}
                label={`View ${approval.entityType}`}
                variant="outlined"
                size="small"
                clickable
                onClick={() => navigate(entityLink)}
              />
            )}
            {approval.linkedTask && (
              <Chip
                icon={<Schedule />}
                label={`${approval.linkedTask.taskNumber || 'Task'} (${approval.linkedTask.status || 'Open'})`}
                variant="outlined"
                size="small"
                clickable
                onClick={() => navigate(`/tasks/${approval.linkedTask._id}`)}
              />
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Approvers */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
            Approvers ({approval.requiredApprovals || 1} required)
          </Typography>
          {approval.approverActions?.map((action, idx) => (
            <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.5, borderBottom: idx < approval.approverActions.length - 1 ? '1px solid' : 'none', borderColor: 'divider' }}>
              <Avatar sx={{ width: 32, height: 32, fontSize: 14, bgcolor: action.action === 'approved' ? 'success.main' : action.action === 'rejected' ? 'error.main' : 'grey.400' }}>
                {getUserName(action.approver).charAt(0)}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" fontWeight={600}>{getUserName(action.approver)}</Typography>
                {action.comment && <Typography variant="caption" color="text.secondary">"{action.comment}"</Typography>}
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Chip label={action.action} size="small" color={STATUS_COLORS[action.action] || 'default'} sx={{ textTransform: 'capitalize' }} />
                {action.actionAt && (
                  <Typography variant="caption" display="block" color="text.secondary">{formatDate(action.actionAt)}</Typography>
                )}
              </Box>
            </Box>
          ))}
        </CardContent>
      </Card>

      {/* Resolution */}
      {approval.resolvedBy && (
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>Resolution</Typography>
            <Typography variant="body2">
              <strong>{getUserName(approval.resolvedBy)}</strong> {approval.status} this request on {formatDate(approval.resolvedAt)}
            </Typography>
            {approval.resolutionComment && (
              <Typography variant="body2" sx={{ mt: 1, p: 1.5, bgcolor: 'grey.50', borderRadius: 1, fontStyle: 'italic' }}>
                "{approval.resolutionComment}"
              </Typography>
            )}
          </CardContent>
        </Card>
      )}

      {/* Escalation History */}
      {approval.escalationHistory?.length > 0 && (
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>Escalation History</Typography>
            {approval.escalationHistory.map((esc, idx) => (
              <Box key={idx} sx={{ display: 'flex', gap: 2, py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Chip label={`L${esc.level}`} size="small" color="warning" />
                <Box>
                  <Typography variant="body2">Escalated to <strong>{getUserName(esc.escalatedTo)}</strong></Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatDate(esc.escalatedAt)} {esc.reason && `— ${esc.reason}`}
                  </Typography>
                </Box>
              </Box>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Audit Trail */}
      {approval.auditTrail?.length > 0 && (
        <Accordion variant="outlined" sx={{ mb: 3 }}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="subtitle1" fontWeight={700}>Activity Log ({approval.auditTrail.length})</Typography>
          </AccordionSummary>
          <AccordionDetails>
            {approval.auditTrail.map((entry, idx) => (
              <Box key={idx} sx={{ display: 'flex', gap: 2, py: 1, borderBottom: idx < approval.auditTrail.length - 1 ? '1px solid' : 'none', borderColor: 'divider' }}>
                <Typography variant="caption" color="text.secondary" sx={{ minWidth: 140 }}>
                  {formatDate(entry.performedAt)}
                </Typography>
                <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                  {entry.action.replace(/_/g, ' ')}
                  {entry.comment && ` — "${entry.comment}"`}
                </Typography>
              </Box>
            ))}
          </AccordionDetails>
        </Accordion>
      )}

      {/* Approve Dialog */}
      <Dialog open={approveDialog} onClose={() => setApproveDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Approve Request</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Are you sure you want to approve "{approval.title}"?
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Comment (optional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add a comment..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApproveDialog(false)}>Cancel</Button>
          <Button variant="contained" color="success" onClick={handleApprove} disabled={actionLoading}>
            {actionLoading ? 'Approving...' : 'Approve'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialog} onClose={() => setRejectDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reject Request</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Are you sure you want to reject "{approval.title}"? A reason is required.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Reason for rejection *"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Explain why this request is being rejected..."
            error={rejectDialog && !comment.trim()}
            helperText={rejectDialog && !comment.trim() ? 'Rejection reason is required' : ''}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialog(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleReject} disabled={actionLoading || !comment.trim()}>
            {actionLoading ? 'Rejecting...' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={cancelDialog} onClose={() => setCancelDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Cancel Request</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Are you sure you want to cancel your request "{approval.title}"?
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Reason (optional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Why are you cancelling this request?"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialog(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleCancel} disabled={actionLoading}>
            {actionLoading ? 'Cancelling...' : 'Cancel Request'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ApprovalDetailPage;
