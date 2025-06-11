const bcrypt = require('bcryptjs');
const db = require('../config/db');

const usersController = {
  // Récupérer tous les utilisateurs par rôle
  getUsersByRole: async (req, res) => {
    try {
      const { role } = req.params;

      if (!['medecin', 'rh', 'admin'].includes(role)) {
        return res.status(400).json({ error: 'Rôle invalide' });
      }

      const [users] = await db.execute(
        'SELECT id, nom, prenom, email, role, created_at FROM users WHERE role = ? ORDER BY nom, prenom',
        [role]
      );

      res.json(users);

    } catch (error) {
      console.error('Erreur récupération utilisateurs:', error);
      res.status(500).json({ error: 'Erreur lors de la récupération des utilisateurs' });
    }
  },

  // Récupérer tous les utilisateurs
  getAllUsers: async (req, res) => {
    try {
      const [users] = await db.execute(
        'SELECT id, nom, prenom, email, role, created_at FROM users ORDER BY role, nom, prenom'
      );

      // Grouper par rôle pour faciliter l'affichage
      const usersByRole = {
        admin: users.filter(u => u.role === 'admin'),
        medecin: users.filter(u => u.role === 'medecin'),
        rh: users.filter(u => u.role === 'rh')
      };

      res.json({
        users,
        usersByRole,
        total: users.length
      });

    } catch (error) {
      console.error('Erreur récupération tous utilisateurs:', error);
      res.status(500).json({ error: 'Erreur lors de la récupération des utilisateurs' });
    }
  },

  // Récupérer un utilisateur par ID
  getUserById: async (req, res) => {
    try {
      const { id } = req.params;

      const [users] = await db.execute(
        'SELECT id, nom, prenom, email, role, created_at FROM users WHERE id = ?',
        [id]
      );

      if (users.length === 0) {
        return res.status(404).json({ error: 'Utilisateur non trouvé' });
      }

      const user = users[0];

      // Si c'est un médecin, récupérer ses statistiques
      if (user.role === 'medecin') {
        const [stats] = await db.execute(`
          SELECT 
            COUNT(DISTINCT t.patient_id) as nb_patients,
            COUNT(t.id) as nb_traitements,
            COUNT(r.id) as nb_rendez_vous
          FROM users u
          LEFT JOIN traitements t ON u.id = t.medecin_id
          LEFT JOIN rendez_vous r ON u.id = r.medecin_id
          WHERE u.id = ?
        `, [id]);

        user.statistiques = stats[0];
      }

      res.json(user);

    } catch (error) {
      console.error('Erreur récupération utilisateur:', error);
      res.status(500).json({ error: 'Erreur lors de la récupération de l\'utilisateur' });
    }
  },

  // Créer un nouvel utilisateur
  createUser: async (req, res) => {
    try {
      const { nom, prenom, email, password, role } = req.body;

      // Validations
      if (!nom || !prenom || !email || !password || !role) {
        return res.status(400).json({ error: 'Tous les champs sont requis' });
      }

      if (!['rh', 'medecin', 'admin'].includes(role)) {
        return res.status(400).json({ error: 'Rôle invalide' });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères' });
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
        message: `${role.charAt(0).toUpperCase() + role.slice(1)} créé(e) avec succès`,
        userId: result.insertId
      });

    } catch (error) {
      console.error('Erreur création utilisateur:', error);
      res.status(500).json({ error: 'Erreur lors de la création de l\'utilisateur' });
    }
  },

  // Modifier un utilisateur
  updateUser: async (req, res) => {
    try {
      const { id } = req.params;
      const { nom, prenom, email, password, role } = req.body;

      // Vérifier que l'utilisateur existe
      const [existingUsers] = await db.execute(
        'SELECT id, email FROM users WHERE id = ?',
        [id]
      );

      if (existingUsers.length === 0) {
        return res.status(404).json({ error: 'Utilisateur non trouvé' });
      }

      // Empêcher l'admin de modifier son propre rôle
      if (req.user.id == id && role && role !== req.user.role) {
        return res.status(400).json({ error: 'Vous ne pouvez pas modifier votre propre rôle' });
      }

      // Vérifier l'unicité de l'email (si modifié)
      if (email && email !== existingUsers[0].email) {
        const [emailCheck] = await db.execute(
          'SELECT id FROM users WHERE email = ? AND id != ?',
          [email, id]
        );

        if (emailCheck.length > 0) {
          return res.status(400).json({ error: 'Cet email est déjà utilisé' });
        }
      }

      // Construire la requête de mise à jour
      let updateFields = [];
      let params = [];

      if (nom) {
        updateFields.push('nom = ?');
        params.push(nom);
      }
      if (prenom) {
        updateFields.push('prenom = ?');
        params.push(prenom);
      }
      if (email) {
        updateFields.push('email = ?');
        params.push(email);
      }
      if (role && ['rh', 'medecin', 'admin'].includes(role)) {
        updateFields.push('role = ?');
        params.push(role);
      }
      if (password) {
        if (password.length < 6) {
          return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        updateFields.push('password = ?');
        params.push(hashedPassword);
      }

      if (updateFields.length === 0) {
        return res.status(400).json({ error: 'Aucune donnée à modifier' });
      }

      params.push(id);

      await db.execute(
        `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
        params
      );

      res.json({ message: 'Utilisateur modifié avec succès' });

    } catch (error) {
      console.error('Erreur modification utilisateur:', error);
      res.status(500).json({ error: 'Erreur lors de la modification de l\'utilisateur' });
    }
  },

  // Supprimer un utilisateur
  deleteUser: async (req, res) => {
    try {
      const { id } = req.params;

      // Vérifier que l'utilisateur existe
      const [existingUsers] = await db.execute(
        'SELECT id, role FROM users WHERE id = ?',
        [id]
      );

      if (existingUsers.length === 0) {
        return res.status(404).json({ error: 'Utilisateur non trouvé' });
      }

      // Empêcher l'admin de se supprimer lui-même
      if (req.user.id == id) {
        return res.status(400).json({ error: 'Vous ne pouvez pas supprimer votre propre compte' });
      }

      const user = existingUsers[0];

      // Si c'est un médecin, vérifier s'il a des données liées
      if (user.role === 'medecin') {
        const [traitements] = await db.execute(
          'SELECT COUNT(*) as count FROM traitements WHERE medecin_id = ?',
          [id]
        );
        const [rdv] = await db.execute(
          'SELECT COUNT(*) as count FROM rendez_vous WHERE medecin_id = ?',
          [id]
        );

        if (traitements[0].count > 0 || rdv[0].count > 0) {
          return res.status(400).json({ 
            error: 'Impossible de supprimer ce médecin : il a des traitements ou rendez-vous associés'
          });
        }
      }

      // Supprimer les messages liés
      await db.execute(
        'DELETE FROM messages WHERE expediteur_id = ? OR destinataire_id = ?',
        [id, id]
      );

      // Supprimer l'utilisateur
      await db.execute('DELETE FROM users WHERE id = ?', [id]);

      res.json({ message: 'Utilisateur supprimé avec succès' });

    } catch (error) {
      console.error('Erreur suppression utilisateur:', error);
      res.status(500).json({ error: 'Erreur lors de la suppression de l\'utilisateur' });
    }
  },

  // Récupérer les statistiques globales
  getStatistics: async (req, res) => {
    try {
      const [stats] = await db.execute(`
        SELECT 
          (SELECT COUNT(*) FROM users WHERE role = 'medecin') as nb_medecins,
          (SELECT COUNT(*) FROM users WHERE role = 'rh') as nb_rh,
          (SELECT COUNT(*) FROM users WHERE role = 'admin') as nb_admins,
          (SELECT COUNT(*) FROM patients) as nb_patients,
          (SELECT COUNT(*) FROM traitements) as nb_traitements,
          (SELECT COUNT(*) FROM rendez_vous) as nb_rendez_vous,
          (SELECT COUNT(*) FROM messages) as nb_messages
      `);

      // Statistiques par mois (derniers 6 mois)
      const [statsMensuelles] = await db.execute(`
        SELECT 
          DATE_FORMAT(created_at, '%Y-%m') as mois,
          COUNT(*) as nb_patients
        FROM patients 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
        GROUP BY DATE_FORMAT(created_at, '%Y-%m')
        ORDER BY mois DESC
      `);

      res.json({
        global: stats[0],
        tendances: statsMensuelles
      });

    } catch (error) {
      console.error('Erreur récupération statistiques:', error);
      res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
    }
  }
};

module.exports = usersController;