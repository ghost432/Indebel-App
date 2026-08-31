const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const morgan = require('morgan');

// Middlewares personnalisés
const { errorHandler, notFound } = require('./middleware/errorHandler');
const requestLogger = require('./middleware/requestLogger');

// Routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const jobRoutes = require('./routes/jobRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const missionRoutes = require('./routes/missionRoutes');
const demandeRoutes = require('./routes/demandeRoutes');
const verificationRoutes = require('./routes/verificationRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const secteurRoutes = require('./routes/secteurRoutes');
const forfaitRoutes = require('./routes/forfaitRoutes');
const paiementRoutes = require('./routes/paiementRoutes');
const messageRoutes = require('./routes/messageRoutes');
const profileViewRoutes = require('./routes/profileViewRoutes');
const evaluationRoutes = require('./routes/evaluationRoutes');
const supportRoutes = require('./routes/supportRoutes');
const labelRoutes = require('./routes/labelRoutes');
const factureRoutes = require('./routes/factureRoutes');
const devisRoutes = require('./routes/devisRoutes');
const devisSoumisRoutes = require('./routes/devisSoumisRoutes');
const freelancerJobRoutes = require('./routes/freelancerJobRoutes');
const devisPublicRoutes = require('./routes/devisPublicRoutes');
const avisRoutes = require('./routes/avisRoutes');
const seoRoutes = require('./routes/seoRoutes');
const dashboardStatsRoutes = require('./routes/dashboardStatsRoutes');
const metierPageRoutes = require('./routes/metierPageRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.get('/api/health', (req, res) => res.json({ success: true, status: 'ok', service: 'indebel-api' }));
app.get('/favicon.ico', (req, res) => res.status(204).end());

// Trust proxy - Important pour Nginx/Plesk
app.set('trust proxy', 1);

// Configure CORS - DOIT être configuré AVANT les autres middlewares
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
  : [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:5175',
      'http://localhost:5001',
      'http://127.0.0.1:5175',
      'http://127.0.0.1:5001',
      'http://localhost:8081',
      'http://127.0.0.1:8081',
      'exp://127.0.0.1:8081',
      'http://192.168.0.199:8081',
      'http://192.168.0.199:3000',
      'http://192.168.0.199:5175'
    ];

console.log('🔧 CORS Origins configurées:', allowedOrigins);

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, or server-to-server requests)
    if (!origin) return callback(null, true);

    // Allow local network IPs dynamically (http:// or https://)
    const isLocalNetwork = origin.match(/^https?:\/\/(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|127\.0\.0\.1|localhost)/);

    // Allow Expo Go dev client origins (exp:// protocol)
    const isExpoGo = origin.match(/^exp:\/\//);

    // Allow React Native mobile apps (they may send custom origins)
    const isMobileApp = origin.match(/^https?:\/\/(localhost|10\.0\.2\.2)/);

    if (allowedOrigins.indexOf(origin) !== -1 || isLocalNetwork || isExpoGo || isMobileApp) {
      callback(null, true);
    } else {
      console.log('❌ CORS bloqué pour:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'X-Client-Platform'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Enable pre-flight for all routes

// Créer le dossier de logs s'il n'existe pas
const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Configuration de la journalisation
const accessLogStream = fs.createWriteStream(
  path.join(logDir, 'access.log'),
  { flags: 'a' }
);

const errorLogStream = fs.createWriteStream(
  path.join(logDir, 'error.log'),
  { flags: 'a' }
);

// Créer un stream de logs pour les erreurs non gérées
const logStream = fs.createWriteStream(
  path.join(logDir, 'server.log'),
  { flags: 'a' }
);

// Middleware de journalisation des requêtes
app.use(morgan('combined', {
  stream: accessLogStream,
  skip: (req, res) => res.statusCode >= 400 // Ne pas journaliser les erreurs ici
}));

// Middleware de journalisation des erreurs
app.use(morgan('combined', {
  stream: errorLogStream,
  skip: (req, res) => res.statusCode < 400 // Ne journaliser que les erreurs
}));

// Gestion des erreurs non capturées
process.on('uncaughtException', (error) => {
  const errorLog = `[${new Date().toISOString()}] Uncaught Exception: ${error.stack || error.message}\n`;
  logStream.write(errorLog);
  console.error(errorLog);
  // Ne pas arrêter le processus, laisser le gestionnaire d'erreurs d'Express s'en charger
});

process.on('unhandledRejection', (reason, promise) => {
  const errorLog = `[${new Date().toISOString()}] Unhandled Rejection at: ${promise}, reason: ${reason}\n`;
  logStream.write(errorLog);
  console.error(errorLog);
});

// Security middleware - configuré APRÈS CORS
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false
}));

// Compression pour optimiser les performances
app.use(compression({
  level: 6, // Niveau de compression (0-9, 6 est un bon compromis)
  threshold: 1024, // Compresser seulement si > 1KB
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

// Rate limiting ciblé pour la sécurité des routes d'authentification
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limite à 30 requêtes par 15 minutes par IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Trop de tentatives depuis cette adresse IP. Veuillez réessayer dans 15 minutes.'
  }
});
app.use(['/api/auth/login', '/api/auth/register', '/api/auth/verify-otp', '/api/auth/forgot-password'], authLimiter);

// Middleware de journalisation personnalisé
app.use((req, res, next) => {
  try {
    return requestLogger(req, res, next);
  } catch (error) {
    console.error('Erreur dans le middleware de journalisation:', error);
    // Poursuivre le traitement même en cas d'échec de la journalisation
    return next();
  }
});

// Webhook Stripe - DOIT être AVANT express.json() pour avoir le raw body
app.post('/api/paiements/webhook', express.raw({ type: 'application/json' }), (req, res, next) => {
  console.log('Webhook Stripe reçu (paiements)');
  next();
}, require('./controllers/paiementController').stripeWebhook);

// ALIAS: /api/paiement/webhook (singulier sans 's') - URL configurée par erreur dans Stripe Dashboard
// Redirige vers le handler credits pour que les crédits soient bien attribués
app.post('/api/paiement/webhook', express.raw({ type: 'application/json' }), (req, res, next) => {
  console.log('[ALIAS] Webhook Stripe /api/paiement/webhook -> credits handler');
  next();
}, require('./controllers/creditsController').webhook);

// ALIAS: /api/pricing/webhook - autre URL Stripe erronée (détectée dans les logs nginx)
app.post('/api/pricing/webhook', express.raw({ type: 'application/json' }), (req, res, next) => {
  console.log('[ALIAS] Webhook Stripe /api/pricing/webhook -> credits handler');
  next();
}, require('./controllers/creditsController').webhook);

// Webhook Stripe Credits - DOIT être AVANT express.json() pour avoir le raw body
app.post('/api/credits/webhook', express.raw({ type: 'application/json' }), (req, res, next) => {
  console.log('Webhook Stripe Credits reçu');
  next();
}, require('./controllers/creditsController').webhook);

// Body parser avec limite augmentée pour les fichiers Base64
app.use(express.json({ limit: '50mb' }));  // Augmenté de 100kb à 50mb
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ============================================
// Servir les fichiers statiques
// ============================================
const uploadsDir = path.join(__dirname, 'public', 'uploads');
const publicDir = path.join(__dirname, 'public');

// Créer les dossiers s'ils n'existent pas
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
  console.log('📁 Dossier public créé');
}
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Dossier uploads créé');
}

// Servir les fichiers statiques
app.use('/api/uploads', express.static(uploadsDir));
app.use('/api/public', express.static(publicDir));

console.log('✅ Fichiers statiques configurés:');
console.log('   - /uploads →', uploadsDir);
console.log('   - /public →', publicDir);

// Routes
app.get(['/', '/api'], (req, res) => {
  res.json({
    message: 'Bienvenue sur l\'API Indebel',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      jobs: '/api/jobs',
      applications: '/api/applications',
      missions: '/api/missions',
      secteurs: '/api/secteurs'
    }
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/missions', missionRoutes);
app.use('/api/demandes', demandeRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/secteurs', secteurRoutes);
app.use('/api/forfaits', forfaitRoutes);
app.use('/api/paiements', paiementRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/profile-views', profileViewRoutes);
app.use('/api/evaluations', evaluationRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/label', labelRoutes);
app.use('/api/factures', factureRoutes);
app.use('/api/devis', devisRoutes);
app.use('/api/devis-soumis', devisSoumisRoutes);
app.use('/api/freelancer-jobs', freelancerJobRoutes);
app.use('/api/devis-public', devisPublicRoutes);
app.use('/api/avis', avisRoutes);
app.use('/api/seo', seoRoutes);
app.use('/api/metiers', metierPageRoutes);
app.use('/api/admin-stats', dashboardStatsRoutes);

const creditsRoutes = require('./routes/creditsRoutes');
app.use('/api/credits', creditsRoutes);

const adminCreditsRoutes = require('./routes/adminCreditsRoutes');
app.use('/api/admin-credits', adminCreditsRoutes);

// Middleware de logging des erreurs
app.use((err, req, res, next) => {
  const errorMessage = `${new Date().toISOString()} - ${req.method} ${req.url} - ${err.stack}\n`;
  console.error(errorMessage);
  logStream.write(errorMessage);
  res.status(500).json({ message: 'Erreur interne du serveur', error: err.message });
});

// Error handlers
app.use(notFound);
app.use(errorHandler);

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
