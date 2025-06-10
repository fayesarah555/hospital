const db = require('../config/db');

const messagesController = {
  // Récupérer les messages d'un utilisateur
  getMessagesByUser: async (req, res) => {
    try {
      const { userId } = req.params;

      // Vérifier que l'utilisateur ne peut voir que ses messages
      if (req.user.id != userId && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Accès refusé' });
      }

      const [messages] = await db.execute(`
        SELECT 
          m.*,
          exp.nom as expediteur_nom, 
          exp.prenom as expediteur_prenom,
          exp.role as expediteur_role,
          dest.nom as destinataire_nom, 
          dest.prenom as destinataire_prenom,
          dest.role as destinataire_role
        FROM messages m
        LEFT JOIN users exp ON m.expediteur_id = exp.id
        LEFT JOIN users dest ON m.destinataire_id = dest.id
        WHERE m.destinataire_id = ? OR m.expediteur_id = ?
        ORDER BY m.created_at DESC
      `, [userId, userId]);

      // Séparer les messages reçus et envoyés
      const messagesRecus = messages.filter(m => m.destinataire_id == userId);
      const messagesEnvoyes = messages.filter(m => m.expediteur_id == userId);

      res.json({
        messagesRecus,
        messagesEnvoyes,
        totalMessages: messages.length,
        messagesNonLus: messagesRecus.filter(m => !m.lu).length
      });

    } catch (error) {
      console.error('Erreur récupération messages:', error);
      res.status(500).json({ error: 'Erreur lors de la récupération des messages' });
    }
  },

  // Récupérer les messages non lus d'un utilisateur
  getUnreadMessages: async (req, res) => {
    try {
      const { userId } = req.params;

      // Vérifier les permissions
      if (req.user.id != userId && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Accès refusé' });
      }

      const [messages] = await db.execute(`
        SELECT 
          m.*,
          exp.nom as expediteur_nom, 
          exp.prenom as expediteur_prenom,
          exp.role as expediteur_role
        FROM messages m
        LEFT JOIN users exp ON m.expediteur_id = exp.id
        WHERE m.destinataire_id = ? AND m.lu = FALSE
        ORDER BY m.created_at DESC
      `, [userId]);

      res.json(messages);

    } catch (error) {
      console.error('Erreur messages non lus:', error);
      res.status(500).json({ error: 'Erreur lors de la récupération des messages non lus' });
    }
  },

  // Envoyer un message
  sendMessage: async (req, res) => {
    try {
      const { destinataire_id, contenu, type } = req.body;
      const expediteur_id = req.user.id;

      // Validations
      if (!destinataire_id || !contenu) {
        return res.status(400).json({ error: 'Destinataire et contenu requis' });
      }

      if (type && !['traitement', 'rdv', 'general'].includes(type)) {
        return res.status(400).json({ error: 'Type de message invalide' });
      }

      // Vérifier que le destinataire existe
      const [destinataires] = await db.execute(
        'SELECT id, nom, prenom, role FROM users WHERE id = ?',
        [destinataire_id]
      );

      if (destinataires.length === 0) {
        return res.status(404).json({ error: 'Destinataire non trouvé' });
      }

      // Créer le message
      const [result] = await db.execute(
        'INSERT INTO messages (expediteur_id, destinataire_id, contenu, type) VALUES (?, ?, ?, ?)',
        [expediteur_id, destinataire_id, contenu, type || 'general']
      );

      res.status(201).json({
        message: 'Message envoyé avec succès',
        messageId: result.insertId,
        destinataire: destinataires[0]
      });

    } catch (error) {
      console.error('Erreur envoi message:', error);
      res.status(500).json({ error: 'Erreur lors de l\'envoi du message' });
    }
  },

  // Marquer un message comme lu
  markAsRead: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Vérifier que le message existe et appartient à l'utilisateur
      const [messages] = await db.execute(
        'SELECT id, destinataire_id FROM messages WHERE id = ?',
        [id]
      );

      if (messages.length === 0) {
        return res.status(404).json({ error: 'Message non trouvé' });
      }

      const message = messages[0];

      // Vérifier que l'utilisateur est le destinataire
      if (message.destinataire_id !== userId && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Accès refusé' });
      }

      // Marquer comme lu
      await db.execute(
        'UPDATE messages SET lu = TRUE WHERE id = ?',
        [id]
      );

      res.json({ message: 'Message marqué comme lu' });

    } catch (error) {
      console.error('Erreur marquage message:', error);
      res.status(500).json({ error: 'Erreur lors du marquage du message' });
    }
  },

  // Marquer tous les messages comme lus
  markAllAsRead: async (req, res) => {
    try {
      const { userId } = req.params;

      // Vérifier les permissions
      if (req.user.id != userId && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Accès refusé' });
      }

      // Marquer tous les messages non lus comme lus
      const [result] = await db.execute(
        'UPDATE messages SET lu = TRUE WHERE destinataire_id = ? AND lu = FALSE',
        [userId]
      );

      res.json({ 
        message: 'Tous les messages marqués comme lus',
        messagesMarques: result.affectedRows
      });

    } catch (error) {
      console.error('Erreur marquage tous messages:', error);
      res.status(500).json({ error: 'Erreur lors du marquage des messages' });
    }
  },

  // Supprimer un message
  deleteMessage: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Vérifier que le message existe
      const [messages] = await db.execute(
        'SELECT id, expediteur_id, destinataire_id FROM messages WHERE id = ?',
        [id]
      );

      if (messages.length === 0) {
        return res.status(404).json({ error: 'Message non trouvé' });
      }

      const message = messages[0];

      // Vérifier les permissions (expéditeur, destinataire ou admin)
      if (message.expediteur_id !== userId && 
          message.destinataire_id !== userId && 
          req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Accès refusé' });
      }

      // Supprimer le message
      await db.execute('DELETE FROM messages WHERE id = ?', [id]);

      res.json({ message: 'Message supprimé avec succès' });

    } catch (error) {
      console.error('Erreur suppression message:', error);
      res.status(500).json({ error: 'Erreur lors de la suppression du message' });
    }
  },

  // Récupérer les conversations d'un utilisateur
  getConversations: async (req, res) => {
    try {
      const userId = req.user.id;

      const [conversations] = await db.execute(`
        SELECT DISTINCT
          CASE 
            WHEN m.expediteur_id = ? THEN m.destinataire_id
            ELSE m.expediteur_id
          END as contact_id,
          CASE 
            WHEN m.expediteur_id = ? THEN CONCAT(dest.prenom, ' ', dest.nom)
            ELSE CONCAT(exp.prenom, ' ', exp.nom)
          END as contact_nom,
          CASE 
            WHEN m.expediteur_id = ? THEN dest.role
            ELSE exp.role
          END as contact_role,
          MAX(m.created_at) as dernier_message_date,
          COUNT(CASE WHEN m.destinataire_id = ? AND m.lu = FALSE THEN 1 END) as messages_non_lus
        FROM messages m
        LEFT JOIN users exp ON m.expediteur_id = exp.id
        LEFT JOIN users dest ON m.destinataire_id = dest.id
        WHERE m.expediteur_id = ? OR m.destinataire_id = ?
        GROUP BY contact_id, contact_nom, contact_role
        ORDER BY dernier_message_date DESC
      `, [userId, userId, userId, userId, userId, userId]);

      res.json(conversations);

    } catch (error) {
      console.error('Erreur récupération conversations:', error);
      res.status(500).json({ error: 'Erreur lors de la récupération des conversations' });
    }
  }
};

module.exports = messagesController;