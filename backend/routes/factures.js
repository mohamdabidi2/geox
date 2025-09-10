const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Generate invoice number
function generateInvoiceNumber() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `INV-${year}${month}${day}-${random}`;
}

// Get all invoices for a magasin
router.get('/magasin/:magasinId', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT f.*, bc.order_number, fr.name as fournisseur_name, m.name as magasin_name
      FROM factures f
      JOIN bons_commande bc ON f.bon_commande_id = bc.id
      JOIN fournisseurs fr ON bc.fournisseur_id = fr.id
      JOIN magasins m ON f.magasin_id = m.id
      WHERE f.magasin_id = ?
      ORDER BY f.created_at DESC
    `, [req.params.magasinId]);
    
    const invoices = rows.map(row => ({
      ...row,
      invoice_data: JSON.parse(row.invoice_data || '{}')
    }));
    
    res.json(invoices);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

// Get invoice by ID
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT f.*, bc.order_number, bc.products as order_products, 
             fr.name as fournisseur_name, fr.email as fournisseur_email, fr.address as fournisseur_address,
             m.name as magasin_name, m.responsable as magasin_responsable, m.address as magasin_address
      FROM factures f
      JOIN bons_commande bc ON f.bon_commande_id = bc.id
      JOIN fournisseurs fr ON bc.fournisseur_id = fr.id
      JOIN magasins m ON f.magasin_id = m.id
      WHERE f.id = ?
    `, [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    
    const invoice = {
      ...rows[0],
      invoice_data: JSON.parse(rows[0].invoice_data || '{}'),
      order_products: JSON.parse(rows[0].order_products || '[]')
    };
    
    res.json(invoice);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({ error: 'Failed to fetch invoice' });
  }
});

// Create invoice from purchase order
router.post('/', async (req, res) => {
  try {
    const { bon_commande_id, magasin_id, tax_rate, created_by } = req.body;
    
    if (!bon_commande_id || !magasin_id || !created_by) {
      return res.status(400).json({ error: 'bon_commande_id, magasin_id, and created_by are required' });
    }
    
    // Get purchase order details
    const [orderRows] = await db.execute(`
      SELECT bc.*, f.name as fournisseur_name, f.email as fournisseur_email, 
             m.name as magasin_name, m.responsable as magasin_responsable
      FROM bons_commande bc
      JOIN fournisseurs f ON bc.fournisseur_id = f.id
      JOIN magasins m ON bc.magasin_id = m.id
      WHERE bc.id = ? AND bc.magasin_id = ? AND bc.status = 'received'
    `, [bon_commande_id, magasin_id]);
    
    if (orderRows.length === 0) {
      return res.status(404).json({ error: 'Received purchase order not found' });
    }
    
    const order = {
      ...orderRows[0],
      products: JSON.parse(orderRows[0].products || '[]')
    };
    
    // Check if invoice already exists
    const [existingInvoice] = await db.execute(
      'SELECT id FROM factures WHERE bon_commande_id = ?',
      [bon_commande_id]
    );
    
    if (existingInvoice.length > 0) {
      return res.status(409).json({ error: 'Invoice already exists for this purchase order' });
    }
    
    const invoice_number = generateInvoiceNumber();
    const total_amount = order.total_amount || 0;
    const tax_amount = tax_rate ? (total_amount * tax_rate / 100) : 0;
    const final_amount = total_amount + tax_amount;
    
    // Prepare invoice data
    const invoice_data = {
      order_number: order.order_number,
      products: order.products,
      fournisseur: {
        name: order.fournisseur_name,
        email: order.fournisseur_email
      },
      magasin: {
        name: order.magasin_name,
        responsable: order.magasin_responsable
      },
      tax_rate: tax_rate || 0,
      issue_date: new Date().toISOString().split('T')[0]
    };
    
    const [result] = await db.execute(
      `INSERT INTO factures 
       (bon_commande_id, magasin_id, invoice_number, total_amount, tax_amount, final_amount, invoice_data, created_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [bon_commande_id, magasin_id, invoice_number, total_amount, tax_amount, final_amount, JSON.stringify(invoice_data), created_by]
    );
    
    res.status(201).json({
      id: result.insertId,
      invoice_number: invoice_number,
      final_amount: final_amount,
      message: 'Invoice created successfully'
    });
  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({ error: 'Failed to create invoice' });
  }
});

// Update invoice status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['draft', 'sent', 'paid', 'overdue'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const [result] = await db.execute(
      'UPDATE factures SET status = ? WHERE id = ?',
      [status, req.params.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    
    res.json({ message: 'Invoice status updated successfully' });
  } catch (error) {
    console.error('Error updating invoice status:', error);
    res.status(500).json({ error: 'Failed to update invoice status' });
  }
});

// Update invoice
router.put('/:id', async (req, res) => {
  try {
    const { tax_rate, invoice_data } = req.body;
    
    // Get current invoice
    const [currentRows] = await db.execute('SELECT * FROM factures WHERE id = ?', [req.params.id]);
    if (currentRows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    
    const current = currentRows[0];
    const total_amount = current.total_amount;
    const tax_amount = tax_rate ? (total_amount * tax_rate / 100) : 0;
    const final_amount = total_amount + tax_amount;
    
    const [result] = await db.execute(
      'UPDATE factures SET tax_amount = ?, final_amount = ?, invoice_data = ? WHERE id = ?',
      [tax_amount, final_amount, JSON.stringify(invoice_data || {}), req.params.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    
    res.json({ message: 'Invoice updated successfully' });
  } catch (error) {
    console.error('Error updating invoice:', error);
    res.status(500).json({ error: 'Failed to update invoice' });
  }
});

// Delete invoice
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await db.execute('DELETE FROM factures WHERE id = ?', [req.params.id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    
    res.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    res.status(500).json({ error: 'Failed to delete invoice' });
  }
});

module.exports = router;