import React, { useState } from 'react';
import {
  Box, Card, CardContent, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TablePagination, TableSortLabel,
  Typography, IconButton, Checkbox, Chip, Tooltip, Fade,
  useTheme, useMediaQuery, alpha,
} from '@mui/material';
import { MoreVert, KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import EmptyState from './EmptyState';
import { TableSkeleton } from './LoadingSkeleton';

/**
 * Adaptive data table — renders as a table on desktop and card list on mobile.
 *
 * @param {object} props
 * @param {Array<{id:string, label:string, render?:Function, sortable?:boolean, width?:string|number, hideOnMobile?:boolean, align?:string}>} props.columns
 * @param {Array} props.rows
 * @param {boolean} [props.loading]
 * @param {{icon?:any, title:string, description?:string, action?:object}} [props.emptyState]
 * @param {{page:number, rowsPerPage:number, total:number, onPageChange:Function, onRowsPerPageChange?:Function}} [props.pagination]
 * @param {{field:string, direction:'asc'|'desc'}} [props.currentSort]
 * @param {Function} [props.onSort]
 * @param {Function} [props.onRowClick]
 * @param {(row:any)=>React.ReactNode} [props.mobileCardRenderer]
 * @param {'card'|'scroll'} [props.responsive] - mobile strategy
 * @param {string} [props.rowKey] - key field in row objects (default: '_id')
 */
const DataTable = ({
  columns = [], rows = [], loading = false,
  emptyState, pagination, currentSort, onSort, onRowClick,
  mobileCardRenderer, responsive = 'card', rowKey = '_id',
  ...rest
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Loading state
  if (loading) {
    return <TableSkeleton rows={5} columns={Math.min(columns.length, 5)} />;
  }

  // Empty state
  if (!rows || rows.length === 0) {
    return (
      <Card {...rest}>
        <EmptyState
          title={emptyState?.title || 'No data found'}
          description={emptyState?.description || 'Try adjusting your filters or check back later.'}
          icon={emptyState?.icon}
          action={emptyState?.action}
          size="medium"
        />
      </Card>
    );
  }

  // Mobile card view
  if (isMobile && responsive === 'card') {
    return (
      <Box {...rest}>
        {rows.map((row, idx) => (
          <Fade in timeout={200 + idx * 50} key={row[rowKey] || idx}>
            <Card
              sx={{
                mb: 1.5,
                cursor: onRowClick ? 'pointer' : 'default',
                '&:hover': onRowClick ? { borderColor: 'primary.light' } : {},
              }}
              onClick={() => onRowClick?.(row)}
            >
              <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
                {mobileCardRenderer ? (
                  mobileCardRenderer(row)
                ) : (
                  // Auto-generate from columns
                  <Box>
                    {columns.filter(c => !c.hideOnMobile).map((col, ci) => (
                      <Box key={col.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                          {col.label}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: ci === 0 ? 600 : 400, textAlign: 'right' }}>
                          {col.render ? col.render(row[col.id], row) : (row[col.id] ?? '-')}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Fade>
        ))}

        {/* Pagination for mobile */}
        {pagination && (
          <TablePagination
            component="div"
            count={pagination.total}
            page={pagination.page}
            onPageChange={(e, p) => pagination.onPageChange(p)}
            rowsPerPage={pagination.rowsPerPage}
            onRowsPerPageChange={pagination.onRowsPerPageChange ? (e) => pagination.onRowsPerPageChange(parseInt(e.target.value, 10)) : undefined}
            rowsPerPageOptions={[10, 25, 50]}
            sx={{ borderTop: '1px solid', borderColor: 'divider' }}
          />
        )}
      </Box>
    );
  }

  // Desktop table view
  return (
    <Card data-coach="data-table" {...rest}>
      <TableContainer sx={{ overflowX: 'auto' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              {columns.map(col => (
                <TableCell
                  key={col.id}
                  align={col.align || 'left'}
                  sx={{ width: col.width, whiteSpace: 'nowrap' }}
                >
                  {col.sortable && onSort ? (
                    <TableSortLabel
                      active={currentSort?.field === col.id}
                      direction={currentSort?.field === col.id ? currentSort.direction : 'asc'}
                      onClick={() => onSort(col.id)}
                    >
                      {col.label}
                    </TableSortLabel>
                  ) : (
                    col.label
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, idx) => (
              <TableRow
                key={row[rowKey] || idx}
                hover
                onClick={() => onRowClick?.(row)}
                sx={{ cursor: onRowClick ? 'pointer' : 'default' }}
              >
                {columns.map(col => (
                  <TableCell key={col.id} align={col.align || 'left'}>
                    {col.render ? col.render(row[col.id], row) : (row[col.id] ?? '-')}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {pagination && (
        <TablePagination
          component="div"
          count={pagination.total}
          page={pagination.page}
          onPageChange={(e, p) => pagination.onPageChange(p)}
          rowsPerPage={pagination.rowsPerPage}
          onRowsPerPageChange={pagination.onRowsPerPageChange ? (e) => pagination.onRowsPerPageChange(parseInt(e.target.value, 10)) : undefined}
          rowsPerPageOptions={[10, 25, 50]}
        />
      )}
    </Card>
  );
};

export default DataTable;
