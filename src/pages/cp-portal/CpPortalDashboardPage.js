import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, List, ListItem, ListItemIcon, ListItemText,
  Button, Chip,
} from '@mui/material';
import { CheckCircle, RadioButtonUnchecked, Lock } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { cpPortalAPI } from '../../services/api';

const CpPortalDashboardPage = () => {
  const navigate = useNavigate();
  const { user, organization } = useAuth();
  const [teamCount, setTeamCount] = useState(null);

  useEffect(() => {
    cpPortalAPI.getTeam()
      .then((res) => setTeamCount((res.data?.data || []).length))
      .catch(() => setTeamCount(null));
  }, []);

  const profileComplete = !!(organization?.city && organization?.contactInfo?.phone);
  const hasTeam = teamCount !== null && teamCount > 1;

  const steps = [
    { done: true, label: 'Create your channel partner account', action: null },
    { done: profileComplete, label: 'Complete your organization profile',
      action: () => navigate('/partner/profile') },
    { done: hasTeam, label: 'Invite your team', action: () => navigate('/partner/team') },
  ];

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700 }}>
        Welcome, {user?.firstName}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {organization?.name} · let's finish setting up.
      </Typography>

      <Card variant="outlined" sx={{ mb: 2, maxWidth: 640 }}>
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
            Getting started
          </Typography>
          <List dense>
            {steps.map((s) => (
              <ListItem key={s.label}
                secondaryAction={s.action && !s.done
                  ? <Button size="small" onClick={s.action}>Do it</Button> : null}>
                <ListItemIcon>
                  {s.done ? <CheckCircle color="success" /> : <RadioButtonUnchecked color="disabled" />}
                </ListItemIcon>
                <ListItemText primary={s.label} />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>

      <Card variant="outlined" sx={{ maxWidth: 640, opacity: 0.7 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Lock fontSize="small" color="disabled" />
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Find developers to partner with
            </Typography>
            <Chip label="Coming soon" size="small" />
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Discover real-estate developers, apply to partner with them, and start
            registering leads — arriving in an upcoming release.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default CpPortalDashboardPage;
