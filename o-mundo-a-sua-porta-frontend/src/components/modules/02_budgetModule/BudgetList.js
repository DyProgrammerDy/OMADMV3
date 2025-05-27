import React, { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Typography,
  Chip,
  Tooltip
} from '@mui/material';
import { Edit, Delete, Visibility, Send } from '@mui/icons-material';
import { format } from 'date-fns';
import budgetService from './budgetService';

const getStatusChipColor = (status) => {
  switch (status) {
    case 'draft':
      return 'default';
    case 'sent':
      return 'info';
    case 'approved':
      return 'success';
    case 'rejected':
      return 'error';
    case 'invoiced':
      return 'warning';
    default:
      return 'default';
  }
};

const BudgetList = ({ onEdit, onDelete, onViewDetails, onSend, isLoading }) => {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadBudgets = async () => {
      try {
        const data = await budgetService.getBudgets();
        setBudgets(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadBudgets();
  }, []);

  if (loading && (!budgets || budgets.length === 0)) {
    return <Typography sx={{ textAlign: 'center', my: 3 }}>Loading budgets...</Typography>;
  }

  if (error) {
    return (
      <Typography color="error" sx={{ textAlign: 'center', my: 3 }}>
        Error loading budgets: {error}
      </Typography>
    );
  }

  if (!budgets || budgets.length === 0) {
    return <Typography sx={{ textAlign: 'center', my: 3 }}>No budgets found. Start by creating one!</Typography>;
  }

  return (
    <TableContainer component={Paper} sx={{ mt: 2 }}>
      <Table sx={{ minWidth: 650 }} aria-label="budgets table">
        <TableHead sx={{ backgroundColor: (theme) => theme.palette.grey[100] }}>
          <TableRow>
            <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Client ID</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }} align="right">Total Value</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }} align="center">Status</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }} align="center">Valid Until</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }} align="center">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {budgets.map((budget) => (
            <TableRow
              key={budget.id}
              sx={{ '&:last-child td, &:last-child th': { border: 0 }, '&:hover': { backgroundColor: (theme) => theme.palette.action.hover } }}
            >
              <TableCell component="th" scope="row">
                {budget.name}
              </TableCell>
              <TableCell>{budget.client_id || '-'}</TableCell>
              <TableCell align="right">{`${budget.currency} ${parseFloat(budget.total_value).toFixed(2)}`}</TableCell>
              <TableCell align="center">
                <Chip label={budget.status?.toUpperCase() || 'N/A'} color={getStatusChipColor(budget.status)} size="small" />
              </TableCell>
              <TableCell align="center">
                {budget.valid_until ? format(new Date(budget.valid_until), 'dd/MM/yyyy') : '-'}
              </TableCell>
              <TableCell align="center">
                <Tooltip title="View Details">
                  <IconButton onClick={() => onViewDetails(budget.id)} size="small" disabled={isLoading}>
                    <Visibility />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Edit Budget">
                  <IconButton onClick={() => onEdit(budget)} size="small" disabled={isLoading || budget.status === 'invoiced'}>
                    <Edit />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Send Budget">
                  <IconButton 
                    onClick={() => onSend(budget.id)} 
                    size="small" 
                    disabled={isLoading || budget.status === 'sent' || budget.status === 'approved' || budget.status === 'invoiced'}
                    color="primary"
                  >
                    <Send />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete Budget">
                  <IconButton onClick={() => onDelete(budget.id)} size="small" color="error" disabled={isLoading}>
                    <Delete />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default BudgetList;
