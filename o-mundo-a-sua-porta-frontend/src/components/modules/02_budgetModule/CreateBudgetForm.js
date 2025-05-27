import React, { useState, useEffect } from 'react';
import {
  TextField,
  Button,
  Grid,
  Typography,
  Paper,
  Box,
  MenuItem,
  CircularProgress,
  Alert
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { parseISO } from 'date-fns';
// import budgetService from './budgetService'; // Assuming you might load clients or packages for dropdowns

// Helper function for date conversion if needed, or rely on date-fns directly
// const formatDateForInput = (dateString) => {
//   if (!dateString) return null;
//   // Assuming dateString is in 'YYYY-MM-DD' or ISO format
//   const date = new Date(dateString);
//   // Format to 'MM/dd/yyyy' or whatever DatePicker expects if it's not handling ISO well.
//   // Modern DatePickers usually handle ISO strings well.
//   return date;
// };


const BudgetForm = ({ budgetToEdit, onSave, onCancel, isLoading }) => {
  const [formData, setFormData] = useState({
    name: '',
    client_id: '', // Assuming client_id will be an ID from a list of clients
    package_id: '', // Optional
    description: '',
    total_value: '0.00',
    currency: 'BRL',
    status: 'draft',
    valid_until: null, // Date object or null
  });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);

  // TODO: In a real app, you'd fetch clients and packages here for dropdowns
  // const [clients, setClients] = useState([]);
  // useEffect(() => {
  //   // clientService.getClients().then(data => setClients(data));
  // }, []);

  useEffect(() => {
    if (budgetToEdit) {
      setFormData({
        name: budgetToEdit.name || '',
        client_id: budgetToEdit.client_id || '',
        package_id: budgetToEdit.package_id || '',
        description: budgetToEdit.description || '',
        total_value: budgetToEdit.total_value || '0.00',
        currency: budgetToEdit.currency || 'BRL',
        status: budgetToEdit.status || 'draft',
        valid_until: budgetToEdit.valid_until ? parseISO(budgetToEdit.valid_until) : null,
      });
    } else {
      // Reset to default for new budget
      setFormData({
        name: '',
        client_id: '',
        package_id: '',
        description: '',
        total_value: '0.00',
        currency: 'BRL',
        status: 'draft',
        valid_until: null,
      });
    }
  }, [budgetToEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleDateChange = (date) => {
    setFormData((prev) => ({ ...prev, valid_until: date }));
    if (errors.valid_until) {
      setErrors((prev) => ({ ...prev, valid_until: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Budget name is required.';
    if (!formData.client_id) newErrors.client_id = 'Client is required.'; // Assuming client_id is mandatory
    if (formData.total_value && isNaN(parseFloat(formData.total_value))) {
      newErrors.total_value = 'Total value must be a valid number.';
    }
    if (formData.valid_until && !(formData.valid_until instanceof Date && !isNaN(formData.valid_until))) {
        newErrors.valid_until = 'Valid until date must be a valid date.';
    } else if (formData.valid_until && formData.valid_until < new Date().setHours(0,0,0,0) && !budgetToEdit) {
        // Only validate for future date if it's a new budget or status allows
        newErrors.valid_until = 'Valid until date must be in the future.';
    }


    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    
    if (validate()) {
      try {
        const dataToSave = {
          ...formData,
          valid_until: formData.valid_until ? formData.valid_until.toISOString().split('T')[0] : null,
          total_value: parseFloat(formData.total_value) || 0,
          // Ensure all required fields are properly formatted
          client_id: parseInt(formData.client_id, 10),
          package_id: formData.package_id ? parseInt(formData.package_id, 10) : null
        };

        await onSave(dataToSave);
      } catch (error) {
        setSubmitError(error.message || 'Failed to save budget. Please try again.');
        console.error('Save error:', error);
      }
    }
  };

  const statusOptions = [
    { value: 'draft', label: 'Draft' },
    { value: 'sent', label: 'Sent' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'invoiced', label: 'Invoiced' },
  ];

  const currencyOptions = [
    { value: 'BRL', label: 'BRL (Brazilian Real)' },
    { value: 'USD', label: 'USD (US Dollar)' },
    { value: 'EUR', label: 'EUR (Euro)' },
  ];

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Paper elevation={3} sx={{ p: 3, mt: 2 }}>
        {submitError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {submitError}
          </Alert>
        )}
        <Typography variant="h6" gutterBottom>
          {budgetToEdit ? 'Edit Budget' : 'Create New Budget'}
        </Typography>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth
                label="Budget Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                error={!!errors.name}
                helperText={errors.name}
                required
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Client ID" // In a real app, this would be a dropdown/autocomplete
                name="client_id"
                value={formData.client_id}
                onChange={handleChange}
                error={!!errors.client_id}
                helperText={errors.client_id || "Enter Client ID (e.g., 1, 2)"}
                required
                // Example with select, if you had clients list:
                // select
              >
                {/* {clients.map((client) => (
                  <MenuItem key={client.id} value={client.id}>
                    {client.name}
                  </MenuItem>
                ))} */}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                multiline
                rows={3}
                value={formData.description}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Total Value"
                name="total_value"
                type="number"
                value={formData.total_value}
                onChange={handleChange}
                error={!!errors.total_value}
                helperText={errors.total_value}
                InputProps={{
                  startAdornment: <Box sx={{ mr: 1 }}>{formData.currency}</Box>,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                select
                label="Currency"
                name="currency"
                value={formData.currency}
                onChange={handleChange}
              >
                {currencyOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
             <Grid item xs={12} sm={4}>
              <DatePicker
                label="Valid Until"
                value={formData.valid_until}
                onChange={handleDateChange}
                slotProps={{ textField: { 
                    fullWidth: true,
                    error: !!errors.valid_until,
                    helperText: errors.valid_until
                }}}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Status"
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                {statusOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Package ID (Optional)"
                name="package_id"
                value={formData.package_id}
                onChange={handleChange}
                helperText="Enter Package ID if applicable (e.g., 101, 102)"
              />
            </Grid>
            <Grid item xs={12} sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button onClick={onCancel} sx={{ mr: 2 }} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" variant="contained" color="primary" disabled={isLoading}>
                {isLoading ? <CircularProgress size={24} /> : (budgetToEdit ? 'Save Changes' : 'Create Budget')}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </LocalizationProvider>
  );
};

export default BudgetForm;
