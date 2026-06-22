import React, { useState, useEffect } from 'react';
import { Alert, AlertTitle, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { peopleAPI } from '../../services/api';

const ReflectionPrompt = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState(null);

  useEffect(() => {
    peopleAPI.reflectionCurrent()
      .then(r => setStatus(r.data?.data || r.data))
      .catch(() => {});
  }, []);

  if (!status) return null;
  if (status.status === 'submitted') return null;

  return (
    <Alert
      severity={status.overdue ? 'error' : 'warning'}
      action={
        <Button color="inherit" size="small" onClick={() => navigate('/people/me')}>
          Complete Now
        </Button>
      }
      sx={{ mb: 2, borderRadius: 2 }}
    >
      <AlertTitle>{status.overdue ? 'Overdue Reflection' : 'Weekly Reflection Pending'}</AlertTitle>
      {status.overdue
        ? `Your reflection for week ${status.isoWeek} is overdue. Please complete it.`
        : `Your weekly reflection for week ${status.isoWeek} is not yet submitted.`}
    </Alert>
  );
};

export default ReflectionPrompt;
