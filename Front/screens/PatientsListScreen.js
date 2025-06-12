import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import axios from 'axios';

export default function UsersListScreen() {
	const [users, setUsers] = useState([]);

	useEffect(() => {
		axios
			.get('http://localhost:3001/users')
			.then(res => setUsers(res.data))
			.catch(() => setUsers([]));
	}, []);

	return (
		<View style={{ flex: 1, padding: 20 }}>
			<Text style={{ fontSize: 22, marginBottom: 10 }}>Liste des patients</Text>
			<FlatList
				data={users}
				keyExtractor={item => item._id}
				renderItem={({ item }) => (
					<Text>
						{item.username} ({item.role})
					</Text>
				)}
			/>
		</View>
	);
}
