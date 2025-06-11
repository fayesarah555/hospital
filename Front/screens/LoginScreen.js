import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import axios from 'axios';

export default function LoginScreen({ navigation }) {
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');

	const handleLogin = async () => {
		try {
			const res = await axios.post('http://localhost:3001/login', { username, password });
			if (res.data.role === 'RH') navigation.replace('RHHome');
			else if (res.data.role === 'Doctor') navigation.replace('DoctorHome');
			else if (res.data.role === 'Admin') navigation.replace('AdminHome');
		} catch (e) {
			Alert.alert('Erreur', 'Identifiants incorrects');
		}
	};

	return (
		<View style={styles.container}>
			<Text style={styles.title}>Connexion</Text>
			<TextInput
				placeholder="Nom d'utilisateur"
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
			<Button title="Se connecter" onPress={handleLogin} />
			<Button title="Créer un compte" onPress={() => navigation.navigate('Register')} />
		</View>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
	title: { fontSize: 24, marginBottom: 20 },
	input: { borderWidth: 1, width: 200, marginBottom: 10, padding: 5 },
});
