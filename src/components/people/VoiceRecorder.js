import React, { useState, useRef } from 'react';
import { Box, IconButton, Typography, CircularProgress, Tooltip } from '@mui/material';
import { Mic, Stop } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { peopleAPI } from '../../services/api';

const VoiceRecorder = ({ onTranscript, disabled }) => {
  const { enqueueSnackbar } = useSnackbar();
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setTranscribing(true);
        try {
          const res = await peopleAPI.transcribe(blob);
          const text = res.data?.text || res.data?.data?.text || '';
          if (text) onTranscript(text);
          else enqueueSnackbar('No transcript returned.', { variant: 'warning' });
        } catch (err) {
          enqueueSnackbar(err.response?.data?.message || 'Transcription failed.', { variant: 'error' });
        } finally {
          setTranscribing(false);
        }
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setRecording(true);
    } catch (err) {
      enqueueSnackbar('Microphone access denied.', { variant: 'error' });
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  if (transcribing) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <CircularProgress size={18} />
        <Typography variant="caption" color="text.secondary">Transcribing…</Typography>
      </Box>
    );
  }

  return (
    <Tooltip title={recording ? 'Stop recording' : 'Record voice'}>
      <span>
        <IconButton
          size="small"
          color={recording ? 'error' : 'primary'}
          disabled={disabled}
          onClick={recording ? stopRecording : startRecording}
          sx={{ border: '1px solid', borderColor: recording ? 'error.main' : 'primary.main' }}
        >
          {recording ? <Stop sx={{ fontSize: 18 }} /> : <Mic sx={{ fontSize: 18 }} />}
        </IconButton>
      </span>
    </Tooltip>
  );
};

export default VoiceRecorder;
