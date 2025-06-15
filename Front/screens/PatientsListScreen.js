import React, { useEffect, useState } from 'react';
import {
	View,
	Text,
	FlatList,
	StyleSheet,
	TouchableOpacity,
	Alert,
	ActivityIndicator,
	RefreshControl,
	TextInput,
	Modal,
} from 'react-native';
import { patientsAPI, traitementsAPI, getCurrentUser } from '../services/api';
import { 
	PermissionGuard, 
	usePermissions, 
	protectedAction,
	getRoleLabel,
	getRoleColor 
} from '../utils/roleGuard';

export default function PatientsListScreen({ navigation }) {
	// États principaux
	const [patients, setPatients] = useState([]);
	const [filteredPatients, setFilteredPatients] = useState([]);
	const [isLoading, setIsLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');

	// États pour le modal patient
	const [selectedPatient, setSelectedPatient] = useState(null);
	const [modalVisible, setModalVisible] = useState(false);
	const [treatments, setTreatments] = useState([]);
	const [loadingTreatments, setLoadingTreatments] = useState(false);

	// États utilisateur
	const [currentUser, setCurrentUser] = useState(null);

	// 🔒 Hooks de permissions
	const { hasAccess: canDeletePatient } = usePermissions('patients', 'delete');
	const { hasAccess: canViewTreatments } = usePermissions('treatments', 'read');

	// Charger les données au montage
	useEffect(() => {
		loadPatients();
		loadCurrentUser();
	}, []);

	// Filtrer les patients selon la recherche
	useEffect(() => {
		if (searchQuery.trim() === '') {
			setFilteredPatients(patients);
		} else {
			const filtered = patients.filter(patient =>
				`${patient.prenom} ${patient.nom}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
				patient.email?.toLowerCase().includes(searchQuery.toLowerCase())
			);
			setFilteredPatients(filtered);
		}
	}, [searchQuery, patients]);

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
			console.log('👥 Chargement des patients...');
			const response = await patientsAPI.getAll();
			console.log('✅ Patients chargés:', response.data.length);
			
			setPatients(response.data);
			setFilteredPatients(response.data);
		} catch (error) {
			console.error('❌ Erreur chargement patients:', error);
			Alert.alert('Erreur', 'Impossible de charger les patients');
		} finally {
			setIsLoading(false);
		}
	};

	// Actualiser les données
	const onRefresh = async () => {
		setRefreshing(true);
		await loadPatients();
		setRefreshing(false);
	};

	// 🔒 Charger les traitements d'un patient (si autorisé)
	const loadPatientTreatments = async (patientId) => {
		if (!canViewTreatments) {
			console.log('🚫 Accès aux traitements refusé pour ce rôle');
			setTreatments([]);
			return;
		}

		try {
			setLoadingTreatments(true);
			console.log('💊 Chargement traitements patient:', patientId);
			
			const response = await traitementsAPI.getByPatient(patientId);
			console.log('✅ Traitements chargés:', response.data);
			
			setTreatments(response.data);
		} catch (error) {
			console.error('❌ Erreur chargement traitements:', error);
			setTreatments([]);
		} finally {
			setLoadingTreatments(false);
		}
	};

	// Ouvrir le détail d'un patient
	const handlePatientPress = async (patient) => {
		setSelectedPatient(patient);
		setModalVisible(true);
		await loadPatientTreatments(patient.id);
	};

	// 🔒 Supprimer un patient (avec vérification des droits)
	const handleDeletePatient = (patient) => {
		protectedAction(
			'patients', 
			'delete',
			async () => {
				Alert.alert(
					'Confirmation',
					`Êtes-vous sûr de vouloir supprimer le patient ${patient.prenom} ${patient.nom} ?`,
					[
						{ text: 'Annuler', style: 'cancel' },
						{
							text: 'Supprimer',
							style: 'destructive',
							onPress: async () => {
								try {
									console.log('🗑️ Suppression patient:', patient.id);
									
									await patientsAPI.delete(patient.id);
									
									Alert.alert('Succès', 'Patient supprimé');
									setModalVisible(false);
									loadPatients(); // Recharger la liste
									
								} catch (error) {
									console.error('❌ Erreur suppression:', error);
									Alert.alert('Erreur', 'Impossible de supprimer le patient');
								}
							}
						}
					]
				);
			},
			{
				alertTitle: 'Suppression non autorisée',
				alertMessage: `Votre rôle "${currentUser?.role}" ne permet pas de supprimer des patients.`
			}
		);
	};

	// Calculer l'âge
	const calculateAge = (birthDate) => {
		if (!birthDate) return 'N/A';
		const today = new Date();
		const birth = new Date(birthDate);
		const age = today.getFullYear() - birth.getFullYear();
		return age;
	};

	// Rendu d'un patient
	const renderPatient = ({ item }) => (
		<TouchableOpacity
			style={styles.patientItem}
			onPress={() => handlePatientPress(item)}
		>
			<View style={styles.patientHeader}>
				<Text style={styles.patientName}>
					{item.prenom} {item.nom}
				</Text>
				<Text style={styles.patientAge}>
					{item.age || calculateAge(item.date_naissance)} ans
				</Text>
			</View>
			
			{item.email && (
				<Text style={styles.patientEmail}>📧 {item.email}</Text>
			)}
			
			<View style={styles.patientDetails}>
				{item.poids && (
					<Text style={styles.patientInfo}>⚖️ {item.poids} kg</Text>
				)}
				{item.taille && (
					<Text style={styles.patientInfo}>📏 {item.taille} cm</Text>
				)}
			</View>
			
			{item.traitement_en_cours && (
				<Text style={styles.currentTreatment}>
					💊 {item.traitement_en_cours}
				</Text>
			)}

			<Text style={styles.patientDate}>
				Créé le {new Date(item.date_creation).toLocaleDateString()}
			</Text>
		</TouchableOpacity>
	);

	// Rendu d'un traitement (si autorisé)
	const renderTreatment = ({ item }) => (
		<View style={styles.treatmentItem}>
			<Text style={styles.treatmentDate}>
				{new Date(item.date_creation).toLocaleDateString()}
			</Text>
			{item.notes && (
				<Text style={styles.treatmentNotes}>{item.notes}</Text>
			)}
			{item.medicaments && item.medicaments.length > 0 && (
				<View style={styles.medicinesContainer}>
					<Text style={styles.medicinesTitle}>Médicaments :</Text>
					{item.medicaments.map((med, index) => (
						<Text key={index} style={styles.medicineItem}>
							• {med.nom} - {med.dosage}
						</Text>
					))}
				</View>
			)}
		</View>
	);

	if (isLoading) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size="large" color="#007bff" />
				<Text style={styles.loadingText}>Chargement des patients...</Text>
			</View>
		);
	}

	return (
		<View style={styles.container}>
			<Text style={styles.title}>👥 Liste des patients</Text>
			
			{/* 🔒 Affichage du rôle et des permissions */}
			{currentUser && (
				<View style={[styles.roleInfo, { backgroundColor: getRoleColor(currentUser.role) + '20' }]}>
					<Text style={[styles.roleText, { color: getRoleColor(currentUser.role) }]}>
						{getRoleLabel(currentUser.role)}
					</Text>
					<Text style={styles.permissionText}>
						{currentUser.role === 'admin' ? 'Tous droits' :
						 currentUser.role === 'medecin' ? 'Consultation seulement' :
						 currentUser.role === 'rh' ? 'Gestion patients' : 'Lecture seule'}
					</Text>
				</View>
			)}
			
			{/* Barre de recherche */}
			<TextInput
				style={styles.searchInput}
				placeholder="Rechercher un patient..."
				value={searchQuery}
				onChangeText={setSearchQuery}
				placeholderTextColor="#888"
			/>

			{/* Statistiques */}
			<View style={styles.statsContainer}>
				<Text style={styles.statsText}>
					{filteredPatients.length} patient{filteredPatients.length > 1 ? 's' : ''}
					{searchQuery ? ` (filtré${filteredPatients.length > 1 ? 's' : ''})` : ''}
				</Text>
			</View>

			{/* Liste des patients */}
			<FlatList
				data={filteredPatients}
				renderItem={renderPatient}
				keyExtractor={item => item.id.toString()}
				style={styles.list}
				refreshControl={
					<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
				}
				ListEmptyComponent={() => (
					<View style={styles.emptyContainer}>
						<Text style={styles.emptyText}>
							{searchQuery ? 'Aucun patient trouvé pour cette recherche' : 'Aucun patient enregistré'}
						</Text>
					</View>
				)}
			/>

			{/* Modal détail patient */}
			<Modal
				visible={modalVisible}
				transparent
				animationType="slide"
				onRequestClose={() => setModalVisible(false)}
			>
				<View style={styles.centeredView}>
					<View style={styles.modalView}>
						{selectedPatient && (
							<>
								<Text style={styles.modalTitle}>
									{selectedPatient.prenom} {selectedPatient.nom}
								</Text>

								{/* Informations patient */}
								<View style={styles.patientInfoSection}>
									<Text style={styles.sectionTitle}>📋 Informations</Text>
									<Text>Âge: {selectedPatient.age || calculateAge(selectedPatient.date_naissance)} ans</Text>
									{selectedPatient.email && <Text>Email: {selectedPatient.email}</Text>}
									{selectedPatient.poids && <Text>Poids: {selectedPatient.poids} kg</Text>}
									{selectedPatient.taille && <Text>Taille: {selectedPatient.taille} cm</Text>}
									{selectedPatient.traitement_en_cours && (
										<Text>Traitement actuel: {selectedPatient.traitement_en_cours}</Text>
									)}
								</View>

								{/* 🔒 Historique des traitements (si autorisé) */}
								<PermissionGuard resource="treatments" action="read">
									<View style={styles.treatmentsSection}>
										<Text style={styles.sectionTitle}>💊 Historique des traitements</Text>
										
										{loadingTreatments ? (
											<ActivityIndicator size="small" color="#007bff" />
										) : treatments.length > 0 ? (
											<FlatList
												data={treatments}
												renderItem={renderTreatment}
												keyExtractor={item => item.id.toString()}
												style={styles.treatmentsList}
												nestedScrollEnabled
											/>
										) : (
											<Text style={styles.noTreatments}>Aucun traitement enregistré</Text>
										)}
									</View>
								</PermissionGuard>

								{/* Message pour les rôles sans accès aux traitements */}
								{!canViewTreatments && (
									<View style={styles.restrictedSection}>
										<Text style={styles.restrictedText}>
											🔒 Accès aux traitements non autorisé pour votre rôle
										</Text>
									</View>
								)}

								{/* Boutons */}
								<View style={styles.modalButtons}>
									{/* 🔒 Bouton Supprimer (si autorisé) */}
									<PermissionGuard 
										resource="patients" 
										action="delete"
										fallback={null}
									>
										<TouchableOpacity
											style={[styles.button, { backgroundColor: '#dc3545' }]}
											onPress={() => handleDeletePatient(selectedPatient)}
										>
											<Text style={styles.buttonText}>🗑️ Supprimer</Text>
										</TouchableOpacity>
									</PermissionGuard>
									
									<TouchableOpacity
										style={[styles.button, { backgroundColor: '#6c757d', flex: 1 }]}
										onPress={() => setModalVisible(false)}
									>
										<Text style={styles.buttonText}>❌ Fermer</Text>
									</TouchableOpacity>
								</View>
							</>
						)}
					</View>
				</View>
			</Modal>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 20,
		backgroundColor: '#f8f9fa',
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
		marginBottom: 15,
		color: '#1e293b',
	},
	roleInfo: {
		padding: 12,
		borderRadius: 8,
		marginBottom: 15,
		alignItems: 'center',
	},
	roleText: {
		fontSize: 14,
		fontWeight: 'bold',
	},
	permissionText: {
		fontSize: 12,
		color: '#6c757d',
		marginTop: 2,
	},
	searchInput: {
		backgroundColor: '#fff',
		padding: 12,
		borderRadius: 8,
		marginBottom: 10,
		borderWidth: 1,
		borderColor: '#e9ecef',
		fontSize: 16,
	},
	statsContainer: {
		marginBottom: 15,
	},
	statsText: {
		fontSize: 14,
		color: '#6c757d',
		textAlign: 'center',
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
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 2,
		elevation: 2,
	},
	patientHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 8,
	},
	patientName: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#0f172a',
		flex: 1,
	},
	patientAge: {
		fontSize: 14,
		color: '#6b7280',
		backgroundColor: '#f3f4f6',
		paddingHorizontal: 8,
		paddingVertical: 2,
		borderRadius: 4,
	},
	patientEmail: {
		fontSize: 14,
		color: '#475569',
		marginBottom: 8,
	},
	patientDetails: {
		flexDirection: 'row',
		marginBottom: 8,
	},
	patientInfo: {
		fontSize: 14,
		color: '#6b7280',
		marginRight: 15,
	},
	currentTreatment: {
		fontSize: 14,
		color: '#059669',
		backgroundColor: '#d1fae5',
		padding: 6,
		borderRadius: 4,
		marginBottom: 8,
	},
	patientDate: {
		fontSize: 12,
		color: '#9ca3af',
		fontStyle: 'italic',
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
		textAlign: 'center',
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
	patientInfoSection: {
		marginBottom: 20,
	},
	sectionTitle: {
		fontSize: 16,
		fontWeight: 'bold',
		marginBottom: 10,
		color: '#374151',
	},
	treatmentsSection: {
		flex: 1,
		marginBottom: 20,
	},
	treatmentsList: {
		maxHeight: 200,
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
		marginBottom: 8,
	},
	medicinesContainer: {
		marginTop: 8,
	},
	medicinesTitle: {
		fontSize: 14,
		fontWeight: 'bold',
		color: '#374151',
		marginBottom: 4,
	},
	medicineItem: {
		fontSize: 13,
		color: '#6b7280',
		marginLeft: 8,
	},
	noTreatments: {
		fontSize: 14,
		color: '#9ca3af',
		fontStyle: 'italic',
		textAlign: 'center',
		paddingVertical: 20,
	},
	restrictedSection: {
		backgroundColor: '#fff3cd',
		padding: 15,
		borderRadius: 8,
		marginBottom: 20,
		borderWidth: 1,
		borderColor: '#ffeaa7',
	},
	restrictedText: {
		fontSize: 14,
		color: '#856404',
		textAlign: 'center',
	},
	modalButtons: {
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
	button: {
		paddingVertical: 12,
		paddingHorizontal: 20,
		borderRadius: 8,
		alignItems: 'center',
		marginHorizontal: 5,
	},
	buttonText: {
		color: '#fff',
		fontWeight: 'bold',
		fontSize: 14,
	},
});