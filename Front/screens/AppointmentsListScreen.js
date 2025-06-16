import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Alert } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://10.74.0.54:3001';

const AppointmentsListScreen = () => {
	const [appointments, setAppointments] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchAppointments = async () => {
			try {
				const token = await AsyncStorage.getItem('authToken');
				const userData = await AsyncStorage.getItem('userData');
				const user = JSON.parse(userData);
				const response = await axios.get(
					`${API_BASE_URL}/api/rendez-vous/medecin/${user.id}`,
					{
						headers: { Authorization: `Bearer ${token}` },
					}
				);
				setAppointments(response.data);
			} catch (error) {
				console.error('Erreur lors de la récupération des rendez-vous:', error);
				Alert.alert('Erreur', 'Impossible de récupérer les rendez-vous.');
			} finally {
				setLoading(false);
			}
		};

		fetchAppointments();
	}, []);

	const renderItem = ({ item }) => (
		<View style={styles.appointmentItem}>
			<Text style={styles.appointmentText}>
				Patient: {item.patient_nom} {item.patient_prenom}
			</Text>
			<Text style={styles.appointmentText}>
				Date: {new Date(item.date_heure).toLocaleString()}
			</Text>
			<Text style={styles.appointmentText}>Notes: {item.notes}</Text>
		</View>
	);

	return (
		<View style={styles.container}>
			<Text style={styles.title}>Liste de vos rendez-vous</Text>
			{loading ? (
				<Text>Chargement...</Text>
			) : (
				<FlatList
					data={appointments}
					renderItem={renderItem}
					keyExtractor={item => item.id.toString()}
					style={styles.list}
				/>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 20,
		backgroundColor: '#f5f5f5',
	},
	title: {
		fontSize: 24,
		fontWeight: 'bold',
		marginBottom: 20,
		textAlign: 'center',
	},
	list: {
		flexGrow: 1,
	},
	appointmentItem: {
		backgroundColor: 'white',
		padding: 15,
		borderRadius: 8,
		marginBottom: 15,
		borderWidth: 1,
		borderColor: '#ddd',
	},
	appointmentText: {
		fontSize: 16,
	},
});

export default AppointmentsListScreen;
