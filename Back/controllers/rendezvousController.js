const db = require('../config/db');
const { sendNotificationMessage } = require('../utils/notifications');

const rendezvousController = {
  // Récupérer l'agenda d'un médecin
  getAgendaMedecin: async (req, res) => {
    try {
      const { medecinId } = req.params;
      const { date, statut } = req.query;
// log de debug
      console.log(`Récupération agenda pour le médecin ID: ${medecinId}, Date: ${date}, Statut: ${statut}`);

      
      // Vérifier que le médecin ne peut voir que son agenda
      if (req.user.role === 'medecin' && req.user.id != medecinId) {
        return res.status(403).json({ error: 'Accès refusé' });
      }

      let query = `
        SELECT r.*, p.nom as patient_nom, p.prenom as patient_prenom
        FROM rendez_vous r
        LEFT JOIN patients p ON r.patient_id = p.id
        WHERE r.medecin_id = ?
      `;
      let params = [medecinId];

      // Filtrer par date si spécifiée
      if (date) {
        query += ' AND DATE(r.date_heure) = ?';
        params.push(date);
      }

      // Filtrer par statut si spécifié
      if (statut) {
        query += ' AND r.statut = ?';
        params.push(statut);
      }

      query += ' ORDER BY r.date_heure ASC';

      const [rendezvous] = await db.execute(query, params);

      res.json(rendezvous);

    } catch (error) {
      console.error('Erreur agenda médecin:', error);
      res.status(500).json({ error: 'Erreur lors de la récupération de l\'agenda' });
    }
  },

  // Récupérer les rendez-vous d'un patient
  getRendezVousPatient: async (req, res) => {
    try {
      const { patientId } = req.params;

      const [rendezvous] = await db.execute(`
        SELECT r.*, u.nom as medecin_nom, u.prenom as medecin_prenom
        FROM rendez_vous r
        LEFT JOIN users u ON r.medecin_id = u.id
        WHERE r.patient_id = ?
        ORDER BY r.date_heure DESC
      `, [patientId]);

      res.json(rendezvous);

    } catch (error) {
      console.error('Erreur RDV patient:', error);
      res.status(500).json({ error: 'Erreur lors de la récupération des rendez-vous' });
    }
  },

  // Créer un nouveau rendez-vous
  createRendezVous: async (req, res) => {
    try {
      const { patient_id, date_heure, notes } = req.body;
      const medecin_id = req.user.id;

      // Validations
      if (!patient_id || !date_heure) {
        return res.status(400).json({ error: 'Patient ID et date/heure requis' });
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

      // Vérifier que la date est dans le futur
      const rdvDate = new Date(date_heure);
      if (rdvDate <= new Date()) {
        return res.status(400).json({ error: 'La date du rendez-vous doit être dans le futur' });
      }

      // Vérifier la disponibilité du médecin (pas de conflit de créneaux)
      const [conflits] = await db.execute(`
        SELECT id FROM rendez_vous 
        WHERE medecin_id = ? 
        AND statut != 'annule'
        AND ABS(TIMESTAMPDIFF(MINUTE, date_heure, ?)) < 30
      `, [medecin_id, date_heure]);

      if (conflits.length > 0) {
        return res.status(400).json({ error: 'Créneau non disponible (conflit avec un autre RDV)' });
      }

      // Créer le rendez-vous
      const [result] = await db.execute(
        'INSERT INTO rendez_vous (patient_id, medecin_id, date_heure, notes) VALUES (?, ?, ?, ?)',
        [patient_id, medecin_id, date_heure, notes || null]
      );

      // Envoyer une notification au patient
      const dateFormatee = new Date(date_heure).toLocaleString('fr-FR');
      const message = `Nouveau rendez-vous programmé avec Dr. ${req.user.prenom} ${req.user.nom} le ${dateFormatee}`;
      
      await sendNotificationMessage(
        medecin_id,
        patient_id,
        message,
        'rdv'
      );

      res.status(201).json({
        message: 'Rendez-vous créé avec succès',
        rendezvousId: result.insertId,
        notification: 'Patient notifié du nouveau rendez-vous'
      });

    } catch (error) {
      console.error('Erreur création RDV:', error);
      res.status(500).json({ error: 'Erreur lors de la création du rendez-vous' });
    }
  },

  // Modifier un rendez-vous
  updateRendezVous: async (req, res) => {
    try {
      const { id } = req.params;
      const { date_heure, statut, notes } = req.body;
      const medecin_id = req.user.id;

      // Vérifier que le RDV existe et appartient au médecin
      const [rdvs] = await db.execute(`
        SELECT r.*, p.nom as patient_nom, p.prenom as patient_prenom
        FROM rendez_vous r
        LEFT JOIN patients p ON r.patient_id = p.id
        WHERE r.id = ? AND r.medecin_id = ?
      `, [id, medecin_id]);

      if (rdvs.length === 0) {
        return res.status(404).json({ error: 'Rendez-vous non trouvé' });
      }

      const rdv = rdvs[0];

      // Validation du statut
      if (statut && !['planifie', 'termine', 'annule'].includes(statut)) {
        return res.status(400).json({ error: 'Statut invalide' });
      }

      // Si changement de date, vérifier la disponibilité
      if (date_heure && date_heure !== rdv.date_heure) {
        const nouvelleDateRdv = new Date(date_heure);
        if (nouvelleDateRdv <= new Date()) {
          return res.status(400).json({ error: 'La nouvelle date doit être dans le futur' });
        }

        const [conflits] = await db.execute(`
          SELECT id FROM rendez_vous 
          WHERE medecin_id = ? 
          AND id != ?
          AND statut != 'annule'
          AND ABS(TIMESTAMPDIFF(MINUTE, date_heure, ?)) < 30
        `, [medecin_id, id, date_heure]);

        if (conflits.length > 0) {
          return res.status(400).json({ error: 'Nouveau créneau non disponible' });
        }
      }

      // Mettre à jour le rendez-vous
      await db.execute(
        'UPDATE rendez_vous SET date_heure = ?, statut = ?, notes = ? WHERE id = ?',
        [
          date_heure || rdv.date_heure,
          statut || rdv.statut,
          notes !== undefined ? notes : rdv.notes,
          id
        ]
      );

      // Envoyer une notification si changement significatif
      if (date_heure || statut) {
        let message = '';
        if (date_heure) {
          const nouvelleDateFormatee = new Date(date_heure).toLocaleString('fr-FR');
          message = `Votre rendez-vous avec Dr. ${req.user.prenom} ${req.user.nom} a été reprogrammé au ${nouvelleDateFormatee}`;
        } else if (statut === 'annule') {
          message = `Votre rendez-vous avec Dr. ${req.user.prenom} ${req.user.nom} a été annulé`;
        }

        if (message) {
          await sendNotificationMessage(medecin_id, rdv.patient_id, message, 'rdv');
        }
      }

      res.json({ message: 'Rendez-vous modifié avec succès' });

    } catch (error) {
      console.error('Erreur modification RDV:', error);
      res.status(500).json({ error: 'Erreur lors de la modification du rendez-vous' });
    }
  },

  // Supprimer/Annuler un rendez-vous
  deleteRendezVous: async (req, res) => {
    try {
      const { id } = req.params;
      const medecin_id = req.user.id;

      // Vérifier que le RDV existe et appartient au médecin
      const [rdvs] = await db.execute(`
        SELECT r.*, p.nom as patient_nom, p.prenom as patient_prenom
        FROM rendez_vous r
        LEFT JOIN patients p ON r.patient_id = p.id
        WHERE r.id = ? AND r.medecin_id = ?
      `, [id, medecin_id]);

      if (rdvs.length === 0) {
        return res.status(404).json({ error: 'Rendez-vous non trouvé' });
      }

      const rdv = rdvs[0];

      // Plutôt que de supprimer, on change le statut à "annulé"
      await db.execute(
        'UPDATE rendez_vous SET statut = ? WHERE id = ?',
        ['annule', id]
      );

      // Notification patient
      const message = `Votre rendez-vous avec Dr. ${req.user.prenom} ${req.user.nom} a été annulé`;
      await sendNotificationMessage(medecin_id, rdv.patient_id, message, 'rdv');

      res.json({ 
        message: 'Rendez-vous annulé avec succès',
        notification: 'Patient notifié de l\'annulation'
      });

    } catch (error) {
      console.error('Erreur annulation RDV:', error);
      res.status(500).json({ error: 'Erreur lors de l\'annulation du rendez-vous' });
    }
  },

  // Récupérer les créneaux disponibles d'un médecin
  getCreneauxDisponibles: async (req, res) => {
    try {
      const { medecinId } = req.params;
      const { date } = req.query;

      if (!date) {
        return res.status(400).json({ error: 'Date requise' });
      }

      // Récupérer les RDV existants pour cette date
      const [rdvExistants] = await db.execute(`
        SELECT TIME(date_heure) as heure
        FROM rendez_vous 
        WHERE medecin_id = ? 
        AND DATE(date_heure) = ?
        AND statut != 'annule'
        ORDER BY date_heure
      `, [medecinId, date]);

      // Générer les créneaux de 8h à 18h (toutes les 30 minutes)
      const creneaux = [];
      for (let heure = 8; heure < 18; heure++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const timeString = `${heure.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
          const estOccupe = rdvExistants.some(rdv => rdv.heure === timeString);
          
          if (!estOccupe) {
            creneaux.push(`${heure.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
          }
        }
      }

      res.json(creneaux);

    } catch (error) {
      console.error('Erreur créneaux disponibles:', error);
      res.status(500).json({ error: 'Erreur lors de la récupération des créneaux' });
    }
  }
};

module.exports = rendezvousController;