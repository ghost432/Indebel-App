const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
require('dotenv').config({ path: '.env.production' });

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy
app.set('trust proxy', 1);

// CORS
const allowedOrigins = process.env.CORS_ORIGINS 
  ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
  : ['http://localhost:5175'];

console.log('🔧 CORS Origins:', allowedOrigins);

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('❌ CORS bloqué pour:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Security & Performance
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const jobRoutes = require('./routes/jobRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const missionRoutes = require('./routes/missionRoutes');
const messageRoutes = require('./routes/messageRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const supportRoutes = require('./routes/supportRoutes');
const labelRoutes = require('./routes/labelRoutes');
const forfaitRoutes = require('./routes/forfaitRoutes');
const paiementRoutes = require('./routes/paiementRoutes');
const evaluationRoutes = require('./routes/evaluationRoutes');
const profileViewRoutes = require('./routes/profileViewRoutes');
const secteurRoutes = require('./routes/secteurRoutes');
const demandeRoutes = require('./routes/demandeRoutes');
const verificationRoutes = require('./routes/verificationRoutes');
const pwaRoutes = require('./routes/pwaRoutes');
const factureRoutes = require('./routes/factureRoutes');

// Route de santé
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'API Indebel COMPLÈTE opérationnelle!',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    features: [
      'health', 'auth', 'users', 'jobs', 'applications', 
      'missions', 'messages', 'notifications', 'support',
      'label', 'forfaits', 'paiements', 'evaluations',
      'profile-views', 'secteurs', 'demandes', 'verifications',
      'pwa', 'factures'
    ]
  });
});

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/missions', missionRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/label', labelRoutes);
app.use('/api/forfaits', forfaitRoutes);
app.use('/api/paiements', paiementRoutes);
app.use('/api/evaluations', evaluationRoutes);
app.use('/api/profile-views', profileViewRoutes);
app.use('/api/secteurs', secteurRoutes);
app.use('/api/demandes', demandeRoutes);
app.use('/api/verifications', verificationRoutes);
app.use('/api/pwa', pwaRoutes);
app.use('/api/factures', factureRoutes);

console.log('✅ Toutes les routes chargées:');
console.log('   - Auth');
console.log('   - Users');
console.log('   - Jobs');
console.log('   - Applications');
console.log('   - Missions');
console.log('   - Messages');
console.log('   - Notifications');
console.log('   - Support');
console.log('   - Label');
console.log('   - Forfaits');
console.log('   - Paiements');
console.log('   - Evaluations');
console.log('   - Profile Views');
console.log('   - Secteurs');
console.log('   - Demandes');
console.log('   - Verifications');
console.log('   - PWA');
console.log('   - Factures');

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.url} non trouvée`
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Erreur:', err.message);
  res.status(500).json({
    success: false,
    message: 'Erreur serveur',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server COMPLET running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`✅ API accessible sur http://localhost:${PORT}`);
  console.log(`🌐 ${allowedOrigins.length} origins CORS autorisées`);
});
