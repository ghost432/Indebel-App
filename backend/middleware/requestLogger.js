const fs = require('fs');
const path = require('path');

// Créer le répertoire de logs s'il n'existe pas
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const requestLogStream = fs.createWriteStream(
  path.join(logDir, 'requests.log'),
  { flags: 'a' }
);

const errorLogStream = fs.createWriteStream(
  path.join(logDir, 'errors.log'),
  { flags: 'a' }
);

const logger = (req, res, next) => {
  const start = Date.now();
  
  // Journaliser la requête entrante
  requestLogStream.write(`
[${new Date().toISOString()}] ${req.method} ${req.originalUrl}\n`);
  
  // Vérifier si req.body existe et a des propriétés
  if (req.body && typeof req.body === 'object' && Object.keys(req.body).length > 0) {
    try {
      requestLogStream.write(`Body: ${JSON.stringify(req.body, null, 2)}\n`);
    } catch (e) {
      requestLogStream.write('Body: [unable to stringify]\n');
    }
  }
  
  // Vérifier si req.query existe et a des propriétés
  if (req.query && typeof req.query === 'object' && Object.keys(req.query).length > 0) {
    try {
      requestLogStream.write(`Query: ${JSON.stringify(req.query, null, 2)}\n`);
    } catch (e) {
      requestLogStream.write('Query: [unable to stringify]\n');
    }
  }
  
  // Sauvegarder la méthode originale de réponse
  const originalSend = res.send;
  
  // Intercepter la réponse
  res.send = function(body) {
    const duration = Date.now() - start;
    
    // Journaliser la réponse
    requestLogStream.write(`Status: ${res.statusCode} (${duration}ms)\n`);
    
    if (res.statusCode >= 400) {
      errorLogStream.write(`
[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - ${res.statusCode}\n`);
      
      // Journaliser le corps de la réponse de manière sécurisée
      try {
        const responseText = typeof body === 'string' ? body : JSON.stringify(body, null, 2);
        errorLogStream.write(`Response: ${responseText}\n`);
      } catch (e) {
        errorLogStream.write('Response: [unable to stringify]\n');
      }
      
      // Journaliser le corps de la requête de manière sécurisée
      if (req.body && typeof req.body === 'object') {
        try {
          errorLogStream.write(`Request Body: ${JSON.stringify(req.body, null, 2)}\n`);
        } catch (e) {
          errorLogStream.write('Request Body: [unable to stringify]\n');
        }
      }
      if (req.user) {
        errorLogStream.write(`User: ${JSON.stringify(req.user, null, 2)}\n`);
      }
    }
    
    // Appeler la méthode d'origine avec les arguments d'origine
    return originalSend.call(this, body);
  };
  
  next();
};

module.exports = logger;
