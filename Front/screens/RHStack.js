import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import DoctorHomeScreen from './DoctorHomeScreen';
import AppointmentScreen from './AppointmentScreen';
import PatientsListScreen from './PatientsListScreen';

const Stack = createStackNavigator();

export default function RHStack() {
	return (
		<Stack.Navigator>
			<Stack.Screen
				name="RHHomeScreen"
				component={RHHomeScreen}
				options={{ title: 'Accueil RH' }}
			/>
			<Stack.Screen
				name="PatientsList"
				component={PatientsListScreen}
				options={{ title: 'Liste des patients' }}
			/>
		</Stack.Navigator>
	);
}
