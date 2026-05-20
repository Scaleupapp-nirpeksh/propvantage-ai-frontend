// File: src/components/channel-partners/ChannelPartnerAttributionSummary.js
// Description: Read-only display of a lead/sale channelPartnerAttribution —
//   the sourcing channel partner(s), their agent, and the commission split.

import React from 'react';
import { Box, Typography, Chip, Stack } from '@mui/material';

const ChannelPartnerAttributionSummary = ({ attribution }) => {
  const a = attribution || {};
  const partners = a.partners || [];

  if (!a.viaChannelPartner || partners.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        Direct — not sourced through a channel partner.
      </Typography>
    );
  }

  return (
    <Stack spacing={1.5}>
      {partners.map((p, i) => {
        const firm =
          (p.channelPartner && p.channelPartner.firmName) || 'Channel partner';
        const agent = p.agent && p.agent.name;
        return (
          <Box
            key={i}
            sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                {firm}
              </Typography>
              {agent && (
                <Typography variant="caption" color="text.secondary">
                  Agent: {agent}
                </Typography>
              )}
            </Box>
            <Chip size="small" label={`${p.sharePct ?? 0}%`} />
          </Box>
        );
      })}
    </Stack>
  );
};

export default ChannelPartnerAttributionSummary;
