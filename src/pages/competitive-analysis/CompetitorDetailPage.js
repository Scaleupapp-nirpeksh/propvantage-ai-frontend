import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  alpha,
} from '@mui/material';
import {
  ArrowBack,
  Edit,
  Delete,
  CheckCircle,
  Cancel,
  LocationOn,
  Business,
  AttachMoney,
  HomeWork,
  Verified,
  Schedule,
  Source,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { competitiveAnalysisAPI } from '../../services/api';
import { PageHeader, DetailPageSkeleton, ConfirmDialog } from '../../components/common';
import { fmtCurrency, formatDate } from '../../utils/formatters';

// ─── Status color mapping ───────────────────────────────────────────────────
const STATUS_COLORS = {
  pre_launch: '#8e24aa',
  newly_launched: '#1e88e5',
  under_construction: '#fb8c00',
  ready_to_move: '#43a047',
  completed: '#757575',
};

const STATUS_LABELS = {
  pre_launch: 'Pre Launch',
  newly_launched: 'Newly Launched',
  under_construction: 'Under Construction',
  ready_to_move: 'Ready to Move',
  completed: 'Completed',
};

// ─── Amenity label mapping ──────────────────────────────────────────────────
const AMENITY_LABELS = {
  gym: 'Gym',
  swimmingPool: 'Swimming Pool',
  clubhouse: 'Clubhouse',
  garden: 'Garden',
  playground: 'Playground',
  powerBackup: 'Power Backup',
  security24x7: '24/7 Security',
  lifts: 'Lifts',
  joggingTrack: 'Jogging Track',
  indoorGames: 'Indoor Games',
  multipurposeHall: 'Multipurpose Hall',
  rainwaterHarvesting: 'Rainwater Harvesting',
  solarPanels: 'Solar Panels',
  evCharging: 'EV Charging',
  concierge: 'Concierge',
  coWorkingSpace: 'Co-Working Space',
};

// ─── Payment plan type labels ───────────────────────────────────────────────
const PLAN_TYPE_LABELS = {
  construction_linked: 'Construction Linked',
  time_based: 'Time Based',
  subvention: 'Subvention',
  flexi: 'Flexi Pay',
  possession_linked: 'Possession Linked',
  other: 'Other',
};

// ─── Helper: Section card wrapper ───────────────────────────────────────────
const SectionCard = ({ title, icon: Icon, children }) => (
  <Card sx={{ mb: 3 }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        {Icon && <Icon sx={{ color: 'primary.main', fontSize: 22 }} />}
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
      </Box>
      {children}
    </CardContent>
  </Card>
);

// ─── Helper: Label/value pair ───────────────────────────────────────────────
const InfoField = ({ label, value, highlight }) => (
  <Box sx={{ mb: 1.5 }}>
    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.25 }}>
      {label}
    </Typography>
    <Typography
      variant="body1"
      sx={{ fontWeight: highlight ? 700 : 500, color: highlight ? 'primary.main' : 'text.primary' }}
    >
      {value ?? '-'}
    </Typography>
  </Box>
);

// ─── Helper: Freshness badge ────────────────────────────────────────────────
const FreshnessBadge = ({ dataAgeDays }) => {
  if (dataAgeDays === null || dataAgeDays === undefined) return null;
  let label, color;
  if (dataAgeDays < 30) {
    label = 'Fresh';
    color = '#43a047';
  } else if (dataAgeDays <= 90) {
    label = 'Aging';
    color = '#fb8c00';
  } else {
    label = 'Stale';
    color = '#e53935';
  }
  return (
    <Chip
      label={`${label} (${dataAgeDays}d)`}
      size="small"
      sx={{ bgcolor: alpha(color, 0.1), color, fontWeight: 600, borderColor: color }}
      variant="outlined"
    />
  );
};

// ─── Helper: Confidence badge ───────────────────────────────────────────────
const ConfidenceBadge = ({ score }) => {
  if (score === null || score === undefined) return null;
  let color;
  if (score >= 80) color = '#43a047';
  else if (score >= 60) color = '#1e88e5';
  else if (score >= 40) color = '#fb8c00';
  else color = '#e53935';
  return (
    <Chip
      label={`Confidence: ${score}%`}
      size="small"
      sx={{ bgcolor: alpha(color, 0.1), color, fontWeight: 600, borderColor: color }}
      variant="outlined"
    />
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================
const CompetitorDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const [competitor, setCompetitor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // ─── Fetch competitor data ──────────────────────────────────────────────
  const fetchCompetitor = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await competitiveAnalysisAPI.getCompetitor(id);
      setCompetitor(data.data || data);
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to load competitor', { variant: 'error' });
      navigate('/competitive-analysis/competitors');
    } finally {
      setLoading(false);
    }
  }, [id, enqueueSnackbar, navigate]);

  useEffect(() => {
    fetchCompetitor();
  }, [fetchCompetitor]);

  // ─── Delete handler ─────────────────────────────────────────────────────
  const handleDelete = async () => {
    try {
      setDeleting(true);
      await competitiveAnalysisAPI.deleteCompetitor(id);
      enqueueSnackbar('Competitor deleted successfully', { variant: 'success' });
      navigate('/competitive-analysis/competitors');
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to delete competitor', { variant: 'error' });
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  // ─── Loading state ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <Box>
        <PageHeader title="Loading..." />
        <DetailPageSkeleton />
      </Box>
    );
  }

  if (!competitor) return null;

  const {
    projectName,
    developerName,
    location = {},
    projectStatus,
    projectType,
    reraNumber,
    dataAgeDays,
    confidenceScore,
    dataSource,
    possessionTimeline,
    scale = {},
    pricing = {},
    unitMix = [],
    amenities = {},
    paymentPlans = [],
    dataProvenance = [],
    metadata = {},
  } = competitor;

  const statusColor = STATUS_COLORS[projectStatus] || '#757575';

  return (
    <Box>
      {/* ─── Page Header ─────────────────────────────────────────────────── */}
      <PageHeader
        title={projectName || 'Competitor Project'}
        subtitle={`${developerName || ''}${location.area ? ` \u2022 ${location.area}` : ''}${location.city ? `, ${location.city}` : ''}`}
        actions={
          <>
            <Button
              variant="outlined"
              size="small"
              startIcon={<ArrowBack />}
              onClick={() => navigate('/competitive-analysis/competitors')}
            >
              Back
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Edit />}
              onClick={() => navigate(`/competitive-analysis/competitors/new?edit=${id}`)}
            >
              Edit
            </Button>
            <Button
              variant="outlined"
              color="error"
              size="small"
              startIcon={<Delete />}
              onClick={() => setDeleteOpen(true)}
            >
              Delete
            </Button>
          </>
        }
      />

      {/* ─── Header Card ─────────────────────────────────────────────────── */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>
            <Chip
              label={STATUS_LABELS[projectStatus] || projectStatus || 'Unknown'}
              size="small"
              sx={{
                bgcolor: alpha(statusColor, 0.1),
                color: statusColor,
                fontWeight: 600,
                borderColor: statusColor,
              }}
              variant="outlined"
            />
            {projectType && (
              <Chip label={projectType} size="small" variant="outlined" />
            )}
            {reraNumber && (
              <Chip
                icon={<Verified sx={{ fontSize: 16 }} />}
                label={`RERA: ${reraNumber}`}
                size="small"
                color="success"
                variant="outlined"
              />
            )}
            <FreshnessBadge dataAgeDays={dataAgeDays} />
            <ConfidenceBadge score={confidenceScore} />
            {dataSource && (
              <Chip
                icon={<Source sx={{ fontSize: 16 }} />}
                label={dataSource}
                size="small"
                variant="outlined"
              />
            )}
            {possessionTimeline && (
              <Chip
                icon={<Schedule sx={{ fontSize: 16 }} />}
                label={`Possession: ${possessionTimeline}`}
                size="small"
                variant="outlined"
              />
            )}
          </Box>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* ─── Location Card ───────────────────────────────────────────── */}
        <Grid item xs={12} md={6}>
          <SectionCard title="Location" icon={LocationOn}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <InfoField label="City" value={location.city} />
              </Grid>
              <Grid item xs={6}>
                <InfoField label="Area" value={location.area} />
              </Grid>
              <Grid item xs={6}>
                <InfoField label="State" value={location.state} />
              </Grid>
              <Grid item xs={6}>
                <InfoField label="Pincode" value={location.pincode} />
              </Grid>
              {location.micromarket && (
                <Grid item xs={12}>
                  <InfoField label="Micromarket" value={location.micromarket} />
                </Grid>
              )}
            </Grid>
          </SectionCard>
        </Grid>

        {/* ─── Scale Card ──────────────────────────────────────────────── */}
        <Grid item xs={12} md={6}>
          <SectionCard title="Scale" icon={Business}>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <Box sx={{ textAlign: 'center', p: 2, borderRadius: 2, bgcolor: 'action.hover' }}>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    {scale.totalUnits ?? '-'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Total Units
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box sx={{ textAlign: 'center', p: 2, borderRadius: 2, bgcolor: 'action.hover' }}>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    {scale.totalTowers ?? '-'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Total Towers
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box sx={{ textAlign: 'center', p: 2, borderRadius: 2, bgcolor: 'action.hover' }}>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    {scale.totalArea ?? '-'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Area (acres)
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </SectionCard>
        </Grid>

        {/* ─── Pricing Card ────────────────────────────────────────────── */}
        <Grid item xs={12}>
          <SectionCard title="Pricing" icon={AttachMoney}>
            {/* Price Per Sqft */}
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5, fontWeight: 600 }}>
              Price Per Sqft
            </Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6} sm={4}>
                <InfoField label="Min" value={pricing.pricePerSqft?.min != null ? fmtCurrency(pricing.pricePerSqft.min) : '-'} />
              </Grid>
              <Grid item xs={6} sm={4}>
                <InfoField label="Max" value={pricing.pricePerSqft?.max != null ? fmtCurrency(pricing.pricePerSqft.max) : '-'} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <InfoField
                  label="Average"
                  value={pricing.pricePerSqft?.avg != null ? fmtCurrency(pricing.pricePerSqft.avg) : '-'}
                  highlight
                />
              </Grid>
            </Grid>
            <Divider sx={{ mb: 2 }} />

            {/* Base Price Range */}
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5, fontWeight: 600 }}>
              Base Price Range
            </Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6}>
                <InfoField label="Min" value={pricing.basePriceRange?.min != null ? fmtCurrency(pricing.basePriceRange.min) : '-'} />
              </Grid>
              <Grid item xs={6}>
                <InfoField label="Max" value={pricing.basePriceRange?.max != null ? fmtCurrency(pricing.basePriceRange.max) : '-'} />
              </Grid>
            </Grid>
            <Divider sx={{ mb: 2 }} />

            {/* Floor Rise & Premiums */}
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5, fontWeight: 600 }}>
              Additional Charges
            </Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6} sm={4}>
                <InfoField
                  label="Floor Rise Charge (per floor)"
                  value={pricing.floorRiseCharge != null ? fmtCurrency(pricing.floorRiseCharge) : '-'}
                />
              </Grid>
              <Grid item xs={6} sm={4}>
                <InfoField
                  label="PLC Charges"
                  value={pricing.plcCharges != null ? fmtCurrency(pricing.plcCharges) : '-'}
                />
              </Grid>
            </Grid>
            <Divider sx={{ mb: 2 }} />

            {/* Facing Premiums */}
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5, fontWeight: 600 }}>
              Facing Premiums
            </Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6} sm={4}>
                <InfoField
                  label="Park Facing"
                  value={pricing.facingPremiums?.parkFacing != null ? fmtCurrency(pricing.facingPremiums.parkFacing) : '-'}
                />
              </Grid>
              <Grid item xs={6} sm={4}>
                <InfoField
                  label="Road Facing"
                  value={pricing.facingPremiums?.roadFacing != null ? fmtCurrency(pricing.facingPremiums.roadFacing) : '-'}
                />
              </Grid>
              <Grid item xs={6} sm={4}>
                <InfoField
                  label="Corner Unit"
                  value={pricing.facingPremiums?.cornerUnit != null ? fmtCurrency(pricing.facingPremiums.cornerUnit) : '-'}
                />
              </Grid>
            </Grid>
            <Divider sx={{ mb: 2 }} />

            {/* Parking */}
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5, fontWeight: 600 }}>
              Parking
            </Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6}>
                <InfoField
                  label="Covered Parking"
                  value={pricing.parking?.covered != null ? fmtCurrency(pricing.parking.covered) : '-'}
                />
              </Grid>
              <Grid item xs={6}>
                <InfoField
                  label="Open Parking"
                  value={pricing.parking?.open != null ? fmtCurrency(pricing.parking.open) : '-'}
                />
              </Grid>
            </Grid>
            <Divider sx={{ mb: 2 }} />

            {/* Other Charges */}
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5, fontWeight: 600 }}>
              Other Charges
            </Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6} sm={4}>
                <InfoField
                  label="Club Membership"
                  value={pricing.clubMembership != null ? fmtCurrency(pricing.clubMembership) : '-'}
                />
              </Grid>
              <Grid item xs={6} sm={4}>
                <InfoField
                  label="Maintenance Deposit"
                  value={pricing.maintenanceDeposit != null ? fmtCurrency(pricing.maintenanceDeposit) : '-'}
                />
              </Grid>
              <Grid item xs={6} sm={4}>
                <InfoField
                  label="Legal Charges"
                  value={pricing.legalCharges != null ? fmtCurrency(pricing.legalCharges) : '-'}
                />
              </Grid>
            </Grid>
            <Divider sx={{ mb: 2 }} />

            {/* Tax Rates */}
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5, fontWeight: 600 }}>
              Tax Rates
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <InfoField label="GST" value={pricing.taxRates?.gst != null ? `${pricing.taxRates.gst}%` : '-'} />
              </Grid>
              <Grid item xs={6}>
                <InfoField label="Stamp Duty" value={pricing.taxRates?.stampDuty != null ? `${pricing.taxRates.stampDuty}%` : '-'} />
              </Grid>
            </Grid>
          </SectionCard>
        </Grid>

        {/* ─── Unit Mix Table ──────────────────────────────────────────── */}
        {unitMix.length > 0 && (
          <Grid item xs={12}>
            <SectionCard title="Unit Mix" icon={HomeWork}>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Unit Type</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Carpet Area (sqft)</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Price Range</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Price/sqft</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Total Count</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Available</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {unitMix.map((unit, idx) => (
                      <TableRow key={idx} sx={{ '&:last-child td': { borderBottom: 0 } }}>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {unit.unitType || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {unit.carpetArea?.min != null && unit.carpetArea?.max != null
                            ? `${unit.carpetArea.min} - ${unit.carpetArea.max}`
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {unit.priceRange?.min != null && unit.priceRange?.max != null
                            ? `${fmtCurrency(unit.priceRange.min)} - ${fmtCurrency(unit.priceRange.max)}`
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {unit.pricePerSqft?.min != null && unit.pricePerSqft?.max != null
                            ? `${fmtCurrency(unit.pricePerSqft.min)} - ${fmtCurrency(unit.pricePerSqft.max)}`
                            : '-'}
                        </TableCell>
                        <TableCell align="right">{unit.totalCount ?? '-'}</TableCell>
                        <TableCell align="right">{unit.available ?? '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </SectionCard>
          </Grid>
        )}

        {/* ─── Amenities Grid ──────────────────────────────────────────── */}
        <Grid item xs={12}>
          <SectionCard title="Amenities" icon={HomeWork}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {Object.entries(AMENITY_LABELS).map(([key, label]) => {
                const available = amenities[key];
                return (
                  <Chip
                    key={key}
                    icon={available ? <CheckCircle sx={{ fontSize: 16 }} /> : <Cancel sx={{ fontSize: 16 }} />}
                    label={label}
                    size="small"
                    variant="outlined"
                    sx={
                      available
                        ? {
                            borderColor: '#43a047',
                            color: '#43a047',
                            bgcolor: alpha('#43a047', 0.06),
                          }
                        : {
                            borderColor: 'divider',
                            color: 'text.disabled',
                          }
                    }
                  />
                );
              })}
              {/* Custom / other amenities */}
              {amenities.other &&
                (Array.isArray(amenities.other) ? amenities.other : [amenities.other]).map((item, idx) => (
                  <Chip
                    key={`other-${idx}`}
                    label={item}
                    size="small"
                    variant="outlined"
                    sx={{ borderColor: '#1e88e5', color: '#1e88e5', bgcolor: alpha('#1e88e5', 0.06) }}
                  />
                ))}
            </Box>
          </SectionCard>
        </Grid>

        {/* ─── Payment Plans ───────────────────────────────────────────── */}
        {paymentPlans.length > 0 && (
          <Grid item xs={12}>
            <SectionCard title="Payment Plans" icon={AttachMoney}>
              <Grid container spacing={2}>
                {paymentPlans.map((plan, idx) => (
                  <Grid item xs={12} sm={6} md={4} key={idx}>
                    <Card variant="outlined" sx={{ height: '100%' }}>
                      <CardContent>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                          {plan.planName || `Plan ${idx + 1}`}
                        </Typography>
                        <Chip
                          label={PLAN_TYPE_LABELS[plan.planType] || plan.planType || 'Other'}
                          size="small"
                          variant="outlined"
                          color="primary"
                          sx={{ mb: 1.5 }}
                        />
                        {plan.bookingAmount != null && (
                          <InfoField label="Booking Amount" value={fmtCurrency(plan.bookingAmount)} />
                        )}
                        {plan.bookingPercentage != null && (
                          <InfoField label="Booking Percentage" value={`${plan.bookingPercentage}%`} />
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </SectionCard>
          </Grid>
        )}

        {/* ─── Data Provenance ─────────────────────────────────────────── */}
        {dataProvenance.length > 0 && (
          <Grid item xs={12}>
            <SectionCard title="Data Provenance" icon={Verified}>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Field</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Source</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Collected At</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Confidence</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Notes</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {dataProvenance.map((entry, idx) => (
                      <TableRow key={idx} sx={{ '&:last-child td': { borderBottom: 0 } }}>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {entry.field || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>{entry.source || '-'}</TableCell>
                        <TableCell>{entry.collectedAt ? formatDate(entry.collectedAt) : '-'}</TableCell>
                        <TableCell>
                          {entry.confidence != null ? <ConfidenceBadge score={entry.confidence} /> : '-'}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {entry.notes || '-'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </SectionCard>
          </Grid>
        )}

        {/* ─── Metadata Footer ─────────────────────────────────────────── */}
        <Grid item xs={12}>
          <Card sx={{ bgcolor: 'action.hover' }}>
            <CardContent>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
                Metadata
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={4} md={2}>
                  <InfoField label="Data Source" value={metadata.dataSource || dataSource || '-'} />
                </Grid>
                <Grid item xs={6} sm={4} md={2}>
                  <InfoField
                    label="Collection Date"
                    value={metadata.dataCollectionDate ? formatDate(metadata.dataCollectionDate) : '-'}
                  />
                </Grid>
                <Grid item xs={6} sm={4} md={2}>
                  <InfoField label="Confidence Score" value={metadata.confidenceScore ?? confidenceScore ?? '-'} />
                </Grid>
                <Grid item xs={6} sm={4} md={2}>
                  <InfoField
                    label="Last Verified"
                    value={metadata.lastVerified ? formatDate(metadata.lastVerified) : '-'}
                  />
                </Grid>
                <Grid item xs={6} sm={4} md={2}>
                  <InfoField
                    label="Stale"
                    value={
                      metadata.isStale != null
                        ? metadata.isStale
                          ? 'Yes'
                          : 'No'
                        : '-'
                    }
                  />
                </Grid>
                <Grid item xs={6} sm={4} md={2}>
                  <InfoField label="Data Age" value={metadata.dataAgeDays ?? dataAgeDays != null ? `${metadata.dataAgeDays ?? dataAgeDays} days` : '-'} />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ─── Delete Confirmation Dialog ──────────────────────────────────── */}
      <ConfirmDialog
        open={deleteOpen}
        title="Delete Competitor"
        message={`Are you sure you want to delete "${projectName}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
        loading={deleting}
      />
    </Box>
  );
};

export default CompetitorDetailPage;
