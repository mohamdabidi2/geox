const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const db = require('../config/database');
// User management routes
router.get('/', userController.getAllUsers);
router.get('/find/:id', userController.getUserById);
router.post('/', userController.createUser);
router.put('/update/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

// Chef-specific routes
router.get('/chefs', userController.getAllChefs);
router.get('/chefs/search', userController.searchChefs);

// Validation routes
router.put('/:id/validate-email', userController.validateUserEmail);
router.put('/:id/validate-rh', userController.validateUserRH);
router.put('/:id/validate-direction', userController.validateUserDirection);

// Bulk validation routes
router.put('/validate/bulk-email', userController.bulkValidateEmails);
router.put('/validate/bulk-rh', userController.bulkValidateRH);
router.put('/validate/bulk-direction', userController.bulkValidateDirection);

// Get user rights (magasins, categories, clients)
router.get('/:userId/rights', async (req, res) => {
  let connection;
  try {
    const userId = req.params.userId;
    
    if (!userId ) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    connection = await db.pool.getConnection();

    // Check if user exists
    const [userRows] = await connection.execute(
      'SELECT id, firstname, lastname, email FROM users WHERE id = ?',
      [userId]
    );

    if (userRows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userRows[0];

    // Get magasin rights
    const [magasinRights] = await connection.execute(`
      SELECT dm.magasinid, m.name as magasin_name
      FROM droitbymagasin dm
      JOIN magasins m ON dm.magasinid = m.id
      WHERE dm.userid = ? 
      ORDER BY m.name
    `, [userId]);

    // Get client rights
    const [clientRights] = await connection.execute(`
      SELECT dc.clientid, c.name as client_name
      FROM droitbyclient dc
      JOIN clients c ON dc.clientid = c.id
      WHERE dc.userid = ?  = 1
      ORDER BY c.name
    `, [userId]);

    // Get categories for accessible magasins
    // If user has no magasin rights, they get no category access
    let categoryRights = [];
    if (magasinRights.length > 0) {
      const magasinIds = magasinRights.map(mr => mr.magasinid);
      const placeholders = magasinIds.map(() => '?').join(',');
      
      const [categoryRows] = await connection.execute(`
        SELECT DISTINCT c.id as category_id, c.name as category_name, c.magasin_id
        FROM categories c
        WHERE c.magasin_id IN (${placeholders}) AND c.is_approved = 1
        ORDER BY c.name
      `, magasinIds);
      
      categoryRights = categoryRows;
    }

    // Prepare response
    const rights = {
      user: {
        id: user.id,
        name: `${user.firstname} ${user.lastname}`,
        email: user.email
      },
      magasins: magasinRights.map(mr => mr.magasinid),
      magasin_details: magasinRights.map(mr => ({
        id: mr.magasinid,
        name: mr.magasin_name
      })),
      clients: clientRights.map(cr => cr.clientid),
      client_details: clientRights.map(cr => ({
        id: cr.clientid,
        name: cr.client_name
      })),
      categories: categoryRights.map(cr => cr.category_id),
      category_details: categoryRights.map(cr => ({
        id: cr.category_id,
        name: cr.category_name,
        magasinid: cr.magasinid
      })),
      permissions: {
        has_magasin_access: magasinRights.length > 0,
        has_client_access: clientRights.length > 0,
        has_category_access: categoryRights.length > 0,
        accessible_magasin_count: magasinRights.length,
        accessible_client_count: clientRights.length,
        accessible_category_count: categoryRights.length
      },
      last_updated: new Date().toISOString()
    };

    res.json(rights);

  } catch (error) {
    console.error('Error fetching user rights:', error);
    res.status(500).json({ 
      error: 'Failed to fetch user rights',
      details: error.message 
    });
  } finally {
    if (connection) connection.release();
  }
});

// Get detailed rights with expiration info
router.get('/:userId/rights/detailed', async (req, res) => {
  let connection;
  try {
    const userId = parseInt(req.params.userId);
    
    if (!userId || isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    connection = await db.pool.getConnection();

    // Get detailed magasin rights with dates
    const [magasinRights] = await connection.execute(`
      SELECT 
        dm.*,
        m.name as magasin_name,
        m.address as magasin_address,
        u_granted.firstname as granted_by_firstname,
        u_granted.lastname as granted_by_lastname
      FROM droitbymagasin dm
      JOIN magasins m ON dm.magasinid = m.id
      LEFT JOIN users u_granted ON dm.granted_by = u_granted.id
      WHERE dm.userid = ?
      ORDER BY dm.isactive DESC, dm.created_at DESC
    `, [userId]);

    // Get detailed client rights with dates
    const [clientRights] = await connection.execute(`
      SELECT 
        dc.*,
        c.name as client_name,
        c.email as client_email,
        u_granted.firstname as granted_by_firstname,
        u_granted.lastname as granted_by_lastname
      FROM droitbyclient dc
      JOIN clients c ON dc.clientid = c.id
      LEFT JOIN users u_granted ON dc.granted_by = u_granted.id
      WHERE dc.userid = ?
      ORDER BY dc.isactive DESC, dc.created_at DESC
    `, [userId]);

    const detailedRights = {
      userid: userId,
      magasin_rights: magasinRights.map(mr => ({
        id: mr.id,
        magasinid: mr.magasinid,
        magasin_name: mr.magasin_name,
        magasin_address: mr.magasin_address,
        isactive: Boolean(mr.isactive),
        granted_by: mr.granted_by,
        granted_by_name: mr.granted_by_firstname && mr.granted_by_lastname 
          ? `${mr.granted_by_firstname} ${mr.granted_by_lastname}` 
          : null,
        created_at: mr.created_at,
        updated_at: mr.updated_at,
        expires_at: mr.expires_at,
        is_expired: mr.expires_at ? new Date(mr.expires_at) < new Date() : false
      })),
      client_rights: clientRights.map(cr => ({
        id: cr.id,
        clientid: cr.clientid,
        client_name: cr.client_name,
        client_email: cr.client_email,
        isactive: Boolean(cr.isactive),
        granted_by: cr.granted_by,
        granted_by_name: cr.granted_by_firstname && cr.granted_by_lastname 
          ? `${cr.granted_by_firstname} ${cr.granted_by_lastname}` 
          : null,
        created_at: cr.created_at,
        updated_at: cr.updated_at,
        expires_at: cr.expires_at,
        is_expired: cr.expires_at ? new Date(cr.expires_at) < new Date() : false
      }))
    };

    res.json(detailedRights);

  } catch (error) {
    console.error('Error fetching detailed user rights:', error);
    res.status(500).json({ 
      error: 'Failed to fetch detailed user rights',
      details: error.message 
    });
  } finally {
    if (connection) connection.release();
  }
});

// Check specific access rights
router.get('/:userId/rights/check', async (req, res) => {
  let connection;
  try {
    const userId = parseInt(req.params.userId);
    const { magasinid, clientid, category_id } = req.query;
    
    if (!userId || isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    connection = await db.pool.getConnection();

    const checks = {};

    // Check magasin access
    if (magasinid) {
      const [magasinCheck] = await connection.execute(`
        SELECT COUNT(*) as has_access
        FROM droitbymagasin 
        WHERE userid = ? AND magasinid = ? AND isactive = 1
        AND (expires_at IS NULL OR expires_at > NOW())
      `, [userId, parseInt(magasinid)]);
      
      checks.magasin_access = magasinCheck[0].has_access > 0;
    }

    // Check client access
    if (clientid) {
      const [clientCheck] = await connection.execute(`
        SELECT COUNT(*) as has_access
        FROM droitbyclient 
        WHERE userid = ? AND clientid = ? AND isactive = 1
        AND (expires_at IS NULL OR expires_at > NOW())
      `, [userId, parseInt(clientid)]);
      
      checks.client_access = clientCheck[0].has_access > 0;
    }

    // Check category access (through magasin access)
    if (category_id) {
      const [categoryCheck] = await connection.execute(`
        SELECT COUNT(*) as has_access
        FROM categories c
        JOIN droitbymagasin dm ON c.magasin_id = dm.magasinid
        WHERE dm.userid = ? AND c.id = ?  AND c.is_approved = 1
        AND (dm.expires_at IS NULL OR dm.expires_at > NOW())
      `, [userId, parseInt(category_id)]);
      
      checks.category_access = categoryCheck[0].has_access > 0;
    }

    res.json({
      userid: userId,
      checks,
      checked_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error checking user rights:', error);
    res.status(500).json({ 
      error: 'Failed to check user rights',
      details: error.message 
    });
  } finally {
    if (connection) connection.release();
  }
});

// Grant magasin rights to user
router.post('/:userId/rights/magasin', async (req, res) => {
  let connection;
  try {
    const userId = parseInt(req.params.userId);
    const { magasinid, granted_by, expires_at } = req.body;
    
    if (!userId || !magasinid || !granted_by) {
      return res.status(400).json({ 
        error: 'userid, magasinid, and granted_by are required' 
      });
    }

    connection = await db.pool.getConnection();

    // Check if user exists
    const [userCheck] = await connection.execute(
      'SELECT id FROM users WHERE id = ?', [userId]
    );
    if (userCheck.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if magasin exists
    const [magasinCheck] = await connection.execute(
      'SELECT id FROM magasins WHERE id = ?', [magasinid]
    );
    if (magasinCheck.length === 0) {
      return res.status(404).json({ error: 'Magasin not found' });
    }

    // Check if right already exists
    const [existingRight] = await connection.execute(
      'SELECT id, isactive FROM droitbymagasin WHERE userid = ? AND magasinid = ?',
      [userId, magasinid]
    );

    if (existingRight.length > 0) {
      // Update existing right
      await connection.execute(`
        UPDATE droitbymagasin 
        SET isactive = 1, granted_by = ?, expires_at = ?, updated_at = NOW()
        WHERE userid = ? AND magasinid = ?
      `, [granted_by, expires_at || null, userId, magasinid]);
      
      res.json({ 
        message: 'Magasin rights updated successfully',
        right_id: existingRight[0].id
      });
    } else {
      // Create new right
      const [result] = await connection.execute(`
        INSERT INTO droitbymagasin (userid, magasinid, granted_by, expires_at, isactive)
        VALUES (?, ?, ?, ?, 1)
      `, [userId, magasinid, granted_by, expires_at || null]);
      
      res.status(201).json({ 
        message: 'Magasin rights granted successfully',
        right_id: result.insertId
      });
    }

  } catch (error) {
    console.error('Error granting magasin rights:', error);
    res.status(500).json({ 
      error: 'Failed to grant magasin rights',
      details: error.message 
    });
  } finally {
    if (connection) connection.release();
  }
});

// Grant client rights to user
router.post('/:userId/rights/client', async (req, res) => {
  let connection;
  try {
    const userId = parseInt(req.params.userId);
    const { clientid, granted_by, expires_at } = req.body;
    
    if (!userId || !clientid || !granted_by) {
      return res.status(400).json({ 
        error: 'userid, clientid, and granted_by are required' 
      });
    }

    connection = await db.pool.getConnection();

    // Check if user exists
    const [userCheck] = await connection.execute(
      'SELECT id FROM users WHERE id = ?', [userId]
    );
    if (userCheck.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if client exists
    const [clientCheck] = await connection.execute(
      'SELECT id FROM clients WHERE id = ?', [clientid]
    );
    if (clientCheck.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Check if right already exists
    const [existingRight] = await connection.execute(
      'SELECT id, isactive FROM droitbyclient WHERE userid = ? AND clientid = ?',
      [userId, clientid]
    );

    if (existingRight.length > 0) {
      // Update existing right
      await connection.execute(`
        UPDATE droitbyclient 
        SET isactive = 1, granted_by = ?, expires_at = ?, updated_at = NOW()
        WHERE userid = ? AND clientid = ?
      `, [granted_by, expires_at || null, userId, clientid]);
      
      res.json({ 
        message: 'Client rights updated successfully',
        right_id: existingRight[0].id
      });
    } else {
      // Create new right
      const [result] = await connection.execute(`
        INSERT INTO droitbyclient (userid, clientid, granted_by, expires_at, isactive)
        VALUES (?, ?, ?, ?, 1)
      `, [userId, clientid, granted_by, expires_at || null]);
      
      res.status(201).json({ 
        message: 'Client rights granted successfully',
        right_id: result.insertId
      });
    }

  } catch (error) {
    console.error('Error granting client rights:', error);
    res.status(500).json({ 
      error: 'Failed to grant client rights',
      details: error.message 
    });
  } finally {
    if (connection) connection.release();
  }
});

// Revoke magasin rights
router.delete('/:userId/rights/magasin/:magasinId', async (req, res) => {
  let connection;
  try {
    const userId = parseInt(req.params.userId);
    const magasinId = parseInt(req.params.magasinId);
    
    connection = await db.pool.getConnection();

    const [result] = await connection.execute(`
      UPDATE droitbymagasin 
      SET isactive = 0, updated_at = NOW()
      WHERE userid = ? AND magasinid = ?
    `, [userId, magasinId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Magasin rights not found' });
    }

    res.json({ message: 'Magasin rights revoked successfully' });

  } catch (error) {
    console.error('Error revoking magasin rights:', error);
    res.status(500).json({ 
      error: 'Failed to revoke magasin rights',
      details: error.message 
    });
  } finally {
    if (connection) connection.release();
  }
});

// Revoke client rights
router.delete('/:userId/rights/client/:clientId', async (req, res) => {
  let connection;
  try {
    const userId = parseInt(req.params.userId);
    const clientId = parseInt(req.params.clientId);
    
    connection = await db.pool.getConnection();

    const [result] = await connection.execute(`
      UPDATE droitbyclient 
      SET isactive = 0, updated_at = NOW()
      WHERE userid = ? AND clientid = ?
    `, [userId, clientId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Client rights not found' });
    }

    res.json({ message: 'Client rights revoked successfully' });

  } catch (error) {
    console.error('Error revoking client rights:', error);
    res.status(500).json({ 
      error: 'Failed to revoke client rights',
      details: error.message 
    });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;

