const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Default available fields
const DEFAULT_FIELDS = [
  "Taille", "Qualite", "Couleur", "Composition", "Devise", "Unite", "Incoterm", 
  "Season", "TargetMarket", "Certifications", "CountryOfOrigin", "HSCode", "Type", 
  "Statut", "Prod_Origine", "Marque", "Version", "Reference", "Libelle", "CodeABarre", 
  "Prix", "PrixMP", "LeadTime", "Poids_Net", "Poids_Unitaire", "Poids_M2", 
  "Construction", "ClasOnze", "RetTRMin", "RetTRMax", "RetCHMin", "RetCHMax", 
  "Laize", "Retrecissement_X", "Retrecissement_Y", "Note", "Domaine", 
  "CareInstructions", "SustainabilityInfo", "TechnicalSpecs", "Images", "Tags"
];

// Get all users for responsable selection
router.get('/users', async (req, res) => {
  try {
    const [rows] = await db.pool.execute(
      'SELECT id, firstname, lastname, email, poste FROM users ORDER BY firstname, lastname'
    );
    
    const users = rows.map(user => ({
      id: user.id,
      name: `${user.firstname} ${user.lastname}`,
      email: user.email,
      poste: user.poste
    }));
    
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get all magasins with responsable user details
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.pool.execute(`
      SELECT m.*, 
             u.firstname, u.lastname, u.email as responsable_email, u.poste
      FROM magasins m
      LEFT JOIN users u ON m.responsable_id = u.id
      ORDER BY m.created_at DESC
    `);
    
    const magasins = rows.map(row => ({
      id: row.id,
      name: row.name,
      responsable_id: row.responsable_id,
      responsable: row.firstname && row.lastname ? 
        `${row.firstname} ${row.lastname}` : 
        'No responsable assigned',
      responsable_email: row.responsable_email,
      responsable_poste: row.poste,
      email: row.email,
      phone: row.phone,
      address: row.address,
      available_fields: JSON.parse(row.available_fields || '[]'),
      created_at: row.created_at,
      updated_at: row.updated_at
    }));
    
    res.json(magasins);
  } catch (error) {
    console.error('Error fetching magasins:', error);
    res.status(500).json({ error: 'Failed to fetch magasins' });
  }
});

// Get magasin by ID with responsable user details
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.pool.execute(`
      SELECT m.*, 
             u.firstname, u.lastname, u.email as responsable_email, u.poste
      FROM magasins m
      LEFT JOIN users u ON m.responsable_id = u.id
      WHERE m.id = ?
    `, [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Magasin not found' });
    }
    
    const row = rows[0];
    const magasin = {
      id: row.id,
      name: row.name,
      responsable_id: row.responsable_id,
      responsable: row.firstname && row.lastname ? 
        `${row.firstname} ${row.lastname}` : 
        'No responsable assigned',
      responsable_email: row.responsable_email,
      responsable_poste: row.poste,
      email: row.email,
      phone: row.phone,
      address: row.address,
      available_fields: JSON.parse(row.available_fields || '[]'),
      created_at: row.created_at,
      updated_at: row.updated_at
    };
    
    res.json(magasin);
  } catch (error) {
    console.error('Error fetching magasin:', error);
    res.status(500).json({ error: 'Failed to fetch magasin' });
  }
});

// Create new magasin
router.post('/', async (req, res) => {
  try {
    const { name, responsable_id, email, phone, address, selected_fields } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    
    // Validate responsable_id if provided
    if (responsable_id) {
      const [userRows] = await db.pool.execute('SELECT id FROM users WHERE id = ?', [responsable_id]);
      if (userRows.length === 0) {
        return res.status(400).json({ error: 'Invalid responsable user ID' });
      }
    }
    
    // Use selected fields or default fields
    const availableFields = selected_fields && selected_fields.length > 0 ? selected_fields : DEFAULT_FIELDS;
    
    const [result] = await db.pool.execute(
      'INSERT INTO magasins (name, responsable_id, email, phone, address, available_fields) VALUES (?, ?, ?, ?, ?, ?)',
      [name, responsable_id || null, email, phone, address, JSON.stringify(availableFields)]
    );
    
    res.status(201).json({
      id: result.insertId,
      message: 'Magasin created successfully'
    });
  } catch (error) {
    console.error('Error creating magasin:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ error: 'Magasin name already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create magasin' });
    }
  }
});

// Update magasin
router.put('/:id', async (req, res) => {
  try {
    const { name, responsable_id, email, phone, address, selected_fields } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    
    // Validate responsable_id if provided
    if (responsable_id) {
      const [userRows] = await db.pool.execute('SELECT id FROM users WHERE id = ?', [responsable_id]);
      if (userRows.length === 0) {
        return res.status(400).json({ error: 'Invalid responsable user ID' });
      }
    }
    
    const availableFields = selected_fields && selected_fields.length > 0 ? selected_fields : DEFAULT_FIELDS;
    
    const [result] = await db.pool.execute(
      'UPDATE magasins SET name = ?, responsable_id = ?, email = ?, phone = ?, address = ?, available_fields = ? WHERE id = ?',
      [name, responsable_id || null, email, phone, address, JSON.stringify(availableFields), req.params.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Magasin not found' });
    }
    
    res.json({ message: 'Magasin updated successfully' });
  } catch (error) {
    console.error('Error updating magasin:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ error: 'Magasin name already exists' });
    } else {
      res.status(500).json({ error: 'Failed to update magasin' });
    }
  }
});

// Delete magasin
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await db.pool.execute('DELETE FROM magasins WHERE id = ?', [req.params.id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Magasin not found' });
    }
    
    res.json({ message: 'Magasin deleted successfully' });
  } catch (error) {
    console.error('Error deleting magasin:', error);
    res.status(500).json({ error: 'Failed to delete magasin' });
  }
});

// Get available fields for a magasin
router.get('/:id/fields', async (req, res) => {
  try {
    const [rows] = await db.pool.execute(
      'SELECT available_fields FROM magasins WHERE id = ?', 
      [req.params.id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Magasin not found' });
    }
    
    // Meilleure gestion des cas où available_fields pourrait être null ou vide
    let fields = [];
    const availableFields = rows[0].available_fields;
    
    if (availableFields) {
      try {
        fields = JSON.parse(availableFields);
        // S'assurer que fields est toujours un tableau
        if (!Array.isArray(fields)) {
          fields = [];
        }
      } catch (parseError) {
        console.error('Error parsing available_fields JSON:', parseError);
        fields = [];
      }
    }
    
    res.json({ fields });
  } catch (error) {
    console.error('Error fetching magasin fields:', error);
    res.status(500).json({ error: 'Failed to fetch magasin fields' });
  }
});
module.exports = router;

