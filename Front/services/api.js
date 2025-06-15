// services/api.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, DEV_CONFIG } from '../config/config';

// ✅ Utiliser la configuration centralisée
const API_BASE_URL = API_CONFIG.BASE_URL;

// Instance axios configurée
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
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
        if (DEV_CONFIG.LOG_REQUESTS) {
          console.log('🔑 Token ajouté aux headers');
          console.log(`📡 ${config.method?.toUpperCase()} ${config.url}`);
        }
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
  (response) => {
    if (DEV_CONFIG.LOG_REQUESTS) {
      console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
    }
    return response;
  },
  async (error) => {
    if (DEV_CONFIG.SHOW_ERROR_DETAILS) {
      console.log('❌ Erreur API:', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        message: error.message,
        baseURL: error.config?.baseURL
      });
    }
    
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

// 🔧 Fonction de diagnostic pour le debug
export const diagnosePage = async () => {
  console.log('🔍 DIAGNOSTIC API');
  console.log('================');
  console.log('URL de base:', API_BASE_URL);
  console.log('Timeout:', API_CONFIG.TIMEOUT);
  
  try {
    // Test de connectivité
    const testResponse = await apiClient.get('/health', { timeout: 5000 });
    console.log('✅ Backend accessible:', testResponse.status);
  } catch (error) {
    console.log('❌ Backend inaccessible:', error.message);
    
    if (error.code === 'NETWORK_ERROR') {
      console.log('💡 Solutions possibles:');
      console.log('- Vérifiez que le backend est démarré');
      console.log(`- Vérifiez l'IP: ${API_CONFIG.HOST}`);
      console.log(`- Vérifiez le port: ${API_CONFIG.PORT}`);
      console.log('- Vérifiez votre connexion WiFi');
    }
  }
  
  // Vérification du token
  const token = await AsyncStorage.getItem('authToken');
  console.log('Token présent:', !!token);
  
  if (token) {
    console.log('Token (premiers caractères):', token.substring(0, 20) + '...');
  }
};

export default apiClient;