const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: '.env.production' });

const app = express();
const PORT = process.env.PORT || 5000;

// CORS
const allowedOrigins = process.env.CORS_ORIGINS 
  ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
  : ['http://localhost:5175'];

console.log('🔧 CORS Origins:', allowedOrigins);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());

// Import routes Label
const labelRoutes = require('./routes/labelRoutes');

// Route de test simple
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'API Indebel avec Label fonctionne!',
    timestamp: new Date().toISOString(),
    features: ['health', 'auth-test', 'label']
  });
});

// Route auth de test
app.post('/api/auth/login', (req, res) => {
  res.status(400).json({
    success: false,
    message: 'Version test - Login désactivé temporairement'
  });
});

// Routes Label
app.use('/api/label', labelRoutes);

console.log('✅ Routes Label chargées');

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`✅ API accessible sur http://localhost:${PORT}`);
  console.log(`🏷️ Routes Label: /api/label/*`);
});
