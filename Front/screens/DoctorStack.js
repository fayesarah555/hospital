// DoctorStack.js
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import DoctorHomeScreen from './DoctorHomeScreen';
import AppointmentScreen from './AppointmentScreen';
import PatientsListScreen from './PatientsListScreen';
import AppointmentsListScreen from './AppointmentsListScreen';

const Stack = createStackNavigator();

export default function DoctorStack() {
	return (
		<Stack.Navigator>
			<Stack.Screen
				name="DoctorHomeScreen"
				component={DoctorHomeScreen}
				options={{
					title: 'Accueil Docteur',
					headerTitle: 'Accueil Docteur',
				}}
			/>
			<Stack.Screen
				name="PatientsList"
				component={PatientsListScreen}
				options={{ title: 'Liste des patients' }}
			/>
			<Stack.Screen
				name="AppointmentScreen"
				component={AppointmentScreen}
				options={{ title: 'Prise de rendez-vous' }}
			/>
			<Stack.Screen
				name="AppointmentsListScreen"
				component={AppointmentsListScreen}
				options={{ title: 'Liste des rendez-vous' }}
			/>
		</Stack.Navigator>
	);
}
