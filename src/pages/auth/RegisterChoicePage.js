import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Card, CardActionArea, CardContent, Typography, Stack } from '@mui/material';
import { Business, Handshake } from '@mui/icons-material';

const RegisterChoicePage = () => {
  const navigate = useNavigate();
  const options = [
    { key: 'developer', title: "I'm a Real Estate Developer",
      desc: 'Manage your projects, inventory, leads, and sales.',
      icon: Business, to: '/register/developer' },
    { key: 'channel_partner', title: "I'm a Channel Partner",
      desc: 'Manage your team and the developers you work with, all in one place.',
      icon: Handshake, to: '/register/channel-partner' },
  ];
  return (
    <Box sx={{ maxWidth: 520, mx: 'auto' }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>Create your account</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Tell us who you are so we can set up the right workspace.
      </Typography>
      <Stack spacing={2}>
        {options.map((o) => (
          <Card key={o.key} variant="outlined">
            <CardActionArea onClick={() => navigate(o.to)}>
              <CardContent sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <o.icon color="primary" sx={{ fontSize: 36 }} />
                <Box>
                  <Typography sx={{ fontWeight: 600 }}>{o.title}</Typography>
                  <Typography variant="body2" color="text.secondary">{o.desc}</Typography>
                </Box>
              </CardContent>
            </CardActionArea>
          </Card>
        ))}
      </Stack>
      <Typography variant="body2" sx={{ mt: 3, textAlign: 'center' }}>
        Already have an account? <a href="/login">Sign in</a>
      </Typography>
    </Box>
  );
};

export default RegisterChoicePage;
