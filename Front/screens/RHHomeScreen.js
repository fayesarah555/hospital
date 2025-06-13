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
			<Text style={styles.title}>➕ Ajouter un Patient</Text>

			<View style={styles.formCard}>
				<TextInput
					style={styles.input}
					placeholder="ID"
					value={id}
					onChangeText={setId}
				/>
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
			</View>

			<TouchableOpacity style={styles.primaryButton}>
				<Text style={styles.buttonText}>➕ Ajouter un patient</Text>
			</TouchableOpacity>

			<TouchableOpacity
				style={styles.secondaryButton}
				onPress={() => navigation.navigate('PatientsList')}
			>
				<Text style={styles.buttonText}>📋 Liste des patients</Text>
			</TouchableOpacity>
		</ScrollView>
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
		marginBottom: 20,
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
		marginBottom: 15,
		width: '90%',
		alignItems: 'center',
		elevation: 3,
	},
	secondaryButton: {
		backgroundColor: '#3498db',
		paddingVertical: 14,
		paddingHorizontal: 30,
		borderRadius: 14,
		width: '90%',
		alignItems: 'center',
		elevation: 3,
	},
	buttonText: {
		color: 'white',
		fontWeight: '600',
		fontSize: 16,
	},
});
