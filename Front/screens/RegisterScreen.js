import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, Picker, StyleSheet } from 'react-native';
import axios from 'axios';

export default function RegisterScreen({ navigation }) {
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [role, setRole] = useState('RH');

	const handleRegister = async () => {
		if (!username || !password) {
			Alert.alert('Erreur', 'Veuillez remplir tous les champs');
			return;
		}
		try {
			await axios.post('http://localhost:3001/register', { username, password, role });
			Alert.alert('Succès', 'Utilisateur créé', [
				{ text: 'OK', onPress: () => navigation.goBack() },
			]);
		} catch (e) {
			Alert.alert('Erreur', "Impossible de créer l'utilisateur");
		}
	};

	return (
		<View style={styles.container}>
			<Text style={styles.title}>Créer un utilisateur</Text>
			<TextInput
				placeholder="Identifiant"
				value={username}
				onChangeText={setUsername}
				style={styles.input}
			/>
			<TextInput
				placeholder="Mot de passe"
				value={password}
				onChangeText={setPassword}
				secureTextEntry
				style={styles.input}
			/>
			<Text style={{ marginTop: 10 }}>Rôle :</Text>
			<Picker
				selectedValue={role}
				style={styles.input}
				onValueChange={itemValue => setRole(itemValue)}
			>
				<Picker.Item label="RH" value="RH" />
				<Picker.Item label="Médecin" value="Doctor" />
				<Picker.Item label="Admin" value="Admin" />
			</Picker>
			<Button title="Créer" onPress={handleRegister} />
		</View>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
	title: { fontSize: 24, marginBottom: 20 },
	input: { borderWidth: 1, width: 200, marginBottom: 10, padding: 5 },
});
