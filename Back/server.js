const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test de la connexion base de données au démarrage
require('./config/db');

// Test de la configuration email au démarrage
(async () => {
  try {
    console.log('🔍 Test de la configuration email...');
    const { testEmailConfig } = require('./utils/notifications');
    const emailOk = await testEmailConfig();
    if (emailOk) {
      console.log('✅ Configuration email OK');
    } else {
      console.log('⚠️  Configuration email non fonctionnelle');
    }
  } catch (error) {
    console.log('⚠️  Erreur test email:', error.message);
  }
})();

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/patients', require('./routes/patients'));
app.use('/api/traitements', require('./routes/traitements'));
app.use('/api/rendez-vous', require('./routes/rendezvous'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/users', require('./routes/users'));

// Route de test
app.get('/', (req, res) => {
  res.json({ 
    message: 'API Hospital - Serveur en marche!',
    version: '1.0.0',
    features: {
      email: process.env.EMAIL_USER ? 'Configuré' : 'Non configuré',
      database: 'Connecté'
    },
    endpoints: [
      'POST /api/auth/login',
      'POST /api/auth/register',
      'GET /api/patients',
      'POST /api/patients',
      'GET /api/traitements',
      'POST /api/traitements',
      'GET /api/rendez-vous',
      'POST /api/rendez-vous',
      'GET /api/messages',
      'POST /api/messages',
      'GET /api/users',
      'POST /test-email'
    ]
  });
});

// Route de test email
app.post('/test-email', async (req, res) => {
  try {
    const { sendTestEmail } = require('./utils/notifications');
    const success = await sendTestEmail();
    
    if (success) {
      res.json({ 
        message: 'Email de test envoyé avec succès !',
        destination: process.env.EMAIL_USER
      });
    } else {
      res.status(500).json({ 
        error: 'Échec envoi email de test',
        suggestion: 'Vérifiez votre configuration .env'
      });
    }
  } catch (error) {
    res.status(500).json({ 
      error: 'Erreur test email',
      details: error.message
    });
  }
});

// Gestion d'erreurs globale
app.use((err, req, res, next) => {
  console.error('❌ Erreur:', err.stack);
  res.status(500).json({ error: 'Erreur serveur interne' });
});

// Route 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route non trouvée' });
});

// app.listen(PORT,'0.0.0.0' () => {
//   console.log(`🚀 Serveur démarré sur le port ${PORT}`);
//   console.log(`📋 Documentation: http://0.0.0.0:${PORT}/`);
// }); 
app.listen(3001, '0.0.0.0', () => {
	console.log("Server is running on port 3001");
});
