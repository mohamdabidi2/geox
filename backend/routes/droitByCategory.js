const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get all category rights with optional filters
router.get('/', async (req, res) => {
  let connection;
  try {
    connection = await db.pool.getConnection();
    const { userid, categoryid, active } = req.query;
    
    let query = `
      SELECT 
        dbc.*,
        u.firstname as user_firstname, u.lastname as user_lastname, u.email as user_email,
        c.name as category_name,
        r.firstname as responsable_firstname, r.lastname as responsable_lastname, r.email as responsable_email
      FROM DroitByCategory dbc
      JOIN users u ON dbc.userid = u.id
      JOIN categories c ON dbc.categoryid = c.id
      JOIN users r ON dbc.ResponsableId = r.id
    `;
    
    const conditions = [];
    const params = [];
    
    if (userid) {
      conditions.push('dbc.userid = ?');
      params.push(userid);
    }
    
    if (categoryid) {
      conditions.push('dbc.categoryid = ?');
      params.push(categoryid);
    }
    
    if (active === 'true') {
      conditions.push('NOW() BETWEEN dbc.DroitStartIn AND dbc.DroitExpiredAt');
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY dbc.created_at DESC';
    
    const [rows] = await connection.execute(query, params);
    
    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Error fetching category rights:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch category rights',
      details: error.message
    });
  } finally {
    if (connection) connection.release();
  }
});

// Get category right by ID
router.get('/:id', async (req, res) => {
  let connection;
  try {
    connection = await db.pool.getConnection();
    const [rows] = await connection.execute(`
      SELECT 
        dbc.*,
        u.firstname as user_firstname, u.lastname as user_lastname, u.email as user_email,
        c.name as category_name,
        r.firstname as responsable_firstname, r.lastname as responsable_lastname, r.email as responsable_email
      FROM DroitByCategory dbc
      JOIN users u ON dbc.userid = u.id
      JOIN categories c ON dbc.categoryid = c.id
      JOIN users r ON dbc.ResponsableId = r.id
      WHERE dbc.id = ?
    `, [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Category right not found' 
      });
    }
    
    res.json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('Error fetching category right:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch category right',
      details: error.message
    });
  } finally {
    if (connection) connection.release();
  }
});

// Get all category rights for a specific user
router.get('/user/:userid', async (req, res) => {
  let connection;
  try {
    connection = await db.pool.getConnection();
    const [rows] = await connection.execute(`
      SELECT 
        dbc.*,
        u.firstname as user_firstname, u.lastname as user_lastname, u.email as user_email,
        c.name as category_name,
        r.firstname as responsable_firstname, r.lastname as responsable_lastname, r.email as responsable_email
      FROM DroitByCategory dbc
      JOIN users u ON dbc.userid = u.id
      JOIN categories c ON dbc.categoryid = c.id
      JOIN users r ON dbc.ResponsableId = r.id
      WHERE dbc.userid = ?
      ORDER BY dbc.created_at DESC
    `, [req.params.userid]);
    
    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Error fetching user category rights:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch user category rights',
      details: error.message
    });
  } finally {
    if (connection) connection.release();
  }
});

// Create new category right
router.post('/', async (req, res) => {
  let connection;
  try {
    connection = await db.pool.getConnection();
    const { userid, categoryid, DroitExpiredAt, DroitStartIn, ResponsableId } = req.body;
    
    // Validate required fields
    const missingFields = [];
    if (!userid) missingFields.push('userid');
    if (!categoryid) missingFields.push('categoryid');
    if (!DroitExpiredAt) missingFields.push('DroitExpiredAt');
    if (!DroitStartIn) missingFields.push('DroitStartIn');
    if (!ResponsableId) missingFields.push('ResponsableId');
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        success: false,
        error: `Missing required field(s): ${missingFields.join(', ')}`,
        missing: missingFields
      });
    }
    
    // Validate that user exists
    const [userRows] = await connection.execute('SELECT id FROM users WHERE id = ?', [userid]);
    if (userRows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
    }
    
    // Validate that category exists
    const [categoryRows] = await connection.execute('SELECT id FROM categories WHERE id = ?', [categoryid]);
    if (categoryRows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Category not found' 
      });
    }
    
    // Validate that responsible user exists
    const [responsableRows] = await connection.execute('SELECT id FROM users WHERE id = ?', [ResponsableId]);
    if (responsableRows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Responsible user not found' 
      });
    }
    
    // Validate dates
    const startDate = new Date(DroitStartIn);
    const endDate = new Date(DroitExpiredAt);
    if (endDate <= startDate) {
      return res.status(400).json({ 
        success: false,
        error: 'Expiry date must be after start date' 
      });
    }
    
    const [result] = await connection.execute(
      'INSERT INTO DroitByCategory (userid, categoryid, DroitExpiredAt, DroitStartIn, ResponsableId) VALUES (?, ?, ?, ?, ?)',
      [userid, categoryid, DroitExpiredAt, DroitStartIn, ResponsableId]
    );
    
    res.status(201).json({
      success: true,
      data: {
        id: result.insertId,
        userid,
        categoryid,
        DroitExpiredAt,
        DroitStartIn,
        ResponsableId
      },
      message: 'Category right created successfully'
    });
  } catch (error) {
    console.error('Error creating category right:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ 
        success: false,
        error: 'User already has rights for this category' 
      });
    } else {
      res.status(500).json({ 
        success: false,
        error: 'Failed to create category right',
        details: error.message
      });
    }
  } finally {
    if (connection) connection.release();
  }
});

// Update category right
router.put('/:id', async (req, res) => {
  let connection;
  try {
    connection = await db.pool.getConnection();
    const { DroitExpiredAt, DroitStartIn, ResponsableId } = req.body;
    
    if (!DroitExpiredAt || !DroitStartIn || !ResponsableId) {
      return res.status(400).json({ 
        success: false,
        error: 'DroitExpiredAt, DroitStartIn, and ResponsableId are required' 
      });
    }
    
    // Validate that responsible user exists
    const [responsableRows] = await connection.execute('SELECT id FROM users WHERE id = ?', [ResponsableId]);
    if (responsableRows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Responsible user not found' 
      });
    }
    
    // Validate dates
    const startDate = new Date(DroitStartIn);
    const endDate = new Date(DroitExpiredAt);
    if (endDate <= startDate) {
      return res.status(400).json({ 
        success: false,
        error: 'Expiry date must be after start date' 
      });
    }
    
    const [result] = await connection.execute(
      'UPDATE DroitByCategory SET DroitExpiredAt = ?, DroitStartIn = ?, ResponsableId = ? WHERE id = ?',
      [DroitExpiredAt, DroitStartIn, ResponsableId, req.params.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Category right not found' 
      });
    }
    
    res.json({ 
      success: true,
      message: 'Category right updated successfully' 
    });
  } catch (error) {
    console.error('Error updating category right:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update category right',
      details: error.message
    });
  } finally {
    if (connection) connection.release();
  }
});

// Delete category right
router.delete('/:id', async (req, res) => {
  let connection;
  try {
    connection = await db.pool.getConnection();
    const [result] = await connection.execute('DELETE FROM DroitByCategory WHERE id = ?', [req.params.id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Category right not found' 
      });
    }
    
    res.json({ 
      success: true,
      message: 'Category right deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting category right:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete category right',
      details: error.message
    });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;

