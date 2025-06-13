import React, { useState } from 'react';
import {
	View,
	Text,
	TextInput,
	TouchableOpacity,
	StyleSheet,
	Alert,
	KeyboardAvoidingView,
	Platform,
	ActivityIndicator,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuration API
const API_BASE_URL = 'http://192.168.1.193:3001/api/auth/login';

export default function LoginScreen({ navigation }) {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [isLoading, setIsLoading] = useState(false);

	// Fonction de connexion avec appel API
	const handleLogin = async () => {
		// Validation des champs
		if (!email || !password) {
			Alert.alert('Erreur', 'Veuillez remplir tous les champs');
			return;
		}

		setIsLoading(true);

		try {
			console.log('🔐 Tentative de connexion...');
			console.log('Email:', email);

			// Appel API de connexion
			const response = await axios.post(`${API_BASE_URL}`, {
				email: email.trim().toLowerCase(),
				password: password,
			});

			console.log('✅ Connexion réussie:', response.data);

			// Destructurer la réponse
			const { token, user } = response.data;

			// Stocker le token et les infos utilisateur
			await AsyncStorage.setItem('authToken', token);
			await AsyncStorage.setItem('userData', JSON.stringify(user));

			console.log('👤 Utilisateur connecté:', user);
			console.log('🔑 Token stocké');

			// Redirection selon le rôle
			switch (user.role) {
				case 'admin':
					console.log('🔴 Redirection vers Admin');
					navigation.replace('MainTabs', {
						screen: 'AdminHome',
						params: { user },
					});
					break;
				case 'medecin':
					console.log('🟢 Redirection vers Médecin');
					navigation.replace('MainTabs', {
						screen: 'DoctorHome',
						params: { user },
					});
					break;
				case 'rh':
					console.log('🔵 Redirection vers RH');
					navigation.replace('MainTabs', {
						screen: 'RHHome',
						params: { user },
					});
					break;
				case 'infirmier':
					console.log('🟡 Redirection vers Infirmier');
					navigation.replace('MainTabs', {
						screen: 'RHHome', // Ou créer un NurseHome
						params: { user },
					});
					break;
				default:
					console.log('⚠️ Rôle non reconnu:', user.role);
					navigation.replace('MainTabs');
			}
		} catch (error) {
			console.error('❌ Erreur de connexion:', error);

			// Gestion des différents types d'erreurs
			if (error.response) {
				// Erreur de l'API (400, 401, 500, etc.)
				const status = error.response.status;
				const message = error.response.data?.message || 'Erreur inconnue';

				switch (status) {
					case 401:
						Alert.alert('Erreur', 'Email ou mot de passe incorrect');
						break;
					case 404:
						Alert.alert('Erreur', 'Utilisateur non trouvé');
						break;
					case 500:
						Alert.alert('Erreur', 'Erreur serveur. Réessayez plus tard.');
						break;
					default:
						Alert.alert('Erreur', message);
				}
			} else if (error.request) {
				// Erreur réseau
				Alert.alert(
					'Erreur de connexion',
					'Impossible de se connecter au serveur. Vérifiez votre connexion.'
				);
			} else {
				// Autre erreur
				Alert.alert('Erreur', "Une erreur inattendue s'est produite");
			}
		} finally {
			setIsLoading(false);
		}
	};

	// Fonction pour tester la connexion avec des comptes prédéfinis
	const quickLogin = role => {
		const testAccounts = {
			admin: { email: 'carlos.garcia@hopital.fr', password: 'password123' },
			medecin: { email: 'marie.dubois@hopital.fr', password: 'password123' },
			rh: { email: 'sophie.leroy@hopital.fr', password: 'password123' },
		};

		const account = testAccounts[role];
		if (account) {
			setEmail(account.email);
			setPassword(account.password);
		}
	};

	return (
		<KeyboardAvoidingView
			behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
			style={styles.container}
		>
			<Text style={styles.title}>🔐 Connexion</Text>

			<View style={styles.formCard}>
				<TextInput
					placeholder="Adresse e-mail"
					value={email}
					onChangeText={setEmail}
					style={styles.input}
					placeholderTextColor="#888"
					keyboardType="email-address"
					autoCapitalize="none"
					autoCorrect={false}
				/>
				<TextInput
					placeholder="Mot de passe"
					value={password}
					onChangeText={setPassword}
					secureTextEntry
					style={styles.input}
					placeholderTextColor="#888"
				/>

				<TouchableOpacity
					style={[styles.primaryButton, isLoading && styles.disabledButton]}
					onPress={handleLogin}
					disabled={isLoading}
				>
					{isLoading ? (
						<ActivityIndicator color="white" />
					) : (
						<Text style={styles.buttonText}>✅ Se connecter</Text>
					)}
				</TouchableOpacity>

				<TouchableOpacity
					style={styles.secondaryButton}
					onPress={() => navigation.navigate('RegisterScreen')}
					disabled={isLoading}
				>
					<Text style={styles.buttonText}>📝 Créer un compte</Text>
				</TouchableOpacity>

				{/* Boutons de test rapide */}
				<View style={styles.testSection}>
					<Text style={styles.testTitle}>🧪 Tests rapides :</Text>
					<View style={styles.testButtons}>
						<TouchableOpacity
							style={[styles.testButton, { backgroundColor: '#dc3545' }]}
							onPress={() => quickLogin('admin')}
						>
							<Text style={styles.testButtonText}>Admin</Text>
						</TouchableOpacity>
						<TouchableOpacity
							style={[styles.testButton, { backgroundColor: '#28a745' }]}
							onPress={() => quickLogin('medecin')}
						>
							<Text style={styles.testButtonText}>Médecin</Text>
						</TouchableOpacity>
						<TouchableOpacity
							style={[styles.testButton, { backgroundColor: '#007bff' }]}
							onPress={() => quickLogin('rh')}
						>
							<Text style={styles.testButtonText}>RH</Text>
						</TouchableOpacity>
					</View>
				</View>
			</View>
		</KeyboardAvoidingView>
	);
}

const styles = StyleSheet.create({
	container: {
		flexGrow: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#e6f2ff',
		padding: 20,
	},
	title: {
		fontSize: 26,
		fontWeight: '700',
		color: '#2c3e50',
		marginBottom: 20,
	},
	formCard: {
		width: '100%',
		backgroundColor: '#ffffff',
		borderRadius: 20,
		padding: 20,
		elevation: 4,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.2,
		shadowRadius: 4,
	},
	input: {
		backgroundColor: '#f8f9fa',
		borderRadius: 12,
		padding: 12,
		marginVertical: 8,
		borderWidth: 1,
		borderColor: '#ced4da',
		fontSize: 16,
		color: '#2c3e50',
	},
	primaryButton: {
		backgroundColor: '#17a2b8',
		paddingVertical: 14,
		paddingHorizontal: 30,
		borderRadius: 14,
		marginTop: 10,
		marginBottom: 15,
		alignItems: 'center',
		elevation: 3,
	},
	secondaryButton: {
		backgroundColor: '#3498db',
		paddingVertical: 14,
		paddingHorizontal: 30,
		borderRadius: 14,
		alignItems: 'center',
		elevation: 3,
		marginBottom: 20,
	},
	disabledButton: {
		backgroundColor: '#6c757d',
		opacity: 0.6,
	},
	buttonText: {
		color: 'white',
		fontWeight: '600',
		fontSize: 16,
	},
	testSection: {
		borderTopWidth: 1,
		borderTopColor: '#e9ecef',
		paddingTop: 15,
	},
	testTitle: {
		fontSize: 14,
		color: '#6c757d',
		textAlign: 'center',
		marginBottom: 10,
	},
	testButtons: {
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
	testButton: {
		flex: 1,
		paddingVertical: 8,
		paddingHorizontal: 10,
		borderRadius: 8,
		marginHorizontal: 2,
		alignItems: 'center',
	},
	testButtonText: {
		color: 'white',
		fontSize: 12,
		fontWeight: '600',
	},
});
