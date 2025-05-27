const express = require('express');
const router = express.Router();
const budgetController = require('./budget.controller');

// --- Budget Routes ---

// POST /api/budgets - Create a new budget
router.post('/', budgetController.createBudget);

// GET /api/budgets - List all budgets (with filtering, pagination via query params)
router.get('/', budgetController.getAllBudgets);

// GET /api/budgets/:id - Get a specific budget
router.get('/:id', budgetController.getBudgetById);

// PUT /api/budgets/:id - Update a budget
router.put('/:id', budgetController.updateBudget);

// DELETE /api/budgets/:id - Delete a budget
router.delete('/:id', budgetController.deleteBudget);

// POST /api/budgets/:id/send - Mark budget as sent
router.post('/:id/send', budgetController.markBudgetAsSent);


// --- Budget Item Routes ---
// These routes are nested under a specific budget.
// For example, the full path might be /api/budgets/:budgetId/items

// POST /api/budgets/:budgetId/items - Add an item to a budget
router.post('/:budgetId/items', budgetController.addBudgetItem);

// GET /api/budgets/:budgetId/items - Get all items for a specific budget
router.get('/:budgetId/items', budgetController.getBudgetItems);

// PUT /api/budgets/:budgetId/items/:itemId - Update a specific budget item
// Note: The controller expects itemId directly. If budgetId is also needed for context in the controller,
// it can be accessed via req.params.budgetId. The controller is currently set up to use itemId.
router.put('/:budgetId/items/:itemId', budgetController.updateBudgetItem);

// DELETE /api/budgets/:budgetId/items/:itemId - Delete a specific budget item
router.delete('/:budgetId/items/:itemId', budgetController.deleteBudgetItem);

module.exports = router;
