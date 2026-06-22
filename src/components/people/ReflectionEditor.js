import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, TextField, Button, Typography, Chip, Alert, CircularProgress, Divider,
} from '@mui/material';
import { Save, Send } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { peopleAPI } from '../../services/api';
import VoiceRecorder from './VoiceRecorder';

const MIN_CHARS = 500;

const PROMPTS = [
  { key: 'wins',            label: 'Wins this week',              placeholder: 'Describe your wins, achievements, and positive outcomes this week...' },
  { key: 'areasToImprove',  label: 'Areas to improve',            placeholder: 'What could you have done better? Where did you struggle?' },
  { key: 'dislikes',        label: 'Frustrations / dislikes',     placeholder: 'What frustrated you or slowed you down this week?' },
  { key: 'achievements',    label: 'Achievements & milestones',   placeholder: 'Specific milestones hit, deals closed, projects completed...' },
  { key: 'plansNextWeek',   label: 'Plans for next week',         placeholder: 'What are your key focus areas and goals for the coming week?' },
];

const ReflectionEditor = ({ isoWeek, onSubmitted }) => {
  const { enqueueSnackbar } = useSnackbar();
  const [answers, setAnswers] = useState({
    wins: '', areasToImprove: '', dislikes: '', achievements: '', plansNextWeek: '', other: '',
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [focusedKey, setFocusedKey] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  // Load existing draft
  useEffect(() => {
    if (!isoWeek) return;
    setLoading(true);
    peopleAPI.getReflection(isoWeek)
      .then(r => {
        const d = r.data?.data || r.data || {};
        if (d.answers) setAnswers(prev => ({ ...prev, ...d.answers }));
        if (d.status === 'submitted') setSubmitted(true);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isoWeek]);

  const handleChange = (key, value) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
  };

  const handleVoiceTranscript = (text) => {
    if (!focusedKey) return;
    setAnswers(prev => ({ ...prev, [focusedKey]: (prev[focusedKey] + ' ' + text).trim() }));
  };

  const allFiveMet = PROMPTS.every(p => (answers[p.key] || '').length >= MIN_CHARS);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await peopleAPI.saveReflection(isoWeek, answers);
      enqueueSnackbar('Draft saved.', { variant: 'success' });
    } catch (e) {
      enqueueSnackbar(e.response?.data?.message || 'Save failed.', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  }, [isoWeek, answers, enqueueSnackbar]);

  const handleSubmit = async () => {
    if (!allFiveMet) return;
    setSubmitting(true);
    try {
      await peopleAPI.saveReflection(isoWeek, answers);
      await peopleAPI.submitReflection(isoWeek);
      setSubmitted(true);
      enqueueSnackbar('Reflection submitted!', { variant: 'success' });
      onSubmitted?.();
    } catch (e) {
      enqueueSnackbar(e.response?.data?.message || 'Submit failed.', { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <CircularProgress size={24} sx={{ display: 'block', mx: 'auto', my: 3 }} />;
  if (submitted) return <Alert severity="success">Reflection submitted for week {isoWeek}.</Alert>;

  return (
    <Box>
      {!allFiveMet && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Each answer must be at least {MIN_CHARS} characters. Use the mic button to dictate.
        </Alert>
      )}
      {PROMPTS.map(({ key, label, placeholder }) => {
        const len = (answers[key] || '').length;
        const met = len >= MIN_CHARS;
        return (
          <Box key={key} sx={{ mb: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{label}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <VoiceRecorder onTranscript={handleVoiceTranscript} disabled={submitted} />
                <Chip
                  label={`${len}/${MIN_CHARS}`}
                  size="small"
                  color={met ? 'success' : 'default'}
                  variant={met ? 'filled' : 'outlined'}
                  sx={{ height: 20, fontSize: '0.625rem' }}
                />
              </Box>
            </Box>
            <TextField
              multiline
              minRows={4}
              fullWidth
              placeholder={placeholder}
              value={answers[key]}
              onChange={e => handleChange(key, e.target.value)}
              onFocus={() => setFocusedKey(key)}
              disabled={submitted}
              variant="outlined"
              size="small"
              error={len > 0 && !met}
              helperText={len > 0 && !met ? `${MIN_CHARS - len} more characters needed` : ''}
            />
          </Box>
        );
      })}
      {/* Optional field */}
      <Box sx={{ mb: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Other (optional)</Typography>
          <VoiceRecorder onTranscript={handleVoiceTranscript} disabled={submitted} />
        </Box>
        <TextField
          multiline
          minRows={3}
          fullWidth
          placeholder="Anything else you want to add..."
          value={answers.other}
          onChange={e => handleChange('other', e.target.value)}
          onFocus={() => setFocusedKey('other')}
          disabled={submitted}
          variant="outlined"
          size="small"
        />
      </Box>
      <Divider sx={{ my: 2 }} />
      <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
        <Button startIcon={<Save />} onClick={handleSave} disabled={saving || submitted} variant="outlined">
          {saving ? 'Saving…' : 'Save Draft'}
        </Button>
        <Button
          startIcon={submitting ? <CircularProgress size={16} /> : <Send />}
          onClick={handleSubmit}
          disabled={!allFiveMet || submitting || submitted}
          variant="contained"
        >
          {submitting ? 'Submitting…' : 'Submit'}
        </Button>
      </Box>
    </Box>
  );
};

export default ReflectionEditor;
