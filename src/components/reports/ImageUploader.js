// File: src/components/reports/ImageUploader.js
import React, { useRef, useState } from 'react';
import { Box, Typography, Button, ImageList, ImageListItem, IconButton } from '@mui/material';
import { CloudUpload, DeleteOutline } from '@mui/icons-material';
import { reportAPI } from '../../services/api';

/**
 * Upload images to S3 (via /reports/uploads) and manage the template's image slots.
 * @param {{ imageSlots, onAdd, onRemove, makeId }} props
 *   onAdd({ id, label, s3Key, url }); onRemove(id); makeId('img') => string
 */
const ImageUploader = ({ imageSlots = [], onAdd, onRemove, makeId }) => {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setError(null);
    try {
      const res = await reportAPI.uploadImage(file);
      const { url, s3Key } = res.data?.data || {};
      onAdd({ id: makeId('img'), label: file.name, s3Key, url });
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="overline" color="text.secondary">Images</Typography>
      <Box sx={{ mt: 1 }}>
        <input ref={inputRef} type="file" accept="image/*" hidden onChange={handleFile} />
        <Button size="small" variant="outlined" startIcon={<CloudUpload />} disabled={uploading}
          onClick={() => inputRef.current?.click()}>
          {uploading ? 'Uploading…' : 'Upload image'}
        </Button>
      </Box>
      {error && <Typography variant="caption" color="error">{error}</Typography>}
      {imageSlots.length > 0 && (
        <ImageList cols={2} gap={8} sx={{ mt: 1 }}>
          {imageSlots.map((s) => (
            <ImageListItem key={s.id} sx={{ position: 'relative' }}>
              <img src={s.url} alt={s.label || ''} style={{ borderRadius: 8, height: 80, objectFit: 'cover' }} />
              <IconButton size="small" onClick={() => onRemove(s.id)}
                sx={{ position: 'absolute', top: 2, right: 2, bgcolor: 'background.paper' }}>
                <DeleteOutline fontSize="small" />
              </IconButton>
            </ImageListItem>
          ))}
        </ImageList>
      )}
    </Box>
  );
};

export default ImageUploader;
