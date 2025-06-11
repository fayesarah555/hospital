import React from 'react';
import { View, Text, Button } from 'react-native';

export default function AdminHomeScreen({ navigation }) {
	return (
		<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
			<Text>Accueil Admin</Text>
			<Button
				title="Voir la liste des utilisateurs"
				onPress={() => navigation.navigate('Utilisateurs')}
			/>
		</View>
	);
}
