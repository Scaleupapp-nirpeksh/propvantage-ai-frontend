// File: src/components/reports/BlockConfigPanel.js
import React from 'react';
import { Box, TextField, Typography, MenuItem } from '@mui/material';

/**
 * Right rail: edit the selected block's title + a few common config fields.
 * @param {{ block, imageSlots, onChange }} props  onChange({ title?, config? })
 */
const BlockConfigPanel = ({ block, imageSlots = [], onChange }) => {
  if (!block) {
    return <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>Select a block to configure it.</Typography>;
  }
  const cfg = block.config || {};
  const setConfig = (patch) => onChange({ config: { ...cfg, ...patch } });

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="overline" color="text.secondary">Block settings</Typography>
      <TextField
        fullWidth size="small" margin="normal" label="Title"
        value={block.title || ''} onChange={(e) => onChange({ title: e.target.value })}
      />

      {block.type === 'text.note' && (
        <TextField
          fullWidth multiline minRows={4} size="small" margin="normal" label="Text"
          value={cfg.text || ''} onChange={(e) => setConfig({ text: e.target.value })}
        />
      )}

      {block.type === 'layout.hero' && (
        <>
          <TextField fullWidth size="small" margin="normal" label="Subtitle"
            value={cfg.subtitle || ''} onChange={(e) => setConfig({ subtitle: e.target.value })} />
          <TextField select fullWidth size="small" margin="normal" label="Cover image"
            value={cfg.imageSlotId || ''} onChange={(e) => setConfig({ imageSlotId: e.target.value })}>
            <MenuItem value="">None</MenuItem>
            {imageSlots.map((s) => <MenuItem key={s.id} value={s.id}>{s.label || s.id}</MenuItem>)}
          </TextField>
        </>
      )}

      {block.type === 'media.gallery' && (
        <TextField select fullWidth size="small" margin="normal" label="Images" SelectProps={{ multiple: true }}
          value={Array.isArray(cfg.imageSlotIds) ? cfg.imageSlotIds : []}
          onChange={(e) => setConfig({ imageSlotIds: e.target.value })}>
          {imageSlots.map((s) => <MenuItem key={s.id} value={s.id}>{s.label || s.id}</MenuItem>)}
        </TextField>
      )}
    </Box>
  );
};

export default BlockConfigPanel;
