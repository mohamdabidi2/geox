const express = require("express");
const router = express.Router();
const db = require("../config/database");
const nodemailer = require("nodemailer");

// Email transporter configuration - FIXED: changed createTransporter to createTransport
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Generate order number
function generateOrderNumber() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  return `BC-${year}${month}${day}-${random}`;
}

// Get all purchase orders for a magasin
router.get("/magasin/:magasinId", async (req, res) => {
  try {
    const [rows] = await db.pool.execute(
      `
      SELECT bc.*, f.name as fournisseur_name, f.email as fournisseur_email, 
             m.name as magasin_name, da.id as demande_id,
             u.firstname, u.lastname
      FROM bons_commande bc
      JOIN fournisseurs f ON bc.fournisseur_id = f.id
      JOIN magasins m ON bc.magasin_id = m.id
      LEFT JOIN demandes_achat da ON bc.demande_achat_id = da.id
      LEFT JOIN users u ON bc.created_by = u.id
      WHERE bc.magasin_id = ?
      ORDER BY bc.created_at DESC
    `,
      [req.params.magasinId]
    );

    const orders = rows.map((row) => ({
      ...row,
      products: JSON.parse(row.products || "[]"),
      created_by_name: row.firstname && row.lastname ? `${row.firstname} ${row.lastname}` : row.created_by,
    }));

    res.json(orders);
  } catch (error) {
    console.error("Error fetching purchase orders:", error);
    res.status(500).json({ error: "Failed to fetch purchase orders" });
  }
});

// Create new purchase order from approved purchase request
router.post("/", async (req, res) => {
  try {
    const { demande_achat_ids, fournisseur_id, magasin_id, notes, created_by } = req.body;

    if (
      !demande_achat_ids ||
      !Array.isArray(demande_achat_ids) ||
      demande_achat_ids.length === 0 ||
      !fournisseur_id ||
      !magasin_id ||
      !created_by
    ) {
      return res.status(400).json({
        error: "All fields are required, and demande_achat_ids must be a non-empty array",
      });
    }

    let consolidatedProducts = [];
    let total_amount = 0;

    for (const demande_achat_id of demande_achat_ids) {
      // Check if purchase request exists and is approved
      const [requestRows] = await db.pool.execute(
        `SELECT * FROM demandes_achat 
         WHERE id = ? AND magasin_id = ? AND status = 'approved'`,
        [demande_achat_id, magasin_id]
      );

      if (requestRows.length === 0) {
        return res.status(404).json({
          error: `Approved purchase request with ID ${demande_achat_id} not found`,
        });
      }

      const requestProducts = JSON.parse(requestRows[0].products || "[]");
      const requestTotalAmount = parseFloat(requestRows[0].total_amount || 0);

      consolidatedProducts = consolidatedProducts.concat(requestProducts);
      total_amount += requestTotalAmount;
    }

    // Check if supplier exists for this magasin
    const [supplierRows] = await db.pool.execute(
      `SELECT * FROM fournisseurs 
       WHERE id = ? AND magasin_id = ?`,
      [fournisseur_id, magasin_id]
    );

    if (supplierRows.length === 0) {
      return res.status(404).json({ error: "Supplier not found for this magasin" });
    }

    const fournisseur = supplierRows[0];

    // Get magasin info
    const [magasinRows] = await db.pool.execute(
      `SELECT * FROM magasins WHERE id = ?`,
      [magasin_id]
    );
    const magasin = magasinRows.length > 0 ? magasinRows[0] : {};

    const order_number = generateOrderNumber();

    const [result] = await db.pool.execute(
      `INSERT INTO bons_commande 
       (demande_achat_id, fournisseur_id, magasin_id, order_number, products, total_amount, notes, created_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        demande_achat_ids.join(","),
        fournisseur_id,
        magasin_id,
        order_number,
        JSON.stringify(consolidatedProducts),
        total_amount,
        notes,
        created_by,
      ]
    );

    // Send email to fournisseur with HTML design
    if (fournisseur.email) {
      // Compose product list for HTML email
      const productRows = consolidatedProducts
        .map(
          (product, idx) => `
            <tr>
              <td style="padding:8px;border:1px solid #ddd;text-align:center;">${idx + 1}</td>
              <td style="padding:8px;border:1px solid #ddd;">${product.name || "Produit"}</td>
              <td style="padding:8px;border:1px solid #ddd;text-align:center;">${product.quantity}</td>
              <td style="padding:8px;border:1px solid #ddd;text-align:right;">${product.unit_price ? Number(product.unit_price).toFixed(2) : "0.00"}</td>
              <td style="padding:8px;border:1px solid #ddd;text-align:right;">${(product.quantity * (product.unit_price || 0)).toFixed(2)}</td>
            </tr>
          `
        )
        .join("");

      const htmlContent = `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9f9f9;padding:24px;border-radius:8px;">
          <div style="background:#2563eb;color:#fff;padding:16px 24px;border-radius:8px 8px 0 0;">
            <h2 style="margin:0;font-size:1.5rem;">Bon de Commande</h2>
            <p style="margin:0;font-size:1rem;">N° ${order_number}</p>
          </div>
          <div style="background:#fff;padding:24px;border-radius:0 0 8px 8px;">
            <p>Bonjour <strong>${fournisseur.name}</strong>,</p>
            <p>Veuillez trouver ci-dessous les détails de notre bon de commande :</p>
            <table style="width:100%;margin-bottom:16px;">
              <tr>
                <td style="padding:4px 0;"><strong>Magasin :</strong></td>
                <td style="padding:4px 0;">${magasin.name || ""}</td>
              </tr>
              <tr>
                <td style="padding:4px 0;"><strong>Date de commande :</strong></td>
                <td style="padding:4px 0;">${new Date().toLocaleDateString()}</td>
              </tr>
            </table>
            <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
              <thead>
                <tr style="background:#f1f5f9;">
                  <th style="padding:8px;border:1px solid #ddd;">#</th>
                  <th style="padding:8px;border:1px solid #ddd;">Produit</th>
                  <th style="padding:8px;border:1px solid #ddd;">Quantité</th>
                  <th style="padding:8px;border:1px solid #ddd;">Prix Unitaire</th>
                  <th style="padding:8px;border:1px solid #ddd;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${productRows}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="4" style="padding:8px;border:1px solid #ddd;text-align:right;font-weight:bold;">Montant total</td>
                  <td style="padding:8px;border:1px solid #ddd;text-align:right;font-weight:bold;">${total_amount ? total_amount.toFixed(2) : "0.00"}</td>
                </tr>
              </tfoot>
            </table>
            ${
              notes
                ? `<div style="margin-bottom:16px;"><strong>Notes :</strong><br><span style="color:#374151;">${notes}</span></div>`
                : ""
            }
            <div style="margin-bottom:16px;">
              Merci de confirmer la réception de cette commande et de nous indiquer le délai de livraison.
            </div>
            <div style="color:#6b7280;font-size:0.95rem;">
              <div>Cordialement,</div>
              <div>${magasin.responsable || ""}</div>
              <div>${magasin.name || ""}</div>
              <div>${magasin.email || ""}</div>
            </div>
          </div>
        </div>
      `;

      try {
        await transporter.sendMail({
          from: process.env.SMTP_USER,
          to: fournisseur.email,
          subject: `Bon de commande #${order_number}`,
          html: htmlContent,
        });
      } catch (emailError) {
        // Log but do not fail the request if email fails
        console.error("Erreur lors de l\"envoi de l\"email au fournisseur :", emailError);
      }
    }

    res.status(201).json({
      id: result.insertId,
      order_number: order_number,
      message: "Purchase order created successfully and email sent to supplier (if email available)",
    });
  } catch (error) {
    console.error("Error creating purchase order:", error);
    res.status(500).json({ error: "Failed to create purchase order" });
  }
});

// Send purchase order email to supplier
router.post("/:id/send-email", async (req, res) => {
  try {
    // Get purchase order details
    const [orderRows] = await db.pool.execute(
      `
      SELECT bc.*, f.name as fournisseur_name, f.email as fournisseur_email, 
             m.name as magasin_name, m.responsable as magasin_responsable, m.email as magasin_email
      FROM bons_commande bc
      JOIN fournisseurs f ON bc.fournisseur_id = f.id
      JOIN magasins m ON bc.magasin_id = m.id
      WHERE bc.id = ?
    `,
      [req.params.id]
    );

    if (orderRows.length === 0) {
      return res.status(404).json({ error: "Purchase order not found" });
    }

    const order = {
      ...orderRows[0],
      products: JSON.parse(orderRows[0].products || "[]"),
    };

    if (!order.fournisseur_email) {
      return res.status(400).json({ error: "Supplier email not found" });
    }

    // Create email content
    const productList = order.products
      .map(
        (product) =>
          `- ${product.name || "Product"}: Quantity ${product.quantity} @ ${product.unit_price || 0} = ${(product.quantity * (product.unit_price || 0)).toFixed(2)}`
      )
      .join("\n");

    const emailContent = `
Dear ${order.fournisseur_name},

Please find below our purchase order details:

Order Number: ${order.order_number}
Magasin: ${order.magasin_name}
Order Date: ${new Date(order.created_at).toLocaleDateString()}

Products:
${productList}

Total Amount: ${order.total_amount ? order.total_amount.toFixed(2) : "0.00"}

${order.notes ? `Notes: ${order.notes}` : ""}

Please confirm receipt of this order and provide delivery timeline.

Best regards,
${order.magasin_responsable}
${order.magasin_name}
    `;

    // Send email
    try {
      await transporter.sendMail({
        from: order.magasin_email || process.env.SMTP_USER,
        to: order.fournisseur_email,
        subject: `Bon de commande #${order.order_number}`,
        html: emailContent,
      });

      // Update email sent status
      await db.pool.execute(
        "UPDATE bons_commande SET email_sent = TRUE, sent_at = ? WHERE id = ?",
        [new Date(), req.params.id]
      );

      res.json({ message: "Purchase order email sent successfully" });
    } catch (emailError) {
      console.error("Erreur lors de l\"envoi de l\"email au fournisseur :", emailError);
      res.status(500).json({ error: "Failed to send email. Please check email configuration." });
    }
  } catch (error) {
    console.error("Error sending purchase order email:", error);
    res.status(500).json({ error: "Failed to send purchase order email" });
  }
});

// Update purchase order status
router.patch("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;

    if (!["sent", "confirmed", "received", "cancelled"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const [result] = await db.pool.execute(
      "UPDATE bons_commande SET status = ? WHERE id = ?",
      [status, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Purchase order not found" });
    }

    res.json({ message: "Purchase order status updated successfully" });
  } catch (error) {
    console.error("Error updating purchase order status:", error);
    res.status(500).json({ error: "Failed to update purchase order status" });
  }
});

module.exports = router;




