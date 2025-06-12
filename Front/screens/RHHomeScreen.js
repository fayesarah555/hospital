import React, { useState } from 'react';
import {
	View,
	Text,
	TextInput,
	TouchableOpacity,
	StyleSheet,
	ScrollView,
} from 'react-native';

export default function AddPatientScreen({ navigation }) {
	const [id, setId] = useState('');
	const [firstName, setFirstName] = useState('');
	const [lastName, setLastName] = useState('');
	const [age, setAge] = useState('');
	const [weight, setWeight] = useState('');
	const [height, setHeight] = useState('');
	const [treatment, setTreatment] = useState('');

	return (
		<ScrollView contentContainerStyle={styles.container}>
			<Text style={styles.title}>Ajouter un Nouveau Patient</Text>
			<TextInput style={styles.input} placeholder="ID" value={id} onChangeText={setId} />
			<TextInput
				style={styles.input}
				placeholder="Nom"
				value={lastName}
				onChangeText={setLastName}
			/>
			<TextInput
				style={styles.input}
				placeholder="Prénom"
				value={firstName}
				onChangeText={setFirstName}
			/>
			<TextInput
				style={styles.input}
				placeholder="Âge"
				value={age}
				onChangeText={setAge}
				keyboardType="numeric"
			/>
			<TextInput
				style={styles.input}
				placeholder="Poids (kg)"
				value={weight}
				onChangeText={setWeight}
				keyboardType="numeric"
			/>
			<TextInput
				style={styles.input}
				placeholder="Taille (cm)"
				value={height}
				onChangeText={setHeight}
				keyboardType="numeric"
			/>
			<TextInput
				style={styles.input}
				placeholder="Traitement en cours"
				value={treatment}
				onChangeText={setTreatment}
			/>
			<TouchableOpacity style={[styles.button, { backgroundColor: '#17a2b8' }]}>
				<Text style={styles.buttonText}>➕ Ajouter un patient</Text>
			</TouchableOpacity>
			<TouchableOpacity
				style={styles.button}
				onPress={() => navigation.navigate('PatientsList')}
			>
				<Text style={styles.buttonText}>Liste Patients</Text>
			</TouchableOpacity>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: {
		flexGrow: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#ffffff',
		padding: 20,
	},
	title: {
		fontSize: 28,
		fontWeight: 'bold',
		marginBottom: 20,
	},
	input: {
		width: '90%',
		padding: 10,
		marginVertical: 10,
		borderWidth: 1,
		borderColor: '#9197AE',
		borderRadius: 5,
		backgroundColor: '#ffffff',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.25,
		shadowRadius: 0.5,
	},
	button: {
		backgroundColor: '#3498db',
		paddingVertical: 12,
		paddingHorizontal: 20,
		borderRadius: 8,
		marginBottom: 15,
		width: '80%',
		alignItems: 'center',
	},
	buttonText: {
		color: 'white',
		fontWeight: 'bold',
		fontSize: 16,
	},
});
