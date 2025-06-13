-- ================================
-- BASE DE DONNÉES HÔPITAL COMPLÈTE
-- ================================

DROP DATABASE IF EXISTS hospital_db;
CREATE DATABASE hospital_db;
USE hospital_db;

-- ================================
-- TABLE USERS (Personnel hospitalier)
-- ================================
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  prenom VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'medecin', 'rh', 'infirmier') NOT NULL,
  specialite VARCHAR(100),
  numero_ordre VARCHAR(50),
  date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================================
-- TABLE PATIENTS (avec email pour notifications)
-- ================================
CREATE TABLE patients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  prenom VARCHAR(100) NOT NULL,
  age INT NOT NULL,
  poids DECIMAL(5,2),
  taille DECIMAL(5,2),
  email VARCHAR(255) NULL,  -- 🔥 COLONNE EMAIL AJOUTÉE
  traitement_en_cours TEXT,
  date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================================
-- TABLE TRAITEMENTS
-- ================================
CREATE TABLE traitements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  medecin_id INT NOT NULL,
  notes TEXT,
  date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (medecin_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ================================
-- TABLE MEDICAMENTS
-- ================================
CREATE TABLE medicaments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  traitement_id INT NOT NULL,
  nom VARCHAR(200) NOT NULL,
  dosage VARCHAR(100) NOT NULL,
  frequence VARCHAR(100) DEFAULT 'Non spécifiée',
  duree VARCHAR(100) DEFAULT 'Non spécifiée',
  date_ajout TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (traitement_id) REFERENCES traitements(id) ON DELETE CASCADE
);

-- ================================
-- TABLE RENDEZ-VOUS
-- ================================
CREATE TABLE rendez_vous (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  medecin_id INT NOT NULL,
  date_heure DATETIME NOT NULL,
  statut ENUM('prévu', 'en_cours', 'terminé', 'annulé') DEFAULT 'prévu',
  notes TEXT,
  date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (medecin_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ================================
-- TABLE CONSULTATIONS
-- ================================
CREATE TABLE consultations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  medecin_id INT NOT NULL,
  date_consultation DATETIME NOT NULL,
  motif TEXT,
  diagnostic TEXT,
  traitement_prescrit TEXT,
  notes TEXT,
  date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (medecin_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ================================
-- TABLE MESSAGES (notifications système)
-- ================================
CREATE TABLE messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  expediteur_id INT NOT NULL,
  destinataire_id INT NOT NULL,
  contenu TEXT NOT NULL,
  type ENUM('general', 'urgent', 'medicament', 'rendez_vous', 'traitement') DEFAULT 'general',
  lu BOOLEAN DEFAULT FALSE,
  date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (expediteur_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (destinataire_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ================================
-- TABLE HISTORIQUE (logs d'activité)
-- ================================
CREATE TABLE historique (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  patient_id INT,
  action VARCHAR(255) NOT NULL,
  details TEXT,
  date_action TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE SET NULL
);

-- ================================
-- DONNÉES D'EXEMPLE
-- ================================

-- Insertion des utilisateurs
INSERT INTO users (nom, prenom, email, password, role, specialite, numero_ordre) VALUES
('Dubois', 'Marie', 'marie.dubois@hopital.fr', '$2b$10$abcdefghijklmnopqrstuvwxyz', 'medecin', 'Cardiologie', 'CARD001'),
('Martin', 'Pierre', 'pierre.martin@hopital.fr', '$2b$10$abcdefghijklmnopqrstuvwxyz', 'medecin', 'Pédiatrie', 'PED001'),
('Leroy', 'Sophie', 'sophie.leroy@hopital.fr', '$2b$10$abcdefghijklmnopqrstuvwxyz', 'rh', NULL, NULL),
('Garcia', 'Carlos', 'carlos.garcia@hopital.fr', '$2b$10$abcdefghijklmnopqrstuvwxyz', 'admin', NULL, NULL),
('Rousseau', 'Julie', 'julie.rousseau@hopital.fr', '$2b$10$abcdefghijklmnopqrstuvwxyz', 'infirmier', 'Soins généraux', 'INF001');

-- Insertion des patients (avec emails pour notifications)
INSERT INTO patients (nom, prenom, age, poids, taille, email, traitement_en_cours) VALUES
('Durand', 'Pierre', 46, 74, 175, 'pierre.durand@email.com', 'Hypertension contrôlée'),
('Moreau', 'Marie', 32, 62, 165, 'marie.moreau@email.com', 'Suivi post-opératoire'),
('Bernard', 'Paul', 67, 80.2, 180, 'paul.bernard@email.com', 'Diabète type 2'),
('Petit', 'Anne', 28, 55, 160, 'anne.petit@email.com', 'Grossesse - suivi mensuel'),
('Roux', 'Jean', 54, 78, 178, 'jean.roux@email.com', 'Rééducation genou');

-- Insertion des traitements
INSERT INTO traitements (patient_id, medecin_id, notes) VALUES
(1, 1, 'Traitement pour hypertension - surveillance tension'),
(2, 2, 'Suivi post-opératoire appendicectomie'),
(3, 1, 'Équilibrage diabète type 2');

-- Insertion des médicaments
INSERT INTO medicaments (traitement_id, nom, dosage, frequence, duree) VALUES
(1, 'Lisinopril', '10mg', '1 fois par jour', '3 mois'),
(1, 'Amlodipine', '5mg', '1 fois par jour', '3 mois'),
(2, 'Paracétamol', '1g', 'Si douleur', '1 semaine'),
(3, 'Metformine', '500mg', '2 fois par jour', '6 mois');

-- Insertion des rendez-vous
INSERT INTO rendez_vous (patient_id, medecin_id, date_heure, notes) VALUES
(1, 1, '2025-06-20 09:00:00', 'Contrôle tension artérielle'),
(2, 2, '2025-06-22 14:30:00', 'Consultation post-opératoire'),
(3, 1, '2025-06-25 10:15:00', 'Bilan diabète et ajustement traitement'),
(4, 2, '2025-06-28 16:00:00', 'Suivi grossesse - 3ème trimestre');

-- Insertion des consultations historiques
INSERT INTO consultations (patient_id, medecin_id, date_consultation, motif, diagnostic, traitement_prescrit) VALUES
(1, 1, '2025-06-10 10:00:00', 'Contrôle hypertension', 'Hypertension stabilisée', 'Poursuite traitement actuel'),
(2, 2, '2025-06-12 15:30:00', 'Douleurs abdominales', 'Appendicite aiguë', 'Appendicectomie en urgence');

-- ================================
-- VUES UTILES
-- ================================

-- Vue des patients avec leur dernier traitement
CREATE VIEW patients_avec_traitements AS
SELECT 
    p.*,
    t.notes as dernier_traitement,
    t.date_creation as date_dernier_traitement,
    CONCAT(u.prenom, ' ', u.nom) as medecin_responsable
FROM patients p
LEFT JOIN traitements t ON p.id = t.patient_id
LEFT JOIN users u ON t.medecin_id = u.id
WHERE t.id = (
    SELECT MAX(id) FROM traitements WHERE patient_id = p.id
);

-- Vue des rendez-vous avec informations complètes
CREATE VIEW rendez_vous_complets AS
SELECT 
    rdv.*,
    CONCAT(p.prenom, ' ', p.nom) as nom_patient,
    p.email as email_patient,
    CONCAT(u.prenom, ' ', u.nom) as nom_medecin,
    u.specialite
FROM rendez_vous rdv
JOIN patients p ON rdv.patient_id = p.id
JOIN users u ON rdv.medecin_id = u.id;

-- ================================
-- INDEX POUR PERFORMANCE
-- ================================

CREATE INDEX idx_patients_email ON patients(email);
CREATE INDEX idx_rendez_vous_date ON rendez_vous(date_heure);
CREATE INDEX idx_traitements_patient ON traitements(patient_id);
CREATE INDEX idx_medicaments_traitement ON medicaments(traitement_id);
CREATE INDEX idx_messages_destinataire ON messages(destinataire_id);

-- ================================
-- PERMISSIONS (optionnel)
-- ================================

-- Créer des utilisateurs spécialisés
-- CREATE USER 'hospital_api'@'localhost' IDENTIFIED BY 'secure_password_123';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON hospital_db.* TO 'hospital_api'@'localhost';
-- FLUSH PRIVILEGES;

-- ================================
-- RÉSUMÉ DES MODIFICATIONS
-- ================================

-- 🔥 MODIFICATIONS APPORTÉES :
-- 1. ✅ Colonne EMAIL ajoutée à la table PATIENTS
-- 2. ✅ Contraintes de clé étrangère optimisées
-- 3. ✅ Données d'exemple avec emails
-- 4. ✅ Vues pour faciliter les requêtes
-- 5. ✅ Index pour améliorer les performances
-- 6. ✅ Structure complète pour le système hospitalier

-- ================================
-- COMMANDES DE VÉRIFICATION
-- ================================

-- Vérifier la structure des patients :
-- DESCRIBE patients;

-- Vérifier les patients avec email :
-- SELECT id, nom, prenom, email FROM patients WHERE email IS NOT NULL;

-- Tester les notifications :
-- SELECT * FROM patients_avec_traitements;