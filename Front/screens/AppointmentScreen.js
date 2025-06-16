import React, { useState } from 'react';
import {
	View,
	Text,
	StyleSheet,
	TextInput,
	TouchableOpacity,
	ScrollView,
	Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as MailComposer from 'expo-mail-composer';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://10.74.0.54:3001';

export default function AppointmentScreen({ navigation }) {
	const [patientName, setPatientName] = useState('');
	const [doctorName, setDoctorName] = useState('');
	const [date, setDate] = useState(new Date());
	const [time, setTime] = useState(new Date());
	const [showDatePicker, setShowDatePicker] = useState(false);
	const [showTimePicker, setShowTimePicker] = useState(false);
	const [reason, setReason] = useState('');

	const formatMySQLDate = date => {
		const pad = n => (n < 10 ? '0' + n : n);
		const year = date.getFullYear();
		const month = pad(date.getMonth() + 1);
		const day = pad(date.getDate());
		const hours = pad(date.getHours());
		const minutes = pad(date.getMinutes());
		const seconds = '00';
		return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
	};

	const notifyByEmail = async () => {
		const isAvailable = await MailComposer.isAvailableAsync();
		if (!isAvailable) {
			Alert.alert('Erreur', "L'envoi d'email n'est pas supporté sur cet appareil.");
			return;
		}

		const emailBody = `Bonjour ${patientName},

Votre rendez-vous avec le Dr ${doctorName} est confirmé.

🗓 Date : ${date.toLocaleDateString()}
🕒 Heure : ${time.toLocaleTimeString().slice(0, 5)}
📄 Motif : ${reason}

À bientôt !`;

		await MailComposer.composeAsync({
			recipients: ['yannis.bttr@gmail.com'],
			subject: 'Confirmation de rendez-vous',
			body: emailBody,
		});
	};

	const onDateChange = (event, selectedDate) => {
		const currentDate = selectedDate || date;
		setShowDatePicker(false);
		setDate(currentDate);
	};

	const onTimeChange = (event, selectedTime) => {
		const currentTime = selectedTime || time;
		setShowTimePicker(false);
		setTime(currentTime);
	};

	const handleSubmit = async () => {
		if (!patientName || !doctorName || !reason) {
			Alert.alert('Erreur', 'Veuillez remplir tous les champs');
			return;
		}

		const fullDate = new Date(date);
		fullDate.setHours(time.getHours(), time.getMinutes(), 0);

		const formattedDate = formatMySQLDate(fullDate);

		console.log('🟢 Payload:', {
			patient_id: parseInt(patientName, 10),
			medecin_id: parseInt(doctorName, 10),
			date_heure: formattedDate,
			notes: reason.trim(),
		});

		try {
			const token = await AsyncStorage.getItem('authToken');
			await axios.post(
				`${API_BASE_URL}/api/rendez-vous`,
				{
					patient_id: parseInt(patientName, 10),
					medecin_id: parseInt(doctorName, 10),
					date_heure: formattedDate,
					notes: reason.trim(),
				},
				{
					headers: { Authorization: `Bearer ${token}` },
				}
			);

			Alert.alert('Succès', 'Rendez-vous créé avec succès');
			await notifyByEmail();
			navigation.goBack();
		} catch (error) {
			console.error('❌ Erreur:', error.response?.data || error.message);
			Alert.alert('Erreur', 'Impossible de créer le rendez-vous.');
		}
	};

	return (
		<ScrollView contentContainerStyle={styles.container}>
			<Text style={styles.title}>Prise de Rendez-vous</Text>

			<TextInput
				style={styles.input}
				placeholder="ID du patient"
				value={patientName}
				onChangeText={setPatientName}
				keyboardType="numeric"
			/>

			<TextInput
				style={styles.input}
				placeholder="ID du médecin"
				value={doctorName}
				onChangeText={setDoctorName}
				keyboardType="numeric"
			/>

			<TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
				<Text style={styles.dateButtonText}>
					Sélectionner une date: {date.toLocaleDateString()}
				</Text>
			</TouchableOpacity>

			{showDatePicker && (
				<DateTimePicker
					value={date}
					mode="date"
					display="default"
					onChange={onDateChange}
					minimumDate={new Date()}
				/>
			)}

			<TouchableOpacity style={styles.dateButton} onPress={() => setShowTimePicker(true)}>
				<Text style={styles.dateButtonText}>
					Sélectionner une heure: {time.toLocaleTimeString().slice(0, 5)}
				</Text>
			</TouchableOpacity>

			{showTimePicker && (
				<DateTimePicker
					value={time}
					mode="time"
					display="default"
					onChange={onTimeChange}
				/>
			)}

			<TextInput
				style={[styles.input, styles.reasonInput]}
				placeholder="Motif du rendez-vous"
				value={reason}
				onChangeText={setReason}
				multiline
			/>

			<TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
				<Text style={styles.submitButtonText}>Confirmer le rendez-vous</Text>
			</TouchableOpacity>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: {
		flexGrow: 1,
		padding: 20,
		backgroundColor: '#f5f5f5',
		alignItems: 'center',
	},
	title: {
		fontSize: 24,
		fontWeight: 'bold',
		marginBottom: 20,
		color: '#333',
	},
	input: {
		width: '90%',
		backgroundColor: 'white',
		padding: 15,
		borderRadius: 8,
		marginBottom: 15,
		borderWidth: 1,
		borderColor: '#ddd',
	},
	reasonInput: {
		height: 100,
		textAlignVertical: 'top',
	},
	dateButton: {
		width: '90%',
		backgroundColor: 'white',
		padding: 15,
		borderRadius: 8,
		marginBottom: 15,
		borderWidth: 1,
		borderColor: '#ddd',
		alignItems: 'center',
	},
	dateButtonText: {
		color: '#333',
	},
	submitButton: {
		width: '90%',
		backgroundColor: '#3498db',
		padding: 15,
		borderRadius: 8,
		alignItems: 'center',
		marginTop: 10,
	},
	submitButtonText: {
		color: 'white',
		fontWeight: 'bold',
		fontSize: 16,
	},
});
