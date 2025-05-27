const express = require('express');
const router = express.Router();
const { pool } = require('../db');

router.get('/available', async (req, res) => {
    try {
        const { rows } = await pool.query(
            'SELECT * FROM dashboard_modules WHERE is_active = true ORDER BY order_index ASC'
        );
        res.json(rows);
    } catch (error) {
        console.error('Error fetching modules:', error);
        res.status(500).json({ error: 'Failed to fetch modules' });
    }
});

module.exports = router;