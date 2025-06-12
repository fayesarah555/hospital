import React, { useState } from 'react';
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
import { Ionicons } from '@expo/vector-icons'; // Assure-toi que ce package est installé

export default function DoctorHomeScreen({ navigation }) {
	const [patients, setPatients] = useState([
		{
			id: '1',
			name: 'Martin Dupont',
			age: 45,
			medicine: 'Doliprane',
			lastVisit: '12/05/2023',
		},
		{
			id: '2',
			name: 'Sophie Lefebvre',
			age: 32,
			medicine: 'Toplexile',
			lastVisit: '03/06/2023',
		},
		{
			id: '3',
			name: 'Jean Moreau',
			age: 58,
			medicine: 'Dafalgan',
			lastVisit: '22/04/2023',
		},
		{
			id: '4',
			name: 'Marie Lambert',
			age: 29,
			medicine: 'Ventoline',
			lastVisit: '17/06/2023',
		},
		{
			id: '5',
			name: 'Pierre Dubois',
			age: 67,
			medicine: 'Ibuprofène',
			lastVisit: '05/05/2023',
		},
	]);

	const [modalVisible, setModalVisible] = useState(false);
	const [addModalVisible, setAddModalVisible] = useState(false);
	const [currentPatient, setCurrentPatient] = useState(null);
	const [editName, setEditName] = useState('');
	const [editAge, setEditAge] = useState('');
	const [editMedicine, setEditMedicine] = useState('');
	const [editLastVisit, setEditLastVisit] = useState('');

	const [newName, setNewName] = useState('');
	const [newAge, setNewAge] = useState('');
	const [newMedicine, setNewMedicine] = useState('');
	const [newLastVisit, setNewLastVisit] = useState('');

	const handlePress = patient => {
		setCurrentPatient(patient);
		setEditName(patient.name);
		setEditAge(patient.age.toString());
		setEditMedicine(patient.medicine);
		setEditLastVisit(patient.lastVisit);
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
					onPress: () => {
						setPatients(patients.filter(patient => patient.id !== id));
					},
					style: 'destructive',
				},
			]
		);
	};

	const saveChanges = () => {
		if (currentPatient) {
			setPatients(
				patients.map(patient =>
					patient.id === currentPatient.id
						? {
								...patient,
								name: editName,
								age: parseInt(editAge),
								medicine: editMedicine,
								lastVisit: editLastVisit,
						  }
						: patient
				)
			);
			setModalVisible(false);
		}
	};

	const addPatient = () => {
		if (newName && newAge && newMedicine && newLastVisit) {
			const newPatient = {
				id: Date.now().toString(),
				name: newName,
				age: parseInt(newAge),
				medicine: newMedicine,
				lastVisit: newLastVisit,
			};
			setPatients([...patients, newPatient]);
			setAddModalVisible(false);
			setNewName('');
			setNewAge('');
			setNewMedicine('');
			setNewLastVisit('');
		} else {
			Alert.alert('Champs manquants', 'Veuillez remplir tous les champs.');
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
				<Text style={styles.patientName}>{item.name}</Text>
				<Text style={styles.patientDetails}>Âge: {item.age} ans</Text>
				<Text style={styles.patientDetails}>Médicament(s): {item.medicine}</Text>
				<Text style={styles.patientDetails}>Dernière visite: {item.lastVisit}</Text>
			</View>
		</TouchableOpacity>
	);

	return (
		<View style={styles.container}>
			<Text style={styles.title}>Accueil Docteur</Text>

			<TouchableOpacity
				style={styles.ButtonNav}
				onPress={() => navigation.navigate('PatientsList')}
			>
				<Text style={styles.ButtonNavText}>Voir tous les patients</Text>
			</TouchableOpacity>

			<TouchableOpacity
				style={styles.ButtonNav}
				onPress={() => navigation.navigate('AppointmentScreen')}
			>
				<Text style={styles.ButtonNavText}>Prise de RDV</Text>
			</TouchableOpacity>

			<TouchableOpacity
				style={[styles.ButtonNav, { backgroundColor: '#17a2b8' }]}
				onPress={() => setAddModalVisible(true)}
			>
				<Text style={styles.ButtonNavText}>➕ Ajouter un patient</Text>
			</TouchableOpacity>

			<FlatList
				data={patients}
				renderItem={renderItem}
				keyExtractor={item => item.id}
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
								<Text style={styles.buttonText}>Annuler</Text>
							</TouchableOpacity>
							<TouchableOpacity
								style={[styles.button, styles.buttonSave]}
								onPress={saveChanges}
							>
								<Text style={styles.buttonText}>Enregistrer</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>

			{/* Modal d'ajout */}
			<Modal
				animationType="slide"
				transparent={true}
				visible={addModalVisible}
				onRequestClose={() => setAddModalVisible(false)}
			>
				<View style={styles.centeredView}>
					<View style={styles.modalView}>
						<View
							style={{
								flexDirection: 'row',
								justifyContent: 'space-between',
								width: '100%',
							}}
						>
							<Text style={styles.modalTitle}>Nouveau patient</Text>
							<TouchableOpacity onPress={() => setAddModalVisible(false)}>
								<Ionicons name="close" size={24} color="black" />
							</TouchableOpacity>
						</View>

						<TextInput
							style={styles.input}
							value={newName}
							onChangeText={setNewName}
							placeholder="Nom du patient"
						/>
						<TextInput
							style={styles.input}
							value={newAge}
							onChangeText={setNewAge}
							placeholder="Âge"
							keyboardType="numeric"
						/>
						<TextInput
							style={styles.input}
							value={newMedicine}
							onChangeText={setNewMedicine}
							placeholder="Médicaments"
						/>
						<TextInput
							style={styles.input}
							value={newLastVisit}
							onChangeText={setNewLastVisit}
							placeholder="Dernière visite (JJ/MM/AAAA)"
						/>

						<TouchableOpacity
							style={[styles.button, styles.buttonSave, { width: '100%', marginTop: 10 }]}
							onPress={addPatient}
						>
							<Text style={styles.buttonText}>Ajouter</Text>
						</TouchableOpacity>
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
});
