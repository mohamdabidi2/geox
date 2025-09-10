
const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get all purchase requests for a magasin
router.get('/magasin/:magasinId', async (req, res) => {
  try {
    const [rows] = await db.pool.execute(`
      SELECT da.*, m.name as magasin_name, m.responsable as magasin_responsable
      FROM demandes_achat da
      JOIN magasins m ON da.magasin_id = m.id
      WHERE da.magasin_id = ?
      ORDER BY da.created_at DESC
    `, [req.params.magasinId]);
    
    const requests = rows.map(row => ({
      ...row,
      products: JSON.parse(row.products || '[]')
    }));
    
    res.json(requests);
  } catch (error) {
    console.error('Error fetching purchase requests:', error);
    res.status(500).json({ error: 'Failed to fetch purchase requests' });
  }
});

// Get purchase request by ID
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.pool.execute(`
      SELECT da.*, m.name as magasin_name, m.responsable as magasin_responsable
      FROM demandes_achat da
      JOIN magasins m ON da.magasin_id = m.id
      WHERE da.id = ?
    `, [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Purchase request not found' });
    }
    
    const request = {
      ...rows[0],
      products: JSON.parse(rows[0].products || '[]')
    };
    
    res.json(request);
  } catch (error) {
    console.error('Error fetching purchase request:', error);
    res.status(500).json({ error: 'Failed to fetch purchase request' });
  }
});

// Create new purchase request
router.post('/', async (req, res) => {
  try {
    const { magasin_id, products, notes, created_by } = req.body;
    console.log(magasin_id, products, notes, created_by)
    if (!magasin_id || !products || !Array.isArray(products) || products.length === 0 || !created_by) {
      return res.status(400).json({ error: 'magasin_id, products array, and created_by are required' });
    }
    
    // Check if magasin exists
    const [magasinRows] = await db.pool.execute('SELECT id FROM magasins WHERE id = ?', [magasin_id]);
    if (magasinRows.length === 0) {
      return res.status(404).json({ error: 'Magasin not found' });
    }
    
    let total_amount = 0;
    let hasPrices = false;
    
    // Validate products exist, are approved, and extract prices
    for (const item of products) {
      if (!item.product_id || !item.quantity || item.quantity <= 0) {
        return res.status(400).json({ error: 'Each product must have valid product_id and quantity' });
      }
      
      const [productRows] = await db.pool.execute(`
        SELECT id, product_data FROM produits 
        WHERE id = ? AND magasin_id = ? AND is_approved = TRUE
      `, [item.product_id, magasin_id]);
      
      if (productRows.length === 0) {
        return res.status(400).json({ error: `Product ${item.product_id} not found or not approved` });
      }
      
      // Extract price from product_data JSON
      const productData = JSON.parse(productRows[0].product_data || '{}');
      const price = parseFloat(productData.Prix); // Use "Prix" field from product_data
      
      if (!isNaN(price) && price > 0) {
        total_amount += price * item.quantity;
        hasPrices = true;
        
        // Optionally add the unit_price to the product item for reference
        item.unit_price = price;
      }
    }
    
    // If no products have prices, set total_amount to null
    const finalTotalAmount = hasPrices ? total_amount : null;
    
    const [result] = await db.pool.execute(
      'INSERT INTO demandes_achat (magasin_id, products, total_amount, notes, created_by) VALUES (?, ?, ?, ?, ?)',
      [magasin_id, JSON.stringify(products), finalTotalAmount, notes, created_by]
    );
    
    res.status(201).json({
      id: result.insertId,
      message: 'Purchase request created successfully and pending approval'
    });
  } catch (error) {
    console.error('Error creating purchase request:', error);
    res.status(500).json({ error: 'Failed to create purchase request' });
  }
});

// Approve/reject purchase request (only by magasin responsable)
router.patch('/:id/approval', async (req, res) => {
  try {
    const { status, approved_by } = req.body;
    console.log(status, approved_by)
    if (!['approved', 'rejected'].includes(status) || !approved_by) {
      return res.status(400).json({ error: 'Valid status (approved/rejected) and approved_by are required' });
    }
    
    // Check if the purchase request exists and get magasin info
    const [requestRows] = await db.pool.execute(`
      SELECT da.*, m.responsable_id as magasin_responsable
      FROM demandes_achat da
      JOIN magasins m ON da.magasin_id = m.id
      WHERE da.id = ?
    `, [req.params.id]);
    
    if (requestRows.length === 0) {
      return res.status(404).json({ error: 'Purchase request not found' });
    }
    
    // Verify that the approver is the magasin responsable
    if (requestRows[0].magasin_responsable !== approved_by) {
      return res.status(403).json({ error: 'Only magasin responsable can approve purchase requests' });
    }
    
    const approved_at = new Date();
    
    const [result] = await db.pool.execute(
      'UPDATE demandes_achat SET status = ?, approved_by = ?, approved_at = ? WHERE id = ?',
      [status, approved_by, approved_at, req.params.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Purchase request not found' });
    }
    
    res.json({ 
      message: `Purchase request ${status} successfully` 
    });
  } catch (error) {
    console.error('Error updating purchase request approval:', error);
    res.status(500).json({ error: 'Failed to update purchase request approval' });
  }
});

// Get approved purchase requests for a magasin (for creating purchase orders)
router.get('/magasin/:magasinId/approved', async (req, res) => {
  try {
    const [rows] = await db.pool.execute(`
      SELECT da.id, da.products, da.notes, da.created_at, m.name as magasin_name
      FROM demandes_achat da
      JOIN magasins m ON da.magasin_id = m.id
      WHERE da.magasin_id = ? AND da.status = 'approved'
      ORDER BY da.created_at DESC
    `, [req.params.magasinId]);

    const requests = await Promise.all(rows.map(async (row) => {
      const products = JSON.parse(row.products || '[]');
      const enrichedProducts = await Promise.all(products.map(async (product) => {
        const [productRows] = await db.pool.execute('SELECT name FROM produits WHERE id = ?', [product.product_id]);
        if (productRows.length > 0) {
          const productData = productRows[0].name ;
        console.log(productRows[0].name )

          return {
            ...product,
            name: productData || 'Unknown Product',
          };
        }
        return product;
      }));

      return {
        ...row,
        products: enrichedProducts,
      };
    }));

    res.json(requests);
  } catch (error) {
    console.error('Error fetching approved purchase requests:', error);
    res.status(500).json({ error: 'Failed to fetch approved purchase requests' });
  }
});


// Update purchase request
router.put('/:id', async (req, res) => {
  try {
    const { products, notes } = req.body;
    
    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: 'Products array is required' });
    }
    
    let total_amount = 0;
    let hasPrices = false;
    
    // Calculate total amount using Prix from product_data
    for (const item of products) {
      if (!item.product_id) continue;
      
      // Get the product to extract price from product_data
      const [productRows] = await db.pool.execute(`
        SELECT product_data FROM produits WHERE id = ?
      `, [item.product_id]);
      
      if (productRows.length > 0) {
        const productData = JSON.parse(productRows[0].product_data || '{}');
        const price = parseFloat(productData.Prix);
        
        if (!isNaN(price) && price > 0) {
          total_amount += price * item.quantity;
          hasPrices = true;
          
          // Update the unit_price in the product item
          item.unit_price = price;
        }
      }
    }
    
    // If no products have prices, set total_amount to null
    const finalTotalAmount = hasPrices ? total_amount : null;
    
    // Reset approval status when request is updated
    const [result] = await db.pool.execute(
      'UPDATE demandes_achat SET products = ?, total_amount = ?, notes = ?, status = "pending", approved_by = NULL, approved_at = NULL WHERE id = ?',
      [JSON.stringify(products), finalTotalAmount, notes, req.params.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Purchase request not found' });
    }
    
    res.json({ message: 'Purchase request updated successfully and pending approval' });
  } catch (error) {
    console.error('Error updating purchase request:', error);
    res.status(500).json({ error: 'Failed to update purchase request' });
  }
});

// Delete purchase request
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await db.pool.execute('DELETE FROM demandes_achat WHERE id = ?', [req.params.id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Purchase request not found' });
    }
    
    res.json({ message: 'Purchase request deleted successfully' });
  } catch (error) {
    console.error('Error deleting purchase request:', error);
    res.status(500).json({ error: 'Failed to delete purchase request' });
  }
});

module.exports = router;


