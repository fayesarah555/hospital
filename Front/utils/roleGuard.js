// Front/utils/roleGuard.js
import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, Alert } from 'react-native';
import { getCurrentUser } from '../services/api';

// 🔐 Définition des permissions par rôle
const ROLE_PERMISSIONS = {
  admin: {
    patients: { read: true, create: true, update: true, delete: true },
    users: { read: true, create: true, update: true, delete: true },
    treatments: { read: true, create: false, update: false, delete: false },
    appointments: { read: true, create: false, update: false, delete: false },
    navigation: ['AdminDashboard', 'Patients', 'Users']
  },
  
  medecin: {
    patients: { read: true, create: false, update: false, delete: false },
    users: { read: false, create: false, update: false, delete: false },
    treatments: { read: true, create: true, update: true, delete: true },
    appointments: { read: true, create: true, update: true, delete: true },
    navigation: ['DoctorDashboard', 'Patients', 'Appointments', 'NewAppointment']
  },
  
  rh: {
    patients: { read: true, create: true, update: true, delete: false },
    users: { read: false, create: false, update: false, delete: false },
    treatments: { read: true, create: false, update: false, delete: false },
    appointments: { read: true, create: false, update: false, delete: false },
    navigation: ['RHDashboard', 'Patients']
  },
  
  infirmier: {
    patients: { read: true, create: false, update: false, delete: false },
    users: { read: false, create: false, update: false, delete: false },
    treatments: { read: false, create: false, update: false, delete: false },
    appointments: { read: false, create: false, update: false, delete: false },
    navigation: ['RHDashboard', 'Patients']
  }
};

// 🔍 Vérifier si un utilisateur a une permission spécifique
export const hasPermission = async (resource, action) => {
  try {
    const user = await getCurrentUser();
    if (!user || !user.role) {
      console.log('❌ Utilisateur non connecté ou rôle manquant');
      return false;
    }
    
    const permissions = ROLE_PERMISSIONS[user.role];
    if (!permissions) {
      console.log(`❌ Rôle ${user.role} non reconnu`);
      return false;
    }
    
    const resourcePermissions = permissions[resource];
    if (!resourcePermissions) {
      console.log(`❌ Ressource ${resource} non définie pour le rôle ${user.role}`);
      return false;
    }
    
    const hasAccess = resourcePermissions[action] || false;
    console.log(`🔍 Permission ${resource}.${action} pour ${user.role}: ${hasAccess ? '✅' : '❌'}`);
    
    return hasAccess;
  } catch (error) {
    console.log('⚠️ Erreur vérification permission:', error);
    return false;
  }
};

// 🛡️ Composant de garde pour protéger les fonctionnalités
export const PermissionGuard = ({ 
  resource, 
  action, 
  children, 
  fallback = null
}) => {
  const [hasAccess, setHasAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    checkPermission();
  }, [resource, action]);
  
  const checkPermission = async () => {
    try {
      const access = await hasPermission(resource, action);
      setHasAccess(access);
    } catch (error) {
      console.log('Erreur vérification permission:', error);
      setHasAccess(false);
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isLoading) {
    return fallback;
  }
  
  return hasAccess ? children : fallback;
};

// 🔒 Hook pour vérifier les permissions dans les composants
export const usePermissions = (resource, action) => {
  const [hasAccess, setHasAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    checkAccess();
  }, [resource, action]);
  
  const checkAccess = async () => {
    try {
      const access = await hasPermission(resource, action);
      setHasAccess(access);
    } catch (error) {
      console.log('Erreur hook permissions:', error);
      setHasAccess(false);
    } finally {
      setIsLoading(false);
    }
  };
  
  return { hasAccess, isLoading };
};

// 🎭 Obtenir le label d'affichage pour un rôle
export const getRoleLabel = (role) => {
  const labels = {
    admin: '🔴 Administrateur',
    medecin: '🟢 Médecin',
    rh: '🔵 Ressources Humaines',
    infirmier: '🟡 Infirmier'
  };
  return labels[role] || role;
};

// 🎨 Obtenir la couleur pour un rôle
export const getRoleColor = (role) => {
  const colors = {
    admin: '#dc3545',
    medecin: '#28a745', 
    rh: '#007bff',
    infirmier: '#ffc107'
  };
  return colors[role] || '#6c757d';
};

// 🚨 Action protégée - exécute une action seulement si autorisée
export const protectedAction = async (resource, action, callback, options = {}) => {
  const { 
    showAlert = true, 
    alertTitle = 'Accès refusé',
    alertMessage = "Vous n'avez pas les droits pour cette action"
  } = options;
  
  try {
    const access = await hasPermission(resource, action);
    
    if (!access) {
      if (showAlert) {
        Alert.alert(alertTitle, alertMessage);
      }
      return false;
    }
    
    // Exécuter l'action si autorisée
    if (typeof callback === 'function') {
      return await callback();
    }
    
    return true;
  } catch (error) {
    console.log('Erreur action protégée:', error);
    if (showAlert) {
      Alert.alert('Erreur', 'Une erreur s\'est produite lors de la vérification des droits');
    }
    return false;
  }
};

// 📱 Wrapper pour les écrans protégés
export const ProtectedScreen = ({ 
  requiredRole, 
  children, 
  fallback = null 
}) => {
  const [canAccess, setCanAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    checkScreenAccess();
  }, [requiredRole]);
  
  const checkScreenAccess = async () => {
    try {
      const user = await getCurrentUser();
      
      if (!user || !user.role) {
        setCanAccess(false);
        return;
      }
      
      // Si requiredRole est un array, vérifier si le rôle est inclus
      if (Array.isArray(requiredRole)) {
        setCanAccess(requiredRole.includes(user.role));
      } else {
        setCanAccess(user.role === requiredRole);
      }
    } catch (error) {
      console.log('Erreur vérification accès écran:', error);
      setCanAccess(false);
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isLoading) {
    return fallback || (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
        <Text>Vérification des droits...</Text>
      </View>
    );
  }
  
  if (!canAccess) {
    return fallback || (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ fontSize: 18, color: '#dc3545', textAlign: 'center' }}>
          🚫 Accès refusé
        </Text>
        <Text style={{ marginTop: 10, color: '#6c757d', textAlign: 'center' }}>
          Vous n'avez pas les droits pour accéder à cette page
        </Text>
      </View>
    );
  }
  
  return children;
};

export default {
  hasPermission,
  PermissionGuard,
  usePermissions,
  getRoleLabel,
  getRoleColor,
  protectedAction,
  ProtectedScreen,
  ROLE_PERMISSIONS
};