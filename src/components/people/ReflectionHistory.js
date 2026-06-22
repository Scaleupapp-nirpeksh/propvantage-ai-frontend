import React from 'react';
import {
  Box, Typography, Chip, Accordion, AccordionSummary, AccordionDetails,
} from '@mui/material';
import { ExpandMore } from '@mui/icons-material';

const PROMPT_LABELS = {
  wins: 'Wins', areasToImprove: 'Areas to Improve', dislikes: 'Frustrations',
  achievements: 'Achievements', plansNextWeek: 'Plans Next Week', other: 'Other',
};

const ReflectionHistory = ({ reflections = [] }) => {
  if (reflections.length === 0) {
    return <Typography variant="body2" color="text.secondary">No past reflections.</Typography>;
  }

  return (
    <Box>
      {reflections.map((r) => (
        <Accordion key={r._id || r.isoWeek} disableGutters elevation={0} sx={{ border: '1px solid', borderColor: 'divider', mb: 1, borderRadius: '8px !important', '&:before': { display: 'none' } }}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography variant="subtitle2">Week {r.isoWeek}</Typography>
              <Chip
                label={r.status}
                size="small"
                color={r.status === 'submitted' ? 'success' : 'default'}
                variant="outlined"
                sx={{ height: 20, fontSize: '0.625rem' }}
              />
              {r.managerAck?.by && <Chip label="Acked" size="small" color="info" variant="outlined" sx={{ height: 20, fontSize: '0.625rem' }} />}
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            {r.answers && Object.entries(r.answers).map(([key, val]) =>
              val ? (
                <Box key={key} sx={{ mb: 1.5 }}>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', display: 'block' }}>
                    {PROMPT_LABELS[key] || key}
                  </Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{val}</Typography>
                </Box>
              ) : null
            )}
            {r.managerAck?.note && (
              <Box sx={{ mt: 1.5, p: 1.5, bgcolor: 'info.50', borderRadius: 1, borderLeft: '3px solid', borderColor: 'info.main' }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: 'info.main' }}>Manager note</Typography>
                <Typography variant="body2">{r.managerAck.note}</Typography>
              </Box>
            )}
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
};

export default ReflectionHistory;
