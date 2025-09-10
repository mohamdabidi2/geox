const express = require('express');
const cors = require('cors');
const path = require('path');
const { testConnection } = require('./config/database');
const { testEmailConfig } = require('./utils/emailService');
require('dotenv').config();
const droitsRoutes = require('./routes/droits');
const clientsRoutes = require('./routes/clients');
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (uploaded photos)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/magasins', require('./routes/magasins'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/products', require('./routes/produits'));
app.use('/api/suppliers', require('./routes/fournisseurs'));
app.use('/api/purchase-requests', require('./routes/demandesAchat'));
app.use('/api/purchase-orders', require('./routes/bonsCommande'));
app.use('/api/stock', require('./routes/stock'));
app.use('/api/factures', require('./routes/factures'));
app.use('/api/posts', require('./routes/postes'));

app.use('/api/droits', droitsRoutes);
app.use('/api/clients', clientsRoutes);

// Basic route
app.get('/', (req, res) => {
    res.json({ message: 'Full-Stack Auth API Server is running!' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
app.listen(PORT, '0.0.0.0', async () => {
    console.log(`Server is running on port ${PORT}`);
    await testConnection();
  
});

module.exports = app;

