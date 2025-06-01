import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  IconButton,
  Tooltip,
  Box,
  Typography,
  CircularProgress,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

/**
 * @typedef {Object} Column
 * @property {string} id - Column identifier
 * @property {string} label - Column label
 * @property {number} [minWidth] - Minimum width of the column
 * @property {'left'|'right'|'center'} [align] - Text alignment
 * @property {function(any): string|number} [format] - Function to format cell value
 * @property {function(Object): React.ReactNode} [render] - Function to render cell content
 */

/**
 * @typedef {Object} DataTableProps
 * @property {Column[]} columns - Table columns configuration
 * @property {Object[]} data - Table data
 * @property {boolean} [loading=false] - Whether the table is in loading state
 * @property {number} total - Total number of records
 * @property {number} page - Current page number
 * @property {number} rowsPerPage - Number of rows per page
 * @property {function(number): void} onPageChange - Callback when page changes
 * @property {function(number): void} onRowsPerPageChange - Callback when rows per page changes
 * @property {function(Object): void} [onEdit] - Callback when edit action is clicked
 * @property {function(Object): void} [onDelete] - Callback when delete action is clicked
 * @property {string} [emptyMessage] - Message to show when table is empty
 */

/**
 * A reusable data table component with pagination and actions
 * @param {DataTableProps} props
 */
function DataTable({
  columns,
  data,
  loading = false,
  total,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  onEdit,
  onDelete,
  emptyMessage,
}) {
  const { t } = useTranslation();

  const handleChangePage = (event, newPage) => {
    onPageChange(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    onRowsPerPageChange(parseInt(event.target.value, 10));
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (data.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="textSecondary">
          {emptyMessage || t('common.noData')}
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
      <TableContainer sx={{ maxHeight: 440 }}>
        <Table stickyHeader aria-label="sticky table">
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={String(column.id)}
                  align={column.align || 'left'}
                  style={{ minWidth: column.minWidth }}
                >
                  {column.label}
                </TableCell>
              ))}
              {(onEdit || onDelete) && (
                <TableCell align="right" style={{ minWidth: 100 }}>
                  {t('common.actions')}
                </TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row) => (
              <TableRow hover role="checkbox" tabIndex={-1} key={row.id}>
                {columns.map((column) => {
                  const value = row[column.id];
                  return (
                    <TableCell key={String(column.id)} align={column.align || 'left'}>
                      {column.render
                        ? column.render(row)
                        : column.format
                        ? column.format(value)
                        : String(value)}
                    </TableCell>
                  );
                })}
                {(onEdit || onDelete) && (
                  <TableCell align="right">
                    {onEdit && (
                      <Tooltip title={t('common.edit')}>
                        <IconButton
                          size="small"
                          onClick={() => onEdit(row)}
                          aria-label={t('common.edit')}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    {onDelete && (
                      <Tooltip title={t('common.delete')}>
                        <IconButton
                          size="small"
                          onClick={() => onDelete(row)}
                          aria-label={t('common.delete')}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[10, 25, 50, 100]}
        component="div"
        count={total}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage={t('common.rowsPerPage')}
        labelDisplayedRows={({ from, to, count }) =>
          t('common.displayedRows', { from, to, count })
        }
      />
    </Paper>
  );
}

export default DataTable; 