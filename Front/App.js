import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';
import RHHomeScreen from './hospital/Front/screens/RHHomeScreen';
import DoctorHomeScreen from './hospital/Front/screens/DoctorHomeScreen';
import AdminHomeScreen from './hospital/Front/screens/AdminHomeScreen';
import PatientsListScreen from './hospital/Front/screens/PatientsListScreen';
import DoctorStack from './hospital/Front/screens/DoctorStack';
import RHStack from './hospital/Front/screens/RHStack';

const Tab = createBottomTabNavigator();

export default function App() {
	return (
		<NavigationContainer>
			<Tab.Navigator
				initialRouteName="RHHome"
				screenOptions={({ route }) => ({
					tabBarIcon: ({ size }) => {
						let iconName;
						let iconColor;

						if (route.name === 'RHHome') {
							iconName = 'home-outline';
							iconColor = 'blue';
						} else if (route.name === 'DoctorHome') {
							iconName = 'medkit-outline';
							iconColor = 'green';
						} else if (route.name === 'AdminHome') {
							iconName = 'settings-outline';
							iconColor = 'red';
						} else if (route.name === 'PatientsList') {
							iconName = 'list-outline';
							iconColor = 'orange';
						}

						return <Icon name={iconName} size={size} color={iconColor} />;
					},
					tabBarActiveTintColor:
						route.name === 'RHHome'
							? 'blue'
							: route.name === 'DoctorHome'
							? 'green'
							: route.name === 'AdminHome'
							? 'red'
							: 'orange',
					tabBarInactiveTintColor: 'gray',
				})}
			>
				<Tab.Screen name="RHHome" component={RHStack} />
				<Tab.Screen name="DoctorHome" component={DoctorStack} />
				<Tab.Screen name="AdminHome" component={AdminHomeScreen} />
				<Tab.Screen name="PatientsList" component={PatientsListScreen} />
			</Tab.Navigator>
		</NavigationContainer>
	);
}
