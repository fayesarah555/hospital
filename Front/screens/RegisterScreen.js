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
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';

export default function RegisterScreen({ navigation }) {
	const [password, setPassword] = useState('');
	const [role, setRole] = useState('rh');
	const [firstName, setFirstName] = useState('');
	const [lastName, setLastName] = useState('');
	const [email, setEmail] = useState('');

const handleRegister = async () => {
	if (!password || !firstName || !lastName || !email) {
		Alert.alert('Erreur', 'Veuillez remplir tous les champs');
		return;
	}
	try {
		await axios.post('http://192.168.1.193:3001/api/auth/register', {
			nom: lastName,
			prenom: firstName,
			email: email,
			password: password,
			role: role,
		});
		Alert.alert('Succès', 'Utilisateur créé', [
			{ text: 'OK', onPress: () => navigation.goBack() },
		]);
	} catch (e) {
		console.error(e.response?.data || e.message); // pour te faciliter le debug
		Alert.alert('Erreur', "Impossible de créer l'utilisateur");
	}
};

	return (
		<KeyboardAvoidingView
			behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
			style={styles.container}
		>
			<Text style={styles.title}>🧾 Création d’un utilisateur</Text>

			<View style={styles.formCard}>
				<TextInput
					placeholder="Prénom"
					value={firstName}
					onChangeText={setFirstName}
					style={styles.input}
					placeholderTextColor="#888"
				/>
				<TextInput
					placeholder="Nom"
					value={lastName}
					onChangeText={setLastName}
					style={styles.input}
					placeholderTextColor="#888"
				/>
				<TextInput
					placeholder="Adresse e-mail"
					value={email}
					onChangeText={setEmail}
					keyboardType="email-address"
					style={styles.input}
					placeholderTextColor="#888"
				/>
				<TextInput
					placeholder="Mot de passe"
					value={password}
					onChangeText={setPassword}
					secureTextEntry
					style={styles.input}
					placeholderTextColor="#888"
				/>
				<Text style={styles.label}>Rôle :</Text>
				<View style={styles.pickerWrapper}>
					<Picker
						selectedValue={role}
						onValueChange={itemValue => setRole(itemValue)}
						style={styles.picker}
						mode="dropdown"
					>
						<Picker.Item label="RH" value="rh" />
						<Picker.Item label="Médecin" value="medecin" />
						<Picker.Item label="Admin" value="admin" />
					</Picker>
				</View>

				<TouchableOpacity style={styles.primaryButton} onPress={handleRegister}>
					<Text style={styles.buttonText}>✅ Créer</Text>
				</TouchableOpacity>
			</View>
		</KeyboardAvoidingView>
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
	label: {
		fontSize: 16,
		color: '#2c3e50',
		marginTop: 10,
		marginBottom: 5,
	},
	pickerWrapper: {
		borderWidth: 1,
		borderColor: '#ced4da',
		borderRadius: 12,
		overflow: 'hidden',
		backgroundColor: '#f8f9fa',
		marginBottom: 16,
		width: '100%',
	},
	picker: {
		width: '100%',
		color: '#2c3e50',
	},
	primaryButton: {
		backgroundColor: '#17a2b8',
		paddingVertical: 14,
		paddingHorizontal: 30,
		borderRadius: 14,
		marginTop: 10,
		alignItems: 'center',
		elevation: 3,
	},
	buttonText: {
		color: 'white',
		fontWeight: '600',
		fontSize: 16,
	},
});
