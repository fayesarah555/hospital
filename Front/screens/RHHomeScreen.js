import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	TextInput,
	TouchableOpacity,
	StyleSheet,
	ScrollView,
	Alert,
	ActivityIndicator,
} from 'react-native';
import { patientsAPI, getCurrentUser } from '../services/api';

export default function RHHomeScreen({ navigation }) {
	// États pour le formulaire
	const [formData, setFormData] = useState({
		nom: '',
		prenom: '',
		age: '',
		poids: '',
		taille: '',
		email: '',
		traitement_en_cours: '',
	});
	
	// États de contrôle
	const [isLoading, setIsLoading] = useState(false);
	const [currentUser, setCurrentUser] = useState(null);
	const [patientsCount, setPatientsCount] = useState(0);

	// Charger les données au montage
	useEffect(() => {
		loadCurrentUser();
		loadPatientsCount();
	}, []);

	// Charger l'utilisateur connecté
	const loadCurrentUser = async () => {
		try {
			const user = await getCurrentUser();
			setCurrentUser(user);
		} catch (error) {
			console.log('Erreur chargement utilisateur:', error);
		}
	};

	// Charger le nombre de patients
	const loadPatientsCount = async () => {
		try {
			const response = await patientsAPI.getAll();
			setPatientsCount(response.data.length);
		} catch (error) {
			console.log('Erreur chargement statistiques:', error);
		}
	};

	// Mettre à jour un champ du formulaire
	const updateField = (field, value) => {
		setFormData(prev => ({
			...prev,
			[field]: value
		}));
	};

	// Valider le formulaire
	const validateForm = () => {
		const { nom, prenom, age } = formData;
		
		if (!nom.trim()) {
			Alert.alert('Erreur', 'Le nom est obligatoire');
			return false;
		}
		
		if (!prenom.trim()) {
			Alert.alert('Erreur', 'Le prénom est obligatoire');
			return false;
		}
		
		if (!age.trim()) {
			Alert.alert('Erreur', 'L\'âge est obligatoire');
			return false;
		}
		
		const ageNum = parseInt(age);
		if (isNaN(ageNum) || ageNum <= 0 || ageNum > 150) {
			Alert.alert('Erreur', 'L\'âge doit être un nombre entre 1 et 150');
			return false;
		}

		// Validation email si renseigné
		if (formData.email.trim()) {
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			if (!emailRegex.test(formData.email.trim())) {
				Alert.alert('Erreur', 'Format d\'email invalide');
				return false;
			}
		}

		// Validation poids si renseigné
		if (formData.poids.trim()) {
			const poidsNum = parseFloat(formData.poids);
			if (isNaN(poidsNum) || poidsNum <= 0 || poidsNum > 1000) {
				Alert.alert('Erreur', 'Le poids doit être un nombre entre 0 et 1000 kg');
				return false;
			}
		}

		// Validation taille si renseignée
		if (formData.taille.trim()) {
			const tailleNum = parseFloat(formData.taille);
			if (isNaN(tailleNum) || tailleNum <= 0 || tailleNum > 300) {
				Alert.alert('Erreur', 'La taille doit être un nombre entre 0 et 300 cm');
				return false;
			}
		}
		
		return true;
	};

	// Ajouter un patient
	const handleAddPatient = async () => {
		if (!validateForm()) return;

		setIsLoading(true);

		try {
			console.log('➕ Ajout nouveau patient...');
			
			// Préparer les données
			const patientData = {
				nom: formData.nom.trim(),
				prenom: formData.prenom.trim(),
				age: parseInt(formData.age),
				poids: formData.poids.trim() ? parseFloat(formData.poids) : null,
				taille: formData.taille.trim() ? parseFloat(formData.taille) : null,
				email: formData.email.trim() || null,
				traitement_en_cours: formData.traitement_en_cours.trim() || null,
			};

			console.log('Données patient:', patientData);

			const response = await patientsAPI.create(patientData);
			
			console.log('✅ Patient créé:', response.data);
			
			Alert.alert(
				'Succès',
				`Patient ${formData.prenom} ${formData.nom} ajouté avec succès !`,
				[
					{
						text: 'Voir la liste',
						onPress: () => navigation.navigate('PatientsList')
					},
					{
						text: 'Ajouter un autre',
						onPress: () => {
							// Réinitialiser le formulaire
							setFormData({
								nom: '',
								prenom: '',
								age: '',
								poids: '',
								taille: '',
								email: '',
								traitement_en_cours: '',
							});
							loadPatientsCount(); // Actualiser le compteur
						}
					}
				]
			);
			
		} catch (error) {
			console.error('❌ Erreur création patient:', error);
			
			let errorMessage = 'Impossible d\'ajouter le patient';
			
			if (error.response?.data?.message) {
				errorMessage = error.response.data.message;
			} else if (error.response?.status === 409) {
				errorMessage = 'Un patient avec cet email existe déjà';
			} else if (error.response?.status === 400) {
				errorMessage = 'Données invalides, vérifiez le formulaire';
			}
			
			Alert.alert('Erreur', errorMessage);
		} finally {
			setIsLoading(false);
		}
	};

	// Réinitialiser le formulaire
	const handleResetForm = () => {
		Alert.alert(
			'Confirmation',
			'Êtes-vous sûr de vouloir effacer le formulaire ?',
			[
				{ text: 'Annuler', style: 'cancel' },
				{
					text: 'Effacer',
					onPress: () => {
						setFormData({
							nom: '',
							prenom: '',
							age: '',
							poids: '',
							taille: '',
							email: '',
							traitement_en_cours: '',
						});
					}
				}
			]
		);
	};

	return (
		<ScrollView contentContainerStyle={styles.container}>
			<Text style={styles.title}>➕ Ajouter un Patient</Text>
			
			{/* Informations utilisateur */}
			{currentUser && (
				<View style={styles.userInfo}>
					<Text style={styles.userInfoText}>
						Connecté en tant que {currentUser.prenom} {currentUser.nom}
					</Text>
					<Text style={styles.statsText}>
						{patientsCount} patient{patientsCount > 1 ? 's' : ''} enregistré{patientsCount > 1 ? 's' : ''}
					</Text>
				</View>
			)}

			<View style={styles.formCard}>
				{/* Champs obligatoires */}
				<Text style={styles.sectionTitle}>📋 Informations obligatoires</Text>
				
				<TextInput
					style={[styles.input, !formData.nom.trim() && styles.inputError]}
					placeholder="Nom *"
					value={formData.nom}
					onChangeText={(text) => updateField('nom', text)}
					placeholderTextColor="#888"
				/>
				
				<TextInput
					style={[styles.input, !formData.prenom.trim() && styles.inputError]}
					placeholder="Prénom *"
					value={formData.prenom}
					onChangeText={(text) => updateField('prenom', text)}
					placeholderTextColor="#888"
				/>
				
				<TextInput
					style={[styles.input, !formData.age.trim() && styles.inputError]}
					placeholder="Âge *"
					value={formData.age}
					onChangeText={(text) => updateField('age', text)}
					keyboardType="numeric"
					placeholderTextColor="#888"
				/>

				{/* Champs optionnels */}
				<Text style={styles.sectionTitle}>📧 Informations optionnelles</Text>
				
				<TextInput
					style={styles.input}
					placeholder="Email (pour notifications)"
					value={formData.email}
					onChangeText={(text) => updateField('email', text)}
					keyboardType="email-address"
					autoCapitalize="none"
					placeholderTextColor="#888"
				/>
				
				<TextInput
					style={styles.input}
					placeholder="Poids (kg)"
					value={formData.poids}
					onChangeText={(text) => updateField('poids', text)}
					keyboardType="numeric"
					placeholderTextColor="#888"
				/>
				
				<TextInput
					style={styles.input}
					placeholder="Taille (cm)"
					value={formData.taille}
					onChangeText={(text) => updateField('taille', text)}
					keyboardType="numeric"
					placeholderTextColor="#888"
				/>
				
				<TextInput
					style={[styles.input, styles.textArea]}
					placeholder="Traitement en cours (optionnel)"
					value={formData.traitement_en_cours}
					onChangeText={(text) => updateField('traitement_en_cours', text)}
					multiline
					numberOfLines={3}
					placeholderTextColor="#888"
				/>

				{/* Boutons */}
				<View style={styles.buttonContainer}>
					<TouchableOpacity
						style={[styles.primaryButton, isLoading && styles.disabledButton]}
						onPress={handleAddPatient}
						disabled={isLoading}
					>
						{isLoading ? (
							<ActivityIndicator color="white" size="small" />
						) : (
							<Text style={styles.buttonText}>➕ Ajouter le patient</Text>
						)}
					</TouchableOpacity>

					<TouchableOpacity
						style={styles.resetButton}
						onPress={handleResetForm}
						disabled={isLoading}
					>
						<Text style={styles.buttonText}>🔄 Effacer</Text>
					</TouchableOpacity>
				</View>
			</View>

			{/* Boutons de navigation */}
			<View style={styles.navigationButtons}>
				<TouchableOpacity
					style={styles.secondaryButton}
					onPress={() => navigation.navigate('PatientsList')}
					disabled={isLoading}
				>
					<Text style={styles.buttonText}>📋 Voir tous les patients</Text>
				</TouchableOpacity>
			</View>

			{/* Aide */}
			<View style={styles.helpContainer}>
				<Text style={styles.helpTitle}>💡 Conseils :</Text>
				<Text style={styles.helpText}>
					• Les champs avec * sont obligatoires{'\n'}
					• L'email permettra d'envoyer des notifications au patient{'\n'}
					• Le poids et la taille peuvent être ajoutés plus tard{'\n'}
					• Vous pourrez modifier ces informations après création
				</Text>
			</View>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: {
		flexGrow: 1,
		padding: 20,
		backgroundColor: '#e6f2ff',
	},
	title: {
		fontSize: 26,
		fontWeight: '700',
		color: '#2c3e50',
		marginBottom: 10,
		textAlign: 'center',
	},
	userInfo: {
		backgroundColor: '#d1ecf1',
		padding: 12,
		borderRadius: 8,
		marginBottom: 20,
		alignItems: 'center',
	},
	userInfoText: {
		fontSize: 14,
		color: '#0c5460',
		fontWeight: '600',
	},
	statsText: {
		fontSize: 12,
		color: '#0c5460',
		marginTop: 4,
	},
	formCard: {
		backgroundColor: '#ffffff',
		borderRadius: 20,
		padding: 20,
		marginBottom: 20,
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
	textArea: {
		height: 80,
		textAlignVertical: 'top',
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
	navigationButtons: {
		marginBottom: 20,
	},
	secondaryButton: {
		backgroundColor: '#3498db',
		paddingVertical: 14,
		paddingHorizontal: 30,
		borderRadius: 14,
		alignItems: 'center',
		elevation: 3,
	},
	helpContainer: {
		backgroundColor: '#fff3cd',
		padding: 15,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: '#ffeaa7',
	},
	helpTitle: {
		fontSize: 16,
		fontWeight: 'bold',
		color: '#856404',
		marginBottom: 8,
	},
	helpText: {
		fontSize: 14,
		color: '#856404',
		lineHeight: 20,
	},
});