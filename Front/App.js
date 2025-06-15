import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View, Text } from 'react-native';
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

// Import du service API
import { isAuthenticated, getCurrentUser } from './services/api';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Navigation pour les médecins
function DoctorTabs() {
	return (
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
	);
}

// Navigation pour les RH
function RHTabs() {
	return (
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
	);
}

// Navigation pour les admins
function AdminTabs() {
	return (
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
	);
}

// Composant principal de l'application
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
					Chargement de l'application...
				</Text>
			</View>
		);
	}

	// Fonction pour obtenir la navigation appropriée selon le rôle
	const getMainNavigator = () => {
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

		// Navigation selon le rôle de l'utilisateur
		switch (user.role) {
			case 'medecin':
				return (
					<Stack.Navigator screenOptions={{ headerShown: false }}>
						<Stack.Screen name="MainTabs" component={DoctorTabs} />
					</Stack.Navigator>
				);
			
			case 'rh':
			case 'infirmier':
				return (
					<Stack.Navigator screenOptions={{ headerShown: false }}>
						<Stack.Screen name="MainTabs" component={RHTabs} />
					</Stack.Navigator>
				);
			
			case 'admin':
				return (
					<Stack.Navigator screenOptions={{ headerShown: false }}>
						<Stack.Screen name="MainTabs" component={AdminTabs} />
					</Stack.Navigator>
				);
			
			default:
				console.log('⚠️ Rôle non reconnu:', user.role);
				// Retour à la connexion en cas de rôle non reconnu
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
	};

	return (
		<NavigationContainer>
			{getMainNavigator()}
		</NavigationContainer>
	);
}