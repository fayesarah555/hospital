import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	StyleSheet,
	FlatList,
	TouchableOpacity,
	Alert,
	ActivityIndicator,
	RefreshControl,
	Modal,
	TextInput,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { rendezVousAPI, patientsAPI, getCurrentUser } from '../services/api';

export default function AppointmentsListScreen({ navigation }) {
	// États pour les données
	const [appointments, setAppointments] = useState([]);
	const [patients, setPatients] = useState([]);
	const [currentUser, setCurrentUser] = useState(null);
	
	// États de contrôle
	const [isLoading, setIsLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [filter, setFilter] = useState('all'); // all, today, upcoming, past
	
	// États pour les modals
	const [editModalVisible, setEditModalVisible] = useState(false);
	const [selectedAppointment, setSelectedAppointment] = useState(null);
	
	// États pour l'édition
	const [editData, setEditData] = useState({
		date_heure: new Date(),
		notes: '',
		statut: 'prévu'
	});
	const [showDatePicker, setShowDatePicker] = useState(false);
	const [showTimePicker, setShowTimePicker] = useState(false);

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
				loadAppointments(),
				loadPatients()
			]);
		} catch (error) {
			console.error('Erreur chargement données:', error);
		} finally {
			setIsLoading(false);
		}
	};

	// Charger les rendez-vous
	const loadAppointments = async () => {
		try {
			console.log('📅 Chargement rendez-vous...');
			const response = await rendezVousAPI.getAll();
			console.log('✅ Rendez-vous chargés:', response.data.length);
			setAppointments(response.data);
		} catch (error) {
			console.error('❌ Erreur chargement rendez-vous:', error);
			Alert.alert('Erreur', 'Impossible de charger les rendez-vous');
		}
	};

	// Charger les patients pour les noms
	const loadPatients = async () => {
		try {
			const response = await patientsAPI.getAll();
			setPatients(response.data);
		} catch (error) {
			console.error('❌ Erreur chargement patients:', error);
		}
	};

	// Actualiser les données
	const onRefresh = async () => {
		setRefreshing(true);
		await loadData();
		setRefreshing(false);
	};

	// Filtrer les rendez-vous
	const getFilteredAppointments = () => {
		const now = new Date();
		const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
		const tomorrow = new Date(today);
		tomorrow.setDate(tomorrow.getDate() + 1);

		switch (filter) {
			case 'today':
				return appointments.filter(apt => {
					const aptDate = new Date(apt.date_heure);
					return aptDate >= today && aptDate < tomorrow;
				});
			case 'upcoming':
				return appointments.filter(apt => {
					const aptDate = new Date(apt.date_heure);
					return aptDate >= now && apt.statut === 'prévu';
				});
			case 'past':
				return appointments.filter(apt => {
					const aptDate = new Date(apt.date_heure);
					return aptDate < now || apt.statut === 'terminé';
				});
			default:
				return appointments;
		}
	};

	// Ouvrir le modal d'édition
	const handleEditAppointment = (appointment) => {
		setSelectedAppointment(appointment);
		setEditData({
			date_heure: new Date(appointment.date_heure),
			notes: appointment.notes || '',
			statut: appointment.statut
		});
		setEditModalVisible(true);
	};

	// Modifier un rendez-vous
	const handleUpdateAppointment = async () => {
		if (!selectedAppointment) return;

		try {
			console.log('✏️ Modification rendez-vous...');
			
			const updateData = {
				date_heure: editData.date_heure.toISOString(),
				notes: editData.notes.trim() || null,
				statut: editData.statut
			};

			await rendezVousAPI.update(selectedAppointment.id, updateData);
			
			Alert.alert('Succès', 'Rendez-vous modifié avec succès!\nLe patient sera notifié par email.');
			setEditModalVisible(false);
			loadAppointments(); // Recharger la liste
			
		} catch (error) {
			console.error('❌ Erreur modification:', error);
			Alert.alert('Erreur', 'Impossible de modifier le rendez-vous');
		}
	};

	// Supprimer un rendez-vous
	const handleDeleteAppointment = (appointment) => {
		const patient = patients.find(p => p.id === appointment.patient_id);
		const appointmentDate = new Date(appointment.date_heure);
		
		Alert.alert(
			'Confirmation',
			`Êtes-vous sûr de vouloir annuler ce rendez-vous ?\n\n` +
			`👤 Patient: ${patient ? `${patient.prenom} ${patient.nom}` : 'Inconnu'}\n` +
			`📅 Date: ${appointmentDate.toLocaleDateString()}\n` +
			`🕒 Heure: ${appointmentDate.toLocaleTimeString().slice(0, 5)}`,
			[
				{ text: 'Non', style: 'cancel' },
				{
					text: 'Oui, annuler',
					style: 'destructive',
					onPress: async () => {
						try {
							console.log('🗑️ Suppression rendez-vous:', appointment.id);
							
							await rendezVousAPI.delete(appointment.id);
							
							Alert.alert('Succès', 'Rendez-vous annulé avec succès!\nLe patient sera notifié par email.');
							loadAppointments(); // Recharger la liste
							
						} catch (error) {
							console.error('❌ Erreur suppression:', error);
							Alert.alert('Erreur', 'Impossible d\'annuler le rendez-vous');
						}
					}
				}
			]
		);
	};

	// Gérer le changement de date
	const onDateChange = (event, selectedDate) => {
		setShowDatePicker(false);
		if (selectedDate) {
			const newDateTime = new Date(editData.date_heure);
			newDateTime.setFullYear(selectedDate.getFullYear());
			newDateTime.setMonth(selectedDate.getMonth());
			newDateTime.setDate(selectedDate.getDate());
			setEditData({...editData, date_heure: newDateTime});
		}
	};

	// Gérer le changement d'heure
	const onTimeChange = (event, selectedTime) => {
		setShowTimePicker(false);
		if (selectedTime) {
			const newDateTime = new Date(editData.date_heure);
			newDateTime.setHours(selectedTime.getHours());
			newDateTime.setMinutes(selectedTime.getMinutes());
			setEditData({...editData, date_heure: newDateTime});
		}
	};

	// Obtenir le style selon le statut
	const getStatusStyle = (statut) => {
		const styles = {
			prévu: { backgroundColor: '#dbeafe', color: '#1e40af' },
			en_cours: { backgroundColor: '#fef3c7', color: '#92400e' },
			terminé: { backgroundColor: '#d1fae5', color: '#065f46' },
			annulé: { backgroundColor: '#fee2e2', color: '#991b1b' }
		};
		return styles[statut] || styles.prévu;
	};

	// Obtenir l'icône selon le statut
	const getStatusIcon = (statut) => {
		const icons = {
			prévu: '🕐',
			en_cours: '👨‍⚕️',
			terminé: '✅',
			annulé: '❌'
		};
		return icons[statut] || '🕐';
	};

	// Rendu d'un rendez-vous
	const renderAppointment = ({ item }) => {
		const patient = patients.find(p => p.id === item.patient_id);
		const appointmentDate = new Date(item.date_heure);
		const now = new Date();
		const isToday = appointmentDate.toDateString() === now.toDateString();
		const isPast = appointmentDate < now;
		const statusStyle = getStatusStyle(item.statut);

		return (
			<TouchableOpacity
				style={[
					styles.appointmentItem,
					isToday && styles.todayAppointment,
					isPast && styles.pastAppointment
				]}
				onPress={() => handleEditAppointment(item)}
			>
				<View style={styles.appointmentHeader}>
					<Text style={styles.patientName}>
						👤 {patient ? `${patient.prenom} ${patient.nom}` : 'Patient inconnu'}
					</Text>
					<View style={[styles.statusBadge, statusStyle]}>
						<Text style={[styles.statusText, { color: statusStyle.color }]}>
							{getStatusIcon(item.statut)} {item.statut}
						</Text>
					</View>
				</View>

				<Text style={styles.appointmentDate}>
					📅 {appointmentDate.toLocaleDateString('fr-FR', {
						weekday: 'long',
						year: 'numeric',
						month: 'long',
						day: 'numeric'
					})}
				</Text>

				<Text style={styles.appointmentTime}>
					🕒 {appointmentDate.toLocaleTimeString().slice(0, 5)}
					{isToday && <Text style={styles.todayLabel}> • AUJOURD'HUI</Text>}
				</Text>

				{patient?.email && (
					<Text style={styles.patientEmail}>📧 {patient.email}</Text>
				)}

				{item.notes && (
					<Text style={styles.appointmentNotes}>📝 {item.notes}</Text>
				)}

				<View style={styles.appointmentActions}>
					<TouchableOpacity
						style={[styles.actionButton, styles.editButton]}
						onPress={() => handleEditAppointment(item)}
					>
						<Text style={styles.actionButtonText}>✏️ Modifier</Text>
					</TouchableOpacity>
					<TouchableOpacity
						style={[styles.actionButton, styles.deleteButton]}
						onPress={() => handleDeleteAppointment(item)}
					>
						<Text style={styles.actionButtonText}>🗑️ Annuler</Text>
					</TouchableOpacity>
				</View>
			</TouchableOpacity>
		);
	};

	if (isLoading) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size="large" color="#007bff" />
				<Text style={styles.loadingText}>Chargement des rendez-vous...</Text>
			</View>
		);
	}

	const filteredAppointments = getFilteredAppointments();

	return (
		<View style={styles.container}>
			<Text style={styles.title}>📅 Liste des rendez-vous</Text>
			
			{currentUser && (
				<Text style={styles.subtitle}>
					Dr. {currentUser.prenom} {currentUser.nom}
				</Text>
			)}

			{/* Filtres */}
			<View style={styles.filterContainer}>
				{[
					{ key: 'all', label: 'Tous', icon: '📋' },
					{ key: 'today', label: 'Aujourd\'hui', icon: '📅' },
					{ key: 'upcoming', label: 'À venir', icon: '⏰' },
					{ key: 'past', label: 'Passés', icon: '📁' }
				].map(filterOption => (
					<TouchableOpacity
						key={filterOption.key}
						style={[
							styles.filterButton,
							filter === filterOption.key && styles.activeFilter
						]}
						onPress={() => setFilter(filterOption.key)}
					>
						<Text style={[
							styles.filterText,
							filter === filterOption.key && styles.activeFilterText
						]}>
							{filterOption.icon} {filterOption.label}
						</Text>
					</TouchableOpacity>
				))}
			</View>

			{/* Statistiques */}
			<View style={styles.statsContainer}>
				<Text style={styles.statsText}>
					{filteredAppointments.length} rendez-vous
					{filter !== 'all' && ` (${filter === 'today' ? 'aujourd\'hui' : 
						filter === 'upcoming' ? 'à venir' : 'passés'})`}
				</Text>
			</View>

			{/* Bouton nouveau rendez-vous */}
			<TouchableOpacity
				style={styles.newAppointmentButton}
				onPress={() => navigation.navigate('AppointmentScreen')}
			>
				<Text style={styles.newAppointmentText}>➕ Nouveau rendez-vous</Text>
			</TouchableOpacity>

			{/* Liste des rendez-vous */}
			<FlatList
				data={filteredAppointments.sort((a, b) => new Date(a.date_heure) - new Date(b.date_heure))}
				renderItem={renderAppointment}
				keyExtractor={item => item.id.toString()}
				style={styles.list}
				refreshControl={
					<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
				}
				ListEmptyComponent={() => (
					<View style={styles.emptyContainer}>
						<Text style={styles.emptyText}>
							{filter === 'all' ? 'Aucun rendez-vous' :
							 filter === 'today' ? 'Aucun rendez-vous aujourd\'hui' :
							 filter === 'upcoming' ? 'Aucun rendez-vous à venir' :
							 'Aucun rendez-vous passé'}
						</Text>
						{filter === 'all' && (
							<TouchableOpacity
								style={styles.emptyButton}
								onPress={() => navigation.navigate('AppointmentScreen')}
							>
								<Text style={styles.emptyButtonText}>Créer le premier rendez-vous</Text>
							</TouchableOpacity>
						)}
					</View>
				)}
			/>

			{/* Modal d'édition */}
			<Modal
				visible={editModalVisible}
				transparent
				animationType="slide"
				onRequestClose={() => setEditModalVisible(false)}
			>
				<View style={styles.centeredView}>
					<View style={styles.modalView}>
						{selectedAppointment && (
							<>
								<Text style={styles.modalTitle}>✏️ Modifier le rendez-vous</Text>

								{/* Infos patient */}
								<View style={styles.patientInfo}>
									{(() => {
										const patient = patients.find(p => p.id === selectedAppointment.patient_id);
										return patient ? (
											<>
												<Text style={styles.patientInfoText}>
													👤 {patient.prenom} {patient.nom}
												</Text>
												{patient.email && (
													<Text style={styles.patientInfoText}>
														📧 {patient.email}
													</Text>
												)}
											</>
										) : (
											<Text style={styles.patientInfoText}>Patient non trouvé</Text>
										);
									})()}
								</View>

								{/* Date */}
								<Text style={styles.inputLabel}>📅 Date :</Text>
								<TouchableOpacity
									style={styles.dateButton}
									onPress={() => setShowDatePicker(true)}
								>
									<Text style={styles.dateButtonText}>
										{editData.date_heure.toLocaleDateString()}
									</Text>
								</TouchableOpacity>

								{showDatePicker && (
									<DateTimePicker
										value={editData.date_heure}
										mode="date"
										display="default"
										onChange={onDateChange}
										minimumDate={new Date()}
									/>
								)}

								{/* Heure */}
								<Text style={styles.inputLabel}>🕒 Heure :</Text>
								<TouchableOpacity
									style={styles.dateButton}
									onPress={() => setShowTimePicker(true)}
								>
									<Text style={styles.dateButtonText}>
										{editData.date_heure.toLocaleTimeString().slice(0, 5)}
									</Text>
								</TouchableOpacity>

								{showTimePicker && (
									<DateTimePicker
										value={editData.date_heure}
										mode="time"
										display="default"
										onChange={onTimeChange}
									/>
								)}

								{/* Statut */}
								<Text style={styles.inputLabel}>📊 Statut :</Text>
								<View style={styles.pickerContainer}>
									<Picker
										selectedValue={editData.statut}
										style={styles.picker}
										onValueChange={(value) => setEditData({...editData, statut: value})}
									>
										<Picker.Item label="🕐 Prévu" value="prévu" />
										<Picker.Item label="👨‍⚕️ En cours" value="en_cours" />
										<Picker.Item label="✅ Terminé" value="terminé" />
										<Picker.Item label="❌ Annulé" value="annulé" />
									</Picker>
								</View>

								{/* Notes */}
								<Text style={styles.inputLabel}>📝 Notes :</Text>
								<TextInput
									style={styles.notesInput}
									placeholder="Notes sur le rendez-vous..."
									value={editData.notes}
									onChangeText={(text) => setEditData({...editData, notes: text})}
									multiline
									numberOfLines={3}
									placeholderTextColor="#888"
								/>

								{/* Boutons */}
								<View style={styles.modalButtons}>
									<TouchableOpacity
										style={[styles.button, { backgroundColor: '#28a745' }]}
										onPress={handleUpdateAppointment}
									>
										<Text style={styles.buttonText}>💾 Enregistrer</Text>
									</TouchableOpacity>
									<TouchableOpacity
										style={[styles.button, { backgroundColor: '#6c757d' }]}
										onPress={() => setEditModalVisible(false)}
									>
										<Text style={styles.buttonText}>❌ Annuler</Text>
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
		marginBottom: 5,
		color: '#1e293b',
	},
	subtitle: {
		fontSize: 14,
		textAlign: 'center',
		marginBottom: 20,
		color: '#6c757d',
	},
	filterContainer: {
		flexDirection: 'row',
		marginBottom: 15,
		backgroundColor: '#e9ecef',
		borderRadius: 8,
		padding: 2,
	},
	filterButton: {
		flex: 1,
		paddingVertical: 8,
		paddingHorizontal: 4,
		borderRadius: 6,
		alignItems: 'center',
	},
	activeFilter: {
		backgroundColor: '#007bff',
	},
	filterText: {
		fontSize: 11,
		fontWeight: '600',
		color: '#6c757d',
		textAlign: 'center',
	},
	activeFilterText: {
		color: '#fff',
	},
	statsContainer: {
		marginBottom: 15,
	},
	statsText: {
		fontSize: 14,
		color: '#6c757d',
		textAlign: 'center',
	},
	newAppointmentButton: {
		backgroundColor: '#28a745',
		padding: 12,
		borderRadius: 8,
		alignItems: 'center',
		marginBottom: 15,
	},
	newAppointmentText: {
		color: '#fff',
		fontWeight: 'bold',
		fontSize: 16,
	},
	list: {
		flex: 1,
	},
	appointmentItem: {
		backgroundColor: '#fff',
		padding: 16,
		borderRadius: 12,
		marginBottom: 10,
		borderLeftWidth: 4,
		borderLeftColor: '#007bff',
		elevation: 2,
	},
	todayAppointment: {
		borderLeftColor: '#ffc107',
		backgroundColor: '#fffbf0',
	},
	pastAppointment: {
		opacity: 0.7,
		borderLeftColor: '#6c757d',
	},
	appointmentHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 8,
	},
	patientName: {
		fontSize: 16,
		fontWeight: 'bold',
		color: '#0f172a',
		flex: 1,
	},
	statusBadge: {
		paddingHorizontal: 8,
		paddingVertical: 2,
		borderRadius: 4,
	},
	statusText: {
		fontSize: 12,
		fontWeight: 'bold',
		textTransform: 'uppercase',
	},
	appointmentDate: {
		fontSize: 14,
		color: '#6b7280',
		marginBottom: 4,
	},
	appointmentTime: {
		fontSize: 14,
		color: '#6b7280',
		marginBottom: 4,
	},
	todayLabel: {
		color: '#dc3545',
		fontWeight: 'bold',
	},
	patientEmail: {
		fontSize: 12,
		color: '#6b7280',
		marginBottom: 4,
	},
	appointmentNotes: {
		fontSize: 14,
		color: '#374151',
		fontStyle: 'italic',
		marginBottom: 8,
	},
	appointmentActions: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginTop: 8,
	},
	actionButton: {
		flex: 1,
		paddingVertical: 8,
		paddingHorizontal: 12,
		borderRadius: 6,
		alignItems: 'center',
		marginHorizontal: 4,
	},
	editButton: {
		backgroundColor: '#007bff',
	},
	deleteButton: {
		backgroundColor: '#dc3545',
	},
	actionButtonText: {
		color: '#fff',
		fontSize: 12,
		fontWeight: 'bold',
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
		marginBottom: 20,
	},
	emptyButton: {
		backgroundColor: '#007bff',
		paddingVertical: 12,
		paddingHorizontal: 20,
		borderRadius: 8,
	},
	emptyButtonText: {
		color: '#fff',
		fontWeight: 'bold',
		fontSize: 14,
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
	patientInfo: {
		backgroundColor: '#e3f2fd',
		padding: 12,
		borderRadius: 8,
		marginBottom: 15,
	},
	patientInfoText: {
		fontSize: 14,
		color: '#1565c0',
		marginBottom: 2,
	},
	inputLabel: {
		fontSize: 16,
		fontWeight: 'bold',
		color: '#374151',
		marginBottom: 5,
		marginTop: 10,
	},
	dateButton: {
		backgroundColor: '#f8f9fa',
		padding: 12,
		borderRadius: 8,
		marginBottom: 10,
		borderWidth: 1,
		borderColor: '#e9ecef',
	},
	dateButtonText: {
		fontSize: 16,
		color: '#374151',
	},
	pickerContainer: {
		borderWidth: 1,
		borderColor: '#e9ecef',
		borderRadius: 8,
		backgroundColor: '#f8f9fa',
		marginBottom: 10,
	},
	picker: {
		color: '#374151',
	},
	notesInput: {
		backgroundColor: '#f8f9fa',
		padding: 12,
		borderRadius: 8,
		marginBottom: 20,
		borderWidth: 1,
		borderColor: '#e9ecef',
		fontSize: 16,
		color: '#374151',
		height: 80,
		textAlignVertical: 'top',
	},
	modalButtons: {
		flexDirection: 'row',
		justifyContent: 'space-between',
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