const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get all categories for a magasin
router.get('/magasin/:magasinId', async (req, res) => {
  let connection;
  try {
    connection = await db.pool.getConnection();
    const [rows] = await connection.execute(`
      SELECT c.*, 
             m.name as magasin_name,
             CONCAT(u.firstname, ' ', u.lastname) as magasin_responsable
      FROM categories c
      JOIN magasins m ON c.magasin_id = m.id
      LEFT JOIN users u ON m.responsable_id = u.id
      WHERE c.magasin_id = ?
      ORDER BY c.created_at DESC
    `, [req.params.magasinId]);
    
    const categories = rows.map(row => ({
      ...row,
      required_fields: JSON.parse(row.required_fields || '[]')
    }));
    
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  } finally {
    if (connection) connection.release();
  }
});

// Get category by ID
router.get('/:id', async (req, res) => {
  let connection;
  try {
    connection = await db.pool.getConnection();
    const [rows] = await connection.execute(`
      SELECT c.*, 
             m.name as magasin_name,
             CONCAT(u.firstname, ' ', u.lastname) as magasin_responsable
      FROM categories c
      JOIN magasins m ON c.magasin_id = m.id
      LEFT JOIN users u ON m.responsable_id = u.id
      WHERE c.id = ?
    `, [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    const category = {
      ...rows[0],
      required_fields: JSON.parse(rows[0].required_fields || '[]')
    };
    
    res.json(category);
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ error: 'Failed to fetch category' });
  } finally {
    if (connection) connection.release();
  }
});

// Create new category
router.post('/', async (req, res) => {
  let connection;
  try {
    connection = await db.pool.getConnection();
    const { name, magasin_id, required_fields, created_by } = req.body;
    console.log(required_fields)
    const missingFields = [];
    if (!name) missingFields.push('name');
    if (!magasin_id) missingFields.push('magasin_id');
    if (!required_fields) missingFields.push('required_fields');
    if (!created_by) missingFields.push('created_by');
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        error: `Missing required field(s): ${missingFields.join(', ')}`,
        missing: missingFields
      });
    }
    
    // Check if magasin exists
    const [magasinRows] = await connection.execute('SELECT id FROM magasins WHERE id = ?', [magasin_id]);
    if (magasinRows.length === 0) {
      return res.status(404).json({ error: 'Magasin not found' });
    }
    
    const [result] = await connection.execute(
      'INSERT INTO categories (name, magasin_id, required_fields, created_by) VALUES (?, ?, ?, ?)',
      [name, magasin_id, JSON.stringify(required_fields), created_by]
    );
    
    res.status(201).json({
      id: result.insertId,
      message: 'Category created successfully and pending approval'
    });
  } catch (error) {
    console.error('Error creating category:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ error: 'Category name already exists for this magasin' });
    } else {
      res.status(500).json({ error: 'Failed to create category' });
    }
  } finally {
    if (connection) connection.release();
  }
});

// Approve/reject category (only by magasin responsable)
router.patch('/:id/approval', async (req, res) => {
  let connection;
  try {
    connection = await db.pool.getConnection();
    const { is_approved, approved_by } = req.body;
    
    if (typeof is_approved !== 'boolean' || !approved_by) {
      return res.status(400).json({ error: 'is_approved and approved_by are required' });
    }
    
    // Check if the category exists and get magasin info
    const [categoryRows] = await connection.execute(`
      SELECT c.*, m.responsable_id
      FROM categories c
      JOIN magasins m ON c.magasin_id = m.id
      WHERE c.id = ?
    `, [req.params.id]);
    
    if (categoryRows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    // Verify that the approver is the magasin responsable
    // We need to check if the approved_by user ID matches the magasin's responsable_id
    const [userRows] = await connection.execute(
      'SELECT id FROM users WHERE id = ? AND id = ?',
      [approved_by, categoryRows[0].responsable_id]
    );
    
    if (userRows.length === 0) {
      return res.status(403).json({ error: 'Only magasin responsable can approve categories' });
    }
    
    const approved_at = is_approved ? new Date() : null;
    
    const [result] = await connection.execute(
      'UPDATE categories SET is_approved = ?, approved_by = ?, approved_at = ? WHERE id = ?',
      [is_approved, approved_by, approved_at, req.params.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    res.json({ 
      message: `Category ${is_approved ? 'approved' : 'rejected'} successfully` 
    });
  } catch (error) {
    console.error('Error updating category approval:', error);
    res.status(500).json({ error: 'Failed to update category approval' });
  } finally {
    if (connection) connection.release();
  }
});

// Update category
router.put('/:id', async (req, res) => {
  let connection;
  try {
    connection = await db.pool.getConnection();
    const { name, required_fields } = req.body;
    
    if (!name || !required_fields) {
      return res.status(400).json({ error: 'Name and required_fields are required' });
    }
    
    // Reset approval status when category is updated
    const [result] = await connection.execute(
      'UPDATE categories SET name = ?, required_fields = ?, is_approved = FALSE, approved_by = NULL, approved_at = NULL WHERE id = ?',
      [name, JSON.stringify(required_fields), req.params.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    res.json({ message: 'Category updated successfully and pending approval' });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: 'Failed to update category' });
  } finally {
    if (connection) connection.release();
  }
});

// Delete category
router.delete('/:id', async (req, res) => {
  let connection;
  try {
    connection = await db.pool.getConnection();
    const [result] = await connection.execute('DELETE FROM categories WHERE id = ?', [req.params.id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  } finally {
    if (connection) connection.release();
  }
});

// Get approved categories for a magasin (for product creation)
router.get('/magasin/:magasinId/approved', async (req, res) => {
  let connection;
  try {
    connection = await db.pool.getConnection();
    const [rows] = await connection.execute(`
      SELECT c.*, m.name as magasin_name
      FROM categories c
      JOIN magasins m ON c.magasin_id = m.id
      WHERE c.magasin_id = ? AND c.is_approved = TRUE
      ORDER BY c.name
    `, [req.params.magasinId]);
    
    const categories = rows.map(row => ({
      ...row,
      required_fields: JSON.parse(row.required_fields || '[]')
    }));
    
    res.json(categories);
  } catch (error) {
    console.error('Error fetching approved categories:', error);
    res.status(500).json({ error: 'Failed to fetch approved categories' });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;