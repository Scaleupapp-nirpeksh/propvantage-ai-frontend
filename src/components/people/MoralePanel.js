import React from 'react';
import { Box, Typography, Chip, Divider, LinearProgress } from '@mui/material';
import { Mood, MoodBad, SentimentNeutral } from '@mui/icons-material';

const MoralePanel = ({ data }) => {
  if (!data) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary">Morale data not yet available.</Typography>
      </Box>
    );
  }

  const { moraleScore = 0, trendVsLastWeek, narrative, topPositiveThemes = [], topNegativeThemes = [], peopleToCheckIn = [] } = data;
  const Icon = moraleScore >= 70 ? Mood : moraleScore >= 40 ? SentimentNeutral : MoodBad;
  const color = moraleScore >= 70 ? 'success' : moraleScore >= 40 ? 'warning' : 'error';

  return (
    <Box>
      {/* Score header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
        <Icon sx={{ fontSize: 32, color: `${color}.main` }} />
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1 }}>{moraleScore}</Typography>
          <Typography variant="caption" color="text.secondary">
            Morale Score
            {trendVsLastWeek != null && (
              <> · {trendVsLastWeek > 0 ? '+' : ''}{trendVsLastWeek} vs last week</>
            )}
          </Typography>
        </Box>
      </Box>
      <LinearProgress
        variant="determinate"
        value={moraleScore}
        color={color}
        sx={{ height: 6, borderRadius: 3, mb: 1.5 }}
      />
      {narrative && (
        <Typography variant="body2" sx={{ mb: 1.5, color: 'text.secondary', lineHeight: 1.6 }}>
          {narrative}
        </Typography>
      )}
      {(topPositiveThemes.length > 0 || topNegativeThemes.length > 0) && <Divider sx={{ mb: 1.5 }} />}
      {topPositiveThemes.length > 0 && (
        <Box sx={{ mb: 1 }}>
          <Typography variant="caption" sx={{ fontWeight: 600, color: 'success.main' }}>Positive themes</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
            {topPositiveThemes.map((t, i) => <Chip key={i} label={t} size="small" color="success" variant="outlined" sx={{ height: 20, fontSize: '0.625rem' }} />)}
          </Box>
        </Box>
      )}
      {topNegativeThemes.length > 0 && (
        <Box sx={{ mb: 1 }}>
          <Typography variant="caption" sx={{ fontWeight: 600, color: 'error.main' }}>Watch areas</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
            {topNegativeThemes.map((t, i) => <Chip key={i} label={t} size="small" color="error" variant="outlined" sx={{ height: 20, fontSize: '0.625rem' }} />)}
          </Box>
        </Box>
      )}
      {peopleToCheckIn.length > 0 && (
        <Box sx={{ mt: 1 }}>
          <Typography variant="caption" sx={{ fontWeight: 600, color: 'warning.main' }}>Check in with</Typography>
          <Box sx={{ mt: 0.5 }}>
            {peopleToCheckIn.map((p, i) => (
              <Typography key={i} variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                • {p.user?.firstName || p.user} — {p.reason}
              </Typography>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default MoralePanel;
