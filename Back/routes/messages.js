const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const messagesController = require('../controllers/messagesController');

const router = express.Router();

// Appliquer l'authentification à toutes les routes
router.use(authenticateToken);

// GET /api/messages/user/:userId - Messages d'un utilisateur
router.get('/user/:userId', messagesController.getMessagesByUser);

// GET /api/messages/user/:userId/unread - Messages non lus d'un utilisateur
router.get('/user/:userId/unread', messagesController.getUnreadMessages);

// GET /api/messages/conversations - Conversations de l'utilisateur connecté
router.get('/conversations', messagesController.getConversations);

// POST /api/messages - Envoyer un message
router.post('/', messagesController.sendMessage);

// PUT /api/messages/:id/read - Marquer un message comme lu
router.put('/:id/read', messagesController.markAsRead);

// PUT /api/messages/user/:userId/read-all - Marquer tous les messages comme lus
router.put('/user/:userId/read-all', messagesController.markAllAsRead);

// DELETE /api/messages/:id - Supprimer un message
router.delete('/:id', messagesController.deleteMessage);

module.exports = router;