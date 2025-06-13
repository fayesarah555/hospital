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
		setAddUserVisible(false);
	};

	const renderItem = ({ item }) => {
		const roleColor = item.role === 'Doctor' ? '#10b981' : '#3b82f6';

		return (
			<TouchableOpacity
				style={[styles.userItem, { borderLeftColor: roleColor }]}
				onPress={() => handleSelectUser(item)}
			>
				<Text style={styles.username}>{item.username}</Text>
				<Text style={styles.role}>{item.role === 'Doctor' ? '🩺 Médecin' : '🧑‍💼 RH'}</Text>
				<Text style={styles.details}>{item.details}</Text>
			</TouchableOpacity>
		);
	};

	return (
		<View style={styles.container}>
			<Text style={styles.title}>Gestion des utilisateurs</Text>

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
		backgroundColor: '#f1f5f9',
	},
	title: {
		fontSize: 30,
		fontWeight: 'bold',
		textAlign: 'center',
		marginBottom: 30,
		color: '#1e293b',
	},
	filters: {
		flexDirection: 'row',
		justifyContent: 'space-around',
		marginBottom: 25,
	},
	filterButton: {
		paddingVertical: 10,
		paddingHorizontal: 18,
		borderRadius: 50,
		backgroundColor: '#e2e8f0',
	},
	filterButtonActive: {
		backgroundColor: '#3b82f6',
	},
	filterButtonText: {
		fontSize: 15,
		fontWeight: '600',
		color: '#1e293b',
	},
	list: {
		marginBottom: 20,
	},
	userItem: {
		backgroundColor: '#fff',
		padding: 18,
		borderRadius: 16,
		marginBottom: 12,
		flexDirection: 'column',
		gap: 4,
		borderLeftWidth: 6,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
	},
	username: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#0f172a',
	},
	role: {
		fontSize: 14,
		fontWeight: '600',
		color: '#6366f1',
	},
	details: {
		fontSize: 14,
		color: '#475569',
	},
	inputContainer: {
		marginTop: 10,
		backgroundColor: '#fff',
		padding: 16,
		borderRadius: 16,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.08,
		shadowRadius: 3,
		elevation: 2,
	},
	input: {
		backgroundColor: '#e2e8f0',
		padding: 12,
		marginBottom: 12,
		borderRadius: 10,
		fontSize: 16,
		color: '#1e293b',
	},
	addButton: {
		backgroundColor: '#10b981',
		padding: 14,
		borderRadius: 12,
		alignItems: 'center',
		marginTop: 8,
	},
	addButtonText: {
		color: '#fff',
		fontSize: 16,
		fontWeight: '700',
	},
	toggleAddButton: {
		backgroundColor: '#0ea5e9',
		padding: 14,
		borderRadius: 14,
		alignItems: 'center',
		marginBottom: 16,
	},
	centeredView: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: 'rgba(0, 0, 0, 0.4)',
	},
	modalView: {
		width: '90%',
		backgroundColor: '#f8fafc',
		padding: 24,
		borderRadius: 18,
		elevation: 10,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.2,
		shadowRadius: 6,
	},
	modalTitle: {
		fontSize: 22,
		fontWeight: '700',
		marginBottom: 18,
		textAlign: 'center',
		color: '#0f172a',
	},
	modalButtons: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginTop: 20,
	},
	button: {
		flex: 1,
		paddingVertical: 12,
		marginHorizontal: 5,
		borderRadius: 10,
		alignItems: 'center',
	},
	buttonText: {
		color: '#fff',
		fontWeight: '700',
		fontSize: 14,
	},
	picker: {
		backgroundColor: '#e2e8f0',
		marginBottom: 10,
		borderRadius: 10,
		paddingHorizontal: 10,
		color: '#1e293b',
	},
});
