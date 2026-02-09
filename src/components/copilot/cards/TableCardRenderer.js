// File: src/components/copilot/cards/TableCardRenderer.js
// Renders a compact data table inside the chat bubble

import React from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';

const TableCardRenderer = ({ card }) => {
  return (
    <Box sx={{ mb: 1 }}>
      {card.title && (
        <Typography
          variant="caption"
          sx={{
            fontWeight: 600,
            color: 'text.secondary',
            mb: 0.75,
            display: 'block',
            fontSize: '0.688rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          {card.title}
        </Typography>
      )}
      <TableContainer
        sx={{
          borderRadius: 1.5,
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'auto',
          maxHeight: 240,
        }}
      >
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              {card.columns.map((col) => (
                <TableCell
                  key={col.key}
                  sx={{
                    py: 0.75,
                    px: 1,
                    fontSize: '0.688rem',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    bgcolor: 'grey.50',
                  }}
                >
                  {col.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {card.rows.map((row, i) => (
              <TableRow key={i} sx={{ '&:last-child td': { borderBottom: 0 } }}>
                {card.columns.map((col) => (
                  <TableCell
                    key={col.key}
                    sx={{ py: 0.5, px: 1, fontSize: '0.75rem', whiteSpace: 'nowrap' }}
                  >
                    {row[col.key] ?? '—'}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default TableCardRenderer;
