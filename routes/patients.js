const express = require('express');
const db = require('../config/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Appliquer l'authentification à toutes les routes
router.use(authenticateToken);

// GET - Liste des patients (tous les rôles)
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    let query = 'SELECT * FROM patients ORDER BY created_at DESC';
    let params = [];

    // Recherche par nom/prénom
    if (search) {
      query = 'SELECT * FROM patients WHERE nom LIKE ? OR prenom LIKE ? ORDER BY created_at DESC';
      params = [`%${search}%`, `%${search}%`];
    }

    const [patients] = await db.execute(query, params);
    res.json(patients);

  } catch (error) {
    console.error('Erreur récupération patients:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des patients' });
  }
});

// GET - Patients d'un médecin spécifique
router.get('/medecin/:medecinId', requireRole(['medecin', 'admin']), async (req, res) => {
  try {
    const { medecinId } = req.params;

    // Vérifier que le médecin ne peut voir que ses patients
    if (req.user.role === 'medecin' && req.user.id != medecinId) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const [patients] = await db.execute(`
      SELECT DISTINCT p.* FROM patients p
      INNER JOIN traitements t ON p.id = t.patient_id
      WHERE t.medecin_id = ?
      ORDER BY p.nom, p.prenom
    `, [medecinId]);

    res.json(patients);

  } catch (error) {
    console.error('Erreur patients médecin:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des patients' });
  }
});

// GET - Détail d'un patient
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [patients] = await db.execute(
      'SELECT * FROM patients WHERE id = ?',
      [id]
    );

    if (patients.length === 0) {
      return res.status(404).json({ error: 'Patient non trouvé' });
    }

    res.json(patients[0]);

  } catch (error) {
    console.error('Erreur détail patient:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du patient' });
  }
});

// POST - Créer un patient (RH et Admin)
router.post('/', requireRole(['rh', 'admin']), async (req, res) => {
  try {
    const { nom, prenom, age, poids, taille, traitement_en_cours } = req.body;

    // Validations
    if (!nom || !prenom || !age) {
      return res.status(400).json({ error: 'Nom, prénom et âge sont requis' });
    }

    if (age < 0 || age > 150) {
      return res.status(400).json({ error: 'Âge invalide' });
    }

    if (poids && (poids < 0 || poids > 500)) {
      return res.status(400).json({ error: 'Poids invalide' });
    }

    if (taille && (taille < 0 || taille > 300)) {
      return res.status(400).json({ error: 'Taille invalide' });
    }

    const [result] = await db.execute(
      'INSERT INTO patients (nom, prenom, age, poids, taille, traitement_en_cours) VALUES (?, ?, ?, ?, ?, ?)',
      [nom, prenom, age, poids || null, taille || null, traitement_en_cours || null]
    );

    res.status(201).json({
      message: 'Patient créé avec succès',
      patientId: result.insertId
    });

  } catch (error) {
    console.error('Erreur création patient:', error);
    res.status(500).json({ error: 'Erreur lors de la création du patient' });
  }
});

// PUT - Modifier un patient (RH et Admin)
router.put('/:id', requireRole(['rh', 'admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, prenom, age, poids, taille, traitement_en_cours } = req.body;

    // Vérifier que le patient existe
    const [existingPatients] = await db.execute(
      'SELECT id FROM patients WHERE id = ?',
      [id]
    );

    if (existingPatients.length === 0) {
      return res.status(404).json({ error: 'Patient non trouvé' });
    }

    // Validations
    if (age && (age < 0 || age > 150)) {
      return res.status(400).json({ error: 'Âge invalide' });
    }

    if (poids && (poids < 0 || poids > 500)) {
      return res.status(400).json({ error: 'Poids invalide' });
    }

    if (taille && (taille < 0 || taille > 300)) {
      return res.status(400).json({ error: 'Taille invalide' });
    }

    await db.execute(
      'UPDATE patients SET nom = ?, prenom = ?, age = ?, poids = ?, taille = ?, traitement_en_cours = ? WHERE id = ?',
      [nom, prenom, age, poids || null, taille || null, traitement_en_cours || null, id]
    );

    res.json({ message: 'Patient modifié avec succès' });

  } catch (error) {
    console.error('Erreur modification patient:', error);
    res.status(500).json({ error: 'Erreur lors de la modification du patient' });
  }
});

// DELETE - Supprimer un patient (Admin seulement)
router.delete('/:id', requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier que le patient existe
    const [existingPatients] = await db.execute(
      'SELECT id FROM patients WHERE id = ?',
      [id]
    );

    if (existingPatients.length === 0) {
      return res.status(404).json({ error: 'Patient non trouvé' });
    }

    // Supprimer les données liées (traitements, RDV, messages)
    await db.execute('DELETE FROM traitements WHERE patient_id = ?', [id]);
    await db.execute('DELETE FROM rendez_vous WHERE patient_id = ?', [id]);
    
    // Supprimer le patient
    await db.execute('DELETE FROM patients WHERE id = ?', [id]);

    res.json({ message: 'Patient supprimé avec succès' });

  } catch (error) {
    console.error('Erreur suppression patient:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du patient' });
  }
});

module.exports = router;