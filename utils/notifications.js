const db = require('../config/db');

// Fonction pour envoyer une notification/message automatique
const sendNotificationMessage = async (expediteurId, destinataireId, contenu, type = 'general') => {
  try {
    // Note: Dans un vrai système hospitalier, destinataireId serait l'ID d'un compte patient
    // Ici on utilise un système simplifié où on crée un message général
    
    await db.execute(
      'INSERT INTO messages (expediteur_id, destinataire_id, contenu, type) VALUES (?, ?, ?, ?)',
      [expediteurId, destinataireId, contenu, type]
    );

    console.log(`📧 Notification envoyée: ${type} - ${contenu.substring(0, 50)}...`);
    
    return true;
  } catch (error) {
    console.error('Erreur envoi notification:', error);
    return false;
  }
};

// Fonction pour envoyer un email (placeholder pour l'implémentation future)
const sendEmail = async (to, subject, text) => {
  try {
    // TODO: Implémenter l'envoi d'email réel avec nodemailer
    console.log(`📧 Email à envoyer à ${to}:`);
    console.log(`Sujet: ${subject}`);
    console.log(`Message: ${text}`);
    
    // Retourner true pour simuler un envoi réussi
    return true;
  } catch (error) {
    console.error('Erreur envoi email:', error);
    return false;
  }
};

// Fonction pour envoyer un SMS (placeholder pour l'implémentation future)
const sendSMS = async (phoneNumber, message) => {
  try {
    // TODO: Implémenter l'envoi de SMS avec un service comme Twilio
    console.log(`📱 SMS à envoyer au ${phoneNumber}:`);
    console.log(`Message: ${message}`);
    
    return true;
  } catch (error) {
    console.error('Erreur envoi SMS:', error);
    return false;
  }
};

// Templates de messages prédéfinis
const messageTemplates = {
  traitementModifie: (medecinNom, medicaments) => 
    `Votre traitement a été mis à jour par Dr. ${medecinNom}.\nNouveaux médicaments: ${medicaments}`,
  
  medicamentAjoute: (medecinNom, medicament, dosage) =>
    `Nouveau médicament ajouté à votre traitement par Dr. ${medecinNom}: ${medicament} (${dosage})`,
  
  medicamentSupprime: (medecinNom, medicament) =>
    `Médicament retiré de votre traitement par Dr. ${medecinNom}: ${medicament}`,
  
  nouveauRendezVous: (medecinNom, date) =>
    `Nouveau rendez-vous programmé avec Dr. ${medecinNom} le ${date}`,
  
  rendezVousModifie: (medecinNom, nouvelleDate) =>
    `Votre rendez-vous avec Dr. ${medecinNom} a été reprogrammé au ${nouvelleDate}`,
  
  rendezVousAnnule: (medecinNom) =>
    `Votre rendez-vous avec Dr. ${medecinNom} a été annulé`,
  
  rappelRendezVous: (medecinNom, date) =>
    `Rappel: Vous avez un rendez-vous avec Dr. ${medecinNom} le ${date}`
};

// Fonction pour formater une date en français
const formatDate = (date) => {
  return new Date(date).toLocaleString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

module.exports = {
  sendNotificationMessage,
  sendEmail,
  sendSMS,
  messageTemplates,
  formatDate
};