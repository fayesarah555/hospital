-- Créer la base de données
CREATE DATABASE IF NOT EXISTS hospital_db;
USE hospital_db;

-- Table des utilisateurs (RH, Médecins, Admin)
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('rh', 'medecin', 'admin') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des patients
CREATE TABLE patients (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    age INT NOT NULL,
    poids FLOAT,
    taille FLOAT,
    traitement_en_cours TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des médicaments
CREATE TABLE medicaments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nom VARCHAR(100) NOT NULL,
    dosage VARCHAR(50),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des traitements
CREATE TABLE traitements (
    id INT PRIMARY KEY AUTO_INCREMENT,
    patient_id INT NOT NULL,
    medecin_id INT NOT NULL,
    medicaments JSON, -- Liste des médicaments avec dosages
    notes TEXT,
    date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (medecin_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Table des rendez-vous
CREATE TABLE rendez_vous (
    id INT PRIMARY KEY AUTO_INCREMENT,
    patient_id INT NOT NULL,
    medecin_id INT NOT NULL,
    date_heure DATETIME NOT NULL,
    statut ENUM('planifie', 'termine', 'annule') DEFAULT 'planifie',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (medecin_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Table des messages
CREATE TABLE messages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    expediteur_id INT NOT NULL,
    destinataire_id INT NOT NULL,
    contenu TEXT NOT NULL,
    type ENUM('traitement', 'rdv', 'general') DEFAULT 'general',
    lu BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (expediteur_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (destinataire_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Insérer quelques médicaments de base
INSERT INTO medicaments (nom, dosage, description) VALUES
('Paracétamol', '500mg', 'Antalgique et antipyrétique'),
('Ibuprofène', '400mg', 'Anti-inflammatoire non stéroïdien'),
('Amoxicilline', '1g', 'Antibiotique à large spectre'),
('Oméprazole', '20mg', 'Inhibiteur de la pompe à protons'),
('Aspirine', '100mg', 'Antiagrégant plaquettaire');

-- Créer un utilisateur admin par défaut
-- Mot de passe: admin123 (à changer en production!)
INSERT INTO users (nom, prenom, email, password, role) VALUES
('Admin', 'Système', 'admin@hospital.com', '$2a$10$8kZY.ZJZyKxPdMaXcgv8o.xYqf8qGxL5FoXzQKZn1YzRzYCzNcYqe', 'admin');

-- Créer un médecin de test
-- Mot de passe: medecin123
INSERT INTO users (nom, prenom, email, password, role) VALUES
('Dupont', 'Jean', 'medecin@hospital.com', '$2a$10$8kZY.ZJZyKxPdMaXcgv8o.xYqf8qGxL5FoXzQKZn1YzRzYCzNcYqe', 'medecin');

-- Créer un RH de test
-- Mot de passe: rh123
INSERT INTO users (nom, prenom, email, password, role) VALUES
('Martin', 'Sophie', 'rh@hospital.com', '$2a$10$8kZY.ZJZyKxPdMaXcgv8o.xYqf8qGxL5FoXzQKZn1YzRzYCzNcYqe', 'rh');

-- Insérer quelques patients de test
INSERT INTO patients (nom, prenom, age, poids, taille, traitement_en_cours) VALUES
('Durand', 'Pierre', 45, 75.5, 175, 'Traitement hypertension'),
('Moreau', 'Marie', 32, 62.0, 165, 'Suivi post-opératoire'),
('Bernard', 'Paul', 67, 80.2, 180, 'Diabète type 2');

-- Index pour optimiser les performances
CREATE INDEX idx_patients_nom ON patients(nom, prenom);
CREATE INDEX idx_traitements_patient ON traitements(patient_id);
CREATE INDEX idx_traitements_medecin ON traitements(medecin_id);
CREATE INDEX idx_rdv_medecin_date ON rendez_vous(medecin_id, date_heure);
CREATE INDEX idx_messages_destinataire ON messages(destinataire_id, lu);