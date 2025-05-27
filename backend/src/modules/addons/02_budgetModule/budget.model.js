const db = require('../../../db'); // Adjust path as necessary to connect to your db.js

/*
SQL DDL for creating the necessary tables:

CREATE TABLE IF NOT EXISTS budgets (
    id SERIAL PRIMARY KEY,
    client_id INTEGER, -- REFERENCES clients(id) - Assuming a clients table from another module
    package_id INTEGER, -- REFERENCES packages(id) - Optional, if based on a pre-defined package
    name VARCHAR(255) NOT NULL,
    description TEXT,
    total_value DECIMAL(10, 2) DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'BRL',
    status VARCHAR(50) DEFAULT 'draft', -- Ex: draft, sent, approved, rejected, invoiced
    valid_until DATE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    -- FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL, -- Example if you have a clients table
    -- FOREIGN KEY (package_id) REFERENCES travel_packages(id) ON DELETE SET NULL -- Example if you have a travel_packages table
);

CREATE TABLE IF NOT EXISTS budget_items (
    id SERIAL PRIMARY KEY,
    budget_id INTEGER REFERENCES budgets(id) ON DELETE CASCADE,
    item_description VARCHAR(255) NOT NULL,
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(10, 2) DEFAULT 0.00,
    total_price DECIMAL(10, 2) DEFAULT 0.00, -- Should be quantity * unit_price
    supplier_id INTEGER -- REFERENCES suppliers(id) - Optional, if item from a specific supplier
    -- FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL -- Example if you have a suppliers table
);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for budgets table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_budgets') THEN
        CREATE TRIGGER set_timestamp_budgets
        BEFORE UPDATE ON budgets
        FOR EACH ROW
        EXECUTE PROCEDURE trigger_set_timestamp();
    END IF;
END
$$;

-- Note: For a production environment, you would run these DDL statements directly against your PostgreSQL database.
-- Consider using a migration tool for managing database schema changes.
*/

// Model functions for budgets

/**
 * Creates a new budget.
 * @param {object} budgetData - The data for the new budget.
 * @returns {Promise<object>} The created budget.
 */
async function createBudget(budgetData) {
  const {
    client_id,
    package_id,
    name,
    description,
    total_value,
    currency,
    status,
    valid_until,
  } = budgetData;

  const query = `
    INSERT INTO budgets (client_id, package_id, name, description, total_value, currency, status, valid_until)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *;
  `;
  const values = [
    client_id,
    package_id,
    name,
    description,
    total_value || 0.00,
    currency || 'BRL',
    status || 'draft',
    valid_until,
  ];

  try {
    const { rows } = await db.query(query, values);
    return rows[0];
  } catch (error) {
    console.error('Error creating budget:', error);
    throw error;
  }
}

/**
 * Gets all budgets, with optional filtering and pagination.
 * @param {object} filters - Optional filters (e.g., { status: 'sent', client_id: 1 }).
 * @param {number} page - Optional page number for pagination.
 * @param {number} limit - Optional limit per page for pagination.
 * @returns {Promise<Array<object>>} A list of budgets.
 */
async function getAllBudgets({ filters = {}, page = 1, limit = 10 } = {}) {
  let query = 'SELECT * FROM budgets';
  const queryParams = [];
  let paramIndex = 1;

  // Apply filters
  const filterClauses = Object.entries(filters)
    .map(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.push(value);
        return `${key} = $${paramIndex++}`;
      }
      return null;
    })
    .filter(Boolean);

  if (filterClauses.length > 0) {
    query += ' WHERE ' + filterClauses.join(' AND ');
  }

  query += ` ORDER BY created_at DESC`;

  // Apply pagination
  const offset = (page - 1) * limit;
  queryParams.push(limit, offset);
  query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
  
  try {
    const { rows } = await db.query(query, queryParams);
    return rows;
  } catch (error) {
    console.error('Error getting all budgets:', error);
    throw error;
  }
}

/**
 * Gets a specific budget by its ID.
 * @param {number} id - The ID of the budget.
 * @returns {Promise<object|null>} The budget, or null if not found.
 */
async function getBudgetById(id) {
  const query = 'SELECT * FROM budgets WHERE id = $1;';
  try {
    const { rows } = await db.query(query, [id]);
    return rows[0] || null;
  } catch (error) {
    console.error(`Error getting budget by ID ${id}:`, error);
    throw error;
  }
}

/**
 * Updates an existing budget.
 * @param {number} id - The ID of the budget to update.
 * @param {object} budgetData - The data to update.
 * @returns {Promise<object|null>} The updated budget, or null if not found.
 */
async function updateBudget(id, budgetData) {
  const {
    client_id,
    package_id,
    name,
    description,
    total_value,
    currency,
    status,
    valid_until,
  } = budgetData;

  const query = `
    UPDATE budgets
    SET 
      client_id = $1,
      package_id = $2,
      name = $3,
      description = $4,
      total_value = $5,
      currency = $6,
      status = $7,
      valid_until = $8,
      updated_at = CURRENT_TIMESTAMP 
    WHERE id = $9
    RETURNING *;
  `;
  const values = [
    client_id,
    package_id,
    name,
    description,
    total_value,
    currency,
    status,
    valid_until,
    id,
  ];

  try {
    const { rows } = await db.query(query, values);
    return rows[0] || null;
  } catch (error) {
    console.error(`Error updating budget by ID ${id}:`, error);
    throw error;
  }
}

/**
 * Deletes a budget by its ID.
 * @param {number} id - The ID of the budget to delete.
 * @returns {Promise<object|null>} The deleted budget, or null if not found.
 */
async function deleteBudget(id) {
  const query = 'DELETE FROM budgets WHERE id = $1 RETURNING *;';
  try {
    const { rows } = await db.query(query, [id]);
    return rows[0] || null;
  } catch (error) {
    console.error(`Error deleting budget by ID ${id}:`, error);
    throw error;
  }
}

// Model functions for budget_items

/**
 * Creates a new budget item.
 * @param {object} itemData - Data for the new item.
 * @returns {Promise<object>} The created budget item.
 */
async function createBudgetItem(itemData) {
  const { budget_id, item_description, quantity, unit_price, supplier_id } = itemData;
  const total_price = (quantity || 1) * (unit_price || 0);
  const query = `
    INSERT INTO budget_items (budget_id, item_description, quantity, unit_price, total_price, supplier_id)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *;
  `;
  const values = [budget_id, item_description, quantity, unit_price, total_price, supplier_id];
  try {
    const { rows } = await db.query(query, values);
    // Optionally, update the budget's total_value here or in the controller
    return rows[0];
  } catch (error) {
    console.error('Error creating budget item:', error);
    throw error;
  }
}

/**
 * Gets all items for a specific budget.
 * @param {number} budgetId - The ID of the budget.
 * @returns {Promise<Array<object>>} A list of budget items.
 */
async function getBudgetItems(budgetId) {
  const query = 'SELECT * FROM budget_items WHERE budget_id = $1 ORDER BY id ASC;';
  try {
    const { rows } = await db.query(query, [budgetId]);
    return rows;
  } catch (error) {
    console.error(`Error getting budget items for budget ID ${budgetId}:`, error);
    throw error;
  }
}

/**
 * Updates a budget item.
 * @param {number} itemId - The ID of the item to update.
 * @param {object} itemData - Data to update.
 * @returns {Promise<object|null>} The updated item, or null if not found.
 */
async function updateBudgetItem(itemId, itemData) {
  const { item_description, quantity, unit_price, supplier_id } = itemData;
  const total_price = (quantity || 1) * (unit_price || 0); // Recalculate total_price
  const query = `
    UPDATE budget_items
    SET 
      item_description = $1,
      quantity = $2,
      unit_price = $3,
      total_price = $4,
      supplier_id = $5
    WHERE id = $6
    RETURNING *;
  `;
  const values = [item_description, quantity, unit_price, total_price, supplier_id, itemId];
  try {
    const { rows } = await db.query(query, values);
    // Optionally, update the budget's total_value here or in the controller
    return rows[0] || null;
  } catch (error) {
    console.error(`Error updating budget item by ID ${itemId}:`, error);
    throw error;
  }
}

/**
 * Deletes a budget item.
 * @param {number} itemId - The ID of the item to delete.
 * @returns {Promise<object|null>} The deleted item, or null if not found.
 */
async function deleteBudgetItem(itemId) {
  const query = 'DELETE FROM budget_items WHERE id = $1 RETURNING *;';
  try {
    const { rows } = await db.query(query, [itemId]);
    // Optionally, update the budget's total_value here or in the controller
    return rows[0] || null;
  } catch (error) {
    console.error(`Error deleting budget item by ID ${itemId}:`, error);
    throw error;
  }
}

module.exports = {
  createBudget,
  getAllBudgets,
  getBudgetById,
  updateBudget,
  deleteBudget,
  createBudgetItem,
  getBudgetItems,
  updateBudgetItem,
  deleteBudgetItem,
  // Note: You might want to add a function here to execute the DDL commands
  // for initial setup if your application doesn't have a separate migration system.
  // async function setupDatabase() { /* ... execute DDL ... */ }
};
