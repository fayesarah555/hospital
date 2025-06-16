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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as MailComposer from 'expo-mail-composer';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function DoctorHomeScreen({ navigation }) {
	const [patients, setPatients] = useState([]);
	const [modalVisible, setModalVisible] = useState(false);
	const [currentPatient, setCurrentPatient] = useState(null);
	const [editName, setEditName] = useState('');
	const [editAge, setEditAge] = useState('');
	const [editMedicine, setEditMedicine] = useState('');
	const [editLastVisit, setEditLastVisit] = useState('');
	const [token, setToken] = useState(null);
	const [searchText, setSearchText] = useState('');

	useEffect(() => {
		console.log('DoctorHomeScreen monté');
		const getTokenAndFetchPatients = async () => {
			console.log('Début de getTokenAndFetchPatients');
			const storedToken = await AsyncStorage.getItem('token');
			console.log('Token récupéré dans useEffect:', storedToken);
			setToken(storedToken);
			if (storedToken) {
				console.log('Appel de fetchPatients avec le token');
				fetchPatients(storedToken);
			} else {
				console.log('Aucun token trouvé dans AsyncStorage');
			}
		};
		getTokenAndFetchPatients();
	}, []);

	const fetchPatients = async currentToken => {
		if (!currentToken) {
			console.log('Token non disponible');
			return;
		}
		try {
			const response = await axios.get('http://10.74.0.54:3001/api/patients', {
				headers: {
					Authorization: `Bearer ${currentToken}`,
				},
			});
			setPatients(response.data);
		} catch (error) {
			console.error('Erreur lors de la récupération des patients:', error);
			Alert.alert('Erreur', 'Impossible de récupérer la liste des patients');
		}
	};

	const handlePress = patient => {
		setCurrentPatient(patient);
		setEditName(`${patient.nom} ${patient.prenom}`);
		setEditAge(patient.age.toString());
		setEditMedicine(patient.traitement_en_cours || '');
		setEditLastVisit(patient.derniere_visite || '');
		setModalVisible(true);
	};

	const handleLongPress = id => {
		Alert.alert(
			'Supprimer le patient',
			'Êtes-vous sûr de vouloir supprimer ce patient ?',
			[
				{ text: 'Annuler', style: 'cancel' },
				{
					text: 'Supprimer',
					onPress: () => deletePatient(id),
					style: 'destructive',
				},
			]
		);
	};

	const deletePatient = async id => {
		try {
			await axios.delete(`http://10.74.0.54:3001/api/patients/${id}`);
			fetchPatients(); // Rafraîchir la liste après suppression
		} catch (error) {
			console.error('Erreur lors de la suppression du patient:', error);
			Alert.alert('Erreur', 'Impossible de supprimer le patient');
		}
	};

	const sendMedicineChangeEmail = async (patient, newMedicine) => {
		const isAvailable = await MailComposer.isAvailableAsync();
		if (!isAvailable) {
			Alert.alert('Erreur', "L'envoi d'email n'est pas supporté sur cet appareil.");
			return;
		}

		const body = `Bonjour ${patient.nom} ${patient.prenom},

⚠️ Les informations concernant vos médicaments ont été modifiées.

💊 Nouveau traitement : ${newMedicine}
👨‍⚕️ Dernière mise à jour par le docteur : aujourd'hui
📅 Dernière visite : ${patient.derniere_visite || 'Non spécifiée'}

Merci de votre attention.`;

		await MailComposer.composeAsync({
			recipients: [patient.email],
			subject: `Mise à jour des médicaments de ${patient.nom} ${patient.prenom}`,
			body,
		});
	};

	const saveChanges = async () => {
		if (currentPatient) {
			const hasMedicineChanged = currentPatient.traitement_en_cours !== editMedicine;

			if (hasMedicineChanged) {
				await sendMedicineChangeEmail(currentPatient, editMedicine);
			}

			try {
				await axios.put(
					`http://10.74.0.54:3001/api/patients/${currentPatient.id}`,
					{
						nom: editName.split(' ')[0],
						prenom: editName.split(' ')[1],
						age: parseInt(editAge),
						traitement_en_cours: editMedicine,
						derniere_visite: editLastVisit,
					},
					{
						headers: {
							Authorization: `Bearer ${token}`,
						},
					}
				);
				fetchPatients(token);
				setModalVisible(false);
			} catch (error) {
				console.error('Erreur lors de la mise à jour du patient:', error);
				Alert.alert('Erreur', 'Impossible de mettre à jour le patient');
			}
		}
	};

	const renderItem = ({ item }) => (
		<TouchableOpacity
			style={styles.patientItem}
			onPress={() => handlePress(item)}
			onLongPress={() => handleLongPress(item.id)}
			delayLongPress={500}
		>
			<View style={styles.patientInfo}>
				<Text style={styles.patientName}>
					{item.nom} {item.prenom}
				</Text>
				<Text style={styles.patientDetails}>Âge: {item.age} ans</Text>
				<Text style={styles.patientDetails}>
					Traitement: {item.traitement_en_cours || 'Aucun'}
				</Text>
				<Text style={styles.patientDetails}>
					Dernière visite: {item.derniere_visite || 'Non spécifiée'}
				</Text>
			</View>
		</TouchableOpacity>
	);

	return (
		<View style={styles.container}>
			<Text style={styles.title}>Accueil Docteur</Text>

			<TouchableOpacity
				style={styles.ButtonNav}
				onPress={() => navigation.navigate('AppointmentScreen')}
			>
				<Text style={styles.ButtonNavText}>📅 Prise de RDV</Text>
			</TouchableOpacity>

			<TouchableOpacity
				style={styles.ButtonNav}
				onPress={() => navigation.navigate('AppointmentsListScreen')}
			>
				<Text style={styles.ButtonNavText}>📅 Liste des rendez-vous</Text>
			</TouchableOpacity>
			<TextInput
				style={styles.searchInput}
				placeholder="🔍 Rechercher un patient..."
				value={searchText}
				onChangeText={setSearchText}
			/>

			<FlatList
				data={patients.filter(patient =>
					`${patient.nom} ${patient.prenom}`
						.toLowerCase()
						.includes(searchText.toLowerCase())
				)}
				renderItem={renderItem}
				keyExtractor={item => item.id.toString()}
				style={styles.list}
			/>

			<Modal
				animationType="slide"
				transparent={true}
				visible={modalVisible}
				onRequestClose={() => setModalVisible(false)}
			>
				<View style={styles.centeredView}>
					<View style={styles.modalView}>
						<Text style={styles.modalTitle}>Modifier le patient</Text>

						<TextInput
							style={styles.input}
							value={editName}
							onChangeText={setEditName}
							placeholder="Nom du patient"
						/>
						<TextInput
							style={styles.input}
							value={editAge}
							onChangeText={setEditAge}
							placeholder="Âge"
							keyboardType="numeric"
						/>
						<TextInput
							style={styles.input}
							value={editMedicine}
							onChangeText={setEditMedicine}
							placeholder="Médicaments"
						/>
						<TextInput
							style={styles.input}
							value={editLastVisit}
							onChangeText={setEditLastVisit}
							placeholder="Dernière visite (JJ/MM/AAAA)"
						/>

						<View style={styles.buttonContainer}>
							<TouchableOpacity
								style={[styles.button, styles.buttonCancel]}
								onPress={() => setModalVisible(false)}
							>
								<Text style={styles.buttonText}>❌ Annuler</Text>
							</TouchableOpacity>
							<TouchableOpacity
								style={[styles.button, styles.buttonSave]}
								onPress={saveChanges}
							>
								<Text style={styles.buttonText}>💾 Enregistrer</Text>
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
		justifyContent: 'flex-start',
		alignItems: 'center',
		padding: 20,
		backgroundColor: '#f5f5f5',
	},
	title: {
		fontSize: 24,
		fontWeight: 'bold',
		marginBottom: 20,
		color: '#333',
	},
	ButtonNav: {
		backgroundColor: '#3498db',
		paddingVertical: 12,
		paddingHorizontal: 20,
		borderRadius: 8,
		marginBottom: 15,
		width: '80%',
		alignItems: 'center',
	},
	ButtonNavText: {
		color: 'white',
		fontWeight: 'bold',
		fontSize: 16,
	},
	list: {
		width: '100%',
	},
	patientItem: {
		backgroundColor: 'white',
		padding: 15,
		borderRadius: 10,
		marginVertical: 8,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.2,
		shadowRadius: 2,
		elevation: 3,
	},
	patientInfo: {
		flex: 1,
	},
	patientName: {
		fontSize: 18,
		fontWeight: 'bold',
		marginBottom: 5,
		color: '#2c3e50',
	},
	patientDetails: {
		fontSize: 14,
		color: '#7f8c8d',
		marginBottom: 3,
	},
	centeredView: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
	},
	modalView: {
		width: '80%',
		backgroundColor: 'white',
		borderRadius: 20,
		padding: 20,
		alignItems: 'center',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.25,
		shadowRadius: 4,
		elevation: 5,
	},
	modalTitle: {
		fontSize: 20,
		fontWeight: 'bold',
		marginBottom: 15,
	},
	input: {
		width: '100%',
		height: 40,
		borderWidth: 1,
		borderColor: '#ddd',
		borderRadius: 5,
		marginBottom: 15,
		paddingHorizontal: 10,
	},
	buttonContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		width: '100%',
	},
	button: {
		borderRadius: 10,
		padding: 10,
		elevation: 2,
		width: '45%',
	},
	buttonCancel: {
		backgroundColor: '#e74c3c',
	},
	buttonSave: {
		backgroundColor: '#2ecc71',
	},
	buttonText: {
		color: 'white',
		fontWeight: 'bold',
		textAlign: 'center',
	},
	searchInput: {
		width: '100%',
		height: 40,
		borderWidth: 1,
		borderColor: '#ccc',
		borderRadius: 8,
		paddingHorizontal: 10,
		marginBottom: 10,
		backgroundColor: 'white',
	},
});
