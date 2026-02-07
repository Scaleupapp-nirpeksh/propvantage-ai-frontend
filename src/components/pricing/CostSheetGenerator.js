// File: src/components/pricing/CostSheetGenerator.js
// Description: Reusable Cost Sheet Generator component for unit pricing breakdown
// Version: 1.0 - Phase 2 Implementation
// Location: src/components/pricing/CostSheetGenerator.js

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  TextField,
  Switch,
  FormControlLabel,
  Collapse,
  IconButton,
  Tooltip,
  Skeleton,
} from '@mui/material';
import {
  Receipt,
  Calculate,
  Print,
  FileDownload,
  Refresh,
  ExpandMore,
  ExpandLess,
  MonetizationOn,
  AccountBalance,
  LocalOffer,
  CheckCircle,
} from '@mui/icons-material';
import { pricingAPI } from '../../services/api';

// Utility
const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const CostSheetGenerator = ({ unitId, unitData, projectData, onCostSheetGenerated, embedded = false }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [costSheet, setCostSheet] = useState(null);
  const [showDiscounts, setShowDiscounts] = useState(false);

  const [discounts, setDiscounts] = useState({
    negotiatedDiscount: 0,
    earlyBirdDiscount: 0,
  });

  const [options, setOptions] = useState({
    includeStampDuty: true,
    includeRegistrationFee: true,
    paymentPlanId: '',
  });

  const generateCostSheet = useCallback(async () => {
    if (!unitId) return;
    setLoading(true);
    setError(null);

    try {
      const requestData = {
        discounts: {
          negotiatedDiscount: Number(discounts.negotiatedDiscount) || 0,
          earlyBirdDiscount: Number(discounts.earlyBirdDiscount) || 0,
        },
        includeStampDuty: options.includeStampDuty,
        includeRegistrationFee: options.includeRegistrationFee,
      };

      if (options.paymentPlanId) {
        requestData.paymentPlanId = options.paymentPlanId;
      }

      const response = await pricingAPI.generateCostSheet(unitId, requestData);
      const data = response.data?.data || response.data;
      setCostSheet(data);

      if (onCostSheetGenerated) {
        onCostSheetGenerated(data);
      }
    } catch (err) {
      console.error('Error generating cost sheet:', err);
      setError(err.response?.data?.message || 'Failed to generate cost sheet. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [unitId, discounts, options, onCostSheetGenerated]);

  useEffect(() => {
    if (unitId && embedded) {
      generateCostSheet();
    }
  }, [unitId]);

  const handlePrint = () => {
    window.print();
  };

  const renderCostBreakdown = () => {
    if (!costSheet) return null;

    const unit = costSheet.unitDetails || {};
    const project = costSheet.projectDetails || {};
    const breakdown = costSheet.costBreakdown || [];
    const finalAmount = costSheet.finalPayableAmount || 0;

    return (
      <Box>
        {/* Unit & Project Info */}
        <Box sx={{ mb: 3, p: 2, bgcolor: 'primary.50', borderRadius: 1 }}>
          <Typography variant="subtitle2" color="primary" gutterBottom>Unit Details</Typography>
          <Grid container spacing={2}>
            <Grid item xs={6} md={3}>
              <Typography variant="caption" color="text.secondary">Unit</Typography>
              <Typography variant="body2" fontWeight={600}>{unit.unitNumber || unitData?.unitNumber || '-'}</Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="caption" color="text.secondary">Project</Typography>
              <Typography variant="body2" fontWeight={600}>{project.name || projectData?.name || '-'}</Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="caption" color="text.secondary">Area</Typography>
              <Typography variant="body2" fontWeight={600}>{unit.areaSqft || unitData?.areaSqft || '-'} sq ft</Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="caption" color="text.secondary">Floor</Typography>
              <Typography variant="body2" fontWeight={600}>{unit.floor || unitData?.floor || '-'}</Typography>
            </Grid>
          </Grid>
        </Box>

        {/* Cost Breakdown Table */}
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.100' }}>
                <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Amount</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {breakdown.map((row, idx) => (
                <TableRow
                  key={idx}
                  sx={row.isBold ? { bgcolor: 'grey.100' } : {}}
                >
                  <TableCell>
                    {idx === 0 ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <MonetizationOn fontSize="small" color="primary" />
                        <Typography variant="body2" fontWeight={row.isBold ? 700 : 600}>
                          {row.item}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: row.isBold ? 700 : 400,
                          pl: row.isBold ? 0 : 2,
                        }}
                      >
                        {row.item}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight={row.isBold ? 700 : 400}>
                      {formatCurrency(row.amount)}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}

              {/* Final Payable Amount */}
              <TableRow sx={{ bgcolor: 'primary.main' }}>
                <TableCell sx={{ fontWeight: 700, color: 'white', fontSize: '1rem' }}>
                  Final Payable Amount
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: 'white', fontSize: '1rem' }}>
                  {formatCurrency(finalAmount)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Receipt color="primary" />
            Cost Sheet {costSheet ? '' : 'Generator'}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {costSheet && (
              <>
                <Tooltip title="Print Cost Sheet">
                  <IconButton size="small" onClick={handlePrint}><Print /></IconButton>
                </Tooltip>
              </>
            )}
            <Tooltip title="Regenerate">
              <IconButton size="small" onClick={generateCostSheet} disabled={loading}>
                <Refresh />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Options */}
        {!costSheet && (
          <Box sx={{ mb: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <FormControlLabel
                    control={<Switch checked={options.includeStampDuty} onChange={(e) => setOptions((p) => ({ ...p, includeStampDuty: e.target.checked }))} />}
                    label="Include Stamp Duty"
                  />
                  <FormControlLabel
                    control={<Switch checked={options.includeRegistrationFee} onChange={(e) => setOptions((p) => ({ ...p, includeRegistrationFee: e.target.checked }))} />}
                    label="Include Registration Fee"
                  />
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Button
                  variant="text"
                  size="small"
                  startIcon={showDiscounts ? <ExpandLess /> : <ExpandMore />}
                  onClick={() => setShowDiscounts(!showDiscounts)}
                >
                  {showDiscounts ? 'Hide Discounts' : 'Add Discounts'}
                </Button>
                <Collapse in={showDiscounts}>
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={6}>
                      <TextField
                        label="Negotiated Discount"
                        type="number"
                        size="small"
                        fullWidth
                        value={discounts.negotiatedDiscount}
                        onChange={(e) => setDiscounts((p) => ({ ...p, negotiatedDiscount: e.target.value }))}
                        InputProps={{ startAdornment: <Typography sx={{ mr: 1 }}>₹</Typography> }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        label="Early Bird Discount"
                        type="number"
                        size="small"
                        fullWidth
                        value={discounts.earlyBirdDiscount}
                        onChange={(e) => setDiscounts((p) => ({ ...p, earlyBirdDiscount: e.target.value }))}
                        InputProps={{ startAdornment: <Typography sx={{ mr: 1 }}>₹</Typography> }}
                      />
                    </Grid>
                  </Grid>
                </Collapse>
              </Grid>
            </Grid>

            <Button
              variant="contained"
              fullWidth
              startIcon={<Calculate />}
              onClick={generateCostSheet}
              disabled={loading || !unitId}
              sx={{ mt: 2 }}
            >
              {loading ? 'Generating...' : 'Generate Cost Sheet'}
            </Button>
          </Box>
        )}

        {/* Loading State */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Error State */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Cost Sheet Result */}
        {!loading && costSheet && renderCostBreakdown()}

        {/* Empty State */}
        {!loading && !costSheet && !error && !embedded && (
          <Alert severity="info">
            Configure options above and click "Generate Cost Sheet" to view the pricing breakdown for this unit.
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default CostSheetGenerator;
