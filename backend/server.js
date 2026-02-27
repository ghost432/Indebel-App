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
const pwaRoutes = require('./routes/pwaRoutes');
const devisRoutes = require('./routes/devisRoutes');
const devisSoumisRoutes = require('./routes/devisSoumisRoutes');
const freelancerJobRoutes = require('./routes/freelancerJobRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy - Important pour Nginx/Plesk
app.set('trust proxy', 1);

// Configure CORS - DOIT être configuré AVANT les autres middlewares
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
  : ['http://localhost:5175', 'http://localhost:5001', 'http://127.0.0.1:5175', 'http://127.0.0.1:5001'];

console.log('🔧 CORS Origins configurées:', allowedOrigins);

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
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

// Rate limiting (augmenté pour le développement)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limite augmentée à 1000 requêtes par fenêtre (était 100)
  message: {
    success: false,
    message: 'Trop de requêtes depuis cette adresse IP, veuillez réessayer dans 15 minutes.'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use('/api/', limiter);

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
  console.log('Webhook Stripe reçu');
  next();
}, require('./controllers/paiementController').stripeWebhook);

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
app.use('/uploads', express.static(uploadsDir));
app.use('/public', express.static(publicDir));

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
app.use('/api/pwa', pwaRoutes);
app.use('/api/devis', devisRoutes);
app.use('/api/devis-soumis', devisSoumisRoutes);
app.use('/api/freelancer-jobs', freelancerJobRoutes);

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
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
