import React, { useState, useEffect, useCallback } from 'react';
import { Box, Button, Typography, CircularProgress, Alert, Snackbar, IconButton } from '@mui/material';
import { Add as AddIcon, ArrowBack as ArrowBackIcon, Close as CloseIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

import BudgetList from './BudgetList';
import BudgetForm from './CreateBudgetForm';
import BudgetDetails from './BudgetDetails';
import budgetService from './budgetService';

function BudgetPage() {
  const navigate = useNavigate();

  const [view, setView] = useState('list'); // 'list', 'form', 'details'
  const [budgets, setBudgets] = useState([]);
  const [selectedBudget, setSelectedBudget] = useState(null); // For editing or viewing details
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null); // For general page errors
  const [formError, setFormError] = useState(null); // For form-specific errors
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [successMessage, setSuccessMessage] = useState('');

  const fetchBudgets = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await budgetService.getBudgets(); // Add pagination/filters if needed
      setBudgets(data || []);
    } catch (err) {
      console.error("Failed to fetch budgets:", err);
      setError(err.message || 'Failed to fetch budgets. Please try again.');
      setSnackbar({ open: true, message: err.message || 'Failed to fetch budgets.', severity: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (view === 'list') {
      fetchBudgets();
    }
  }, [view, fetchBudgets]);

  const handleShowSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };

  // --- Navigation Handlers ---
  const showListView = () => {
    setView('list');
    setSelectedBudget(null);
    setFormError(null); // Clear form errors when switching view
  };

  const showCreateForm = () => {
    setSelectedBudget(null); // Clear any selected budget for editing
    setView('form');
    setFormError(null);
  };

  const showEditForm = (budget) => {
    setSelectedBudget(budget);
    setView('form');
    setFormError(null);
  };

  const showDetailsView = async (budgetId) => {
    setIsLoading(true); // Potentially show a spinner while fetching full details if needed
    try {
        const budgetDetails = await budgetService.getBudgetById(budgetId);
        if (budgetDetails) {
            setSelectedBudget(budgetDetails);
            setView('details');
        } else {
            handleShowSnackbar('Budget details not found.', 'error');
            showListView(); // Go back to list if details not found
        }
    } catch (err) {
        console.error(`Error fetching budget details for ID ${budgetId}:`, err);
        handleShowSnackbar(err.message || 'Error fetching budget details.', 'error');
    } finally {
        setIsLoading(false);
    }
  };

  // --- CRUD Handlers ---
  const handleSaveBudget = async (budgetData) => {
    setIsLoading(true);
    setFormError(null);
    try {
      if (selectedBudget && selectedBudget.id) {
        // Update existing budget
        await budgetService.updateBudget(selectedBudget.id, budgetData);
        handleShowSnackbar('Budget updated successfully!');
      } else {
        // Create new budget
        await budgetService.createBudget(budgetData);
        handleShowSnackbar('Budget created successfully!');
      }
      showListView(); // Refresh list and go back
    } catch (err) {
      console.error("Failed to save budget:", err);
      const errorMessage = err.error || err.message || 'Failed to save budget.';
      setFormError(errorMessage); // Show error on the form
      handleShowSnackbar(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteBudget = async (budgetId) => {
    if (window.confirm('Are you sure you want to delete this budget? This action cannot be undone.')) {
      setIsLoading(true);
      try {
        await budgetService.deleteBudget(budgetId);
        handleShowSnackbar('Budget deleted successfully!');
        fetchBudgets(); // Refresh list
        if (view === 'details' && selectedBudget?.id === budgetId) {
            showListView(); // If currently viewing details of deleted budget, go to list
        }
      } catch (err) {
        console.error("Failed to delete budget:", err);
        handleShowSnackbar(err.message || 'Failed to delete budget.', 'error');
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  const handleSendBudget = async (budgetId) => {
    if (window.confirm('Are you sure you want to mark this budget as sent?')) {
        setIsLoading(true);
        try {
            await budgetService.sendBudget(budgetId);
            handleShowSnackbar('Budget marked as sent!');
            fetchBudgets(); // Refresh list
            // If viewing details, update the selected budget's status
            if (view === 'details' && selectedBudget?.id === budgetId) {
                setSelectedBudget(prev => ({ ...prev, status: 'sent' }));
            }
        } catch (err) {
            console.error("Failed to send budget:", err);
            handleShowSnackbar(err.message || 'Failed to send budget.', 'error');
        } finally {
            setIsLoading(false);
        }
    }
  };


  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => view === 'list' ? navigate('/dashboard') : showListView()}
          sx={{ visibility: view === 'list' && !selectedBudget ? 'visible' : 'visible' }} // Always show back to dashboard from list
        >
          {view === 'list' ? 'Back to Dashboard' : 'Back to List'}
        </Button>
        <Typography variant="h4" component="h1" sx={{ textAlign: 'center', flexGrow: 1 }}>
          Budget Management
        </Typography>
        {view === 'list' && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={showCreateForm}
            disabled={isLoading}
          >
            New Budget
          </Button>
        )}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {view === 'list' && (
        <BudgetList
          budgets={budgets}
          onEdit={showEditForm}
          onDelete={handleDeleteBudget}
          onViewDetails={showDetailsView}
          onSend={handleSendBudget}
          isLoading={isLoading}
        />
      )}

      {view === 'form' && (
        <BudgetForm
          budgetToEdit={selectedBudget}
          onSave={handleSaveBudget}
          onCancel={showListView}
          isLoading={isLoading}
          // error={formError} // Pass formError to BudgetForm if it's designed to display it
        />
      )}
      {/* Display formError directly on BudgetPage if BudgetForm doesn't handle it */}
      {view === 'form' && formError && (
          <Alert severity="error" sx={{ mt: 2 }}>{formError}</Alert>
      )}


      {view === 'details' && selectedBudget && (
        <BudgetDetails
          budget={selectedBudget}
          onEdit={showEditForm} // Allow editing from details view
          onClose={showListView} // Close details view and go back to list
        />
      )}
      
      {isLoading && view !== 'list' && <CircularProgress sx={{ display: 'block', margin: '20px auto' }} />}


      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default BudgetPage;
