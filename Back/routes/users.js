const express = require('express');
const { authenticateToken, requireRole } = require('../middleware/auth');
const usersController = require('../controllers/usersController');

const router = express.Router();

// Appliquer l'authentification à toutes les routes
router.use(authenticateToken);

// GET /api/users - Tous les utilisateurs (Admin seulement)
router.get('/', requireRole(['admin']), usersController.getAllUsers);

// GET /api/users/statistics - Statistiques globales (Admin seulement)
router.get('/statistics', requireRole(['admin']), usersController.getStatistics);

// GET /api/users/role/:role - Utilisateurs par rôle (Admin seulement)
router.get('/role/:role', requireRole(['admin']), usersController.getUsersByRole);

// GET /api/users/:id - Détail d'un utilisateur (Admin seulement)
router.get('/:id', requireRole(['admin']), usersController.getUserById);

// POST /api/users - Créer un utilisateur (Admin seulement)
router.post('/', requireRole(['admin']), usersController.createUser);

// PUT /api/users/:id - Modifier un utilisateur (Admin seulement)
router.put('/:id', requireRole(['admin']), usersController.updateUser);

// DELETE /api/users/:id - Supprimer un utilisateur (Admin seulement)
router.delete('/:id', requireRole(['admin']), usersController.deleteUser);

module.exports = router;