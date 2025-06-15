import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	StyleSheet,
	TextInput,
	TouchableOpacity,
	ScrollView,
	Alert,
	ActivityIndicator,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { patientsAPI, rendezVousAPI, getCurrentUser } from '../services/api';

export default function AppointmentScreen({ navigation }) {
	// États pour les données
	const [patients, setPatients] = useState([]);
	const [currentUser, setCurrentUser] = useState(null);
	
	// États pour le formulaire
	const [formData, setFormData] = useState({
		patient_id: null,
		date_heure: new Date(),
		notes: '',
	});
	
	// États pour les date pickers
	const [showDatePicker, setShowDatePicker] = useState(false);
	const [showTimePicker, setShowTimePicker] = useState(false);
	
	// États de contrôle
	const [isLoading, setIsLoading] = useState(false);
	const [loadingPatients, setLoadingPatients] = useState(true);

	// Charger les données au montage
	useEffect(() => {
		loadPatients();
		loadCurrentUser();
		
		// Définir une date par défaut (demain à 9h)
		const tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);
		tomorrow.setHours(9, 0, 0, 0);
		setFormData(prev => ({
			...prev,
			date_heure: tomorrow
		}));
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

	// Charger la liste des patients
	const loadPatients = async () => {
		try {
			console.log('👥 Chargement patients...');
			const response = await patientsAPI.getAll();
			console.log('✅ Patients chargés:', response.data.length);
			setPatients(response.data);
		} catch (error) {
			console.error('❌ Erreur chargement patients:', error);
			Alert.alert('Erreur', 'Impossible de charger la liste des patients');
		} finally {
			setLoadingPatients(false);
		}
	};

	// Mettre à jour un champ
	const updateField = (field, value) => {
		setFormData(prev => ({
			...prev,
			[field]: value
		}));
	};

	// Gérer le changement de date
	const onDateChange = (event, selectedDate) => {
		setShowDatePicker(false);
		if (selectedDate) {
			// Combiner la nouvelle date avec l'heure actuelle
			const newDateTime = new Date(formData.date_heure);
			newDateTime.setFullYear(selectedDate.getFullYear());
			newDateTime.setMonth(selectedDate.getMonth());
			newDateTime.setDate(selectedDate.getDate());
			updateField('date_heure', newDateTime);
		}
	};

	// Gérer le changement d'heure
	const onTimeChange = (event, selectedTime) => {
		setShowTimePicker(false);
		if (selectedTime) {
			// Combiner la date actuelle avec la nouvelle heure
			const newDateTime = new Date(formData.date_heure);
			newDateTime.setHours(selectedTime.getHours());
			newDateTime.setMinutes(selectedTime.getMinutes());
			updateField('date_heure', newDateTime);
		}
	};

	// Valider le formulaire
	const validateForm = () => {
		if (!formData.patient_id) {
			Alert.alert('Erreur', 'Veuillez sélectionner un patient');
			return false;
		}

		if (!formData.date_heure) {
			Alert.alert('Erreur', 'Veuillez sélectionner une date et heure');
			return false;
		}

		// Vérifier que le rendez-vous n'est pas dans le passé
		const now = new Date();
		if (formData.date_heure <= now) {
			Alert.alert('Erreur', 'Le rendez-vous ne peut pas être dans le passé');
			return false;
		}

		// Vérifier les heures ouvrables (8h-18h)
		const hour = formData.date_heure.getHours();
		if (hour < 8 || hour >= 18) {
			Alert.alert('Erreur', 'Les rendez-vous doivent être entre 8h et 18h');
			return false;
		}

		// Vérifier que ce n'est pas un weekend
		const dayOfWeek = formData.date_heure.getDay();
		if (dayOfWeek === 0 || dayOfWeek === 6) {
			Alert.alert('Erreur', 'Les rendez-vous ne peuvent pas être le weekend');
			return false;
		}

		return true;
	};

	// Créer le rendez-vous
	const handleSubmit = async () => {
		if (!validateForm()) return;

		setIsLoading(true);

		try {
			console.log('📅 Création rendez-vous...');
			
			const appointmentData = {
				patient_id: formData.patient_id,
				medecin_id: currentUser?.id,
				date_heure: formData.date_heure.toISOString(),
				notes: formData.notes.trim() || null,
				statut: 'prévu'
			};

			console.log('Données rendez-vous:', appointmentData);

			const response = await rendezVousAPI.create(appointmentData);
			
			console.log('✅ Rendez-vous créé:', response.data);

			// Trouver le patient pour l'affichage
			const selectedPatient = patients.find(p => p.id === formData.patient_id);
			
			Alert.alert(
				'Succès ! 🎉',
				`Rendez-vous créé avec succès !\n\n` +
				`👤 Patient: ${selectedPatient?.prenom} ${selectedPatient?.nom}\n` +
				`📅 Date: ${formData.date_heure.toLocaleDateString()}\n` +
				`🕒 Heure: ${formData.date_heure.toLocaleTimeString().slice(0, 5)}\n` +
				`${formData.notes ? `📝 Notes: ${formData.notes}\n` : ''}` +
				`\n📧 Le patient sera notifié par email`,
				[
					{
						text: 'Créer un autre',
						onPress: () => {
							// Réinitialiser le formulaire
							const tomorrow = new Date();
							tomorrow.setDate(tomorrow.getDate() + 1);
							tomorrow.setHours(9, 0, 0, 0);
							
							setFormData({
								patient_id: null,
								date_heure: tomorrow,
								notes: '',
							});
						}
					},
					{
						text: 'Voir les RDV',
						onPress: () => navigation.navigate('AppointmentsListScreen')
					},
					{
						text: 'Retour',
						onPress: () => navigation.goBack()
					}
				]
			);
			
		} catch (error) {
			console.error('❌ Erreur création rendez-vous:', error);
			
			let errorMessage = 'Impossible de créer le rendez-vous';
			
			if (error.response?.data?.message) {
				errorMessage = error.response.data.message;
			} else if (error.response?.status === 409) {
				errorMessage = 'Un rendez-vous existe déjà à cette heure';
			} else if (error.response?.status === 400) {
				errorMessage = 'Données invalides, vérifiez le formulaire';
			}
			
			Alert.alert('Erreur', errorMessage);
		} finally {
			setIsLoading(false);
		}
	};

	// Créneaux rapides
	const quickTimeSlots = [
		{ label: '09:00', hour: 9, minute: 0 },
		{ label: '10:00', hour: 10, minute: 0 },
		{ label: '11:00', hour: 11, minute: 0 },
		{ label: '14:00', hour: 14, minute: 0 },
		{ label: '15:00', hour: 15, minute: 0 },
		{ label: '16:00', hour: 16, minute: 0 },
	];

	const setQuickTime = (hour, minute) => {
		const newDateTime = new Date(formData.date_heure);
		newDateTime.setHours(hour, minute, 0, 0);
		updateField('date_heure', newDateTime);
	};

	if (loadingPatients) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size="large" color="#007bff" />
				<Text style={styles.loadingText}>Chargement des patients...</Text>
			</View>
		);
	}

	return (
		<ScrollView contentContainerStyle={styles.container}>
			<Text style={styles.title}>📅 Prise de Rendez-vous</Text>
			
			{currentUser && (
				<Text style={styles.subtitle}>
					Dr. {currentUser.prenom} {currentUser.nom}
				</Text>
			)}

			<View style={styles.formCard}>
				{/* Sélection du patient */}
				<Text style={styles.sectionTitle}>👤 Patient</Text>
				<View style={styles.pickerContainer}>
					<Picker
						selectedValue={formData.patient_id}
						onValueChange={(value) => updateField('patient_id', value)}
						style={styles.picker}
					>
						<Picker.Item label="Sélectionner un patient" value={null} />
						{patients.map(patient => (
							<Picker.Item
								key={patient.id}
								label={`${patient.prenom} ${patient.nom} (${patient.age} ans)`}
								value={patient.id}
							/>
						))}
					</Picker>
				</View>

				{/* Affichage des infos du patient sélectionné */}
				{formData.patient_id && (
					<View style={styles.patientInfo}>
						{(() => {
							const selectedPatient = patients.find(p => p.id === formData.patient_id);
							if (selectedPatient) {
								return (
									<>
										<Text style={styles.patientInfoText}>
											📧 {selectedPatient.email || 'Email non renseigné'}
										</Text>
										{selectedPatient.traitement_en_cours && (
											<Text style={styles.patientInfoText}>
												💊 Traitement: {selectedPatient.traitement_en_cours}
											</Text>
										)}
									</>
								);
							}
							return null;
						})()}
					</View>
				)}

				{/* Sélection de la date */}
				<Text style={styles.sectionTitle}>📅 Date</Text>
				<TouchableOpacity 
					style={styles.dateButton} 
					onPress={() => setShowDatePicker(true)}
				>
					<Text style={styles.dateButtonText}>
						📅 {formData.date_heure.toLocaleDateString('fr-FR', {
							weekday: 'long',
							year: 'numeric',
							month: 'long',
							day: 'numeric'
						})}
					</Text>
				</TouchableOpacity>

				{showDatePicker && (
					<DateTimePicker
						value={formData.date_heure}
						mode="date"
						display="default"
						onChange={onDateChange}
						minimumDate={new Date()}
					/>
				)}

				{/* Sélection de l'heure */}
				<Text style={styles.sectionTitle}>🕒 Heure</Text>
				<TouchableOpacity 
					style={styles.dateButton} 
					onPress={() => setShowTimePicker(true)}
				>
					<Text style={styles.dateButtonText}>
						🕒 {formData.date_heure.toLocaleTimeString().slice(0, 5)}
					</Text>
				</TouchableOpacity>

				{showTimePicker && (
					<DateTimePicker
						value={formData.date_heure}
						mode="time"
						display="default"
						onChange={onTimeChange}
					/>
				)}

				{/* Créneaux rapides */}
				<Text style={styles.sectionTitle}>⚡ Créneaux rapides</Text>
				<View style={styles.quickSlotsContainer}>
					{quickTimeSlots.map((slot, index) => (
						<TouchableOpacity
							key={index}
							style={[
								styles.quickSlot,
								formData.date_heure.getHours() === slot.hour && 
								formData.date_heure.getMinutes() === slot.minute && 
								styles.selectedQuickSlot
							]}
							onPress={() => setQuickTime(slot.hour, slot.minute)}
						>
							<Text style={[
								styles.quickSlotText,
								formData.date_heure.getHours() === slot.hour && 
								formData.date_heure.getMinutes() === slot.minute && 
								styles.selectedQuickSlotText
							]}>
								{slot.label}
							</Text>
						</TouchableOpacity>
					))}
				</View>

				{/* Notes */}
				<Text style={styles.sectionTitle}>📝 Notes (optionnel)</Text>
				<TextInput
					style={[styles.input, styles.notesInput]}
					placeholder="Motif du rendez-vous, préparation nécessaire..."
					value={formData.notes}
					onChangeText={(text) => updateField('notes', text)}
					multiline
					numberOfLines={4}
					placeholderTextColor="#888"
				/>

				{/* Récapitulatif */}
				{formData.patient_id && (
					<View style={styles.summaryContainer}>
						<Text style={styles.summaryTitle}>📋 Récapitulatif</Text>
						<Text style={styles.summaryText}>
							👤 Patient: {patients.find(p => p.id === formData.patient_id)?.prenom} {patients.find(p => p.id === formData.patient_id)?.nom}
						</Text>
						<Text style={styles.summaryText}>
							📅 Date: {formData.date_heure.toLocaleDateString()}
						</Text>
						<Text style={styles.summaryText}>
							🕒 Heure: {formData.date_heure.toLocaleTimeString().slice(0, 5)}
						</Text>
						{formData.notes && (
							<Text style={styles.summaryText}>
								📝 Notes: {formData.notes}
							</Text>
						)}
					</View>
				)}

				{/* Bouton de soumission */}
				<TouchableOpacity
					style={[styles.submitButton, isLoading && styles.disabledButton]}
					onPress={handleSubmit}
					disabled={isLoading}
				>
					{isLoading ? (
						<ActivityIndicator color="white" size="small" />
					) : (
						<Text style={styles.submitButtonText}>✅ Confirmer le rendez-vous</Text>
					)}
				</TouchableOpacity>

				{/* Informations importantes */}
				<View style={styles.infoContainer}>
					<Text style={styles.infoTitle}>ℹ️ Informations importantes</Text>
					<Text style={styles.infoText}>
						• Horaires : Lundi à Vendredi, 8h à 18h{'\n'}
						• Le patient sera automatiquement notifié par email{'\n'}
						• Vous pouvez modifier ou annuler le rendez-vous après création{'\n'}
						• Les créneaux de 30 minutes sont recommandés
					</Text>
				</View>
			</View>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: {
		flexGrow: 1,
		padding: 20,
		backgroundColor: '#f5f5f5',
	},
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	loadingText: {
		marginTop: 10,
		fontSize: 16,
		color: '#6c757d',
	},
	title: {
		fontSize: 24,
		fontWeight: 'bold',
		marginBottom: 5,
		color: '#333',
		textAlign: 'center',
	},
	subtitle: {
		fontSize: 14,
		color: '#6c757d',
		textAlign: 'center',
		marginBottom: 20,
	},
	formCard: {
		backgroundColor: '#fff',
		borderRadius: 16,
		padding: 20,
		elevation: 4,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
	},
	sectionTitle: {
		fontSize: 16,
		fontWeight: 'bold',
		color: '#333',
		marginBottom: 10,
		marginTop: 15,
	},
	pickerContainer: {
		borderWidth: 1,
		borderColor: '#ddd',
		borderRadius: 8,
		backgroundColor: '#f8f9fa',
		marginBottom: 10,
	},
	picker: {
		color: '#333',
	},
	patientInfo: {
		backgroundColor: '#e3f2fd',
		padding: 12,
		borderRadius: 8,
		marginBottom: 10,
	},
	patientInfoText: {
		fontSize: 14,
		color: '#1565c0',
		marginBottom: 2,
	},
	dateButton: {
		backgroundColor: '#f8f9fa',
		padding: 15,
		borderRadius: 8,
		marginBottom: 15,
		borderWidth: 1,
		borderColor: '#ddd',
		alignItems: 'center',
	},
	dateButtonText: {
		color: '#333',
		fontSize: 16,
		fontWeight: '500',
	},
	quickSlotsContainer: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		marginBottom: 15,
	},
	quickSlot: {
		backgroundColor: '#e9ecef',
		paddingVertical: 8,
		paddingHorizontal: 12,
		borderRadius: 6,
		margin: 4,
	},
	selectedQuickSlot: {
		backgroundColor: '#007bff',
	},
	quickSlotText: {
		fontSize: 14,
		color: '#495057',
		fontWeight: '500',
	},
	selectedQuickSlotText: {
		color: '#fff',
	},
	input: {
		backgroundColor: '#f8f9fa',
		padding: 12,
		borderRadius: 8,
		marginBottom: 15,
		borderWidth: 1,
		borderColor: '#ddd',
		fontSize: 16,
		color: '#333',
	},
	notesInput: {
		height: 100,
		textAlignVertical: 'top',
	},
	summaryContainer: {
		backgroundColor: '#f8f9fa',
		padding: 15,
		borderRadius: 8,
		marginBottom: 20,
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
	submitButton: {
		backgroundColor: '#28a745',
		padding: 15,
		borderRadius: 8,
		alignItems: 'center',
		marginBottom: 20,
		elevation: 2,
	},
	disabledButton: {
		backgroundColor: '#6c757d',
		opacity: 0.6,
	},
	submitButtonText: {
		color: 'white',
		fontWeight: 'bold',
		fontSize: 16,
	},
	infoContainer: {
		backgroundColor: '#fff3cd',
		padding: 15,
		borderRadius: 8,
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