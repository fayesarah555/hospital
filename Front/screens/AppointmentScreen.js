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

export default function AppointmentScreen({ navigation }) {
	const [patientName, setPatientName] = useState('');
	const [doctorName, setDoctorName] = useState('');
	const [date, setDate] = useState(new Date());
	const [time, setTime] = useState(new Date());
	const [showDatePicker, setShowDatePicker] = useState(false);
	const [showTimePicker, setShowTimePicker] = useState(false);
	const [reason, setReason] = useState('');

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

	const handleSubmit = () => {
		if (!patientName || !doctorName || !reason) {
			Alert.alert('Erreur', 'Veuillez remplir tous les champs');
			return;
		}

		Alert.alert(
			'Rendez-vous confirmé',
			`Patient: ${patientName}\nDocteur: ${doctorName}\nDate: ${date.toLocaleDateString()}\nHeure: ${time
				.toLocaleTimeString()
				.slice(0, 5)}\nMotif: ${reason}`,
			[{ text: 'OK', onPress: () => navigation.goBack() }]
		);
	};

	return (
		<ScrollView contentContainerStyle={styles.container}>
			<Text style={styles.title}>Prise de Rendez-vous</Text>

			<TextInput
				style={styles.input}
				placeholder="Nom du patient"
				value={patientName}
				onChangeText={setPatientName}
			/>

			<TextInput
				style={styles.input}
				placeholder="Nom du médecin"
				value={doctorName}
				onChangeText={setDoctorName}
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
