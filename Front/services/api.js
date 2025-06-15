// services/api.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuration de base
const API_BASE_URL = 'http://localhost:3000/api';

// Instance axios configurée
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter automatiquement le token JWT
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('🔑 Token ajouté aux headers');
      }
    } catch (error) {
      console.log('⚠️ Erreur récupération token:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur pour gérer les erreurs d'authentification
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      console.log('🚫 Token expiré, déconnexion...');
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userData');
      // Navigation vers Login sera gérée dans les composants
    }
    return Promise.reject(error);
  }
);

// ================================
// SERVICES API
// ================================

export const authAPI = {
  // Connexion
  login: (credentials) => 
    apiClient.post('/auth/login', credentials),
  
  // Inscription
  register: (userData) => 
    apiClient.post('/auth/register', userData),
  
  // Déconnexion
  logout: async () => {
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('userData');
  },
};

export const patientsAPI = {
  // Liste des patients
  getAll: () => 
    apiClient.get('/patients'),
  
  // Détails d'un patient
  getById: (id) => 
    apiClient.get(`/patients/${id}`),
  
  // Créer un patient
  create: (patientData) => 
    apiClient.post('/patients', patientData),
  
  // Modifier un patient
  update: (id, patientData) => 
    apiClient.put(`/patients/${id}`, patientData),
  
  // Supprimer un patient
  delete: (id) => 
    apiClient.delete(`/patients/${id}`),
};

export const usersAPI = {
  // Liste des utilisateurs (pour admin)
  getAll: () => 
    apiClient.get('/users'),
  
  // Créer un utilisateur
  create: (userData) => 
    apiClient.post('/users', userData),
  
  // Modifier un utilisateur
  update: (id, userData) => 
    apiClient.put(`/users/${id}`, userData),
  
  // Supprimer un utilisateur
  delete: (id) => 
    apiClient.delete(`/users/${id}`),
};

export const traitementsAPI = {
  // Traitements d'un patient
  getByPatient: (patientId) => 
    apiClient.get(`/traitements/patient/${patientId}`),
  
  // Créer un traitement
  create: (treatmentData) => 
    apiClient.post('/traitements', treatmentData),
  
  // Ajouter un médicament
  addMedicine: (patientId, medicineData) => 
    apiClient.post(`/traitements/patient/${patientId}/medicament`, medicineData),
  
  // Supprimer un médicament
  removeMedicine: (patientId, medicineId) => 
    apiClient.delete(`/traitements/patient/${patientId}/medicament/${medicineId}`),
  
  // Modifier un traitement
  update: (id, treatmentData) => 
    apiClient.put(`/traitements/${id}`, treatmentData),
};

export const rendezVousAPI = {
  // Tous les rendez-vous
  getAll: () => 
    apiClient.get('/rendez-vous'),
  
  // Rendez-vous d'un patient
  getByPatient: (patientId) => 
    apiClient.get(`/rendez-vous/patient/${patientId}`),
  
  // Créer un rendez-vous
  create: (appointmentData) => 
    apiClient.post('/rendez-vous', appointmentData),
  
  // Modifier un rendez-vous
  update: (id, appointmentData) => 
    apiClient.put(`/rendez-vous/${id}`, appointmentData),
  
  // Supprimer un rendez-vous
  delete: (id) => 
    apiClient.delete(`/rendez-vous/${id}`),
};

// Fonction utilitaire pour récupérer les données utilisateur stockées
export const getCurrentUser = async () => {
  try {
    const userData = await AsyncStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.log('Erreur récupération utilisateur:', error);
    return null;
  }
};

// Fonction utilitaire pour vérifier si l'utilisateur est connecté
export const isAuthenticated = async () => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    return !!token;
  } catch (error) {
    return false;
  }
};

export default apiClient;