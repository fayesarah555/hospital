import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	TouchableOpacity,
	Alert,
	Modal,
	TextInput,
	FlatList,
	StyleSheet,
	ActivityIndicator,
	ScrollView,
	RefreshControl,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { 
	patientsAPI, 
	traitementsAPI, 
	rendezVousAPI, 
	getCurrentUser 
} from '../services/api';

export default function DoctorHomeScreen({ navigation }) {
	// États pour les données
	const [patients, setPatients] = useState([]);
	const [rendezVous, setRendezVous] = useState([]);
	const [currentUser, setCurrentUser] = useState(null);
	
	// États de contrôle
	const [isLoading, setIsLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [selectedTab, setSelectedTab] = useState('patients'); // patients, rendez-vous, dashboard

	// États pour les modals
	const [patientModalVisible, setPatientModalVisible] = useState(false);
	const [treatmentModalVisible, setTreatmentModalVisible] = useState(false);
	const [appointmentModalVisible, setAppointmentModalVisible] = useState(false);
	
	// États pour la gestion des patients
	const [selectedPatient, setSelectedPatient] = useState(null);
	const [patientTreatments, setPatientTreatments] = useState([]);
	const [loadingTreatments, setLoadingTreatments] = useState(false);

	// États pour le nouveau traitement
	const [newTreatment, setNewTreatment] = useState({
		patient_id: null,
		notes: '',
		medicaments: [{ nom: '', dosage: '', frequence: '', duree: '' }]
	});

	// États pour le nouveau rendez-vous
	const [newAppointment, setNewAppointment] = useState({
		patient_id: null,
		date_heure: '',
		notes: ''
	});

	// Charger les données au montage
	useEffect(() => {
		loadData();
		loadCurrentUser();
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

	// Charger toutes les données
	const loadData = async () => {
		try {
			setIsLoading(true);
			await Promise.all([
				loadPatients(),
				loadRendezVous()
			]);
		} catch (error) {
			console.error('Erreur chargement données:', error);
		} finally {
			setIsLoading(false);
		}
	};

	// Charger les patients
	const loadPatients = async () => {
		try {
			console.log('👥 Chargement patients...');
			const response = await patientsAPI.getAll();
			setPatients(response.data);
		} catch (error) {
			console.error('❌ Erreur chargement patients:', error);
		}
	};

	// Charger les rendez-vous
	const loadRendezVous = async () => {
		try {
			console.log('📅 Chargement rendez-vous...');
			const response = await rendezVousAPI.getAll();
			setRendezVous(response.data);
		} catch (error) {
			console.error('❌ Erreur chargement rendez-vous:', error);
		}
	};

	// Actualiser les données
	const onRefresh = async () => {
		setRefreshing(true);
		await loadData();
		setRefreshing(false);
	};

	// Charger les traitements d'un patient
	const loadPatientTreatments = async (patientId) => {
		try {
			setLoadingTreatments(true);
			const response = await traitementsAPI.getByPatient(patientId);
			setPatientTreatments(response.data);
		} catch (error) {
			console.error('❌ Erreur chargement traitements:', error);
			setPatientTreatments([]);
		} finally {
			setLoadingTreatments(false);
		}
	};

	// Ouvrir le détail d'un patient
	const handlePatientPress = async (patient) => {
		setSelectedPatient(patient);
		setPatientModalVisible(true);
		await loadPatientTreatments(patient.id);
	};

	// Ouvrir le modal de nouveau traitement
	const handleNewTreatment = (patient) => {
		setNewTreatment({
			patient_id: patient.id,
			notes: '',
			medicaments: [{ nom: '', dosage: '', frequence: '1 fois par jour', duree: '7 jours' }]
		});
		setPatientModalVisible(false);
		setTreatmentModalVisible(true);
	};

	// Ajouter un médicament au traitement
	const addMedicine = () => {
		setNewTreatment(prev => ({
			...prev,
			medicaments: [...prev.medicaments, { nom: '', dosage: '', frequence: '1 fois par jour', duree: '7 jours' }]
		}));
	};

	// Supprimer un médicament
	const removeMedicine = (index) => {
		setNewTreatment(prev => ({
			...prev,
			medicaments: prev.medicaments.filter((_, i) => i !== index)
		}));
	};

	// Mettre à jour un médicament
	const updateMedicine = (index, field, value) => {
		setNewTreatment(prev => ({
			...prev,
			medicaments: prev.medicaments.map((med, i) => 
				i === index ? { ...med, [field]: value } : med
			)
		}));
	};

	// Créer un nouveau traitement
	const handleCreateTreatment = async () => {
		if (!newTreatment.patient_id) {
			Alert.alert('Erreur', 'Patient non sélectionné');
			return;
		}

		// Valider au moins un médicament
		const validMedicines = newTreatment.medicaments.filter(med => med.nom.trim() && med.dosage.trim());
		if (validMedicines.length === 0) {
			Alert.alert('Erreur', 'Veuillez ajouter au moins un médicament avec nom et dosage');
			return;
		}

		try {
			console.log('💊 Création traitement...');
			
			const treatmentData = {
				patient_id: newTreatment.patient_id,
				notes: newTreatment.notes.trim(),
				medicaments: validMedicines
			};

			await traitementsAPI.create(treatmentData);
			
			Alert.alert('Succès', 'Traitement créé avec succès!\nLe patient sera notifié par email.');
			setTreatmentModalVisible(false);
			loadData(); // Recharger les données
			
		} catch (error) {
			console.error('❌ Erreur création traitement:', error);
			Alert.alert('Erreur', 'Impossible de créer le traitement');
		}
	};

	// Ouvrir le modal de nouveau rendez-vous
	const handleNewAppointment = () => {
		const tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);
		const defaultDateTime = tomorrow.toISOString().slice(0, 16);
		
		setNewAppointment({
			patient_id: null,
			date_heure: defaultDateTime,
			notes: ''
		});
		setAppointmentModalVisible(true);
	};

	// Créer un nouveau rendez-vous
	const handleCreateAppointment = async () => {
		if (!newAppointment.patient_id) {
			Alert.alert('Erreur', 'Veuillez sélectionner un patient');
			return;
		}

		if (!newAppointment.date_heure) {
			Alert.alert('Erreur', 'Veuillez sélectionner une date et heure');
			return;
		}

		try {
			console.log('📅 Création rendez-vous...');
			
			await rendezVousAPI.create(newAppointment);
			
			Alert.alert('Succès', 'Rendez-vous créé avec succès!\nLe patient sera notifié par email.');
			setAppointmentModalVisible(false);
			loadData(); // Recharger les données
			
		} catch (error) {
			console.error('❌ Erreur création rendez-vous:', error);
			Alert.alert('Erreur', 'Impossible de créer le rendez-vous');
		}
	};

	// Rendu d'un patient
	const renderPatient = ({ item }) => (
		<TouchableOpacity
			style={styles.patientItem}
			onPress={() => handlePatientPress(item)}
		>
			<Text style={styles.patientName}>{item.prenom} {item.nom}</Text>
			<Text style={styles.patientInfo}>Âge: {item.age} ans</Text>
			{item.email && (
				<Text style={styles.patientEmail}>📧 {item.email}</Text>
			)}
			{item.traitement_en_cours && (
				<Text style={styles.currentTreatment}>💊 {item.traitement_en_cours}</Text>
			)}
		</TouchableOpacity>
	);

	// Rendu d'un rendez-vous
	const renderAppointment = ({ item }) => {
		const patient = patients.find(p => p.id === item.patient_id);
		const appointmentDate = new Date(item.date_heure);
		const isToday = appointmentDate.toDateString() === new Date().toDateString();
		
		return (
			<View style={[styles.appointmentItem, isToday && styles.todayAppointment]}>
				<View style={styles.appointmentHeader}>
					<Text style={styles.appointmentPatient}>
						{patient ? `${patient.prenom} ${patient.nom}` : 'Patient inconnu'}
					</Text>
					<Text style={[styles.appointmentStatus, styles[`status_${item.statut}`]]}>
						{item.statut}
					</Text>
				</View>
				<Text style={styles.appointmentDate}>
					📅 {appointmentDate.toLocaleDateString()} à {appointmentDate.toLocaleTimeString().slice(0, 5)}
				</Text>
				{item.notes && (
					<Text style={styles.appointmentNotes}>📝 {item.notes}</Text>
				)}
			</View>
		);
	};

	// Rendu du dashboard
	const renderDashboard = () => (
		<ScrollView style={styles.dashboardContainer}>
			<View style={styles.statsContainer}>
				<View style={styles.statCard}>
					<Text style={styles.statNumber}>{patients.length}</Text>
					<Text style={styles.statLabel}>Patients</Text>
				</View>
				<View style={styles.statCard}>
					<Text style={styles.statNumber}>
						{rendezVous.filter(rdv => rdv.statut === 'prévu').length}
					</Text>
					<Text style={styles.statLabel}>RDV prévus</Text>
				</View>
				<View style={styles.statCard}>
					<Text style={styles.statNumber}>
						{rendezVous.filter(rdv => {
							const rdvDate = new Date(rdv.date_heure);
							return rdvDate.toDateString() === new Date().toDateString();
						}).length}
					</Text>
					<Text style={styles.statLabel}>RDV aujourd'hui</Text>
				</View>
			</View>

			{/* Prochains rendez-vous */}
			<View style={styles.sectionContainer}>
				<Text style={styles.sectionTitle}>📅 Prochains rendez-vous</Text>
				{rendezVous
					.filter(rdv => new Date(rdv.date_heure) >= new Date() && rdv.statut === 'prévu')
					.slice(0, 3)
					.map(rdv => renderAppointment({ item: rdv }))
				}
			</View>

			{/* Actions rapides */}
			<View style={styles.quickActions}>
				<TouchableOpacity
					style={[styles.quickActionButton, { backgroundColor: '#28a745' }]}
					onPress={handleNewAppointment}
				>
					<Text style={styles.quickActionText}>📅 Nouveau RDV</Text>
				</TouchableOpacity>
				<TouchableOpacity
					style={[styles.quickActionButton, { backgroundColor: '#007bff' }]}
					onPress={() => setSelectedTab('patients')}
				>
					<Text style={styles.quickActionText}>👥 Voir patients</Text>
				</TouchableOpacity>
			</View>
		</ScrollView>
	);

	if (isLoading) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size="large" color="#007bff" />
				<Text style={styles.loadingText}>Chargement...</Text>
			</View>
		);
	}

	return (
		<View style={styles.container}>
			<Text style={styles.title}>🩺 Espace Médecin</Text>
			
			{currentUser && (
				<Text style={styles.subtitle}>
					Dr. {currentUser.prenom} {currentUser.nom}
					{currentUser.specialite && ` - ${currentUser.specialite}`}
				</Text>
			)}

			{/* Onglets */}
			<View style={styles.tabContainer}>
				<TouchableOpacity
					style={[styles.tab, selectedTab === 'dashboard' && styles.activeTab]}
					onPress={() => setSelectedTab('dashboard')}
				>
					<Text style={[styles.tabText, selectedTab === 'dashboard' && styles.activeTabText]}>
						📊 Dashboard
					</Text>
				</TouchableOpacity>
				<TouchableOpacity
					style={[styles.tab, selectedTab === 'patients' && styles.activeTab]}
					onPress={() => setSelectedTab('patients')}
				>
					<Text style={[styles.tabText, selectedTab === 'patients' && styles.activeTabText]}>
						👥 Patients
					</Text>
				</TouchableOpacity>
				<TouchableOpacity
					style={[styles.tab, selectedTab === 'rendez-vous' && styles.activeTab]}
					onPress={() => setSelectedTab('rendez-vous')}
				>
					<Text style={[styles.tabText, selectedTab === 'rendez-vous' && styles.activeTabText]}>
						📅 RDV
					</Text>
				</TouchableOpacity>
			</View>

			{/* Contenu selon l'onglet */}
			{selectedTab === 'dashboard' && renderDashboard()}

			{selectedTab === 'patients' && (
				<FlatList
					data={patients}
					renderItem={renderPatient}
					keyExtractor={item => item.id.toString()}
					style={styles.list}
					refreshControl={
						<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
					}
					ListEmptyComponent={() => (
						<View style={styles.emptyContainer}>
							<Text style={styles.emptyText}>Aucun patient</Text>
						</View>
					)}
				/>
			)}

			{selectedTab === 'rendez-vous' && (
				<>
					<TouchableOpacity
						style={styles.addButton}
						onPress={handleNewAppointment}
					>
						<Text style={styles.addButtonText}>📅 Nouveau rendez-vous</Text>
					</TouchableOpacity>
					
					<FlatList
						data={rendezVous.sort((a, b) => new Date(a.date_heure) - new Date(b.date_heure))}
						renderItem={renderAppointment}
						keyExtractor={item => item.id.toString()}
						style={styles.list}
						refreshControl={
							<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
						}
						ListEmptyComponent={() => (
							<View style={styles.emptyContainer}>
								<Text style={styles.emptyText}>Aucun rendez-vous</Text>
							</View>
						)}
					/>
				</>
			)}

			{/* Modal détail patient */}
			<Modal
				visible={patientModalVisible}
				transparent
				animationType="slide"
				onRequestClose={() => setPatientModalVisible(false)}
			>
				<View style={styles.centeredView}>
					<View style={styles.modalView}>
						{selectedPatient && (
							<>
								<Text style={styles.modalTitle}>
									{selectedPatient.prenom} {selectedPatient.nom}
								</Text>

								<ScrollView style={styles.modalContent}>
									{/* Infos patient */}
									<Text style={styles.patientInfo}>Âge: {selectedPatient.age} ans</Text>
									{selectedPatient.email && (
										<Text style={styles.patientInfo}>Email: {selectedPatient.email}</Text>
									)}

									{/* Traitements */}
									<Text style={styles.sectionTitle}>💊 Traitements</Text>
									{loadingTreatments ? (
										<ActivityIndicator size="small" color="#007bff" />
									) : patientTreatments.length > 0 ? (
										patientTreatments.map((treatment, index) => (
											<View key={index} style={styles.treatmentItem}>
												<Text style={styles.treatmentDate}>
													{new Date(treatment.date_creation).toLocaleDateString()}
												</Text>
												{treatment.notes && (
													<Text style={styles.treatmentNotes}>{treatment.notes}</Text>
												)}
												{treatment.medicaments?.map((med, medIndex) => (
													<Text key={medIndex} style={styles.medicineItem}>
														• {med.nom} - {med.dosage}
													</Text>
												))}
											</View>
										))
									) : (
										<Text style={styles.noData}>Aucun traitement</Text>
									)}
								</ScrollView>

								<View style={styles.modalButtons}>
									<TouchableOpacity
										style={[styles.button, { backgroundColor: '#28a745' }]}
										onPress={() => handleNewTreatment(selectedPatient)}
									>
										<Text style={styles.buttonText}>💊 Nouveau traitement</Text>
									</TouchableOpacity>
									<TouchableOpacity
										style={[styles.button, { backgroundColor: '#6c757d' }]}
										onPress={() => setPatientModalVisible(false)}
									>
										<Text style={styles.buttonText}>❌ Fermer</Text>
									</TouchableOpacity>
								</View>
							</>
						)}
					</View>
				</View>
			</Modal>

			{/* Modal nouveau traitement */}
			<Modal
				visible={treatmentModalVisible}
				transparent
				animationType="slide"
				onRequestClose={() => setTreatmentModalVisible(false)}
			>
				<View style={styles.centeredView}>
					<View style={styles.modalView}>
						<Text style={styles.modalTitle}>💊 Nouveau traitement</Text>

						<ScrollView style={styles.modalContent}>
							<TextInput
								style={styles.input}
								placeholder="Notes sur le traitement"
								value={newTreatment.notes}
								onChangeText={(text) => setNewTreatment({...newTreatment, notes: text})}
								multiline
							/>

							<Text style={styles.sectionTitle}>Médicaments :</Text>
							{newTreatment.medicaments.map((med, index) => (
								<View key={index} style={styles.medicineForm}>
									<TextInput
										style={styles.input}
										placeholder="Nom du médicament"
										value={med.nom}
										onChangeText={(text) => updateMedicine(index, 'nom', text)}
									/>
									<TextInput
										style={styles.input}
										placeholder="Dosage"
										value={med.dosage}
										onChangeText={(text) => updateMedicine(index, 'dosage', text)}
									/>
									<TextInput
										style={styles.input}
										placeholder="Fréquence"
										value={med.frequence}
										onChangeText={(text) => updateMedicine(index, 'frequence', text)}
									/>
									<TextInput
										style={styles.input}
										placeholder="Durée"
										value={med.duree}
										onChangeText={(text) => updateMedicine(index, 'duree', text)}
									/>
									{newTreatment.medicaments.length > 1 && (
										<TouchableOpacity
											style={styles.removeMedicineButton}
											onPress={() => removeMedicine(index)}
										>
											<Text style={styles.removeMedicineText}>🗑️ Supprimer</Text>
										</TouchableOpacity>
									)}
								</View>
							))}

							<TouchableOpacity
								style={styles.addMedicineButton}
								onPress={addMedicine}
							>
								<Text style={styles.addMedicineText}>➕ Ajouter un médicament</Text>
							</TouchableOpacity>
						</ScrollView>

						<View style={styles.modalButtons}>
							<TouchableOpacity
								style={[styles.button, { backgroundColor: '#28a745' }]}
								onPress={handleCreateTreatment}
							>
								<Text style={styles.buttonText}>💾 Créer</Text>
							</TouchableOpacity>
							<TouchableOpacity
								style={[styles.button, { backgroundColor: '#6c757d' }]}
								onPress={() => setTreatmentModalVisible(false)}
							>
								<Text style={styles.buttonText}>❌ Annuler</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>

			{/* Modal nouveau rendez-vous */}
			<Modal
				visible={appointmentModalVisible}
				transparent
				animationType="slide"
				onRequestClose={() => setAppointmentModalVisible(false)}
			>
				<View style={styles.centeredView}>
					<View style={styles.modalView}>
						<Text style={styles.modalTitle}>📅 Nouveau rendez-vous</Text>

						<ScrollView style={styles.modalContent}>
							<Text style={styles.inputLabel}>Patient :</Text>
							<Picker
								selectedValue={newAppointment.patient_id}
								style={styles.picker}
								onValueChange={(value) => setNewAppointment({...newAppointment, patient_id: value})}
							>
								<Picker.Item label="Sélectionner un patient" value={null} />
								{patients.map(patient => (
									<Picker.Item
										key={patient.id}
										label={`${patient.prenom} ${patient.nom}`}
										value={patient.id}
									/>
								))}
							</Picker>

							<Text style={styles.inputLabel}>Date et heure :</Text>
							<TextInput
								style={styles.input}
								placeholder="YYYY-MM-DD HH:MM"
								value={newAppointment.date_heure}
								onChangeText={(text) => setNewAppointment({...newAppointment, date_heure: text})}
							/>

							<TextInput
								style={styles.input}
								placeholder="Notes sur le rendez-vous"
								value={newAppointment.notes}
								onChangeText={(text) => setNewAppointment({...newAppointment, notes: text})}
								multiline
							/>
						</ScrollView>

						<View style={styles.modalButtons}>
							<TouchableOpacity
								style={[styles.button, { backgroundColor: '#28a745' }]}
								onPress={handleCreateAppointment}
							>
								<Text style={styles.buttonText}>📅 Créer</Text>
							</TouchableOpacity>
							<TouchableOpacity
								style={[styles.button, { backgroundColor: '#6c757d' }]}
								onPress={() => setAppointmentModalVisible(false)}
							>
								<Text style={styles.buttonText}>❌ Annuler</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#f8f9fa',
		padding: 20,
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
		textAlign: 'center',
		marginBottom: 5,
		color: '#1e293b',
	},
	subtitle: {
		fontSize: 14,
		textAlign: 'center',
		marginBottom: 20,
		color: '#6c757d',
	},
	tabContainer: {
		flexDirection: 'row',
		backgroundColor: '#e9ecef',
		borderRadius: 8,
		marginBottom: 20,
		padding: 2,
	},
	tab: {
		flex: 1,
		paddingVertical: 10,
		alignItems: 'center',
		borderRadius: 6,
	},
	activeTab: {
		backgroundColor: '#007bff',
	},
	tabText: {
		fontSize: 12,
		fontWeight: '600',
		color: '#6c757d',
	},
	activeTabText: {
		color: '#fff',
	},
	list: {
		flex: 1,
	},
	patientItem: {
		backgroundColor: '#fff',
		padding: 16,
		borderRadius: 12,
		marginBottom: 10,
		borderLeftWidth: 4,
		borderLeftColor: '#007bff',
		elevation: 2,
	},
	patientName: {
		fontSize: 16,
		fontWeight: 'bold',
		color: '#0f172a',
		marginBottom: 4,
	},
	patientInfo: {
		fontSize: 14,
		color: '#6b7280',
		marginBottom: 2,
	},
	patientEmail: {
		fontSize: 14,
		color: '#475569',
		marginBottom: 4,
	},
	currentTreatment: {
		fontSize: 12,
		color: '#059669',
		backgroundColor: '#d1fae5',
		padding: 4,
		borderRadius: 4,
	},
	appointmentItem: {
		backgroundColor: '#fff',
		padding: 16,
		borderRadius: 12,
		marginBottom: 10,
		borderLeftWidth: 4,
		borderLeftColor: '#28a745',
		elevation: 2,
	},
	todayAppointment: {
		borderLeftColor: '#dc3545',
		backgroundColor: '#fff5f5',
	},
	appointmentHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 8,
	},
	appointmentPatient: {
		fontSize: 16,
		fontWeight: 'bold',
		color: '#0f172a',
		flex: 1,
	},
	appointmentStatus: {
		fontSize: 12,
		fontWeight: 'bold',
		paddingHorizontal: 8,
		paddingVertical: 2,
		borderRadius: 4,
		textTransform: 'uppercase',
	},
	status_prévu: {
		backgroundColor: '#dbeafe',
		color: '#1e40af',
	},
	status_en_cours: {
		backgroundColor: '#fef3c7',
		color: '#92400e',
	},
	status_terminé: {
		backgroundColor: '#d1fae5',
		color: '#065f46',
	},
	status_annulé: {
		backgroundColor: '#fee2e2',
		color: '#991b1b',
	},
	appointmentDate: {
		fontSize: 14,
		color: '#6b7280',
		marginBottom: 4,
	},
	appointmentNotes: {
		fontSize: 14,
		color: '#374151',
		fontStyle: 'italic',
	},
	dashboardContainer: {
		flex: 1,
	},
	statsContainer: {
		flexDirection: 'row',
		justifyContent: 'space-around',
		marginBottom: 20,
	},
	statCard: {
		backgroundColor: '#fff',
		padding: 20,
		borderRadius: 12,
		alignItems: 'center',
		elevation: 2,
		minWidth: 80,
	},
	statNumber: {
		fontSize: 24,
		fontWeight: 'bold',
		color: '#007bff',
	},
	statLabel: {
		fontSize: 12,
		color: '#6c757d',
		marginTop: 4,
	},
	sectionContainer: {
		marginBottom: 20,
	},
	sectionTitle: {
		fontSize: 16,
		fontWeight: 'bold',
		color: '#374151',
		marginBottom: 10,
	},
	quickActions: {
		flexDirection: 'row',
		justifyContent: 'space-around',
	},
	quickActionButton: {
		paddingVertical: 12,
		paddingHorizontal: 20,
		borderRadius: 8,
		alignItems: 'center',
		flex: 1,
		marginHorizontal: 5,
	},
	quickActionText: {
		color: '#fff',
		fontWeight: 'bold',
		fontSize: 14,
	},
	addButton: {
		backgroundColor: '#28a745',
		padding: 12,
		borderRadius: 8,
		alignItems: 'center',
		marginBottom: 10,
	},
	addButtonText: {
		color: '#fff',
		fontWeight: 'bold',
		fontSize: 16,
	},
	emptyContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingVertical: 50,
	},
	emptyText: {
		fontSize: 16,
		color: '#6c757d',
	},
	centeredView: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
	},
	modalView: {
		width: '90%',
		maxHeight: '80%',
		backgroundColor: '#fff',
		padding: 20,
		borderRadius: 16,
		elevation: 10,
	},
	modalTitle: {
		fontSize: 20,
		fontWeight: 'bold',
		textAlign: 'center',
		marginBottom: 20,
		color: '#0f172a',
	},
	modalContent: {
		maxHeight: 400,
	},
	treatmentItem: {
		backgroundColor: '#f8f9fa',
		padding: 12,
		borderRadius: 8,
		marginBottom: 8,
	},
	treatmentDate: {
		fontSize: 12,
		color: '#6b7280',
		marginBottom: 4,
	},
	treatmentNotes: {
		fontSize: 14,
		color: '#374151',
		marginBottom: 4,
	},
	medicineItem: {
		fontSize: 13,
		color: '#6b7280',
		marginLeft: 8,
	},
	noData: {
		fontSize: 14,
		color: '#9ca3af',
		fontStyle: 'italic',
		textAlign: 'center',
		paddingVertical: 20,
	},
	input: {
		backgroundColor: '#f8f9fa',
		padding: 12,
		borderRadius: 8,
		marginBottom: 10,
		borderWidth: 1,
		borderColor: '#e9ecef',
		fontSize: 16,
	},
	inputLabel: {
		fontSize: 16,
		fontWeight: 'bold',
		color: '#374151',
		marginBottom: 5,
		marginTop: 10,
	},
	picker: {
		backgroundColor: '#f8f9fa',
		borderRadius: 8,
		marginBottom: 10,
	},
	medicineForm: {
		backgroundColor: '#f8f9fa',
		padding: 12,
		borderRadius: 8,
		marginBottom: 10,
	},
	addMedicineButton: {
		backgroundColor: '#007bff',
		padding: 10,
		borderRadius: 8,
		alignItems: 'center',
		marginBottom: 10,
	},
	addMedicineText: {
		color: '#fff',
		fontWeight: 'bold',
		fontSize: 14,
	},
	removeMedicineButton: {
		backgroundColor: '#dc3545',
		padding: 8,
		borderRadius: 6,
		alignItems: 'center',
		marginTop: 8,
	},
	removeMedicineText: {
		color: '#fff',
		fontSize: 12,
		fontWeight: 'bold',
	},
	modalButtons: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginTop: 20,
	},
	button: {
		flex: 1,
		paddingVertical: 12,
		marginHorizontal: 5,
		borderRadius: 8,
		alignItems: 'center',
	},
	buttonText: {
		color: '#fff',
		fontWeight: 'bold',
		fontSize: 14,
	},
});