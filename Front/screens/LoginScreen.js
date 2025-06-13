import React, { useState } from 'react';
import {
	View,
	Text,
	TextInput,
	TouchableOpacity,
	StyleSheet,
	Alert,
	KeyboardAvoidingView,
	Platform,
} from 'react-native';
import axios from 'axios';

export default function LoginScreen({ navigation }) {
	const [mail, setMail] = useState('');
	const [password, setPassword] = useState('');

	// On supprime axios et la vraie connexion pour le moment
	const handleLogin = () => {
		// Juste rediriger vers l'app principale (MainTabs)
		navigation.replace('MainTabs');
	};

	return (
		<KeyboardAvoidingView
			behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
			style={styles.container}
		>
			<Text style={styles.title}>🔐 Connexion</Text>

			<View style={styles.formCard}>
				<TextInput
					placeholder="Adresse e-mail"
					value={mail}
					onChangeText={setMail}
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

				<TouchableOpacity style={styles.primaryButton} onPress={handleLogin}>
					<Text style={styles.buttonText}>✅ Se connecter</Text>
				</TouchableOpacity>

				<TouchableOpacity
					style={styles.secondaryButton}
					onPress={() => navigation.navigate('RegisterScreen')}
				>
					<Text style={styles.buttonText}>📝 Créer un compte</Text>
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
	primaryButton: {
		backgroundColor: '#17a2b8',
		paddingVertical: 14,
		paddingHorizontal: 30,
		borderRadius: 14,
		marginTop: 10,
		marginBottom: 15,
		alignItems: 'center',
		elevation: 3,
	},
	secondaryButton: {
		backgroundColor: '#3498db',
		paddingVertical: 14,
		paddingHorizontal: 30,
		borderRadius: 14,
		alignItems: 'center',
		elevation: 3,
	},
	buttonText: {
		color: 'white',
		fontWeight: '600',
		fontSize: 16,
	},
});
