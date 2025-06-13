// App.js
import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import RHStack from './screens/RHStack';
import DoctorStack from './screens/DoctorStack';
import AdminHomeScreen from './screens/AdminHomeScreen';
import PatientsListScreen from './screens/PatientsListScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
	return (
		<Tab.Navigator
			initialRouteName="RHHome"
			screenOptions={({ route }) => ({
				tabBarIcon: ({ size }) => {
					let iconName, iconColor;
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
	);
}

export default function App() {
	return (
		<NavigationContainer>
			<Stack.Navigator screenOptions={{ headerShown: false }}>
				<Stack.Screen name="Login" component={LoginScreen} />
				<Stack.Screen name="RegisterScreen" component={RegisterScreen} />
				<Stack.Screen name="MainTabs" component={MainTabs} />
			</Stack.Navigator>
		</NavigationContainer>
	);
}
