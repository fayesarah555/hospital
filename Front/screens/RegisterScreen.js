import React, { useState } from 'react';
import {
	View,
	Text,
	TextInput,
	TouchableOpacity,
	Alert,
	StyleSheet,
	KeyboardAvoidingView,
	Platform,
	ActivityIndicator,
	ScrollView,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { authAPI } from '../services/api';

export default function RegisterScreen({ navigation }) {
	// États pour le formulaire
	const [formData, setFormData] = useState({
		prenom: '',
		nom: '',
		email: '',
		mot_de_passe: '',
		confirmPassword: '',
		role: 'rh',
		specialite: '',
		numero_ordre: '',
	});
	
	// État de chargement
	const [isLoading, setIsLoading] = useState(false);

	// Mettre à jour un champ
	const updateField = (field, value) => {
		setFormData(prev => ({
			...prev,
			[field]: value
		}));
	};

	// Valider le formulaire
	const validateForm = () => {
		const { prenom, nom, email, mot_de_passe, confirmPassword, role } = formData;
		
		// Champs obligatoires
		if (!prenom.trim()) {
			Alert.alert('Erreur', 'Le prénom est obligatoire');
			return false;
		}
		
		if (!nom.trim()) {
			Alert.alert('Erreur', 'Le nom est obligatoire');
			return false;
		}
		
		if (!email.trim()) {
			Alert.alert('Erreur', 'L\'email est obligatoire');
			return false;
		}
		
		if (!mot_de_passe) {
			Alert.alert('Erreur', 'Le mot de passe est obligatoire');
			return false;
		}

		// Validation email
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email.trim())) {
			Alert.alert('Erreur', 'Format d\'email invalide');
			return false;
		}

		// Validation mot de passe
		if (mot_de_passe.length < 6) {
			Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères');
			return false;
		}

		// Confirmation mot de passe
		if (mot_de_passe !== confirmPassword) {
			Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
			return false;
		}

		// Validation spécifique selon le rôle
		if (role === 'medecin') {
			if (!formData.specialite.trim()) {
				Alert.alert('Erreur', 'La spécialité est obligatoire pour les médecins');
				return false;
			}
			if (!formData.numero_ordre.trim()) {
				Alert.alert('Erreur', 'Le numéro d\'ordre est obligatoire pour les médecins');
				return false;
			}
		}
		
		return true;
	};

	// Créer le compte
	const handleRegister = async () => {
		if (!validateForm()) return;

		setIsLoading(true);

		try {
			console.log('📝 Création de compte...');
			
			// Préparer les données
			const userData = {
				nom: formData.nom.trim(),
				prenom: formData.prenom.trim(),
				email: formData.email.trim().toLowerCase(),
				mot_de_passe: formData.mot_de_passe,
				role: formData.role,
			};

			// Ajouter les champs optionnels selon le rôle
			if (formData.role === 'medecin') {
				userData.specialite = formData.specialite.trim();
				userData.numero_ordre = formData.numero_ordre.trim();
			}

			console.log('Données utilisateur:', { ...userData, mot_de_passe: '[MASQUÉ]' });

			const response = await authAPI.register(userData);
			
			console.log('✅ Compte créé:', response.data);
			
			Alert.alert(
				'Succès ! 🎉', 
				`Compte créé avec succès !\n\n` +
				`👤 ${formData.prenom} ${formData.nom}\n` +
				`📧 ${formData.email}\n` +
				`🔧 Rôle: ${formData.role}\n` +
				`${formData.specialite ? `🩺 Spécialité: ${formData.specialite}\n` : ''}` +
				`\nVous pouvez maintenant vous connecter.`,
				[
					{ 
						text: 'Se connecter', 
						onPress: () => {
							// Pré-remplir l'email sur la page de connexion
							navigation.navigate('Login', { 
								prefilledEmail: formData.email 
							});
						}
					}
				]
			);
			
		} catch (error) {
			console.error('❌ Erreur création compte:', error);
			
			let errorMessage = 'Impossible de créer le compte';
			
			if (error.response?.data?.message) {
				errorMessage = error.response.data.message;
			} else if (error.response?.status === 409) {
				errorMessage = 'Un compte avec cet email existe déjà';
			} else if (error.response?.status === 400) {
				errorMessage = 'Données invalides, vérifiez le formulaire';
			} else if (error.request) {
				errorMessage = 'Impossible de se connecter au serveur.\nVérifiez que le backend est démarré.';
			}
			
			Alert.alert('Erreur', errorMessage);
		} finally {
			setIsLoading(false);
		}
	};

	// Réinitialiser le formulaire
	const resetForm = () => {
		setFormData({
			prenom: '',
			nom: '',
			email: '',
			mot_de_passe: '',
			confirmPassword: '',
			role: 'rh',
			specialite: '',
			numero_ordre: '',
		});
	};

	// Obtenir le placeholder selon le rôle
	const getEmailPlaceholder = () => {
		const domain = '@hopital.fr';
		switch (formData.role) {
			case 'medecin':
				return `dr.${formData.prenom.toLowerCase()}${domain}`;
			case 'admin':
				return `admin.${formData.prenom.toLowerCase()}${domain}`;
			case 'rh':
				return `rh.${formData.prenom.toLowerCase()}${domain}`;
			case 'infirmier':
				return `infirmier.${formData.prenom.toLowerCase()}${domain}`;
			default:
				return `${formData.prenom.toLowerCase()}${domain}`;
		}
	};

	return (
		<KeyboardAvoidingView
			behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
			style={styles.container}
		>
			<ScrollView contentContainerStyle={styles.scrollContent}>
				<Text style={styles.title}>📝 Création de compte</Text>
				<Text style={styles.subtitle}>Nouveau membre du personnel</Text>

				<View style={styles.formCard}>
					{/* Informations personnelles */}
					<Text style={styles.sectionTitle}>👤 Informations personnelles</Text>
					
					<TextInput
						placeholder="Prénom *"
						value={formData.prenom}
						onChangeText={(text) => updateField('prenom', text)}
						style={styles.input}
						placeholderTextColor="#888"
					/>
					
					<TextInput
						placeholder="Nom *"
						value={formData.nom}
						onChangeText={(text) => updateField('nom', text)}
						style={styles.input}
						placeholderTextColor="#888"
					/>

					{/* Rôle */}
					<Text style={styles.sectionTitle}>🔧 Rôle et accès</Text>
					<View style={styles.pickerWrapper}>
						<Picker
							selectedValue={formData.role}
							onValueChange={(value) => updateField('role', value)}
							style={styles.picker}
						>
							<Picker.Item label="👥 Ressources Humaines" value="rh" />
							<Picker.Item label="🩺 Médecin" value="medecin" />
							<Picker.Item label="🔴 Administrateur" value="admin" />
							<Picker.Item label="💉 Infirmier" value="infirmier" />
						</Picker>
					</View>

					{/* Champs spécifiques aux médecins */}
					{formData.role === 'medecin' && (
						<View style={styles.doctorFields}>
							<Text style={styles.subsectionTitle}>🩺 Informations médicales</Text>
							
							<TextInput
								placeholder="Spécialité *"
								value={formData.specialite}
								onChangeText={(text) => updateField('specialite', text)}
								style={styles.input}
								placeholderTextColor="#888"
							/>
							
							<TextInput
								placeholder="Numéro d'ordre *"
								value={formData.numero_ordre}
								onChangeText={(text) => updateField('numero_ordre', text)}
								style={styles.input}
								placeholderTextColor="#888"
							/>
						</View>
					)}

					{/* Informations de connexion */}
					<Text style={styles.sectionTitle}>🔐 Informations de connexion</Text>
					
					<TextInput
						placeholder={formData.prenom ? getEmailPlaceholder() : "Adresse e-mail *"}
						value={formData.email}
						onChangeText={(text) => updateField('email', text)}
						keyboardType="email-address"
						autoCapitalize="none"
						style={styles.input}
						placeholderTextColor="#888"
					/>
					
					<TextInput
						placeholder="Mot de passe * (min. 6 caractères)"
						value={formData.mot_de_passe}
						onChangeText={(text) => updateField('mot_de_passe', text)}
						secureTextEntry
						style={styles.input}
						placeholderTextColor="#888"
					/>
					
					<TextInput
						placeholder="Confirmer le mot de passe *"
						value={formData.confirmPassword}
						onChangeText={(text) => updateField('confirmPassword', text)}
						secureTextEntry
						style={[
							styles.input,
							formData.confirmPassword && formData.mot_de_passe !== formData.confirmPassword && styles.inputError
						]}
						placeholderTextColor="#888"
					/>

					{/* Indicateur de force du mot de passe */}
					{formData.mot_de_passe && (
						<View style={styles.passwordStrength}>
							<Text style={[
								styles.passwordStrengthText,
								{ color: formData.mot_de_passe.length >= 6 ? '#28a745' : '#dc3545' }
							]}>
								{formData.mot_de_passe.length >= 6 ? '✅ Mot de passe valide' : '⚠️ Trop court (min. 6 caractères)'}
							</Text>
						</View>
					)}

					{/* Récapitulatif */}
					{formData.prenom && formData.nom && formData.role && (
						<View style={styles.summaryContainer}>
							<Text style={styles.summaryTitle}>📋 Récapitulatif</Text>
							<Text style={styles.summaryText}>
								👤 {formData.prenom} {formData.nom}
							</Text>
							<Text style={styles.summaryText}>
								🔧 {formData.role === 'rh' ? 'Ressources Humaines' :
									 formData.role === 'medecin' ? 'Médecin' :
									 formData.role === 'admin' ? 'Administrateur' : 'Infirmier'}
							</Text>
							{formData.specialite && (
								<Text style={styles.summaryText}>
									🩺 Spécialité: {formData.specialite}
								</Text>
							)}
							{formData.email && (
								<Text style={styles.summaryText}>
									📧 {formData.email}
								</Text>
							)}
						</View>
					)}

					{/* Boutons */}
					<View style={styles.buttonContainer}>
						<TouchableOpacity
							style={[styles.primaryButton, isLoading && styles.disabledButton]}
							onPress={handleRegister}
							disabled={isLoading}
						>
							{isLoading ? (
								<ActivityIndicator color="white" size="small" />
							) : (
								<Text style={styles.buttonText}>✅ Créer le compte</Text>
							)}
						</TouchableOpacity>

						<TouchableOpacity
							style={styles.resetButton}
							onPress={resetForm}
							disabled={isLoading}
						>
							<Text style={styles.buttonText}>🔄 Réinitialiser</Text>
						</TouchableOpacity>

						<TouchableOpacity
							style={styles.backButton}
							onPress={() => navigation.goBack()}
							disabled={isLoading}
						>
							<Text style={styles.buttonText}>← Retour à la connexion</Text>
						</TouchableOpacity>
					</View>

					{/* Informations importantes */}
					<View style={styles.infoContainer}>
						<Text style={styles.infoTitle}>ℹ️ Informations importantes</Text>
						<Text style={styles.infoText}>
							• Les champs avec * sont obligatoires{'\n'}
							• Le mot de passe doit contenir au moins 6 caractères{'\n'}
							• Les médecins doivent renseigner leur spécialité{'\n'}
							• L'email sera utilisé pour la connexion
						</Text>
					</View>
				</View>
			</ScrollView>
		</KeyboardAvoidingView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#e6f2ff',
	},
	scrollContent: {
		flexGrow: 1,
		padding: 20,
		justifyContent: 'center',
	},
	title: {
		fontSize: 26,
		fontWeight: '700',
		color: '#2c3e50',
		marginBottom: 5,
		textAlign: 'center',
	},
	subtitle: {
		fontSize: 14,
		color: '#6c757d',
		marginBottom: 30,
		textAlign: 'center',
	},
	formCard: {
		backgroundColor: '#ffffff',
		borderRadius: 20,
		padding: 20,
		elevation: 4,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.2,
		shadowRadius: 4,
	},
	sectionTitle: {
		fontSize: 16,
		fontWeight: 'bold',
		color: '#2c3e50',
		marginBottom: 15,
		marginTop: 10,
	},
	subsectionTitle: {
		fontSize: 14,
		fontWeight: 'bold',
		color: '#495057',
		marginBottom: 10,
		marginTop: 10,
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
	inputError: {
		borderColor: '#dc3545',
		backgroundColor: '#f8d7da',
	},
	pickerWrapper: {
		borderWidth: 1,
		borderColor: '#ced4da',
		borderRadius: 12,
		backgroundColor: '#f8f9fa',
		marginVertical: 8,
	},
	picker: {
		color: '#2c3e50',
	},
	doctorFields: {
		backgroundColor: '#e8f5e8',
		padding: 15,
		borderRadius: 12,
		marginVertical: 10,
	},
	passwordStrength: {
		marginTop: 5,
		marginBottom: 10,
	},
	passwordStrengthText: {
		fontSize: 12,
		fontWeight: 'bold',
	},
	summaryContainer: {
		backgroundColor: '#f8f9fa',
		padding: 15,
		borderRadius: 12,
		marginVertical: 15,
		borderLeftWidth: 4,
		borderLeftColor: '#28a745',
	},
	summaryTitle: {
		fontSize: 16,
		fontWeight: 'bold',
		color: '#333',
		marginBottom: 8,
	},
	summaryText: {
		fontSize: 14,
		color: '#495057',
		marginBottom: 4,
	},
	buttonContainer: {
		marginTop: 20,
	},
	primaryButton: {
		backgroundColor: '#17a2b8',
		paddingVertical: 14,
		paddingHorizontal: 30,
		borderRadius: 14,
		marginBottom: 10,
		alignItems: 'center',
		elevation: 3,
	},
	resetButton: {
		backgroundColor: '#6c757d',
		paddingVertical: 14,
		paddingHorizontal: 30,
		borderRadius: 14,
		marginBottom: 10,
		alignItems: 'center',
		elevation: 3,
	},
	backButton: {
		backgroundColor: '#3498db',
		paddingVertical: 14,
		paddingHorizontal: 30,
		borderRadius: 14,
		alignItems: 'center',
		elevation: 3,
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
	infoContainer: {
		backgroundColor: '#fff3cd',
		padding: 15,
		borderRadius: 12,
		marginTop: 20,
		borderWidth: 1,
		borderColor: '#ffeaa7',
	},
	infoTitle: {
		fontSize: 14,
		fontWeight: 'bold',
		color: '#856404',
		marginBottom: 8,
	},
	infoText: {
		fontSize: 13,
		color: '#856404',
		lineHeight: 18,
	},
});