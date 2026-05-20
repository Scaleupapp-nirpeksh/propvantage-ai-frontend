// File: src/components/channel-partners/ChannelPartnerAttributionFields.js
// Description: Controlled form fields for channel-partner attribution — a
//   "via CP?" toggle plus a multi-CP commission split. Value shape:
//   { viaChannelPartner: bool, partners: [{ channelPartner, agent, sharePct }] }

import React, { useEffect, useState } from 'react';
import {
  Box, FormControlLabel, Switch, Stack, Autocomplete, TextField, IconButton,
  Button, Typography, Alert,
} from '@mui/material';
import { Delete, Add } from '@mui/icons-material';
import { channelPartnerAPI } from '../../services/api';

const ChannelPartnerAttributionFields = ({ value, onChange }) => {
  const v = value || { viaChannelPartner: false, partners: [] };
  const [partners, setPartners] = useState([]);

  useEffect(() => {
    channelPartnerAPI
      .getChannelPartners({ status: 'active' })
      .then((res) => setPartners(res.data?.data || []))
      .catch(() => setPartners([]));
  }, []);

  const emit = (next) => onChange({ ...v, ...next });

  const setRow = (i, key, val) => {
    const rows = [...(v.partners || [])];
    rows[i] = { ...rows[i], [key]: val };
    emit({ partners: rows });
  };
  const addRow = () =>
    emit({ partners: [...(v.partners || []), { channelPartner: '', agent: null, sharePct: 0 }] });
  const removeRow = (i) =>
    emit({ partners: (v.partners || []).filter((_, idx) => idx !== i) });

  const sum = (v.partners || []).reduce((a, p) => a + (Number(p.sharePct) || 0), 0);

  return (
    <Box>
      <FormControlLabel
        control={
          <Switch
            checked={Boolean(v.viaChannelPartner)}
            onChange={(e) =>
              emit({
                viaChannelPartner: e.target.checked,
                partners: e.target.checked && (v.partners || []).length === 0
                  ? [{ channelPartner: '', agent: null, sharePct: 100 }]
                  : v.partners,
              })
            }
          />
        }
        label="Sourced via a channel partner"
      />

      {v.viaChannelPartner && (
        <Stack spacing={1} sx={{ mt: 1 }}>
          {(v.partners || []).map((row, i) => (
            <Stack key={i} direction="row" spacing={1} alignItems="center">
              <Autocomplete
                sx={{ flex: 3 }}
                options={partners}
                value={partners.find((p) => p._id === row.channelPartner) || null}
                getOptionLabel={(o) => o.firmName || ''}
                isOptionEqualToValue={(o, val) => o._id === val._id}
                onChange={(e, val) => setRow(i, 'channelPartner', val?._id || '')}
                renderInput={(params) => (
                  <TextField {...params} size="small" label="Channel partner" />
                )}
              />
              <TextField
                sx={{ flex: 1 }}
                size="small"
                type="number"
                label="Share %"
                value={row.sharePct}
                onChange={(e) => setRow(i, 'sharePct', e.target.value)}
              />
              <IconButton onClick={() => removeRow(i)} aria-label="remove">
                <Delete />
              </IconButton>
            </Stack>
          ))}
          <Box>
            <Button size="small" startIcon={<Add />} onClick={addRow}>
              Add channel partner
            </Button>
          </Box>
          {(v.partners || []).length > 0 && Math.abs(sum - 100) > 0.01 && (
            <Alert severity="warning">
              Commission split is {sum}% — it must total 100%.
            </Alert>
          )}
          <Typography variant="caption" color="text.secondary">
            When the booking closes, commission is generated per partner by their share.
          </Typography>
        </Stack>
      )}
    </Box>
  );
};

export default ChannelPartnerAttributionFields;
