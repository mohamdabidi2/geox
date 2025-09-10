const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get all clients
router.get('/', async (req, res) => {
  let connection;
  try {
    connection = await db.pool.getConnection();
    const [rows] = await connection.execute(`
      SELECT * FROM clients
      ORDER BY created_at DESC
    `);
    
    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch clients',
      details: error.message
    });
  } finally {
    if (connection) connection.release();
  }
});

// Get client by ID
router.get('/:id', async (req, res) => {
  let connection;
  try {
    connection = await db.pool.getConnection();
    const [rows] = await connection.execute(`
      SELECT * FROM clients WHERE id = ?
    `, [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Client not found' 
      });
    }
    
    res.json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('Error fetching client:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch client',
      details: error.message
    });
  } finally {
    if (connection) connection.release();
  }
});

// Create new client
router.post('/', async (req, res) => {
  let connection;
  try {
    connection = await db.pool.getConnection();
    const { name, email, phone, address } = req.body;
    
    if (!name) {
      return res.status(400).json({ 
        success: false,
        error: 'Name is required' 
      });
    }
    
    // Check if email already exists (if provided)
    if (email) {
      const [existingRows] = await connection.execute('SELECT id FROM clients WHERE email = ?', [email]);
      if (existingRows.length > 0) {
        return res.status(409).json({ 
          success: false,
          error: 'Client with this email already exists' 
        });
      }
    }
    
    const [result] = await connection.execute(
      'INSERT INTO clients (name, email, phone, address) VALUES (?, ?, ?, ?)',
      [name, email || null, phone || null, address || null]
    );
    
    res.status(201).json({
      success: true,
      data: {
        id: result.insertId,
        name,
        email,
        phone,
        address
      },
      message: 'Client created successfully'
    });
  } catch (error) {
    console.error('Error creating client:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ 
        success: false,
        error: 'Client with this information already exists' 
      });
    } else {
      res.status(500).json({ 
        success: false,
        error: 'Failed to create client',
        details: error.message
      });
    }
  } finally {
    if (connection) connection.release();
  }
});

// Update client
router.put('/:id', async (req, res) => {
  let connection;
  try {
    connection = await db.pool.getConnection();
    const { name, email, phone, address } = req.body;
    
    if (!name) {
      return res.status(400).json({ 
        success: false,
        error: 'Name is required' 
      });
    }
    
    // Check if email already exists for another client (if provided)
    if (email) {
      const [existingRows] = await connection.execute('SELECT id FROM clients WHERE email = ? AND id != ?', [email, req.params.id]);
      if (existingRows.length > 0) {
        return res.status(409).json({ 
          success: false,
          error: 'Another client with this email already exists' 
        });
      }
    }
    
    const [result] = await connection.execute(
      'UPDATE clients SET name = ?, email = ?, phone = ?, address = ? WHERE id = ?',
      [name, email || null, phone || null, address || null, req.params.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Client not found' 
      });
    }
    
    res.json({ 
      success: true,
      message: 'Client updated successfully' 
    });
  } catch (error) {
    console.error('Error updating client:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ 
        success: false,
        error: 'Client with this information already exists' 
      });
    } else {
      res.status(500).json({ 
        success: false,
        error: 'Failed to update client',
        details: error.message
      });
    }
  } finally {
    if (connection) connection.release();
  }
});

// Delete client
router.delete('/:id', async (req, res) => {
  let connection;
  try {
    connection = await db.pool.getConnection();
    
    // Check if client has associated rights
    const [rightsRows] = await connection.execute('SELECT COUNT(*) as count FROM DroitByClient WHERE clientid = ?', [req.params.id]);
    if (rightsRows[0].count > 0) {
      return res.status(409).json({ 
        success: false,
        error: 'Cannot delete client with associated rights. Please remove all rights first.' 
      });
    }
    
    const [result] = await connection.execute('DELETE FROM clients WHERE id = ?', [req.params.id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Client not found' 
      });
    }
    
    res.json({ 
      success: true,
      message: 'Client deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting client:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete client',
      details: error.message
    });
  } finally {
    if (connection) connection.release();
  }
});

// Search clients by name or email
router.get('/search/:query', async (req, res) => {
  let connection;
  try {
    connection = await db.pool.getConnection();
    const searchQuery = `%${req.params.query}%`;
    
    const [rows] = await connection.execute(`
      SELECT * FROM clients 
      WHERE name LIKE ? OR email LIKE ?
      ORDER BY name
    `, [searchQuery, searchQuery]);
    
    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Error searching clients:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to search clients',
      details: error.message
    });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;

