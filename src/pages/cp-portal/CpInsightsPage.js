// File: src/pages/cp-portal/CpInsightsPage.js
// Description: SP5 — /partner/insights. Weekly / Monthly / Custom tabs.
//   Each tab renders a full-width <AIInsightCard /> for the corresponding
//   digest surface; pre-cron the AIInsightCard auto-shows the scheduled
//   placeholder. The Custom tab lets the user trigger an on-demand
//   monthly digest with their own range.

import React, { useState } from 'react';
import {
  Box, Card, CardContent, Typography, Stack, Tabs, Tab,
  ToggleButtonGroup, ToggleButton,
} from '@mui/material';
import { AutoAwesome } from '@mui/icons-material';
import AIInsightCard from '../../components/ai/AIInsightCard';
import AIQuotaIndicator from '../../components/ai/AIQuotaIndicator';

const RANGES = ['7d', '30d', '90d', '6m', '12m', 'ytd'];

const CpInsightsPage = () => {
  const [tab, setTab] = useState(0); // 0 = This week, 1 = This month, 2 = Custom
  const [customRange, setCustomRange] = useState('30d');
  const [, setUsage] = useState(null);

  return (
    <Box>
      <Stack direction="row" alignItems="center" sx={{ mb: 3 }}>
        <AutoAwesome sx={{ mr: 1, color: 'primary.main' }} />
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>AI Insights</Typography>
          <Typography variant="body2" color="text.secondary">
            Weekly digests every Sunday 22:00 IST · monthly on the 1st · custom on demand.
          </Typography>
        </Box>
        <AIQuotaIndicator onUsageChange={setUsage} />
      </Stack>

      <Card variant="outlined">
        <CardContent>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Tab label="This week" />
            <Tab label="This month" />
            <Tab label="Custom range" />
          </Tabs>

          {tab === 0 && <AIInsightCard surface="weekly_digest" compact={false} />}
          {tab === 1 && <AIInsightCard surface="monthly_digest" compact={false} />}
          {tab === 2 && (
            <Box>
              <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">Range:</Typography>
                <ToggleButtonGroup size="small" value={customRange} exclusive onChange={(_, v) => v && setCustomRange(v)}>
                  {RANGES.map((r) => <ToggleButton key={r} value={r}>{r}</ToggleButton>)}
                </ToggleButtonGroup>
                <Typography variant="caption" color="text.secondary">
                  Custom-range digests are on-demand (counted under the on-demand quota).
                </Typography>
              </Stack>
              <AIInsightCard
                key={`monthly_${customRange}`}
                surface="monthly_digest"
                range={customRange}
                compact={false}
              />
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default CpInsightsPage;
