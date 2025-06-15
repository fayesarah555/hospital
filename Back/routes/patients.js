// Back/routes/patients.js - Solution finale avec rôles explicites

const express = require('express');
const { authenticateToken, requireRole } = require('../middleware/auth');
const patientsController = require('../controllers/patientsController');

const router = express.Router();

// Appliquer l'authentification à toutes les routes
router.use(authenticateToken);

// ✅ SOLUTION: Autoriser explicitement les rôles pour chaque route

// GET /api/patients - Liste des patients 
// Autorisé: admin, medecin, rh, infirmier (tous les rôles)
router.get('/', requireRole(['admin', 'medecin', 'rh', 'infirmier']), patientsController.getAllPatients);

// GET /api/patients/medecin/:medecinId - Patients d'un médecin spécifique
router.get('/medecin/:medecinId', requireRole(['medecin', 'admin']), patientsController.getPatientsByMedecin);

// GET /api/patients/:id - Détail d'un patient
// Autorisé: admin, medecin, rh (infirmier en lecture seule)
router.get('/:id', requireRole(['admin', 'medecin', 'rh', 'infirmier']), patientsController.getPatientById);

// POST /api/patients - Créer un patient (RH et Admin)
router.post('/', requireRole(['rh', 'admin']), patientsController.createPatient);

// PUT /api/patients/:id - Modifier un patient (RH et Admin)
router.put('/:id', requireRole(['rh', 'admin']), patientsController.updatePatient);

// DELETE /api/patients/:id - Supprimer un patient (Admin seulement)
router.delete('/:id', requireRole(['admin']), patientsController.deletePatient);

module.exports = router;