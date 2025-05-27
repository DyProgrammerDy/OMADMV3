const express = require('express');
const router = express.Router();
const { getDB } = require('../db');
const bcrypt = require('bcrypt');

// GET /api/links-acesso/ - Fetch all active records
router.get('/', async (req, res) => {
  const db = getDB();
  try {
    const [rows] = await db.query('SELECT id, nome_sistema, url_acesso, usuario, observacoes, data_criacao, data_atualizacao FROM sistemas_externos WHERE is_active = true');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching links de acesso:', err);
    res.status(500).json({ error: 'Failed to fetch links de acesso' });
  }
});

// GET /api/links-acesso/:id - Fetch a single active record by id
router.get('/:id', async (req, res) => {
  const db = getDB();
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT id, nome_sistema, url_acesso, usuario, observacoes, data_criacao, data_atualizacao FROM sistemas_externos WHERE id = ? AND is_active = true', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Link de acesso not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(`Error fetching link de acesso with id ${id}:`, err);
    res.status(500).json({ error: 'Failed to fetch link de acesso' });
  }
});

// POST /api/links-acesso/ - Create a new record
router.post('/', async (req, res) => {
  const db = getDB();
  const { nome_sistema, url_acesso, usuario, senha, observacoes } = req.body;

  if (!nome_sistema || !url_acesso) {
    return res.status(400).json({ error: 'nome_sistema and url_acesso are required' });
  }

  let senha_hash = null;
  if (senha) {
    try {
      const saltRounds = 10;
      senha_hash = await bcrypt.hash(senha, saltRounds);
    } catch (hashError) {
      console.error('Error hashing password:', hashError);
      return res.status(500).json({ error: 'Failed to process password' });
    }
  }

  try {
    const [result] = await db.query(
      'INSERT INTO sistemas_externos (nome_sistema, url_acesso, usuario, senha_hash, observacoes, is_active, data_criacao, data_atualizacao) VALUES (?, ?, ?, ?, ?, true, NOW(), NOW())',
      [nome_sistema, url_acesso, usuario, senha_hash, observacoes]
    );
    res.status(201).json({
      id: result.insertId,
      nome_sistema,
      url_acesso,
      usuario,
      observacoes,
      is_active: true
    });
  } catch (err) {
    console.error('Error creating link de acesso:', err);
    res.status(500).json({ error: 'Failed to create link de acesso' });
  }
});

// PUT /api/links-acesso/:id - Update an existing record by id
router.put('/:id', async (req, res) => {
  const db = getDB();
  const { id } = req.params;
  const { nome_sistema, url_acesso, usuario, senha, observacoes } = req.body;

  if (!nome_sistema && !url_acesso && !usuario && senha === undefined && observacoes === undefined) {
    return res.status(400).json({ error: 'No fields provided for update' });
  }

  try {
    // Check if record exists and is active
    const [existingRows] = await db.query('SELECT * FROM sistemas_externos WHERE id = ? AND is_active = true', [id]);
    if (existingRows.length === 0) {
      return res.status(404).json({ error: 'Link de acesso not found or not active' });
    }

    let senha_hash_to_update = existingRows[0].senha_hash; // Keep existing hash by default

    if (senha) { // Only hash and update if a new password is provided
      try {
        const saltRounds = 10;
        senha_hash_to_update = await bcrypt.hash(senha, saltRounds);
      } catch (hashError) {
        console.error('Error hashing password for update:', hashError);
        return res.status(500).json({ error: 'Failed to process new password' });
      }
    }

    const updateFields = {};
    if (nome_sistema !== undefined) updateFields.nome_sistema = nome_sistema;
    if (url_acesso !== undefined) updateFields.url_acesso = url_acesso;
    if (usuario !== undefined) updateFields.usuario = usuario;
    // Only include senha_hash in updateFields if a new password was provided and hashed
    if (senha) updateFields.senha_hash = senha_hash_to_update;
    if (observacoes !== undefined) updateFields.observacoes = observacoes;
    updateFields.data_atualizacao = new Date();


    const [result] = await db.query(
      'UPDATE sistemas_externos SET ? WHERE id = ?',
      [updateFields, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Link de acesso not found' });
    }

    const [updatedRows] = await db.query('SELECT id, nome_sistema, url_acesso, usuario, observacoes, data_criacao, data_atualizacao FROM sistemas_externos WHERE id = ?', [id]);
    res.json(updatedRows[0]);

  } catch (err) {
    console.error(`Error updating link de acesso with id ${id}:`, err);
    res.status(500).json({ error: 'Failed to update link de acesso' });
  }
});

// DELETE /api/links-acesso/:id - Soft delete a record by id
router.delete('/:id', async (req, res) => {
  const db = getDB();
  const { id } = req.params;
  try {
    const [result] = await db.query(
      'UPDATE sistemas_externos SET is_active = false, data_atualizacao = NOW() WHERE id = ?',
      [id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Link de acesso not found' });
    }
    res.status(200).json({ message: 'Link de acesso soft deleted successfully' });
  } catch (err) {
    console.error(`Error soft deleting link de acesso with id ${id}:`, err);
    res.status(500).json({ error: 'Failed to soft delete link de acesso' });
  }
});

module.exports = router;
