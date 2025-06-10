const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const authController = {
  // Inscription
  register: async (req, res) => {
    try {
      const { nom, prenom, email, password, role } = req.body;

      // Vérifications
      if (!nom || !prenom || !email || !password || !role) {
        return res.status(400).json({ error: 'Tous les champs sont requis' });
      }

      if (!['rh', 'medecin', 'admin'].includes(role)) {
        return res.status(400).json({ error: 'Rôle invalide' });
      }

      // Vérifier si l'email existe déjà
      const [existingUsers] = await db.execute(
        'SELECT id FROM users WHERE email = ?',
        [email]
      );

      if (existingUsers.length > 0) {
        return res.status(400).json({ error: 'Cet email est déjà utilisé' });
      }

      // Hasher le mot de passe
      const hashedPassword = await bcrypt.hash(password, 10);

      // Créer l'utilisateur
      const [result] = await db.execute(
        'INSERT INTO users (nom, prenom, email, password, role) VALUES (?, ?, ?, ?, ?)',
        [nom, prenom, email, hashedPassword, role]
      );

      res.status(201).json({
        message: 'Utilisateur créé avec succès',
        userId: result.insertId
      });

    } catch (error) {
      console.error('Erreur inscription:', error);
      res.status(500).json({ error: 'Erreur lors de l\'inscription' });
    }
  },

  // Connexion
  login: async (req, res) => {
    try {
      const { email, password } = req.body;
        console.log('Tentative de connexion:', email, password);

      if (!email || !password) {
        return res.status(400).json({ error: 'Email et mot de passe requis' });
      }

      // Rechercher l'utilisateur
      const [users] = await db.execute(
        'SELECT id, nom, prenom, email, password, role FROM users WHERE email = ?',
        [email]
      );

      if (users.length === 0) {
        return res.status(401).json({ error: 'Email ou mot de passe incorrect okayy' });
      }

      const user = users[0];

      // Vérifier le mot de passe
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
      }

      // Créer le token JWT
      const token = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Retourner les infos utilisateur (sans le mot de passe)
      const { password: _, ...userInfo } = user;

      res.json({
        message: 'Connexion réussie',
        token,
        user: userInfo
      });

    } catch (error) {
      console.error('Erreur connexion:', error);
      res.status(500).json({ error: 'Erreur lors de la connexion' });
    }
  },

  // Vérifier le token
  verify: (req, res) => {
    res.json({ 
      user: req.user,
      message: 'Token valide'
    });
  }
};

module.exports = authController;