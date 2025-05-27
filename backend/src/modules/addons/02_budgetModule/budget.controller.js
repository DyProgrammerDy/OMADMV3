const budgetModel = require('./budget.model');

// --- Budget Controllers ---

/**
 * Controller to create a new budget.
 */
async function createBudget(req, res) {
  try {
    // Basic validation (more can be added)
    if (!req.body.name) {
      return res.status(400).json({ error: 'Budget name is required.' });
    }
    const newBudget = await budgetModel.createBudget(req.body);
    res.status(201).json(newBudget);
  } catch (error) {
    console.error('Controller error creating budget:', error);
    res.status(500).json({ error: 'Failed to create budget.' });
  }
}

/**
 * Controller to get all budgets with optional filtering.
 */
async function getAllBudgets(req, res) {
  try {
    // Extract query parameters for filtering, page, limit
    const { status, client_id, page, limit } = req.query;
    const filters = {};
    if (status) filters.status = status;
    if (client_id) filters.client_id = parseInt(client_id, 10); // Ensure client_id is an integer

    const pageInt = page ? parseInt(page, 10) : 1;
    const limitInt = limit ? parseInt(limit, 10) : 10;

    if (isNaN(pageInt) || pageInt < 1) {
        return res.status(400).json({ error: 'Invalid page number.' });
    }
    if (isNaN(limitInt) || limitInt < 1) {
        return res.status(400).json({ error: 'Invalid limit value.' });
    }
    
    const budgets = await budgetModel.getAllBudgets({ filters, page: pageInt, limit: limitInt });
    // TODO: Add count for pagination headers if needed
    res.status(200).json(budgets);
  } catch (error) {
    console.error('Controller error getting all budgets:', error);
    res.status(500).json({ error: 'Failed to retrieve budgets.' });
  }
}

/**
 * Controller to get a single budget by ID.
 */
async function getBudgetById(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid budget ID.' });
    }
    const budget = await budgetModel.getBudgetById(id);
    if (budget) {
      res.status(200).json(budget);
    } else {
      res.status(404).json({ error: 'Budget not found.' });
    }
  } catch (error) {
    console.error('Controller error getting budget by ID:', error);
    res.status(500).json({ error: 'Failed to retrieve budget.' });
  }
}

/**
 * Controller to update an existing budget.
 */
async function updateBudget(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid budget ID.' });
    }
    // Basic validation (more can be added)
    if (!req.body.name) {
      return res.status(400).json({ error: 'Budget name is required for update.' });
    }
    const updatedBudget = await budgetModel.updateBudget(id, req.body);
    if (updatedBudget) {
      res.status(200).json(updatedBudget);
    } else {
      res.status(404).json({ error: 'Budget not found for update.' });
    }
  } catch (error) {
    console.error('Controller error updating budget:', error);
    res.status(500).json({ error: 'Failed to update budget.' });
  }
}

/**
 * Controller to delete a budget.
 */
async function deleteBudget(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid budget ID.' });
    }
    const deletedBudget = await budgetModel.deleteBudget(id);
    if (deletedBudget) {
      // Also delete associated budget items (or rely on ON DELETE CASCADE)
      // For explicit control, you might call budgetModel.deleteBudgetItemsByBudgetId(id) here
      res.status(200).json({ message: 'Budget deleted successfully.', budget: deletedBudget });
    } else {
      res.status(404).json({ error: 'Budget not found for deletion.' });
    }
  } catch (error) {
    console.error('Controller error deleting budget:', error);
    res.status(500).json({ error: 'Failed to delete budget.' });
  }
}

/**
 * Controller to mark a budget as sent.
 * This is an example of a custom action.
 */
async function markBudgetAsSent(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid budget ID.' });
    }
    const budget = await budgetModel.getBudgetById(id);
    if (!budget) {
      return res.status(404).json({ error: 'Budget not found.' });
    }

    // Update status to 'sent'
    const updatedBudget = await budgetModel.updateBudget(id, { ...budget, status: 'sent' });
    res.status(200).json(updatedBudget);
  } catch (error) {
    console.error('Controller error marking budget as sent:', error);
    res.status(500).json({ error: 'Failed to mark budget as sent.' });
  }
}


// --- Budget Item Controllers ---

/**
 * Controller to add an item to a budget.
 */
async function addBudgetItem(req, res) {
  try {
    const budgetId = parseInt(req.params.budgetId, 10); // Assuming route like /api/budgets/:budgetId/items
    if (isNaN(budgetId)) {
      return res.status(400).json({ error: 'Invalid budget ID.' });
    }
    // Basic validation for item
    if (!req.body.item_description || !req.body.unit_price) {
      return res.status(400).json({ error: 'Item description and unit price are required.' });
    }
    const newItemData = { ...req.body, budget_id: budgetId };
    const newItem = await budgetModel.createBudgetItem(newItemData);
    // Optionally, recalculate and update budget's total_value here
    res.status(201).json(newItem);
  } catch (error) {
    console.error('Controller error adding budget item:', error);
    res.status(500).json({ error: 'Failed to add budget item.' });
  }
}

/**
 * Controller to get all items for a specific budget.
 */
async function getBudgetItems(req, res) {
  try {
    const budgetId = parseInt(req.params.budgetId, 10); // Assuming route like /api/budgets/:budgetId/items
    if (isNaN(budgetId)) {
      return res.status(400).json({ error: 'Invalid budget ID.' });
    }
    const items = await budgetModel.getBudgetItems(budgetId);
    res.status(200).json(items);
  } catch (error) {
    console.error('Controller error getting budget items:', error);
    res.status(500).json({ error: 'Failed to retrieve budget items.' });
  }
}

/**
 * Controller to update a budget item.
 */
async function updateBudgetItem(req, res) {
  try {
    const itemId = parseInt(req.params.itemId, 10); // Assuming route like /api/budgets/:budgetId/items/:itemId
    if (isNaN(itemId)) {
      return res.status(400).json({ error: 'Invalid item ID.' });
    }
    // Basic validation
    if (!req.body.item_description || !req.body.unit_price) {
      return res.status(400).json({ error: 'Item description and unit price are required for update.' });
    }
    const updatedItem = await budgetModel.updateBudgetItem(itemId, req.body);
    if (updatedItem) {
      // Optionally, recalculate and update budget's total_value here
      res.status(200).json(updatedItem);
    } else {
      res.status(404).json({ error: 'Budget item not found for update.' });
    }
  } catch (error) {
    console.error('Controller error updating budget item:', error);
    res.status(500).json({ error: 'Failed to update budget item.' });
  }
}

/**
 * Controller to delete a budget item.
 */
async function deleteBudgetItem(req, res) {
  try {
    const itemId = parseInt(req.params.itemId, 10); // Assuming route like /api/budgets/:budgetId/items/:itemId
    if (isNaN(itemId)) {
      return res.status(400).json({ error: 'Invalid item ID.' });
    }
    const deletedItem = await budgetModel.deleteBudgetItem(itemId);
    if (deletedItem) {
      // Optionally, recalculate and update budget's total_value here
      res.status(200).json({ message: 'Budget item deleted successfully.', item: deletedItem });
    } else {
      res.status(404).json({ error: 'Budget item not found for deletion.' });
    }
  } catch (error) {
    console.error('Controller error deleting budget item:', error);
    res.status(500).json({ error: 'Failed to delete budget item.' });
  }
}

module.exports = {
  createBudget,
  getAllBudgets,
  getBudgetById,
  updateBudget,
  deleteBudget,
  markBudgetAsSent,
  addBudgetItem,
  getBudgetItems,
  updateBudgetItem,
  deleteBudgetItem,
};
