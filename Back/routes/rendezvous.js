const express = require('express');
const { authenticateToken, requireRole } = require('../middleware/auth');
const rendezvousController = require('../controllers/rendezvousController');

const router = express.Router();

// Appliquer l'authentification à toutes les routes
router.use(authenticateToken);

// GET /api/rendez-vous/medecin/:medecinId - Agenda d'un médecin
router.get(
	'/medecin/:medecinId',
	requireRole(['medecin', 'admin']),
	rendezvousController.getAgendaMedecin
);

// GET /api/rendez-vous/medecin/:medecinId/creneaux - Créneaux disponibles
router.get(
	'/medecin/:medecinId/creneaux',
	requireRole(['medecin', 'admin']),
	rendezvousController.getCreneauxDisponibles
);

// GET /api/rendez-vous/patient/:patientId - Rendez-vous d'un patient
router.get('/patient/:patientId', rendezvousController.getRendezVousPatient);

// POST /api/rendez-vous - Créer un rendez-vous (Médecins seulement)
router.post('/', requireRole(['medecin']), rendezvousController.createRendezVous);

// PUT /api/rendez-vous/:id - Modifier un rendez-vous (Médecins seulement)
router.put('/:id', requireRole(['medecin']), rendezvousController.updateRendezVous);

// DELETE /api/rendez-vous/:id - Annuler un rendez-vous (Médecins seulement)
router.delete('/:id', requireRole(['medecin']), rendezvousController.deleteRendezVous);

module.exports = router;
