import React, { useState, useEffect, useCallback } from 'react';
import {
  Drawer, Box, Typography, IconButton, Divider, CircularProgress,
  Alert, Button, Chip, useTheme,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { peopleAPI } from '../../services/api';
import Scorecard from './Scorecard';
import RedFlagInbox from './RedFlagInbox';
import ReflectionHistory from './ReflectionHistory';
import TargetEditorDialog from './TargetEditorDialog';

/**
 * Normalise attainment from { key: { actual, target, pct } } to fractions (0-1)
 * that Scorecard expects (it multiplies by 100 internally).
 */
const normaliseAttainment = (attainment = {}) =>
  Object.fromEntries(
    Object.entries(attainment).map(([k, v]) => [
      k,
      typeof v === 'object' && v !== null && 'pct' in v ? v.pct / 100 : v,
    ])
  );

/**
 * MemberDetailDrawer — right-side MUI Drawer showing a member's full dashboard.
 *
 * Props:
 *   userId  {string|null}  — member to load; null means "nothing open"
 *   range   {string}       — time range passed to the member endpoint
 *   open    {boolean}
 *   onClose {function}
 *   allowSetTargets {boolean} — when true, show "Set target" button (heads only)
 */
const MemberDetailDrawer = ({ userId, range = 'this_month', open, onClose, allowSetTargets = false }) => {
  const theme = useTheme();
  const [memberData, setMemberData] = useState(null);
  const [reflections, setReflections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [targetDialogOpen, setTargetDialogOpen] = useState(false);

  const load = useCallback(async () => {
    if (!userId || !open) return;
    setLoading(true);
    setError(null);
    setMemberData(null);
    setReflections([]);
    try {
      const [memberRes, reflRes] = await Promise.all([
        peopleAPI.member(userId, { range }),
        peopleAPI.memberReflections(userId).catch(() => ({ data: { data: [] } })),
      ]);
      setMemberData(memberRes.data?.data || memberRes.data);
      setReflections(reflRes.data?.data || []);
    } catch (e) {
      if (e.response?.status === 403) {
        setError('You do not have permission to view this member.');
      } else {
        setError(e.response?.data?.message || 'Failed to load member data.');
      }
    } finally {
      setLoading(false);
    }
  }, [userId, range, open]);

  useEffect(() => { load(); }, [load]);

  // Reset state when drawer closes
  useEffect(() => {
    if (!open) {
      setMemberData(null);
      setReflections([]);
      setError(null);
      setLoading(false);
    }
  }, [open]);

  const user = memberData?.user;
  const flags = memberData?.flags || {};
  const normAttainment = normaliseAttainment(memberData?.attainment || {});
  const userName = user
    ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
    : null;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { width: { xs: '100vw', sm: 480 }, p: 0 },
      }}
    >
      {/* Drawer header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          borderBottom: `1px solid ${theme.palette.divider}`,
          position: 'sticky',
          top: 0,
          bgcolor: 'background.paper',
          zIndex: 1,
        }}
      >
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
            {loading ? 'Loading…' : (userName || 'Member Details')}
          </Typography>
          {user?.role && (
            <Typography variant="caption" color="text.secondary">{user.role}</Typography>
          )}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {allowSetTargets && userId && !loading && !error && (
            <Button
              size="small"
              variant="outlined"
              onClick={() => setTargetDialogOpen(true)}
            >
              Set Targets
            </Button>
          )}
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </Box>

      {/* Drawer body */}
      <Box sx={{ p: 2, overflowY: 'auto' }}>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
            <CircularProgress size={36} />
          </Box>
        )}

        {!loading && error && (
          <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
        )}

        {!loading && !error && memberData && (
          <>
            {/* Scorecard (metrics + attainment) */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
                Performance Scorecard
              </Typography>
              <Scorecard
                user={user}
                metrics={memberData.metrics || {}}
                attainment={normAttainment}
              />
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* Red Flags */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
                Red Flags
                {memberData.flagCount > 0 && (
                  <Chip
                    label={memberData.flagCount}
                    size="small"
                    color="error"
                    sx={{ ml: 1, height: 20, fontSize: '0.625rem' }}
                  />
                )}
              </Typography>
              <RedFlagInbox flags={flags} />
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* Reflection History */}
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
                Reflection History
              </Typography>
              <ReflectionHistory reflections={reflections} />
            </Box>
          </>
        )}

        {!loading && !error && !memberData && userId && (
          <Alert severity="info" sx={{ mt: 2 }}>No data available for this member.</Alert>
        )}
      </Box>

      {/* Target editor (only when allowSetTargets) */}
      {allowSetTargets && (
        <TargetEditorDialog
          open={targetDialogOpen}
          onClose={() => setTargetDialogOpen(false)}
          userId={userId}
          onSaved={() => {
            setTargetDialogOpen(false);
            load();
          }}
        />
      )}
    </Drawer>
  );
};

export default MemberDetailDrawer;
