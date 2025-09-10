const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Import individual route modules
const droitByCategoryRoutes = require('./droitByCategory');
const droitByMagasinRoutes = require('./droitByMagasin');
const droitByClientRoutes = require('./droitByClient');

// Mount individual route modules
router.use('/category', droitByCategoryRoutes);
router.use('/magasin', droitByMagasinRoutes);
router.use('/client', droitByClientRoutes);

// Get all rights for a specific user (combined endpoint)
router.get('/user/:userid/all', async (req, res) => {
  let connection;
  try {
    connection = await db.pool.getConnection();
    const userId = req.params.userid;
    
    // Fetch category rights
    const [categoryRights] = await connection.execute(`
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
    `, [userId]);
    
    // Fetch magasin rights
    const [magasinRights] = await connection.execute(`
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
    `, [userId]);
    
    // Fetch client rights
    const [clientRights] = await connection.execute(`
      SELECT 
        dbc.*,
        u.firstname as user_firstname, u.lastname as user_lastname, u.email as user_email,
        c.name as client_name, c.email as client_email, c.phone as client_phone,
        r.firstname as responsable_firstname, r.lastname as responsable_lastname, r.email as responsable_email
      FROM DroitByClient dbc
      JOIN users u ON dbc.userid = u.id
      JOIN clients c ON dbc.clientid = c.id
      JOIN users r ON dbc.ResponsableId = r.id
      WHERE dbc.userid = ?
      ORDER BY dbc.created_at DESC
    `, [userId]);
    
    res.json({
      success: true,
      data: {
        categories: categoryRights,
        magasins: magasinRights,
        clients: clientRights
      }
    });
  } catch (error) {
    console.error('Error fetching all user rights:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch all user rights',
      details: error.message
    });
  } finally {
    if (connection) connection.release();
  }
});

// Get all active rights for a specific user
router.get('/user/:userid/active', async (req, res) => {
  let connection;
  try {
    connection = await db.pool.getConnection();
    const userId = req.params.userid;
    const now = new Date().toISOString();
    
    // Fetch active category rights
    const [categoryRights] = await connection.execute(`
      SELECT 
        dbc.*,
        u.firstname as user_firstname, u.lastname as user_lastname, u.email as user_email,
        c.name as category_name,
        r.firstname as responsable_firstname, r.lastname as responsable_lastname, r.email as responsable_email
      FROM DroitByCategory dbc
      JOIN users u ON dbc.userid = u.id
      JOIN categories c ON dbc.categoryid = c.id
      JOIN users r ON dbc.ResponsableId = r.id
      WHERE dbc.userid = ? AND ? BETWEEN dbc.DroitStartIn AND dbc.DroitExpiredAt
      ORDER BY dbc.created_at DESC
    `, [userId, now]);
    
    // Fetch active magasin rights
    const [magasinRights] = await connection.execute(`
      SELECT 
        dbm.*,
        u.firstname as user_firstname, u.lastname as user_lastname, u.email as user_email,
        m.name as magasin_name, m.address as magasin_address,
        r.firstname as responsable_firstname, r.lastname as responsable_lastname, r.email as responsable_email
      FROM DroitByMagasin dbm
      JOIN users u ON dbm.userid = u.id
      JOIN magasins m ON dbm.magasinid = m.id
      JOIN users r ON dbm.ResponsableId = r.id
      WHERE dbm.userid = ? AND ? BETWEEN dbm.DroitStartIn AND dbm.DroitExpiredAt
      ORDER BY dbm.created_at DESC
    `, [userId, now]);
    
    // Fetch active client rights
    const [clientRights] = await connection.execute(`
      SELECT 
        dbc.*,
        u.firstname as user_firstname, u.lastname as user_lastname, u.email as user_email,
        c.name as client_name, c.email as client_email, c.phone as client_phone,
        r.firstname as responsable_firstname, r.lastname as responsable_lastname, r.email as responsable_email
      FROM DroitByClient dbc
      JOIN users u ON dbc.userid = u.id
      JOIN clients c ON dbc.clientid = c.id
      JOIN users r ON dbc.ResponsableId = r.id
      WHERE dbc.userid = ? AND ? BETWEEN dbc.DroitStartIn AND dbc.DroitExpiredAt
      ORDER BY dbc.created_at DESC
    `, [userId, now]);
    
    res.json({
      success: true,
      data: {
        categories: categoryRights,
        magasins: magasinRights,
        clients: clientRights
      }
    });
  } catch (error) {
    console.error('Error fetching active user rights:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch active user rights',
      details: error.message
    });
  } finally {
    if (connection) connection.release();
  }
});

// Check if user has specific rights
router.get('/check/:userid', async (req, res) => {
  let connection;
  try {
    connection = await db.pool.getConnection();
    const userId = req.params.userid;
    const { categoryid, magasinid, clientid } = req.query;
    const now = new Date().toISOString();
    
    const results = {
      hasRights: false,
      details: {
        category: false,
        magasin: false,
        client: false
      }
    };
    
    // Check category rights if categoryid is provided
    if (categoryid) {
      const [categoryRows] = await connection.execute(`
        SELECT COUNT(*) as count FROM DroitByCategory 
        WHERE userid = ? AND categoryid = ? AND ? BETWEEN DroitStartIn AND DroitExpiredAt
      `, [userId, categoryid, now]);
      
      results.details.category = categoryRows[0].count > 0;
    }
    
    // Check magasin rights if magasinid is provided
    if (magasinid) {
      const [magasinRows] = await connection.execute(`
        SELECT COUNT(*) as count FROM DroitByMagasin 
        WHERE userid = ? AND magasinid = ? AND ? BETWEEN DroitStartIn AND DroitExpiredAt
      `, [userId, magasinid, now]);
      
      results.details.magasin = magasinRows[0].count > 0;
    }
    
    // Check client rights if clientid is provided
    if (clientid) {
      const [clientRows] = await connection.execute(`
        SELECT COUNT(*) as count FROM DroitByClient 
        WHERE userid = ? AND clientid = ? AND ? BETWEEN DroitStartIn AND DroitExpiredAt
      `, [userId, clientid, now]);
      
      results.details.client = clientRows[0].count > 0;
    }
    
    // Determine overall rights status
    if (categoryid && magasinid && clientid) {
      results.hasRights = results.details.category && results.details.magasin && results.details.client;
    } else if (categoryid && magasinid) {
      results.hasRights = results.details.category && results.details.magasin;
    } else if (categoryid && clientid) {
      results.hasRights = results.details.category && results.details.client;
    } else if (magasinid && clientid) {
      results.hasRights = results.details.magasin && results.details.client;
    } else if (categoryid) {
      results.hasRights = results.details.category;
    } else if (magasinid) {
      results.hasRights = results.details.magasin;
    } else if (clientid) {
      results.hasRights = results.details.client;
    }
    
    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Error checking user rights:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to check user rights',
      details: error.message
    });
  } finally {
    if (connection) connection.release();
  }
});

// Get rights statistics for a user
router.get('/user/:userid/stats', async (req, res) => {
  let connection;
  try {
    connection = await db.pool.getConnection();
    const userId = req.params.userid;
    const now = new Date().toISOString();
    
    // Get total and active counts for each type
    const [categoryStats] = await connection.execute(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN ? BETWEEN DroitStartIn AND DroitExpiredAt THEN 1 ELSE 0 END) as active
      FROM DroitByCategory WHERE userid = ?
    `, [now, userId]);
    
    const [magasinStats] = await connection.execute(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN ? BETWEEN DroitStartIn AND DroitExpiredAt THEN 1 ELSE 0 END) as active
      FROM DroitByMagasin WHERE userid = ?
    `, [now, userId]);
    
    const [clientStats] = await connection.execute(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN ? BETWEEN DroitStartIn AND DroitExpiredAt THEN 1 ELSE 0 END) as active
      FROM DroitByClient WHERE userid = ?
    `, [now, userId]);
    
    const stats = {
      categories: {
        total: parseInt(categoryStats[0].total),
        active: parseInt(categoryStats[0].active)
      },
      magasins: {
        total: parseInt(magasinStats[0].total),
        active: parseInt(magasinStats[0].active)
      },
      clients: {
        total: parseInt(clientStats[0].total),
        active: parseInt(clientStats[0].active)
      }
    };
    
    stats.overall = {
      total: stats.categories.total + stats.magasins.total + stats.clients.total,
      active: stats.categories.active + stats.magasins.active + stats.clients.active
    };
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching user rights statistics:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch user rights statistics',
      details: error.message
    });
  } finally {
    if (connection) connection.release();
  }
});

// Get rights that are expiring soon (within specified days)
router.get('/user/:userid/expiring', async (req, res) => {
  let connection;
  try {
    connection = await db.pool.getConnection();
    const userId = req.params.userid;
    const days = parseInt(req.query.days) || 30; // Default to 30 days
    const now = new Date();
    const futureDate = new Date(now.getTime() + (days * 24 * 60 * 60 * 1000));
    
    // Get expiring category rights
    const [categoryRights] = await connection.execute(`
      SELECT 
        dbc.*,
        'category' as type,
        c.name as entity_name
      FROM DroitByCategory dbc
      JOIN categories c ON dbc.categoryid = c.id
      WHERE dbc.userid = ? 
        AND dbc.DroitExpiredAt BETWEEN ? AND ?
        AND dbc.DroitExpiredAt > NOW()
      ORDER BY dbc.DroitExpiredAt ASC
    `, [userId, now.toISOString(), futureDate.toISOString()]);
    
    // Get expiring magasin rights
    const [magasinRights] = await connection.execute(`
      SELECT 
        dbm.*,
        'magasin' as type,
        m.name as entity_name
      FROM DroitByMagasin dbm
      JOIN magasins m ON dbm.magasinid = m.id
      WHERE dbm.userid = ? 
        AND dbm.DroitExpiredAt BETWEEN ? AND ?
        AND dbm.DroitExpiredAt > NOW()
      ORDER BY dbm.DroitExpiredAt ASC
    `, [userId, now.toISOString(), futureDate.toISOString()]);
    
    // Get expiring client rights
    const [clientRights] = await connection.execute(`
      SELECT 
        dbc.*,
        'client' as type,
        c.name as entity_name
      FROM DroitByClient dbc
      JOIN clients c ON dbc.clientid = c.id
      WHERE dbc.userid = ? 
        AND dbc.DroitExpiredAt BETWEEN ? AND ?
        AND dbc.DroitExpiredAt > NOW()
      ORDER BY dbc.DroitExpiredAt ASC
    `, [userId, now.toISOString(), futureDate.toISOString()]);
    
    // Combine and sort all expiring rights
    const allExpiringRights = [
      ...categoryRights,
      ...magasinRights,
      ...clientRights
    ].sort((a, b) => new Date(a.DroitExpiredAt) - new Date(b.DroitExpiredAt));
    
    res.json({
      success: true,
      data: {
        expiringRights: allExpiringRights,
        count: allExpiringRights.length,
        daysChecked: days
      }
    });
  } catch (error) {
    console.error('Error fetching expiring rights:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch expiring rights',
      details: error.message
    });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;

