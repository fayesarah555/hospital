const express = require('express');
const { authenticateToken, requireRole } = require('../middleware/auth');
const traitementsController = require('../controllers/traitementsController');

const router = express.Router();

// Appliquer l'authentification à toutes les routes
router.use(authenticateToken);

// GET /api/traitements/patient/:patientId - Traitements d'un patient
router.get('/patient/:patientId', traitementsController.getTraitementsByPatient);

// GET /api/traitements/patient/:patientId/current - Traitement actuel d'un patient
router.get('/patient/:patientId/current', traitementsController.getCurrentTraitement);

// GET /api/traitements/medicaments - Liste des médicaments disponibles
router.get('/medicaments', traitementsController.getMedicaments);

// POST /api/traitements - Créer/modifier un traitement (Médecins seulement)
router.post('/', requireRole(['medecin']), traitementsController.createOrUpdateTraitement);

// POST /api/traitements/patient/:patientId/medicament - Ajouter un médicament
router.post('/patient/:patientId/medicament', requireRole(['medecin']), traitementsController.addMedicament);

// DELETE /api/traitements/patient/:patientId/medicament - Supprimer un médicament
router.delete('/patient/:patientId/medicament', requireRole(['medecin']), traitementsController.removeMedicament);

module.exports = router;