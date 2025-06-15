import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View, Text, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

// Import des écrans
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import AdminHomeScreen from './screens/AdminHomeScreen';
import PatientsListScreen from './screens/PatientsListScreen';
import RHHomeScreen from './screens/RHHomeScreen';
import DoctorHomeScreen from './screens/DoctorHomeScreen';
import AppointmentScreen from './screens/AppointmentScreen';
import AppointmentsListScreen from './screens/AppointmentsListScreen';

// Import du service API et du système de rôles
import { isAuthenticated, getCurrentUser } from './services/api';
import { ProtectedScreen, getRoleColor } from './utils/roleGuard';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// 🩺 Navigation pour les MÉDECINS
function DoctorTabs() {
	return (
		<ProtectedScreen requiredRole="medecin">
			<Tab.Navigator
				screenOptions={({ route }) => ({
					tabBarIcon: ({ focused, color, size }) => {
						let iconName;
						if (route.name === 'DoctorDashboard') {
							iconName = focused ? 'home' : 'home-outline';
						} else if (route.name === 'Patients') {
							iconName = focused ? 'people' : 'people-outline';
						} else if (route.name === 'Appointments') {
							iconName = focused ? 'calendar' : 'calendar-outline';
						} else if (route.name === 'NewAppointment') {
							iconName = focused ? 'add-circle' : 'add-circle-outline';
						}
						return <Icon name={iconName} size={size} color={color} />;
					},
					tabBarActiveTintColor: '#28a745',
					tabBarInactiveTintColor: 'gray',
					headerShown: true,
				})}
			>
				<Tab.Screen 
					name="DoctorDashboard" 
					component={DoctorHomeScreen}
					options={{ title: '🩺 Accueil Médecin' }}
				/>
				<Tab.Screen 
					name="Patients" 
					component={PatientsListScreen}
					options={{ title: '👥 Patients' }}
				/>
				<Tab.Screen 
					name="Appointments" 
					component={AppointmentsListScreen}
					options={{ title: '📅 Rendez-vous' }}
				/>
				<Tab.Screen 
					name="NewAppointment" 
					component={AppointmentScreen}
					options={{ title: '➕ Nouveau RDV' }}
				/>
			</Tab.Navigator>
		</ProtectedScreen>
	);
}

// 👥 Navigation pour les RH et INFIRMIERS
function RHTabs() {
	return (
		<ProtectedScreen requiredRole={['rh', 'infirmier']}>
			<Tab.Navigator
				screenOptions={({ route }) => ({
					tabBarIcon: ({ focused, color, size }) => {
						let iconName;
						if (route.name === 'RHDashboard') {
							iconName = focused ? 'home' : 'home-outline';
						} else if (route.name === 'Patients') {
							iconName = focused ? 'people' : 'people-outline';
						}
						return <Icon name={iconName} size={size} color={color} />;
					},
					tabBarActiveTintColor: '#007bff',
					tabBarInactiveTintColor: 'gray',
					headerShown: true,
				})}
			>
				<Tab.Screen 
					name="RHDashboard" 
					component={RHHomeScreen}
					options={{ title: '👥 Accueil RH' }}
				/>
				<Tab.Screen 
					name="Patients" 
					component={PatientsListScreen}
					options={{ title: '📋 Liste Patients' }}
				/>
			</Tab.Navigator>
		</ProtectedScreen>
	);
}

// 🔴 Navigation pour les ADMINS
function AdminTabs() {
	return (
		<ProtectedScreen requiredRole="admin">
			<Tab.Navigator
				screenOptions={({ route }) => ({
					tabBarIcon: ({ focused, color, size }) => {
						let iconName;
						if (route.name === 'AdminDashboard') {
							iconName = focused ? 'settings' : 'settings-outline';
						} else if (route.name === 'Patients') {
							iconName = focused ? 'people' : 'people-outline';
						}
						return <Icon name={iconName} size={size} color={color} />;
					},
					tabBarActiveTintColor: '#dc3545',
					tabBarInactiveTintColor: 'gray',
					headerShown: true,
				})}
			>
				<Tab.Screen 
					name="AdminDashboard" 
					component={AdminHomeScreen}
					options={{ title: '🔴 Administration' }}
				/>
				<Tab.Screen 
					name="Patients" 
					component={PatientsListScreen}
					options={{ title: '📋 Patients' }}
				/>
			</Tab.Navigator>
		</ProtectedScreen>
	);
}

// 🚫 Écran d'accès refusé
function AccessDeniedScreen({ userRole }) {
	return (
		<View style={{ 
			flex: 1, 
			justifyContent: 'center', 
			alignItems: 'center',
			backgroundColor: '#f8f9fa',
			padding: 20
		}}>
			<Text style={{ 
				fontSize: 24, 
				color: '#dc3545',
				marginBottom: 10,
				textAlign: 'center'
			}}>
				🚫 Accès refusé
			</Text>
			<Text style={{ 
				fontSize: 16, 
				color: '#6c757d',
				textAlign: 'center',
				marginBottom: 20
			}}>
				Votre rôle "{userRole}" n'a pas accès à cette section de l'application.
			</Text>
			<Text style={{ 
				fontSize: 14, 
				color: '#6c757d',
				textAlign: 'center'
			}}>
				Contactez l'administrateur si vous pensez qu'il s'agit d'une erreur.
			</Text>
		</View>
	);
}

// 🔒 Composant principal de l'application avec sécurité
export default function App() {
	const [isLoading, setIsLoading] = useState(true);
	const [user, setUser] = useState(null);

	// Vérifier l'authentification au démarrage
	useEffect(() => {
		checkAuthenticationStatus();
	}, []);

	const checkAuthenticationStatus = async () => {
		try {
			const authenticated = await isAuthenticated();
			if (authenticated) {
				const currentUser = await getCurrentUser();
				setUser(currentUser);
				console.log('✅ Utilisateur connecté:', currentUser);
				
				// Vérifier que le rôle est valide
				const validRoles = ['admin', 'medecin', 'rh', 'infirmier'];
				if (!validRoles.includes(currentUser?.role)) {
					console.log('⚠️ Rôle invalide:', currentUser?.role);
					Alert.alert(
						'Erreur de compte',
						'Votre compte a un rôle invalide. Veuillez contacter l\'administrateur.',
						[
							{
								text: 'Se déconnecter',
								onPress: () => {
									setUser(null);
									// Optionnel: effacer le token
								}
							}
						]
					);
					return;
				}
			} else {
				console.log('❌ Aucun utilisateur connecté');
			}
		} catch (error) {
			console.log('⚠️ Erreur vérification auth:', error);
		} finally {
			setIsLoading(false);
		}
	};

	// Écran de chargement
	if (isLoading) {
		return (
			<View style={{ 
				flex: 1, 
				justifyContent: 'center', 
				alignItems: 'center', 
				backgroundColor: '#e6f2ff' 
			}}>
				<ActivityIndicator size="large" color="#007bff" />
				<Text style={{ 
					marginTop: 10, 
					fontSize: 16, 
					color: '#6c757d',
					textAlign: 'center'
				}}>
					🔒 Vérification des droits d'accès...
				</Text>
			</View>
		);
	}

	// 🛣️ Fonction pour obtenir la navigation sécurisée selon le rôle
	const getSecureNavigator = () => {
		if (!user) {
			// Navigation d'authentification
			return (
				<Stack.Navigator 
					initialRouteName="Login"
					screenOptions={{ headerShown: false }}
				>
					<Stack.Screen name="Login" component={LoginScreen} />
					<Stack.Screen name="RegisterScreen" component={RegisterScreen} />
				</Stack.Navigator>
			);
		}

		// 🔐 Navigation sécurisée selon le rôle de l'utilisateur
		switch (user.role) {
			case 'medecin':
				console.log('🟢 Navigation Médecin activée');
				return (
					<Stack.Navigator screenOptions={{ headerShown: false }}>
						<Stack.Screen name="MainTabs" component={DoctorTabs} />
					</Stack.Navigator>
				);
			
			case 'rh':
				console.log('🔵 Navigation RH activée');
				return (
					<Stack.Navigator screenOptions={{ headerShown: false }}>
						<Stack.Screen name="MainTabs" component={RHTabs} />
					</Stack.Navigator>
				);
				
			case 'infirmier':
				console.log('🟡 Navigation Infirmier activée (interface RH)');
				return (
					<Stack.Navigator screenOptions={{ headerShown: false }}>
						<Stack.Screen name="MainTabs" component={RHTabs} />
					</Stack.Navigator>
				);
			
			case 'admin':
				console.log('🔴 Navigation Admin activée');
				return (
					<Stack.Navigator screenOptions={{ headerShown: false }}>
						<Stack.Screen name="MainTabs" component={AdminTabs} />
					</Stack.Navigator>
				);
			
			default:
				console.log('⚠️ Rôle non reconnu ou non autorisé:', user.role);
				// Afficher un écran d'accès refusé au lieu de rediriger vers login
				return (
					<Stack.Navigator screenOptions={{ headerShown: false }}>
						<Stack.Screen 
							name="AccessDenied" 
							children={() => <AccessDeniedScreen userRole={user.role} />}
						/>
					</Stack.Navigator>
				);
		}
	};

	return (
		<NavigationContainer>
			{getSecureNavigator()}
		</NavigationContainer>
	);
}

/*
🔒 RÉSUMÉ DES ACCÈS PAR RÔLE :

🔴 ADMIN :
- ✅ Gestion des utilisateurs
- ✅ Consultation des patients  
- ✅ Vue d'ensemble du système

🟢 MÉDECIN :
- ✅ Dashboard médecin
- ✅ Gestion des patients (consultation)
- ✅ Gestion complète des rendez-vous
- ✅ Gestion des traitements

🔵 RH :
- ✅ Dashboard RH
- ✅ Gestion des patients (création, modification)
- ✅ Consultation des rendez-vous (lecture seule)

🟡 INFIRMIER :
- ✅ Dashboard RH (interface simplifiée)
- ✅ Consultation des patients (lecture seule)
- ❌ Pas d'accès aux rendez-vous ni traitements

🚫 PROTECTIONS MISES EN PLACE :
- Vérification du rôle à chaque navigation
- Écrans protégés par ProtectedScreen
- Validation des rôles au démarrage
- Gestion des rôles invalides
- Interface adaptée selon les permissions
*/