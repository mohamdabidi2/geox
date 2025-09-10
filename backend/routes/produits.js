const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get all products for a magasin
router.get('/magasin/:magasinId', async (req, res) => {
  try {
    const [rows] = await db.pool.execute(`
      SELECT p.*, c.name as category_name, m.name as magasin_name, 
             mr.firstname as magasin_responsable_firstname, 
             mr.lastname as magasin_responsable_lastname,
             mr.email as magasin_responsable_email
      FROM produits p
      JOIN categories c ON p.category_id = c.id
      JOIN magasins m ON p.magasin_id = m.id
      LEFT JOIN users mr ON m.responsable_id = mr.id
      WHERE p.magasin_id = ?
      ORDER BY p.created_at DESC
    `, [req.params.magasinId]);
    
    const products = rows.map(row => ({
      id: row.id,
      name: row.name,
      category_id: row.category_id,
      magasin_id: row.magasin_id,
      product_data: JSON.parse(row.product_data || '{}'),
      created_by: row.created_by,
      is_approved: row.is_approved,
      approved_by: row.approved_by,
      approved_at: row.approved_at,
      created_at: row.created_at,
      updated_at: row.updated_at,
      category_name: row.category_name,
      magasin_name: row.magasin_name,
      magasin_responsable: row.magasin_responsable_firstname && row.magasin_responsable_lastname ?
        `${row.magasin_responsable_firstname} ${row.magasin_responsable_lastname}` :
        'No responsable assigned',
      magasin_responsable_email: row.magasin_responsable_email
    }));
    
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get products by category
router.get('/category/:categoryId', async (req, res) => {
  try {
    const [rows] = await db.pool.execute(`
      SELECT p.*, c.name as category_name, m.name as magasin_name
      FROM produits p
      JOIN categories c ON p.category_id = c.id
      JOIN magasins m ON p.magasin_id = m.id
      WHERE p.category_id = ?
      ORDER BY p.created_at DESC
    `, [req.params.categoryId]);
    
    const products = rows.map(row => ({
      id: row.id,
      name: row.name,
      category_id: row.category_id,
      magasin_id: row.magasin_id,
      product_data: JSON.parse(row.product_data || '{}'),
      created_by: row.created_by,
      is_approved: row.is_approved,
      approved_by: row.approved_by,
      approved_at: row.approved_at,
      created_at: row.created_at,
      updated_at: row.updated_at,
      category_name: row.category_name,
      magasin_name: row.magasin_name
    }));
    
    res.json(products);
  } catch (error) {
    console.error('Error fetching products by category:', error);
    res.status(500).json({ error: 'Failed to fetch products by category' });
  }
});

// Get product by ID
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.pool.execute(`
      SELECT p.*, c.name as category_name, c.required_fields, m.name as magasin_name, 
             mr.firstname as magasin_responsable_firstname, 
             mr.lastname as magasin_responsable_lastname,
             mr.email as magasin_responsable_email
      FROM produits p
      JOIN categories c ON p.category_id = c.id
      JOIN magasins m ON p.magasin_id = m.id
      LEFT JOIN users mr ON m.responsable_id = mr.id
      WHERE p.id = ?
    `, [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    const row = rows[0];
    const product = {
      id: row.id,
      name: row.name,
      category_id: row.category_id,
      magasin_id: row.magasin_id,
      product_data: JSON.parse(row.product_data || '{}'),
      created_by: row.created_by,
      is_approved: row.is_approved,
      approved_by: row.approved_by,
      approved_at: row.approved_at,
      created_at: row.created_at,
      updated_at: row.updated_at,
      category_name: row.category_name,
      magasin_name: row.magasin_name,
      magasin_responsable: row.magasin_responsable_firstname && row.magasin_responsable_lastname ?
        `${row.magasin_responsable_firstname} ${row.magasin_responsable_lastname}` :
        'No responsable assigned',
      magasin_responsable_email: row.magasin_responsable_email,
      required_fields: JSON.parse(row.required_fields || '[]')
    };
    
    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Create new product
router.post('/', async (req, res) => {
  try {
    const { name, category_id, magasin_id, product_data, created_by } = req.body;
    
    if (!name || !category_id || !magasin_id || !product_data || !created_by) {
      return res.status(400).json({ error: 'name, category_id, magasin_id, product_data, and created_by are required' });
    }
    
    // Check if category exists and is approved
    const [categoryRows] = await db.pool.execute(`
      SELECT id, magasin_id, is_approved FROM categories 
      WHERE id = ? AND is_approved = TRUE
    `, [category_id]);
    
    if (categoryRows.length === 0) {
      return res.status(404).json({ error: 'Approved category not found' });
    }
    
    if (categoryRows[0].magasin_id !== parseInt(magasin_id)) {
      return res.status(400).json({ error: 'Category does not belong to the specified magasin' });
    }
    
    const [result] = await db.pool.execute(
      'INSERT INTO produits (name, category_id, magasin_id, product_data, created_by) VALUES (?, ?, ?, ?, ?)',
      [name, category_id, magasin_id, JSON.stringify(product_data), created_by]
    );
    
    res.status(201).json({
      id: result.insertId,
      message: 'Product created successfully and pending approval'
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// Approve/reject product (only by magasin responsable)
router.patch('/:id/approval', async (req, res) => {
  try {
    const { is_approved, approved_by_user_id } = req.body;
    
    if (typeof is_approved !== 'boolean' || !approved_by_user_id) {
      return res.status(400).json({ error: 'is_approved and approved_by_user_id are required' });
    }
    
    // Check if the product exists and get magasin info
    const [productRows] = await db.pool.execute(`
      SELECT p.*, m.responsable_id as magasin_responsable_id
      FROM produits p
      JOIN magasins m ON p.magasin_id = m.id
      WHERE p.id = ?
    `, [req.params.id]);
    
    if (productRows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Verify that the approver is the magasin responsable
    if (productRows[0].magasin_responsable_id !== approved_by_user_id) {
      return res.status(403).json({ error: 'Only magasin responsable can approve products' });
    }
    
    // Get user name for approved_by field
    const [userRows] = await db.pool.execute(
      'SELECT firstname, lastname FROM users WHERE id = ?',
      [approved_by_user_id]
    );
    
    if (userRows.length === 0) {
      return res.status(400).json({ error: 'Invalid approved_by_user_id' });
    }
    
    const approved_by = `${userRows[0].firstname} ${userRows[0].lastname}`;
    const approved_at = is_approved ? new Date() : null;
    
    const [result] = await db.pool.execute(
      'UPDATE produits SET is_approved = ?, approved_by = ?, approved_at = ? WHERE id = ?',
      [is_approved, approved_by, approved_at, req.params.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json({ 
      message: `Product ${is_approved ? 'approved' : 'rejected'} successfully` 
    });
  } catch (error) {
    console.error('Error updating product approval:', error);
    res.status(500).json({ error: 'Failed to update product approval' });
  }
});

// Get approved products for a magasin (for purchase requests)
router.get('/magasin/:magasinId/approved', async (req, res) => {
  try {
    const [rows] = await db.pool.execute(`
      SELECT p.*, c.name as category_name, m.name as magasin_name
      FROM produits p
      JOIN categories c ON p.category_id = c.id
      JOIN magasins m ON p.magasin_id = m.id
      WHERE p.magasin_id = ? AND p.is_approved = TRUE
      ORDER BY p.created_at DESC
    `, [req.params.magasinId]);
    
    const products = rows.map(row => ({
      id: row.id,
      name: row.name,
      category_id: row.category_id,
      magasin_id: row.magasin_id,
      product_data: JSON.parse(row.product_data || '{}'),
      created_by: row.created_by,
      is_approved: row.is_approved,
      approved_by: row.approved_by,
      approved_at: row.approved_at,
      created_at: row.created_at,
      updated_at: row.updated_at,
      category_name: row.category_name,
      magasin_name: row.magasin_name
    }));
    
    res.json(products);
  } catch (error) {
    console.error('Error fetching approved products:', error);
    res.status(500).json({ error: 'Failed to fetch approved products' });
  }
});

// Update product
router.put('/:id', async (req, res) => {
  try {
    const { name, product_data } = req.body;
    
    if (!name || !product_data) {
      return res.status(400).json({ error: 'name and product_data are required' });
    }
    
    // Reset approval status when product is updated
    const [result] = await db.pool.execute(
      'UPDATE produits SET name = ?, product_data = ?, is_approved = FALSE, approved_by = NULL, approved_at = NULL WHERE id = ?',
      [name, JSON.stringify(product_data), req.params.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json({ message: 'Product updated successfully and pending approval' });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Delete product
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await db.pool.execute('DELETE FROM produits WHERE id = ?', [req.params.id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

module.exports = router;

