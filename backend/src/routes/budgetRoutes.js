const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all budgets
router.get('/', async (req, res) => {
  try {
    const budgets = await db.query('SELECT * FROM budgets ORDER BY created_at DESC');
    res.json(budgets.rows);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ message: 'Error fetching budgets' });
  }
});

// ...other budget routes...

module.exports = router;