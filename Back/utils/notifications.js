const db = require('../config/db');
const nodemailer = require('nodemailer');

// Configuration du transporteur email
const createEmailTransporter = () => {
  return nodemailer.createTransport({  // ← TRANSPORT pas TRANSPORTER !
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true pour 465, false pour les autres ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

// Fonction pour envoyer une notification/message automatique
const sendNotificationMessage = async (expediteurId, destinataireId, contenu, type = 'general') => {
  try {
    console.log(`🔔 DÉBUT sendNotificationMessage:`);
    console.log(`- Expediteur ID: ${expediteurId}`);
    console.log(`- Destinataire ID: ${destinataireId}`);
    console.log(`- Type: ${type}`);
    console.log(`- Contenu: ${contenu.substring(0, 100)}...`);
    
    // Pour TOUTES les notifications aux patients, on envoie seulement l'email (pas de stockage en base)
    // On vérifie si c'est une notification patient (destinataireId correspond à un patient)
    try {
      const [patients] = await db.execute(
        'SELECT email FROM patients WHERE id = ?',
        [destinataireId]
      );
      
      console.log(`👤 Recherche patient ID ${destinataireId}:`, patients);
      
      if (patients.length > 0) {
        // C'est bien un patient, on envoie l'email sans stocker en base
        console.log(`🎯 Notification patient détectée - envoi email direct sans stockage base`);
        
        if (patients[0].email) {
          console.log(`📧 Email patient trouvé: ${patients[0].email}`);
          console.log(`🚀 Envoi email en cours...`);
          
          const emailSuccess = await sendEmail(
            patients[0].email,
            'Notification - Système Hospitalier',
            contenu
          );
          
          console.log(`📧 Résultat envoi email: ${emailSuccess ? 'SUCCÈS' : 'ÉCHEC'}`);
          
          if (emailSuccess) {
            console.log(`✅ Email envoyé avec succès - pas de stockage en base pour les patients`);
          }
        } else {
          console.log(`⚠️  Patient trouvé mais pas d'email configuré`);
        }
        
        console.log(`✅ FIN sendNotificationMessage (patient)`);
        return true;
      } else {
        // Ce n'est pas un patient, c'est peut-être un user
        console.log(`👥 Pas un patient - vérification si c'est un utilisateur...`);
        
        const [users] = await db.execute(
          'SELECT email FROM users WHERE id = ?',
          [destinataireId]
        );
        
        if (users.length > 0) {
          // C'est un utilisateur, on stocke en base
          console.log(`💬 Message utilisateur - stockage en base`);
          await db.execute(
            'INSERT INTO messages (expediteur_id, destinataire_id, contenu, type) VALUES (?, ?, ?, ?)',
            [expediteurId, destinataireId, contenu, type]
          );
          console.log(`📧 Message enregistré en base`);
        } else {
          console.log(`⚠️  Destinataire ID ${destinataireId} non trouvé ni dans patients ni dans users`);
        }
      }
    } catch (searchError) {
      console.log('❌ Erreur lors de la recherche destinataire:', searchError);
    }
    
    console.log(`✅ FIN sendNotificationMessage`);
    return true;
  } catch (error) {
    console.error('❌ Erreur envoi notification:', error);
    return false;
  }
};

// Fonction pour envoyer un email réel
const sendEmail = async (to, subject, text, html = null) => {
  try {
    console.log(`📧 Tentative d'envoi email à ${to}...`);
    
    const transporter = createEmailTransporter();
    
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM}>`,
      to: to,
      subject: subject,
      text: text,
      html: html || `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">🏥 ${process.env.EMAIL_FROM_NAME}</h2>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 5px;">
            <p style="margin: 0; white-space: pre-line;">${text}</p>
          </div>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #dee2e6;">
          <p style="font-size: 12px; color: #6c757d;">
            Ceci est un message automatique du système hospitalier.<br>
            Merci de ne pas répondre à cet email.
          </p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email envoyé avec succès à ${to} - ID: ${info.messageId}`);
    
    return true;
  } catch (error) {
    console.error(`❌ Erreur envoi email à ${to}:`, error.message);
    return false;
  }
};

// Fonction pour tester la configuration email
const testEmailConfig = async () => {
  try {
    console.log('📧 Variables email:');
    console.log('- EMAIL_HOST:', process.env.EMAIL_HOST);
    console.log('- EMAIL_PORT:', process.env.EMAIL_PORT);
    console.log('- EMAIL_USER:', process.env.EMAIL_USER);
    console.log('- EMAIL_PASS:', process.env.EMAIL_PASS ? 'Configuré' : 'NON CONFIGURÉ');
    console.log('- EMAIL_FROM_NAME:', process.env.EMAIL_FROM_NAME);
    console.log('- EMAIL_FROM:', process.env.EMAIL_FROM);
    
    const transporter = createEmailTransporter();
    await transporter.verify();
    console.log('✅ Configuration email valide');
    return true;
  } catch (error) {
    console.error('❌ Erreur configuration email:', error.message);
    return false;
  }
};

// Fonction pour envoyer un email de test
const sendTestEmail = async () => {
  try {
    console.log('🧪 Début du test email...');
    console.log('📧 Destination:', process.env.EMAIL_USER);
    
    const success = await sendEmail(
      process.env.EMAIL_USER, // S'envoyer un email de test
      'Test - Système Hospitalier',
      'Ceci est un email de test.\nSi vous recevez ce message, la configuration email fonctionne correctement !'
    );
    
    if (success) {
      console.log('✅ Email de test envoyé avec succès !');
    } else {
      console.log('❌ Échec envoi email de test');
    }
    
    return success;
  } catch (error) {
    console.error('❌ Erreur email de test:', error);
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
    `Votre traitement a été mis à jour par Dr. ${medecinNom}.\n\nNouveaux médicaments:\n${medicaments}\n\nCordialement,\nL'équipe médicale`,
  
  medicamentAjoute: (medecinNom, medicament, dosage) =>
    `Nouveau médicament ajouté à votre traitement par Dr. ${medecinNom}:\n\n• ${medicament} (${dosage})\n\nPensez à bien respecter la posologie.\n\nCordialement,\nL'équipe médicale`,
  
  medicamentSupprime: (medecinNom, medicament) =>
    `Médicament retiré de votre traitement par Dr. ${medecinNom}:\n\n• ${medicament}\n\nVeuillez arrêter la prise de ce médicament.\n\nCordialement,\nL'équipe médicale`,
  
  nouveauRendezVous: (medecinNom, date) =>
    `Nouveau rendez-vous programmé avec Dr. ${medecinNom}\n\n📅 Date: ${date}\n\nMerci d'être ponctuel(le).\n\nCordialement,\nL'équipe médicale`,
  
  rendezVousModifie: (medecinNom, nouvelleDate) =>
    `Votre rendez-vous avec Dr. ${medecinNom} a été reprogrammé\n\n📅 Nouvelle date: ${nouvelleDate}\n\nMerci de noter ce changement.\n\nCordialement,\nL'équipe médicale`,
  
  rendezVousAnnule: (medecinNom) =>
    `Votre rendez-vous avec Dr. ${medecinNom} a été annulé\n\nVeuillez nous contacter pour reprendre un nouveau rendez-vous.\n\nCordialement,\nL'équipe médicale`,
  
  rappelRendezVous: (medecinNom, date) =>
    `🔔 Rappel: Vous avez un rendez-vous avec Dr. ${medecinNom}\n\n📅 Date: ${date}\n\nN'oubliez pas !\n\nCordialement,\nL'équipe médicale`
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
  formatDate,
  testEmailConfig,
  sendTestEmail
};