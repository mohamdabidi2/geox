const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get all magasin rights with optional filters
router.get('/', async (req, res) => {
  let connection;
  try {
    connection = await db.pool.getConnection();
    const { userid, magasinid, active } = req.query;
    
    let query = `
      SELECT 
        dbm.*,
        u.firstname as user_firstname, u.lastname as user_lastname, u.email as user_email,
        m.name as magasin_name, m.address as magasin_address,
        r.firstname as responsable_firstname, r.lastname as responsable_lastname, r.email as responsable_email
      FROM DroitByMagasin dbm
      JOIN users u ON dbm.userid = u.id
      JOIN magasins m ON dbm.magasinid = m.id
      JOIN users r ON dbm.ResponsableId = r.id
    `;
    
    const conditions = [];
    const params = [];
    
    if (userid) {
      conditions.push('dbm.userid = ?');
      params.push(userid);
    }
    
    if (magasinid) {
      conditions.push('dbm.magasinid = ?');
      params.push(magasinid);
    }
    
    if (active === 'true') {
      conditions.push('NOW() BETWEEN dbm.DroitStartIn AND dbm.DroitExpiredAt');
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY dbm.created_at DESC';
    
    const [rows] = await connection.execute(query, params);
    
    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Error fetching magasin rights:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch magasin rights',
      details: error.message
    });
  } finally {
    if (connection) connection.release();
  }
});

// Get magasin right by ID
router.get('/:id', async (req, res) => {
  let connection;
  try {
    connection = await db.pool.getConnection();
    const [rows] = await connection.execute(`
      SELECT 
        dbm.*,
        u.firstname as user_firstname, u.lastname as user_lastname, u.email as user_email,
        m.name as magasin_name, m.address as magasin_address,
        r.firstname as responsable_firstname, r.lastname as responsable_lastname, r.email as responsable_email
      FROM DroitByMagasin dbm
      JOIN users u ON dbm.userid = u.id
      JOIN magasins m ON dbm.magasinid = m.id
      JOIN users r ON dbm.ResponsableId = r.id
      WHERE dbm.id = ?
    `, [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Magasin right not found' 
      });
    }
    
    res.json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('Error fetching magasin right:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch magasin right',
      details: error.message
    });
  } finally {
    if (connection) connection.release();
  }
});

// Get all magasin rights for a specific user
router.get('/user/:userid', async (req, res) => {
  let connection;
  try {
    connection = await db.pool.getConnection();
    const [rows] = await connection.execute(`
      SELECT 
        dbm.*,
        u.firstname as user_firstname, u.lastname as user_lastname, u.email as user_email,
        m.name as magasin_name, m.address as magasin_address,
        r.firstname as responsable_firstname, r.lastname as responsable_lastname, r.email as responsable_email
      FROM DroitByMagasin dbm
      JOIN users u ON dbm.userid = u.id
      JOIN magasins m ON dbm.magasinid = m.id
      JOIN users r ON dbm.ResponsableId = r.id
      WHERE dbm.userid = ?
      ORDER BY dbm.created_at DESC
    `, [req.params.userid]);
    
    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Error fetching user magasin rights:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch user magasin rights',
      details: error.message
    });
  } finally {
    if (connection) connection.release();
  }
});

// Create new magasin right
router.post('/', async (req, res) => {
  let connection;
  try {
    connection = await db.pool.getConnection();
    const { userid, magasinid, DroitExpiredAt, DroitStartIn, ResponsableId } = req.body;
    
    // Validate required fields
    const missingFields = [];
    if (!userid) missingFields.push('userid');
    if (!magasinid) missingFields.push('magasinid');
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
    
    // Validate that magasin exists
    const [magasinRows] = await connection.execute('SELECT id FROM magasins WHERE id = ?', [magasinid]);
    if (magasinRows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Magasin not found' 
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
      'INSERT INTO DroitByMagasin (userid, magasinid, DroitExpiredAt, DroitStartIn, ResponsableId) VALUES (?, ?, ?, ?, ?)',
      [userid, magasinid, DroitExpiredAt, DroitStartIn, ResponsableId]
    );
    
    res.status(201).json({
      success: true,
      data: {
        id: result.insertId,
        userid,
        magasinid,
        DroitExpiredAt,
        DroitStartIn,
        ResponsableId
      },
      message: 'Magasin right created successfully'
    });
  } catch (error) {
    console.error('Error creating magasin right:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ 
        success: false,
        error: 'User already has rights for this magasin' 
      });
    } else {
      res.status(500).json({ 
        success: false,
        error: 'Failed to create magasin right',
        details: error.message
      });
    }
  } finally {
    if (connection) connection.release();
  }
});

// Update magasin right
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
      'UPDATE DroitByMagasin SET DroitExpiredAt = ?, DroitStartIn = ?, ResponsableId = ? WHERE id = ?',
      [DroitExpiredAt, DroitStartIn, ResponsableId, req.params.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Magasin right not found' 
      });
    }
    
    res.json({ 
      success: true,
      message: 'Magasin right updated successfully' 
    });
  } catch (error) {
    console.error('Error updating magasin right:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update magasin right',
      details: error.message
    });
  } finally {
    if (connection) connection.release();
  }
});

// Delete magasin right
router.delete('/:id', async (req, res) => {
  let connection;
  try {
    connection = await db.pool.getConnection();
    const [result] = await connection.execute('DELETE FROM DroitByMagasin WHERE id = ?', [req.params.id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Magasin right not found' 
      });
    }
    
    res.json({ 
      success: true,
      message: 'Magasin right deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting magasin right:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete magasin right',
      details: error.message
    });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;

