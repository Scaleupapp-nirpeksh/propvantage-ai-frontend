// File: src/pages/competitive-analysis/CSVImportPage.js
// CSV import page — download template, upload CSV, view row-by-row results

import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Grid,
  Chip,
  LinearProgress,
  Alert,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Download,
  Upload,
  CloudUpload,
  CheckCircle,
  Error as ErrorIcon,
  SkipNext,
  ArrowBack,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { competitiveAnalysisAPI } from '../../services/api';
import { PageHeader } from '../../components/common';

const ROW_STATUS_CONFIG = {
  created:   { label: 'Created',   color: 'success', icon: CheckCircle },
  updated:   { label: 'Updated',   color: 'info',    icon: CheckCircle },
  unchanged: { label: 'Unchanged', color: 'default', icon: SkipNext },
  skipped:   { label: 'Skipped',   color: 'warning', icon: SkipNext },
  error:     { label: 'Error',     color: 'error',   icon: ErrorIcon },
};

const CSVImportPage = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const fileInputRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [defaultCity, setDefaultCity] = useState('');
  const [defaultArea, setDefaultArea] = useState('');
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);

  const handleDownloadTemplate = async () => {
    try {
      setDownloadingTemplate(true);
      const res = await competitiveAnalysisAPI.downloadTemplate();
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'competitor_import_template.csv';
      a.click();
      URL.revokeObjectURL(url);
      enqueueSnackbar('Template downloaded', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Failed to download template', { variant: 'error' });
    } finally {
      setDownloadingTemplate(false);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.csv')) {
        enqueueSnackbar('Please select a CSV file', { variant: 'warning' });
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        enqueueSnackbar('File size must be under 10MB', { variant: 'warning' });
        return;
      }
      setSelectedFile(file);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', selectedFile);
      if (defaultCity) formData.append('city', defaultCity);
      if (defaultArea) formData.append('area', defaultArea);

      const res = await competitiveAnalysisAPI.importCSV(formData);
      setResult(res.data?.data || res.data);
      enqueueSnackbar(res.data?.message || 'Import completed', { variant: 'success' });
    } catch (error) {
      const msg = error.response?.data?.message || 'Import failed';
      enqueueSnackbar(msg, { variant: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setResult(null);
    setDefaultCity('');
    setDefaultArea('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <Box>
      <PageHeader
        title="Import Competitor Data"
        subtitle="Bulk import competitor data from CSV files"
        badge="BETA"
        actions={
          <Button variant="outlined" startIcon={<ArrowBack />} onClick={() => navigate('/competitive-analysis/competitors')}>
            Back to Competitors
          </Button>
        }
      />

      {/* Info banner */}
      <Alert severity="info" sx={{ mb: 3 }}>
        Supports Indian price notation: "85 Lakhs", "1.2 Cr", "₹8,500", and plain numbers. Existing records are automatically matched by project name + area and enriched (not duplicated).
      </Alert>

      <Grid container spacing={3}>
        {/* Step 1: Download Template */}
        <Grid item xs={12} md={4}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
              <Chip label="Step 1" size="small" color="primary" sx={{ mb: 1.5 }} />
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>Download Template</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Download the CSV template with 32 columns and one example row.
              </Typography>
              <Button
                variant="outlined"
                startIcon={<Download />}
                onClick={handleDownloadTemplate}
                disabled={downloadingTemplate}
                fullWidth
              >
                {downloadingTemplate ? 'Downloading...' : 'Download Template'}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Step 2: Upload File */}
        <Grid item xs={12} md={4}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
              <Chip label="Step 2" size="small" color="primary" sx={{ mb: 1.5 }} />
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>Upload CSV File</Typography>

              {/* Default city/area */}
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                  label="Default City"
                  size="small"
                  value={defaultCity}
                  onChange={(e) => setDefaultCity(e.target.value)}
                  helperText="For rows without city"
                  fullWidth
                />
                <TextField
                  label="Default Area"
                  size="small"
                  value={defaultArea}
                  onChange={(e) => setDefaultArea(e.target.value)}
                  helperText="For rows without area"
                  fullWidth
                />
              </Box>

              {/* File drop zone */}
              <input
                type="file"
                accept=".csv"
                ref={fileInputRef}
                onChange={handleFileSelect}
                hidden
              />
              <Box
                onClick={() => fileInputRef.current?.click()}
                sx={{
                  border: '2px dashed',
                  borderColor: selectedFile ? 'success.main' : 'divider',
                  borderRadius: 2,
                  p: 3,
                  textAlign: 'center',
                  cursor: 'pointer',
                  bgcolor: selectedFile ? alpha(theme.palette.success.main, 0.04) : 'transparent',
                  '&:hover': { borderColor: 'primary.main', bgcolor: alpha(theme.palette.primary.main, 0.04) },
                  transition: 'all 0.2s',
                }}
              >
                <CloudUpload sx={{ fontSize: 36, color: selectedFile ? 'success.main' : 'text.disabled', mb: 1 }} />
                {selectedFile ? (
                  <>
                    <Typography variant="body2" fontWeight={600} color="success.main">{selectedFile.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {(selectedFile.size / 1024).toFixed(1)} KB • Click to change
                    </Typography>
                  </>
                ) : (
                  <>
                    <Typography variant="body2" color="text.secondary">Click to select CSV file</Typography>
                    <Typography variant="caption" color="text.disabled">Max 10MB</Typography>
                  </>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Step 3: Import */}
        <Grid item xs={12} md={4}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
              <Chip label="Step 3" size="small" color="primary" sx={{ mb: 1.5 }} />
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>Import Data</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Upload and process your competitor data. Duplicates are automatically merged.
              </Typography>
              <Button
                variant="contained"
                startIcon={<Upload />}
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
                fullWidth
                sx={{ mb: 1 }}
              >
                {uploading ? 'Importing...' : 'Start Import'}
              </Button>
              {uploading && <LinearProgress sx={{ borderRadius: 1 }} />}
              {result && (
                <Button variant="text" size="small" onClick={handleReset} fullWidth sx={{ mt: 1 }}>
                  Import Another File
                </Button>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Results */}
      {result && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>Import Results</Typography>

          {/* Summary */}
          <Box sx={{ display: 'flex', gap: 1.5, mb: 2, flexWrap: 'wrap' }}>
            <Chip label={`Total Rows: ${result.totalRows || 0}`} variant="outlined" />
            <Chip label={`Created: ${result.created || 0}`} color="success" />
            <Chip label={`Updated: ${result.updated || 0}`} color="info" />
            <Chip label={`Skipped: ${result.skipped || 0}`} color="warning" variant="outlined" />
          </Box>

          {/* Row details table */}
          {result.rowDetails?.length > 0 && (
            <Card variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Row</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Details</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {result.rowDetails.map((row, idx) => {
                    const cfg = ROW_STATUS_CONFIG[row.status] || ROW_STATUS_CONFIG.error;
                    return (
                      <TableRow key={idx}>
                        <TableCell>{row.row || idx + 1}</TableCell>
                        <TableCell>
                          <Chip label={cfg.label} size="small" color={cfg.color} variant="outlined" />
                        </TableCell>
                        <TableCell>
                          {row.errors?.length > 0 && (
                            <Typography variant="caption" color="error.main">
                              {row.errors.join('; ')}
                            </Typography>
                          )}
                          {row.fieldsUpdated > 0 && (
                            <Typography variant="caption" color="text.secondary">
                              {row.fieldsUpdated} fields updated
                            </Typography>
                          )}
                          {!row.errors?.length && !row.fieldsUpdated && (
                            <Typography variant="caption" color="text.secondary">—</Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          )}

          {/* Post-import CTA */}
          <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
            <Button variant="contained" onClick={() => navigate('/competitive-analysis/competitors')}>
              View All Competitors
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default CSVImportPage;
