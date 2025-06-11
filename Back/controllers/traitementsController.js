const db = require('../config/db');
const { sendNotificationMessage } = require('../utils/notifications');

const traitementsController = {
  // Récupérer les traitements d'un patient
  getTraitementsByPatient: async (req, res) => {
    try {
      const { patientId } = req.params;

      // Vérifier que le patient existe
      const [patients] = await db.execute(
        'SELECT id, nom, prenom FROM patients WHERE id = ?',
        [patientId]
      );

      if (patients.length === 0) {
        return res.status(404).json({ error: 'Patient non trouvé' });
      }

      // Récupérer l'historique des traitements
      const [traitements] = await db.execute(`
        SELECT t.*, u.nom as medecin_nom, u.prenom as medecin_prenom
        FROM traitements t
        LEFT JOIN users u ON t.medecin_id = u.id
        WHERE t.patient_id = ?
        ORDER BY t.date_modification DESC
      `, [patientId]);

      // Assurer que les médicaments sont bien parsés
      const traitementsWithParsedMedicaments = traitements.map(traitement => {
        let medicaments = [];
        if (traitement.medicaments) {
          if (typeof traitement.medicaments === 'string') {
            medicaments = JSON.parse(traitement.medicaments);
          } else if (Array.isArray(traitement.medicaments)) {
            medicaments = traitement.medicaments;
          }
        }
        return {
          ...traitement,
          medicaments
        };
      });

      res.json({
        patient: patients[0],
        traitements: traitementsWithParsedMedicaments
      });

    } catch (error) {
      console.error('Erreur récupération traitements:', error);
      res.status(500).json({ error: 'Erreur lors de la récupération des traitements' });
    }
  },

  // Récupérer le traitement actuel d'un patient
  getCurrentTraitement: async (req, res) => {
    try {
      const { patientId } = req.params;

      const [traitements] = await db.execute(`
        SELECT t.*, u.nom as medecin_nom, u.prenom as medecin_prenom
        FROM traitements t
        LEFT JOIN users u ON t.medecin_id = u.id
        WHERE t.patient_id = ?
        ORDER BY t.date_modification DESC
        LIMIT 1
      `, [patientId]);

      if (traitements.length === 0) {
        return res.status(404).json({ error: 'Aucun traitement trouvé pour ce patient' });
      }

      const traitement = traitements[0];
      
      // Assurer que les médicaments sont bien parsés
      let medicaments = [];
      if (traitement.medicaments) {
        if (typeof traitement.medicaments === 'string') {
          medicaments = JSON.parse(traitement.medicaments);
        } else if (Array.isArray(traitement.medicaments)) {
          medicaments = traitement.medicaments;
        }
      }

      res.json({
        ...traitement,
        medicaments
      });

    } catch (error) {
      console.error('Erreur traitement actuel:', error);
      res.status(500).json({ error: 'Erreur lors de la récupération du traitement' });
    }
  },

  // Créer ou modifier un traitement
  createOrUpdateTraitement: async (req, res) => {
    try {
      const { patient_id, medicaments, notes } = req.body;
      const medecin_id = req.user.id;

      // Validations
      if (!patient_id) {
        return res.status(400).json({ error: 'ID patient requis' });
      }

      if (!medicaments || !Array.isArray(medicaments)) {
        return res.status(400).json({ error: 'Liste des médicaments requise' });
      }

      // Vérifier que le patient existe
      const [patients] = await db.execute(
        'SELECT id, nom, prenom FROM patients WHERE id = ?',
        [patient_id]
      );

      if (patients.length === 0) {
        return res.status(404).json({ error: 'Patient non trouvé' });
      }

      const patient = patients[0];

      // Créer le nouveau traitement
      const [result] = await db.execute(
        'INSERT INTO traitements (patient_id, medecin_id, medicaments, notes) VALUES (?, ?, ?, ?)',
        [patient_id, medecin_id, JSON.stringify(medicaments), notes || null]
      );

      // Envoyer une notification au patient
      const medicamentsText = medicaments.map(m => `${m.nom} (${m.dosage})`).join(', ');
      const message = `Votre traitement a été mis à jour par Dr. ${req.user.prenom} ${req.user.nom}.\n\nNouveaux médicaments: ${medicamentsText}`;
      
      // Note: Dans un vrai système, on enverrait un email/SMS au patient
      // Ici on crée juste un message dans la base
      await sendNotificationMessage(
        medecin_id,
        patient_id, // En réalité, ce serait l'ID d'un compte patient
        message,
        'traitement'
      );

      res.status(201).json({
        message: 'Traitement créé avec succès',
        traitementId: result.insertId,
        notification: 'Patient notifié du changement de traitement'
      });

    } catch (error) {
      console.error('Erreur création traitement:', error);
      res.status(500).json({ error: 'Erreur lors de la création du traitement' });
    }
  },

  // Ajouter un médicament au traitement actuel
  addMedicament: async (req, res) => {
    try {
      const { patientId } = req.params;
      const { nom, dosage } = req.body;
      const medecin_id = req.user.id;

      if (!nom || !dosage) {
        return res.status(400).json({ error: 'Nom et dosage du médicament requis' });
      }

      // Récupérer le traitement actuel
      const [traitements] = await db.execute(
        'SELECT * FROM traitements WHERE patient_id = ? ORDER BY date_modification DESC LIMIT 1',
        [patientId]
      );

      console.log('🔍 Récupération du traitement pour le patient:', patientId, traitements);

      let medicaments = [];
      if (traitements.length > 0) {
        const medicamentsData = traitements[0].medicaments;
        
        // Vérifier si c'est déjà un objet (parsé par MySQL2) ou une string JSON
        if (typeof medicamentsData === 'string') {
          medicaments = JSON.parse(medicamentsData || '[]');
        } else if (Array.isArray(medicamentsData)) {
          medicaments = medicamentsData;
        } else {
          medicaments = [];
        }
        
        console.log('💊 Médicaments actuels:', medicaments);
      }

      // Vérifier si le médicament existe déjà
      const existingMedicament = medicaments.find(m => m.nom.toLowerCase() === nom.toLowerCase());
      if (existingMedicament) {
        return res.status(400).json({ error: 'Ce médicament est déjà dans le traitement' });
      }

      // Ajouter le nouveau médicament
      medicaments.push({ nom, dosage });

      // Créer un nouveau traitement avec la liste mise à jour
      const notes = traitements.length > 0 ? traitements[0].notes : null;
      const [result] = await db.execute(
        'INSERT INTO traitements (patient_id, medecin_id, medicaments, notes) VALUES (?, ?, ?, ?)',
        [patientId, medecin_id, JSON.stringify(medicaments), notes]
      );

      // Notification patient
      const message = `Nouveau médicament ajouté à votre traitement: ${nom} (${dosage})`;
      await sendNotificationMessage(medecin_id, patientId, message, 'traitement');

      res.json({
        message: 'Médicament ajouté avec succès',
        traitementId: result.insertId
      });

    } catch (error) {
      console.error('Erreur ajout médicament:', error);
      res.status(500).json({ error: 'Erreur lors de l\'ajout du médicament' });
    }
  },

  // Supprimer un médicament du traitement
  removeMedicament: async (req, res) => {
    try {
      const { patientId } = req.params;
      const { nom } = req.body;
      const medecin_id = req.user.id;

      if (!nom) {
        return res.status(400).json({ error: 'Nom du médicament requis' });
      }

      // Récupérer le traitement actuel
      const [traitements] = await db.execute(
        'SELECT * FROM traitements WHERE patient_id = ? ORDER BY date_modification DESC LIMIT 1',
        [patientId]
      );

      if (traitements.length === 0) {
        return res.status(404).json({ error: 'Aucun traitement trouvé' });
      }

      const medicamentsData = traitements[0].medicaments;
      let medicaments = [];
      
      // Vérifier si c'est déjà un objet (parsé par MySQL2) ou une string JSON
      if (typeof medicamentsData === 'string') {
        medicaments = JSON.parse(medicamentsData || '[]');
      } else if (Array.isArray(medicamentsData)) {
        medicaments = medicamentsData;
      }
      
      // Supprimer le médicament
      const initialLength = medicaments.length;
      medicaments = medicaments.filter(m => m.nom.toLowerCase() !== nom.toLowerCase());

      if (medicaments.length === initialLength) {
        return res.status(404).json({ error: 'Médicament non trouvé dans le traitement' });
      }

      // Créer un nouveau traitement avec la liste mise à jour
      const [result] = await db.execute(
        'INSERT INTO traitements (patient_id, medecin_id, medicaments, notes) VALUES (?, ?, ?, ?)',
        [patientId, medecin_id, JSON.stringify(medicaments), traitements[0].notes]
      );

      // Notification patient
      const message = `Médicament retiré de votre traitement: ${nom}`;
      await sendNotificationMessage(medecin_id, patientId, message, 'traitement');

      res.json({
        message: 'Médicament supprimé avec succès',
        traitementId: result.insertId
      });

    } catch (error) {
      console.error('Erreur suppression médicament:', error);
      res.status(500).json({ error: 'Erreur lors de la suppression du médicament' });
    }
  },

  // Récupérer la liste des médicaments disponibles
  getMedicaments: async (req, res) => {
    try {
      const [medicaments] = await db.execute(
        'SELECT * FROM medicaments ORDER BY nom'
      );

      res.json(medicaments);

    } catch (error) {
      console.error('Erreur récupération médicaments:', error);
      res.status(500).json({ error: 'Erreur lors de la récupération des médicaments' });
    }
  }
};

module.exports = traitementsController;