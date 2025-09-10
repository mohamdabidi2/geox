const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get all stock movements (for StockManagement component)
router.get('/stock-movements', async (req, res) => {
  try {
    const [rows] = await db.pool.execute(`
      SELECT sm.*, 
             p.name as product_name, 
             p.product_data,
             c.name as category_name,
             m.name as magasin_name,
             bc.order_number,
             u.firstname, u.lastname
      FROM mouvements_stock sm
      JOIN produits p ON sm.produit_id = p.id
      JOIN categories c ON p.category_id = c.id
      JOIN magasins m ON sm.magasin_id = m.id
      LEFT JOIN bons_commande bc ON sm.bon_commande_id = bc.id
      LEFT JOIN users u ON sm.created_by = u.id
      ORDER BY sm.created_at DESC
    `);
    
    const movements = rows.map(row => ({
      ...row,
      product_data: JSON.parse(row.product_data || '{}'),
      created_by_name: row.firstname && row.lastname ? `${row.firstname} ${row.lastname}` : row.created_by
    }));
    
    res.json(movements);
  } catch (error) {
    console.error('Error fetching stock movements:', error);
    res.status(500).json({ error: 'Failed to fetch stock movements' });
  }
});

// Get current stock levels (for StockManagement component)
router.get('/current-stock', async (req, res) => {
  try {
    const [rows] = await db.pool.execute(`
      SELECT sa.*, 
             p.name as product_name,
             p.product_data,
             c.name as category_name, 
             m.name as magasin_name
      FROM stock_actuel sa
      JOIN produits p ON sa.produit_id = p.id
      JOIN categories c ON p.category_id = c.id
      JOIN magasins m ON sa.magasin_id = m.id
      ORDER BY sa.last_updated DESC
    `);
    
    const stockLevels = rows.map(row => ({
      ...row,
      product_id: row.produit_id,
      quantity: row.quantity_available,
      product_data: JSON.parse(row.product_data || '{}')
    }));
    
    res.json(stockLevels);
  } catch (error) {
    console.error('Error fetching current stock:', error);
    res.status(500).json({ error: 'Failed to fetch current stock' });
  }
});

// Get stock movements for a specific magasin
router.get('/movements/magasin/:magasinId', async (req, res) => {
  try {
    const [rows] = await db.pool.execute(`
      SELECT sm.*, 
             p.name as product_name,
             p.product_data, 
             bc.order_number, 
             m.name as magasin_name
      FROM mouvements_stock sm
      JOIN produits p ON sm.produit_id = p.id
      JOIN magasins m ON sm.magasin_id = m.id
      LEFT JOIN bons_commande bc ON sm.bon_commande_id = bc.id
      WHERE sm.magasin_id = ?
      ORDER BY sm.created_at DESC
    `, [req.params.magasinId]);
    
    const movements = rows.map(row => ({
      ...row,
      product_data: JSON.parse(row.product_data || '{}')
    }));
    
    res.json(movements);
  } catch (error) {
    console.error('Error fetching stock movements:', error);
    res.status(500).json({ error: 'Failed to fetch stock movements' });
  }
});

// Get current stock levels for a specific magasin
router.get('/levels/magasin/:magasinId', async (req, res) => {
  try {
    const [rows] = await db.pool.execute(`
      SELECT sa.*, 
             p.name as product_name,
             p.product_data, 
             c.name as category_name, 
             m.name as magasin_name
      FROM stock_actuel sa
      JOIN produits p ON sa.produit_id = p.id
      JOIN categories c ON p.category_id = c.id
      JOIN magasins m ON sa.magasin_id = m.id
      WHERE sa.magasin_id = ?
      ORDER BY sa.last_updated DESC
    `, [req.params.magasinId]);
    
    const stockLevels = rows.map(row => ({
      ...row,
      product_data: JSON.parse(row.product_data || '{}')
    }));
    
    res.json(stockLevels);
  } catch (error) {
    console.error('Error fetching stock levels:', error);
    res.status(500).json({ error: 'Failed to fetch stock levels' });
  }
});

// Create stock movement (for StockManagement component)
router.post('/stock-movements', async (req, res) => {
  let connection;
  try {
    const { product_id, magasin_id, movement_type, quantity, reference_type, reference_id, notes } = req.body;
    
    if (!product_id || !magasin_id || !movement_type || !quantity) {
      return res.status(400).json({ error: 'product_id, magasin_id, movement_type, and quantity are required' });
    }
    
    if (!['in', 'out'].includes(movement_type)) {
      return res.status(400).json({ error: 'movement_type must be "in" or "out"' });
    }
    
    // Get connection for transaction
    connection = await db.pool.getConnection();
    
    // Check if product exists
    const [productRows] = await connection.execute(`
      SELECT id FROM produits WHERE id = ? AND magasin_id = ?
    `, [product_id, magasin_id]);
    
    if (productRows.length === 0) {
      return res.status(404).json({ error: 'Product not found in this magasin' });
    }
    
    // Start transaction
    await connection.beginTransaction();
    
    try {
      // Insert stock movement
      const [movementResult] = await connection.execute(
        `INSERT INTO mouvements_stock 
         (produit_id, magasin_id, movement_type, quantity, reference_type, reference_id, notes, created_by) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [product_id, magasin_id, movement_type, quantity, reference_type || 'manual', reference_id, notes, 1] // Default created_by to 1 for now
      );
      
      // Update or create current stock level
      const quantityChange = movement_type === 'in' ? quantity : -quantity;
      
      await connection.execute(
        `INSERT INTO stock_actuel (produit_id, magasin_id, quantity_available) 
         VALUES (?, ?, ?) 
         ON DUPLICATE KEY UPDATE 
         quantity_available = quantity_available + ?, 
         last_updated = CURRENT_TIMESTAMP`,
        [product_id, magasin_id, quantityChange, quantityChange]
      );
      
      await connection.commit();
      
      res.status(201).json({
        id: movementResult.insertId,
        message: 'Stock movement created successfully'
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error creating stock movement:', error);
    res.status(500).json({ error: 'Failed to create stock movement' });
  } finally {
    if (connection) connection.release();
  }
});

// Create stock movement (original endpoint for other parts of the system)
router.post('/movements', async (req, res) => {
  let connection;
  try {
    const { produit_id, magasin_id, bon_commande_id, movement_type, quantity, unit_price, created_by, notes } = req.body;
    
    if (!produit_id || !magasin_id || !movement_type || !quantity || !created_by) {
      return res.status(400).json({ error: 'produit_id, magasin_id, movement_type, quantity, and created_by are required' });
    }
    
    if (!['in', 'out'].includes(movement_type)) {
      return res.status(400).json({ error: 'movement_type must be "in" or "out"' });
    }
    
    // Get connection for transaction
    connection = await db.pool.getConnection();
    
    // Check if product exists
    const [productRows] = await connection.execute(`
      SELECT id FROM produits WHERE id = ? AND magasin_id = ?
    `, [produit_id, magasin_id]);
    
    if (productRows.length === 0) {
      return res.status(404).json({ error: 'Product not found in this magasin' });
    }
    
    const total_value = unit_price ? unit_price * quantity : 0;
    
    // Start transaction
    await connection.beginTransaction();
    
    try {
      // Insert stock movement
      const [movementResult] = await connection.execute(
        `INSERT INTO mouvements_stock 
         (produit_id, magasin_id, bon_commande_id, movement_type, quantity, unit_price, total_value, created_by, notes) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [produit_id, magasin_id, bon_commande_id, movement_type, quantity, unit_price, total_value, created_by, notes]
      );
      
      // Update or create current stock level
      const quantityChange = movement_type === 'in' ? quantity : -quantity;
      
      await connection.execute(
        `INSERT INTO stock_actuel (produit_id, magasin_id, quantity_available) 
         VALUES (?, ?, ?) 
         ON DUPLICATE KEY UPDATE 
         quantity_available = quantity_available + ?, 
         last_updated = CURRENT_TIMESTAMP`,
        [produit_id, magasin_id, quantityChange, quantityChange]
      );
      
      await connection.commit();
      
      res.status(201).json({
        id: movementResult.insertId,
        message: 'Stock movement created successfully'
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error creating stock movement:', error);
    res.status(500).json({ error: 'Failed to create stock movement' });
  } finally {
    if (connection) connection.release();
  }
});

// Process purchase order reception
router.post('/reception/:bonCommandeId', async (req, res) => {
  try {
    const { received_products, created_by } = req.body;
    
    if (!Array.isArray(received_products) || received_products.length === 0 || !created_by) {
      return res.status(400).json({ error: 'received_products array and created_by are required' });
    }
    
    // Get purchase order details
    const [orderRows] = await db.pool.execute(`
      SELECT bc.*, m.name as magasin_name
      FROM bons_commande bc
      JOIN magasins m ON bc.magasin_id = m.id
      WHERE bc.id = ?
    `, [req.params.bonCommandeId]);
    
    if (orderRows.length === 0) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }
    
    const order = {
      ...orderRows[0],
      products: JSON.parse(orderRows[0].products || '[]')
    };
    
    // Start transaction
    await db.pool.execute('START TRANSACTION');
    
    try {
      const movements = [];
      
      for (const receivedProduct of received_products) {
        const { product_id, received_quantity, unit_price } = receivedProduct;
        
        if (!product_id || !received_quantity || received_quantity <= 0) {
          throw new Error('Invalid product data in reception');
        }
        
        const total_value = unit_price ? unit_price * received_quantity : 0;
        
        // Insert stock movement
        const [movementResult] = await db.pool.execute(
          `INSERT INTO mouvements_stock 
           (produit_id, magasin_id, bon_commande_id, movement_type, quantity, unit_price, total_value, created_by) 
           VALUES (?, ?, ?, 'in', ?, ?, ?, ?)`,
          [product_id, order.magasin_id, req.params.bonCommandeId, received_quantity, unit_price, total_value, created_by]
        );
        
        // Update current stock level
        await db.pool.execute(
          `INSERT INTO stock_actuel (produit_id, magasin_id, quantity_available) 
           VALUES (?, ?, ?) 
           ON DUPLICATE KEY UPDATE 
           quantity_available = quantity_available + ?, 
           last_updated = CURRENT_TIMESTAMP`,
          [product_id, order.magasin_id, received_quantity, received_quantity]
        );
        
        movements.push({
          id: movementResult.insertId,
          product_id,
          received_quantity,
          unit_price,
          total_value
        });
      }
      
      // Update purchase order status
      await db.pool.execute(
        'UPDATE bons_commande SET status = "received" WHERE id = ?',
        [req.params.bonCommandeId]
      );
      
      await db.pool.execute('COMMIT');
      
      res.status(201).json({
        message: 'Stock reception processed successfully',
        movements: movements
      });
    } catch (error) {
      await db.pool.execute('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error processing stock reception:', error);
    res.status(500).json({ error: 'Failed to process stock reception' });
  }
});

// Update minimum stock level
router.patch('/levels/:id/minimum', async (req, res) => {
  try {
    const { minimum_stock } = req.body;
    
    if (minimum_stock === undefined || minimum_stock < 0) {
      return res.status(400).json({ error: 'Valid minimum_stock is required' });
    }
    
    const [result] = await db.pool.execute(
      'UPDATE stock_actuel SET minimum_stock = ? WHERE id = ?',
      [minimum_stock, req.params.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Stock level not found' });
    }
    
    res.json({ message: 'Minimum stock level updated successfully' });
  } catch (error) {
    console.error('Error updating minimum stock level:', error);
    res.status(500).json({ error: 'Failed to update minimum stock level' });
  }
});

// Get low stock alerts for a magasin
router.get('/alerts/magasin/:magasinId', async (req, res) => {
  try {
    const [rows] = await db.pool.execute(`
      SELECT sa.*, 
             p.name as product_name,
             p.product_data, 
             c.name as category_name
      FROM stock_actuel sa
      JOIN produits p ON sa.produit_id = p.id
      JOIN categories c ON p.category_id = c.id
      WHERE sa.magasin_id = ? AND sa.quantity_available <= sa.minimum_stock
      ORDER BY sa.quantity_available ASC
    `, [req.params.magasinId]);
    
    const alerts = rows.map(row => ({
      ...row,
      product_data: JSON.parse(row.product_data || '{}')
    }));
    
    res.json(alerts);
  } catch (error) {
    console.error('Error fetching stock alerts:', error);
    res.status(500).json({ error: 'Failed to fetch stock alerts' });
  }
});

module.exports = router;