import React, { useState } from 'react';
import {
  Box, Button, Menu, MenuItem, Typography, Chip, alpha, useTheme, CircularProgress,
} from '@mui/material';
import { FolderSpecial, ExpandMore, Check } from '@mui/icons-material';
import { useProjectContext } from '../../context/ProjectContext';

const ProjectSwitcher = () => {
  const theme = useTheme();
  const { myProjects, activeProjectId, activeProject, loadingProjects, setActiveProjectId } = useProjectContext();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleOpen = (e) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleSelect = (id) => {
    setActiveProjectId(id);
    handleClose();
  };

  if (loadingProjects) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', px: 1 }}>
        <CircularProgress size={14} />
      </Box>
    );
  }

  const label = activeProject ? activeProject.name : 'All Projects';

  return (
    <>
      <Button
        size="small"
        onClick={handleOpen}
        endIcon={<ExpandMore sx={{ fontSize: 16 }} />}
        startIcon={<FolderSpecial sx={{ fontSize: 16 }} />}
        sx={{
          textTransform: 'none',
          fontSize: '0.8125rem',
          fontWeight: 500,
          color: 'text.secondary',
          borderRadius: 2,
          px: 1.5,
          py: 0.5,
          bgcolor: open ? alpha(theme.palette.primary.main, 0.06) : 'transparent',
          '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.06) },
          maxWidth: 200,
        }}
      >
        <Typography
          variant="body2"
          fontWeight={500}
          noWrap
          sx={{ maxWidth: 130, fontSize: 'inherit' }}
        >
          {label}
        </Typography>
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          elevation: 2,
          sx: { borderRadius: 2, minWidth: 220, mt: 0.5 },
        }}
      >
        <MenuItem
          onClick={() => handleSelect(null)}
          sx={{ gap: 1.5, py: 1 }}
        >
          <FolderSpecial sx={{ fontSize: 18, color: 'text.secondary' }} />
          <Typography variant="body2" fontWeight={500}>All Projects</Typography>
          {!activeProjectId && <Check sx={{ fontSize: 16, color: 'primary.main', ml: 'auto' }} />}
        </MenuItem>

        {myProjects.length > 0 && (
          <Box sx={{ borderTop: '1px solid', borderColor: 'divider', mx: 1, my: 0.5 }} />
        )}

        {myProjects.map((project) => (
          <MenuItem
            key={project._id}
            onClick={() => handleSelect(project._id)}
            sx={{ gap: 1.5, py: 1 }}
          >
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" fontWeight={500} noWrap>{project.name}</Typography>
              {project.location?.city && (
                <Typography variant="caption" color="text.secondary" noWrap>
                  {project.location.city}
                </Typography>
              )}
            </Box>
            {project._id === activeProjectId && (
              <Check sx={{ fontSize: 16, color: 'primary.main', flexShrink: 0 }} />
            )}
          </MenuItem>
        ))}

        {myProjects.length === 0 && (
          <MenuItem disabled>
            <Typography variant="body2" color="text.secondary">No projects assigned</Typography>
          </MenuItem>
        )}

        {activeProjectId && (
          <>
            <Box sx={{ borderTop: '1px solid', borderColor: 'divider', mx: 1, my: 0.5 }} />
            <MenuItem onClick={() => handleSelect(null)} sx={{ py: 0.75 }}>
              <Typography variant="caption" color="primary.main">Clear selection</Typography>
            </MenuItem>
          </>
        )}
      </Menu>

      {activeProjectId && (
        <Chip
          label={activeProject?.name || 'Filtered'}
          size="small"
          onDelete={() => setActiveProjectId(null)}
          sx={{
            height: 22,
            fontSize: '0.688rem',
            fontWeight: 600,
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            color: 'primary.main',
            '& .MuiChip-deleteIcon': { fontSize: 14, color: 'primary.main' },
            ml: 0.5,
          }}
        />
      )}
    </>
  );
};

export default ProjectSwitcher;
