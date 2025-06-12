import React, { useState } from 'react';
import {
	View,
	Text,
	TextInput,
	FlatList,
	TouchableOpacity,
	Modal,
	StyleSheet,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';

export default function AdminHomeScreen() {
	const [users, setUsers] = useState([
		{ id: '1', username: 'rh1', role: 'RH', details: 'Details RH1' },
		{ id: '2', username: 'doctor1', role: 'Doctor', details: 'Details Doctor1' },
		{ id: '3', username: 'rh2', role: 'RH', details: 'Details RH2' },
		{ id: '4', username: 'doctor2', role: 'Doctor', details: 'Details Doctor2' },
	]);
	const [filteredUsers, setFilteredUsers] = useState(users);
	const [selectedRole, setSelectedRole] = useState('All');
	const [modalVisible, setModalVisible] = useState(false);
	const [selectedUser, setSelectedUser] = useState(null);
	const [editUsername, setEditUsername] = useState('');
	const [editDetails, setEditDetails] = useState('');
	const [newUser, setNewUser] = useState({ username: '', role: 'RH', details: '' });
	const [addUserVisible, setAddUserVisible] = useState(false);

	const primaryColor = '#007bff';
	const secondaryColor = '#6c757d';

	const handleFilter = role => {
		setSelectedRole(role);
		setFilteredUsers(role === 'All' ? users : users.filter(user => user.role === role));
	};

	const handleSelectUser = user => {
		setSelectedUser(user);
		setEditUsername(user.username);
		setEditDetails(user.details);
		setModalVisible(true);
	};

	const handleSaveUser = () => {
		const updatedUsers = users.map(user =>
			user.id === selectedUser.id
				? { ...user, username: editUsername, details: editDetails }
				: user
		);
		setUsers(updatedUsers);
		handleFilter(selectedRole);
		setModalVisible(false);
	};

	const handleDeleteUser = () => {
		const updatedUsers = users.filter(user => user.id !== selectedUser.id);
		setUsers(updatedUsers);
		handleFilter(selectedRole);
		setModalVisible(false);
	};

	const handleAddUser = () => {
		const newUserWithId = { ...newUser, id: String(Date.now()) };
		const updatedUsers = [...users, newUserWithId];
		setUsers(updatedUsers);
		handleFilter(selectedRole);
		setNewUser({ username: '', role: 'RH', details: '' });
		setAddUserVisible(false); // Ferme le formulaire après ajout
	};

	const renderItem = ({ item }) => (
		<TouchableOpacity style={styles.userItem} onPress={() => handleSelectUser(item)}>
			<Text style={styles.username}>{item.username}</Text>
			<Text style={styles.role}>({item.role})</Text>
			<Text style={styles.details}>{item.details}</Text>
		</TouchableOpacity>
	);

	return (
		<View style={styles.container}>
			<Text style={styles.title}>👤 Gestion des utilisateurs</Text>

			<View style={styles.filters}>
				{['All', 'RH', 'Doctor'].map(role => (
					<TouchableOpacity
						key={role}
						style={[
							styles.filterButton,
							selectedRole === role && styles.filterButtonActive,
						]}
						onPress={() => handleFilter(role)}
					>
						<Text
							style={[
								styles.filterButtonText,
								selectedRole === role && { color: '#fff' },
							]}
						>
							{role === 'All' ? 'Tous' : role === 'Doctor' ? 'Médecin' : role}
						</Text>
					</TouchableOpacity>
				))}
			</View>

			<FlatList
				data={filteredUsers}
				renderItem={renderItem}
				keyExtractor={item => item.id}
				style={styles.list}
			/>

			<TouchableOpacity
				style={styles.toggleAddButton}
				onPress={() => setAddUserVisible(!addUserVisible)}
			>
				<Text style={styles.addButtonText}>
					{addUserVisible ? '❌ Fermer le formulaire' : '➕ Ajouter un utilisateur'}
				</Text>
			</TouchableOpacity>

			{addUserVisible && (
				<View style={styles.inputContainer}>
					<TextInput
						style={styles.input}
						placeholder="Nom d'utilisateur"
						value={newUser.username}
						onChangeText={text => setNewUser({ ...newUser, username: text })}
					/>
					<TextInput
						style={styles.input}
						placeholder="Détails"
						value={newUser.details}
						onChangeText={text => setNewUser({ ...newUser, details: text })}
					/>

					<Picker
						selectedValue={newUser.role}
						style={styles.picker}
						onValueChange={itemValue => setNewUser({ ...newUser, role: itemValue })}
					>
						<Picker.Item label="RH" value="RH" />
						<Picker.Item label="Médecin" value="Doctor" />
					</Picker>

					<TouchableOpacity style={styles.addButton} onPress={handleAddUser}>
						<Text style={styles.addButtonText}>💾 Ajouter</Text>
					</TouchableOpacity>
				</View>
			)}

			{/* Modal Modification utilisateur */}
			<Modal
				visible={modalVisible}
				transparent
				animationType="fade"
				onRequestClose={() => setModalVisible(false)}
			>
				<View style={styles.centeredView}>
					<View style={styles.modalView}>
						<Text style={styles.modalTitle}>Modifier l'utilisateur</Text>

						<TextInput
							style={styles.input}
							placeholder="Nom d'utilisateur"
							value={editUsername}
							onChangeText={setEditUsername}
						/>
						<TextInput
							style={styles.input}
							placeholder="Détails"
							value={editDetails}
							onChangeText={setEditDetails}
						/>

						<View style={styles.modalButtons}>
							<TouchableOpacity
								style={[styles.button, { backgroundColor: primaryColor }]}
								onPress={handleSaveUser}
							>
								<Text style={styles.buttonText}>💾 Enregistrer</Text>
							</TouchableOpacity>
							<TouchableOpacity
								style={[styles.button, { backgroundColor: '#dc3545' }]}
								onPress={handleDeleteUser}
							>
								<Text style={styles.buttonText}>🗑️ Supprimer</Text>
							</TouchableOpacity>
							<TouchableOpacity
								style={[styles.button, { backgroundColor: secondaryColor }]}
								onPress={() => setModalVisible(false)}
							>
								<Text style={styles.buttonText}>❌ Annuler</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 20,
		backgroundColor: '#f2f2f2',
	},
	title: {
		fontSize: 26,
		fontWeight: 'bold',
		textAlign: 'center',
		marginBottom: 20,
		color: '#222',
	},
	filters: {
		flexDirection: 'row',
		justifyContent: 'space-around',
		marginBottom: 20,
	},
	filterButton: {
		paddingVertical: 10,
		paddingHorizontal: 15,
		borderRadius: 20,
		backgroundColor: '#e0e0e0',
	},
	filterButtonActive: {
		backgroundColor: '#007bff',
	},
	filterButtonText: {
		fontSize: 14,
		color: '#333',
	},
	list: {
		marginBottom: 20,
	},
	userItem: {
		backgroundColor: '#fff',
		padding: 15,
		borderRadius: 10,
		marginBottom: 10,
		borderLeftWidth: 4,
		borderLeftColor: '#007bff',
	},
	username: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#333',
	},
	role: {
		fontSize: 14,
		color: '#888',
	},
	details: {
		fontSize: 15,
		color: '#555',
		marginTop: 5,
	},
	inputContainer: {
		marginTop: 10,
	},
	input: {
		backgroundColor: '#fff',
		padding: 10,
		marginBottom: 10,
		borderRadius: 8,
		fontSize: 16,
	},
	addButton: {
		backgroundColor: '#28a745',
		padding: 12,
		borderRadius: 10,
		alignItems: 'center',
	},
	addButtonText: {
		color: '#fff',
		fontSize: 16,
		fontWeight: '600',
	},
	toggleAddButton: {
		backgroundColor: '#17a2b8',
		padding: 12,
		borderRadius: 10,
		alignItems: 'center',
		marginBottom: 10,
	},
	centeredView: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: 'rgba(0, 0, 0, 0.4)',
	},
	modalView: {
		width: '85%',
		backgroundColor: '#fff',
		padding: 20,
		borderRadius: 12,
		elevation: 5,
	},
	modalTitle: {
		fontSize: 20,
		fontWeight: 'bold',
		marginBottom: 15,
		textAlign: 'center',
	},
	modalButtons: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginTop: 20,
	},
	button: {
		flex: 1,
		paddingVertical: 10,
		marginHorizontal: 5,
		borderRadius: 8,
		alignItems: 'center',
	},
	buttonText: {
		color: '#fff',
		fontWeight: '600',
		fontSize: 14,
	},
	picker: {
		backgroundColor: '#fff',
		marginBottom: 10,
		borderRadius: 8,
		paddingHorizontal: 10,
	},
});
