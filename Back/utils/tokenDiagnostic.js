// Front/utils/tokenDiagnostic.js - Script pour diagnostiquer le token

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentUser } from '../services/api';
import { API_CONFIG } from '../config/config';

export const diagnoseToken = async () => {
  console.log('\n🔍 === DIAGNOSTIC TOKEN JWT ===');
  
  try {
    // 1. Récupérer le token stocké
    const token = await AsyncStorage.getItem('authToken');
    console.log('🔑 Token présent:', !!token);
    
    if (!token) {
      console.log('❌ Aucun token trouvé dans AsyncStorage');
      return;
    }
    
    console.log('🔑 Token (100 premiers caractères):', token.substring(0, 100) + '...');
    
    // 2. Décoder le token JWT manuellement
    try {
      const parts = token.split('.');
      console.log('📋 Parties du JWT:', parts.length);
      
      if (parts.length === 3) {
        // Décoder le header
        const header = JSON.parse(atob(parts[0]));
        console.log('📄 Header JWT:', header);
        
        // Décoder le payload
        const payload = JSON.parse(atob(parts[1]));
        console.log('📋 Payload JWT:', {
          id: payload.id,
          email: payload.email,
          role: payload.role,
          roleType: typeof payload.role,
          iat: new Date(payload.iat * 1000).toLocaleString(),
          exp: new Date(payload.exp * 1000).toLocaleString(),
          isExpired: payload.exp * 1000 < Date.now()
        });
        
        // Vérifier l'expiration
        if (payload.exp * 1000 < Date.now()) {
          console.log('⚠️ TOKEN EXPIRÉ !');
        } else {
          console.log('✅ Token encore valide');
        }
        
        // Vérifier le rôle spécifiquement
        console.log('🔍 Analyse du rôle:');
        console.log('  - Rôle brut:', JSON.stringify(payload.role));
        console.log('  - Rôle type:', typeof payload.role);
        console.log('  - Rôle longueur:', payload.role?.length);
        console.log('  - Rôle === "rh":', payload.role === 'rh');
        console.log('  - Rôle trim():', payload.role?.trim?.());
        
      } else {
        console.log('❌ Format JWT invalide');
      }
    } catch (decodeError) {
      console.log('❌ Erreur décodage JWT:', decodeError.message);
    }
    
    // 3. Vérifier les données utilisateur stockées
    const userData = await getCurrentUser();
    console.log('👤 Données utilisateur stockées:', userData);
    
    if (userData) {
      console.log('🔍 Analyse utilisateur:');
      console.log('  - ID:', userData.id);
      console.log('  - Email:', userData.email);
      console.log('  - Rôle:', JSON.stringify(userData.role));
      console.log('  - Rôle type:', typeof userData.role);
    }
    
    // 4. Test API direct avec curl equivalent
    console.log('🌐 Test API direct...');
    
    const testResponse = await fetch(`${API_CONFIG.BASE_URL}/patients`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📡 Réponse API:', {
      status: testResponse.status,
      statusText: testResponse.statusText,
      ok: testResponse.ok
    });
    
    if (!testResponse.ok) {
      const errorText = await testResponse.text();
      console.log('❌ Erreur API détaillée:', errorText);
      
      try {
        const errorJson = JSON.parse(errorText);
        console.log('📋 Erreur parsée:', errorJson);
      } catch (e) {
        console.log('📋 Réponse brute:', errorText);
      }
    } else {
      console.log('✅ API accessible');
    }
    
  } catch (error) {
    console.log('❌ Erreur diagnostic:', error);
  }
  
  console.log('🏁 === FIN DIAGNOSTIC TOKEN ===\n');
};

// Fonction simple pour déboguer rapidement
export const quickTokenCheck = async () => {
  const token = await AsyncStorage.getItem('authToken');
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      console.log('🔍 QUICK CHECK - Rôle:', payload.role, '| Expiré:', payload.exp * 1000 < Date.now());
    } catch (e) {
      console.log('🔍 QUICK CHECK - Token invalide');
    }
  } else {
    console.log('🔍 QUICK CHECK - Pas de token');
  }
};

// Fonction pour régénérer un token propre
export const refreshAuth = async () => {
  console.log('🔄 Nettoyage des données d\'authentification...');
  await AsyncStorage.removeItem('authToken');
  await AsyncStorage.removeItem('userData');
  console.log('✅ Données supprimées, reconnectez-vous');
};