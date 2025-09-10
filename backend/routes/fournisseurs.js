const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get all users for created_by selection
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

// Get all suppliers for a magasin with user details
router.get('/magasin/:magasinId', async (req, res) => {
  try {
    const [rows] = await db.pool.execute(`
      SELECT f.*, 
             m.name as magasin_name, 
             mr.firstname as magasin_responsable_firstname, 
             mr.lastname as magasin_responsable_lastname,
             mr.email as magasin_responsable_email,
             cu.firstname as created_by_firstname,
             cu.lastname as created_by_lastname,
             cu.email as created_by_email,
             cu.poste as created_by_poste
      FROM fournisseurs f
      JOIN magasins m ON f.magasin_id = m.id
      LEFT JOIN users mr ON m.responsable_id = mr.id
      LEFT JOIN users cu ON f.created_by_user_id = cu.id
      WHERE f.magasin_id = ?
      ORDER BY f.created_at DESC
    `, [req.params.magasinId]);
    
    const suppliers = rows.map(row => ({
      id: row.id,
      magasin_id: row.magasin_id,
      name: row.name,
      country: row.country,
      email: row.email,
      phone: row.phone,
      address: row.address,
      contact_types: JSON.parse(row.contact_types || '[]'),
      created_by_user_id: row.created_by_user_id,
      created_by: row.created_by_firstname && row.created_by_lastname ? 
        `${row.created_by_firstname} ${row.created_by_lastname}` : 
        'Unknown user',
      created_by_email: row.created_by_email,
      created_by_poste: row.created_by_poste,
      magasin_name: row.magasin_name,
      magasin_responsable: row.magasin_responsable_firstname && row.magasin_responsable_lastname ?
        `${row.magasin_responsable_firstname} ${row.magasin_responsable_lastname}` :
        'No responsable assigned',
      magasin_responsable_email: row.magasin_responsable_email,
      created_at: row.created_at,
      updated_at: row.updated_at
    }));
    
    res.json(suppliers);
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    res.status(500).json({ error: 'Failed to fetch suppliers' });
  }
});

// Get supplier by ID with user details
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.pool.execute(`
      SELECT f.*, 
             m.name as magasin_name, 
             mr.firstname as magasin_responsable_firstname, 
             mr.lastname as magasin_responsable_lastname,
             mr.email as magasin_responsable_email,
             cu.firstname as created_by_firstname,
             cu.lastname as created_by_lastname,
             cu.email as created_by_email,
             cu.poste as created_by_poste
      FROM fournisseurs f
      JOIN magasins m ON f.magasin_id = m.id
      LEFT JOIN users mr ON m.responsable_id = mr.id
      LEFT JOIN users cu ON f.created_by_user_id = cu.id
      WHERE f.id = ?
    `, [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Supplier not found' });
    }
    
    const row = rows[0];
    const supplier = {
      id: row.id,
      magasin_id: row.magasin_id,
      name: row.name,
      country: row.country,
      email: row.email,
      phone: row.phone,
      address: row.address,
      contact_types: JSON.parse(row.contact_types || '[]'),
      created_by_user_id: row.created_by_user_id,
      created_by: row.created_by_firstname && row.created_by_lastname ? 
        `${row.created_by_firstname} ${row.created_by_lastname}` : 
        'Unknown user',
      created_by_email: row.created_by_email,
      created_by_poste: row.created_by_poste,
      magasin_name: row.magasin_name,
      magasin_responsable: row.magasin_responsable_firstname && row.magasin_responsable_lastname ?
        `${row.magasin_responsable_firstname} ${row.magasin_responsable_lastname}` :
        'No responsable assigned',
      magasin_responsable_email: row.magasin_responsable_email,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
    
    res.json(supplier);
  } catch (error) {
    console.error('Error fetching supplier:', error);
    res.status(500).json({ error: 'Failed to fetch supplier' });
  }
});

// Create new supplier (only by magasin responsable)
router.post('/', async (req, res) => {
  try {
    const { magasin_id, name, country, email, phone, address, contact_types, created_by_user_id } = req.body;
    
    if (!magasin_id || !name || !created_by_user_id) {
      return res.status(400).json({ error: 'magasin_id, name, and created_by_user_id are required' });
    }
    
    // Validate created_by_user_id exists
    const [userRows] = await db.pool.execute('SELECT id FROM users WHERE id = ?', [created_by_user_id]);
    if (userRows.length === 0) {
      return res.status(400).json({ error: 'Invalid created_by_user_id' });
    }
    
    // Check if magasin exists and verify the creator is the responsable
    const [magasinRows] = await db.pool.execute('SELECT responsable_id FROM magasins WHERE id = ?', [magasin_id]);
    if (magasinRows.length === 0) {
      return res.status(404).json({ error: 'Magasin not found' });
    }
    
    if (magasinRows[0].responsable_id != created_by_user_id) {
      console.log(magasinRows[0].responsable_id,created_by_user_id)
      return res.status(403).json({ error: 'Only magasin responsable can create suppliers' });
    }
    
    const [result] = await db.pool.execute(
      'INSERT INTO fournisseurs (magasin_id, name, country, email, phone, address, contact_types, created_by_user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [magasin_id, name, country, email, phone, address, JSON.stringify(contact_types || []), created_by_user_id]
    );
    
    res.status(201).json({
      id: result.insertId,
      message: 'Supplier created successfully'
    });
  } catch (error) {
    console.error('Error creating supplier:', error);
    res.status(500).json({ error: 'Failed to create supplier' });
  }
});

// Update supplier
router.put('/:id', async (req, res) => {
  try {
    const { name, country, email, phone, address, contact_types, created_by_user_id } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    
    // Validate created_by_user_id if provided
    if (created_by_user_id) {
      const [userRows] = await db.pool.execute('SELECT id FROM users WHERE id = ?', [created_by_user_id]);
      if (userRows.length === 0) {
        return res.status(400).json({ error: 'Invalid created_by_user_id' });
      }
    }
    
    const [result] = await db.pool.execute(
      'UPDATE fournisseurs SET name = ?, country = ?, email = ?, phone = ?, address = ?, contact_types = ?, created_by_user_id = ? WHERE id = ?',
      [name, country, email, phone, address, JSON.stringify(contact_types || []), created_by_user_id || null, req.params.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Supplier not found' });
    }
    
    res.json({ message: 'Supplier updated successfully' });
  } catch (error) {
    console.error('Error updating supplier:', error);
    res.status(500).json({ error: 'Failed to update supplier' });
  }
});

// Delete supplier
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await db.pool.execute('DELETE FROM fournisseurs WHERE id = ?', [req.params.id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Supplier not found' });
    }
    
    res.json({ message: 'Supplier deleted successfully' });
  } catch (error) {
    console.error('Error deleting supplier:', error);
    res.status(500).json({ error: 'Failed to delete supplier' });
  }
});

module.exports = router;

