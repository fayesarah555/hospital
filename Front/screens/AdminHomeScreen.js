import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	TextInput,
	FlatList,
	TouchableOpacity,
	Modal,
	StyleSheet,
	Alert,
	ActivityIndicator,
	RefreshControl,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { usersAPI, getCurrentUser } from '../services/api';

export default function AdminHomeScreen() {
	// États pour les utilisateurs
	const [users, setUsers] = useState([]);
	const [filteredUsers, setFilteredUsers] = useState([]);
	const [selectedRole, setSelectedRole] = useState('All');
	const [isLoading, setIsLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);

	// États pour les modals
	const [modalVisible, setModalVisible] = useState(false);
	const [addUserVisible, setAddUserVisible] = useState(false);
	const [selectedUser, setSelectedUser] = useState(null);

	// États pour l'édition
	const [editEmail, setEditEmail] = useState('');
	const [editNom, setEditNom] = useState('');
	const [editPrenom, setEditPrenom] = useState('');
	const [editRole, setEditRole] = useState('rh');

	// États pour l'ajout
	const [newUser, setNewUser] = useState({
		email: '',
		nom: '',
		prenom: '',
		role: 'rh',
		mot_de_passe: '',
		specialite: ''
	});

	// États pour l'utilisateur connecté
	const [currentUser, setCurrentUser] = useState(null);

	// Charger les données au montage
	useEffect(() => {
		loadUsers();
		loadCurrentUser();
	}, []);

	// Charger l'utilisateur connecté
	const loadCurrentUser = async () => {
		try {
			const user = await getCurrentUser();
			setCurrentUser(user);
		} catch (error) {
			console.log('Erreur chargement utilisateur:', error);
		}
	};

	// Charger la liste des utilisateurs
	const loadUsers = async () => {
		try {
			console.log('📋 Chargement des utilisateurs...');
			const response = await usersAPI.getAll();
			console.log('✅ Utilisateurs chargés:', response.data.length);
			
			setUsers(response.data);
			setFilteredUsers(response.data);
		} catch (error) {
			console.error('❌ Erreur chargement utilisateurs:', error);
			Alert.alert('Erreur', 'Impossible de charger les utilisateurs');
		} finally {
			setIsLoading(false);
		}
	};

	// Actualiser les données
	const onRefresh = async () => {
		setRefreshing(true);
		await loadUsers();
		setRefreshing(false);
	};

	// Filtrer par rôle
	const handleFilter = (role) => {
		setSelectedRole(role);
		if (role === 'All') {
			setFilteredUsers(users);
		} else {
			setFilteredUsers(users.filter(user => user.role === role));
		}
	};

	// Sélectionner un utilisateur pour édition
	const handleSelectUser = (user) => {
		setSelectedUser(user);
		setEditEmail(user.email);
		setEditNom(user.nom);
		setEditPrenom(user.prenom);
		setEditRole(user.role);
		setModalVisible(true);
	};

	// Sauvegarder les modifications d'un utilisateur
	const handleSaveUser = async () => {
		if (!selectedUser) return;

		try {
			console.log('💾 Modification utilisateur:', selectedUser.id);
			
			const updateData = {
				email: editEmail,
				nom: editNom,
				prenom: editPrenom,
				role: editRole,
			};

			await usersAPI.update(selectedUser.id, updateData);
			
			Alert.alert('Succès', 'Utilisateur modifié avec succès');
			setModalVisible(false);
			loadUsers(); // Recharger la liste
			
		} catch (error) {
			console.error('❌ Erreur modification:', error);
			Alert.alert('Erreur', 'Impossible de modifier l\'utilisateur');
		}
	};

	// Supprimer un utilisateur
	const handleDeleteUser = () => {
		if (!selectedUser) return;

		Alert.alert(
			'Confirmation',
			`Êtes-vous sûr de vouloir supprimer ${selectedUser.prenom} ${selectedUser.nom} ?`,
			[
				{ text: 'Annuler', style: 'cancel' },
				{
					text: 'Supprimer',
					style: 'destructive',
					onPress: async () => {
						try {
							console.log('🗑️ Suppression utilisateur:', selectedUser.id);
							
							await usersAPI.delete(selectedUser.id);
							
							Alert.alert('Succès', 'Utilisateur supprimé');
							setModalVisible(false);
							loadUsers(); // Recharger la liste
							
						} catch (error) {
							console.error('❌ Erreur suppression:', error);
							Alert.alert('Erreur', 'Impossible de supprimer l\'utilisateur');
						}
					}
				}
			]
		);
	};

	// Ajouter un nouvel utilisateur
	const handleAddUser = async () => {
		// Validation
		if (!newUser.email || !newUser.nom || !newUser.prenom || !newUser.mot_de_passe) {
			Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
			return;
		}

		try {
			console.log('➕ Ajout nouvel utilisateur');
			
			await usersAPI.create(newUser);
			
			Alert.alert('Succès', 'Utilisateur créé avec succès');
			setAddUserVisible(false);
			setNewUser({
				email: '',
				nom: '',
				prenom: '',
				role: 'rh',
				mot_de_passe: '',
				specialite: ''
			});
			loadUsers(); // Recharger la liste
			
		} catch (error) {
			console.error('❌ Erreur création:', error);
			Alert.alert('Erreur', 'Impossible de créer l\'utilisateur');
		}
	};

	// Rendu d'un utilisateur
	const renderItem = ({ item }) => {
		const roleColors = {
			admin: '#dc3545',
			medecin: '#28a745',
			rh: '#007bff',
			infirmier: '#ffc107'
		};

		const roleLabels = {
			admin: '🔴 Admin',
			medecin: '🟢 Médecin',
			rh: '🔵 RH',
			infirmier: '🟡 Infirmier'
		};

		const roleColor = roleColors[item.role] || '#6c757d';

		return (
			<TouchableOpacity
				style={[styles.userItem, { borderLeftColor: roleColor }]}
				onPress={() => handleSelectUser(item)}
			>
				<Text style={styles.username}>
					{item.prenom} {item.nom}
				</Text>
				<Text style={styles.email}>{item.email}</Text>
				<Text style={[styles.role, { color: roleColor }]}>
					{roleLabels[item.role] || item.role}
				</Text>
				{item.specialite && (
					<Text style={styles.specialite}>
						📋 {item.specialite}
					</Text>
				)}
			</TouchableOpacity>
		);
	};

	if (isLoading) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size="large" color="#007bff" />
				<Text style={styles.loadingText}>Chargement des utilisateurs...</Text>
			</View>
		);
	}

	return (
		<View style={styles.container}>
			<Text style={styles.title}>👥 Gestion des utilisateurs</Text>
			
			{currentUser && (
				<Text style={styles.subtitle}>
					Connecté en tant que {currentUser.prenom} {currentUser.nom}
				</Text>
			)}

			{/* Filtres */}
			<View style={styles.filters}>
				{['All', 'admin', 'medecin', 'rh', 'infirmier'].map(role => (
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
							{role === 'All' ? 'Tous' : 
							 role === 'medecin' ? 'Médecins' :
							 role === 'admin' ? 'Admins' :
							 role === 'rh' ? 'RH' : 'Infirmiers'}
						</Text>
					</TouchableOpacity>
				))}
			</View>

			{/* Liste des utilisateurs */}
			<FlatList
				data={filteredUsers}
				renderItem={renderItem}
				keyExtractor={item => item.id.toString()}
				style={styles.list}
				refreshControl={
					<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
				}
				ListEmptyComponent={() => (
					<View style={styles.emptyContainer}>
						<Text style={styles.emptyText}>Aucun utilisateur trouvé</Text>
					</View>
				)}
			/>

			{/* Bouton ajouter */}
			<TouchableOpacity
				style={styles.addButton}
				onPress={() => setAddUserVisible(true)}
			>
				<Text style={styles.addButtonText}>➕ Ajouter un utilisateur</Text>
			</TouchableOpacity>

			{/* Modal d'édition */}
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
							placeholder="Prénom"
							value={editPrenom}
							onChangeText={setEditPrenom}
						/>
						<TextInput
							style={styles.input}
							placeholder="Nom"
							value={editNom}
							onChangeText={setEditNom}
						/>
						<TextInput
							style={styles.input}
							placeholder="Email"
							value={editEmail}
							onChangeText={setEditEmail}
							keyboardType="email-address"
						/>

						<Picker
							selectedValue={editRole}
							style={styles.picker}
							onValueChange={setEditRole}
						>
							<Picker.Item label="Admin" value="admin" />
							<Picker.Item label="Médecin" value="medecin" />
							<Picker.Item label="RH" value="rh" />
							<Picker.Item label="Infirmier" value="infirmier" />
						</Picker>

						<View style={styles.modalButtons}>
							<TouchableOpacity
								style={[styles.button, { backgroundColor: '#28a745' }]}
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
								style={[styles.button, { backgroundColor: '#6c757d' }]}
								onPress={() => setModalVisible(false)}
							>
								<Text style={styles.buttonText}>❌ Annuler</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>

			{/* Modal d'ajout */}
			<Modal
				visible={addUserVisible}
				transparent
				animationType="fade"
				onRequestClose={() => setAddUserVisible(false)}
			>
				<View style={styles.centeredView}>
					<View style={styles.modalView}>
						<Text style={styles.modalTitle}>Nouvel utilisateur</Text>

						<TextInput
							style={styles.input}
							placeholder="Prénom *"
							value={newUser.prenom}
							onChangeText={text => setNewUser({...newUser, prenom: text})}
						/>
						<TextInput
							style={styles.input}
							placeholder="Nom *"
							value={newUser.nom}
							onChangeText={text => setNewUser({...newUser, nom: text})}
						/>
						<TextInput
							style={styles.input}
							placeholder="Email *"
							value={newUser.email}
							onChangeText={text => setNewUser({...newUser, email: text})}
							keyboardType="email-address"
						/>
						<TextInput
							style={styles.input}
							placeholder="Mot de passe *"
							value={newUser.mot_de_passe}
							onChangeText={text => setNewUser({...newUser, mot_de_passe: text})}
							secureTextEntry
						/>
						<TextInput
							style={styles.input}
							placeholder="Spécialité (médecins)"
							value={newUser.specialite}
							onChangeText={text => setNewUser({...newUser, specialite: text})}
						/>

						<Picker
							selectedValue={newUser.role}
							style={styles.picker}
							onValueChange={value => setNewUser({...newUser, role: value})}
						>
							<Picker.Item label="RH" value="rh" />
							<Picker.Item label="Médecin" value="medecin" />
							<Picker.Item label="Admin" value="admin" />
							<Picker.Item label="Infirmier" value="infirmier" />
						</Picker>

						<View style={styles.modalButtons}>
							<TouchableOpacity
								style={[styles.button, { backgroundColor: '#28a745', flex: 1 }]}
								onPress={handleAddUser}
							>
								<Text style={styles.buttonText}>➕ Créer</Text>
							</TouchableOpacity>
							<TouchableOpacity
								style={[styles.button, { backgroundColor: '#6c757d', flex: 1, marginLeft: 10 }]}
								onPress={() => setAddUserVisible(false)}
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
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	loadingText: {
		marginTop: 10,
		fontSize: 16,
		color: '#6c757d',
	},
	title: {
		fontSize: 28,
		fontWeight: 'bold',
		textAlign: 'center',
		marginBottom: 10,
		color: '#1e293b',
	},
	subtitle: {
		fontSize: 14,
		textAlign: 'center',
		marginBottom: 20,
		color: '#6c757d',
	},
	filters: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'center',
		marginBottom: 20,
	},
	filterButton: {
		paddingVertical: 8,
		paddingHorizontal: 12,
		borderRadius: 20,
		backgroundColor: '#e2e8f0',
		margin: 2,
	},
	filterButtonActive: {
		backgroundColor: '#3b82f6',
	},
	filterButtonText: {
		fontSize: 12,
		fontWeight: '600',
		color: '#1e293b',
	},
	list: {
		flex: 1,
		marginBottom: 10,
	},
	userItem: {
		backgroundColor: '#fff',
		padding: 16,
		borderRadius: 12,
		marginBottom: 10,
		borderLeftWidth: 4,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 2,
		elevation: 2,
	},
	username: {
		fontSize: 16,
		fontWeight: 'bold',
		color: '#0f172a',
		marginBottom: 4,
	},
	email: {
		fontSize: 14,
		color: '#475569',
		marginBottom: 4,
	},
	role: {
		fontSize: 14,
		fontWeight: '600',
		marginBottom: 2,
	},
	specialite: {
		fontSize: 12,
		color: '#6b7280',
		fontStyle: 'italic',
	},
	emptyContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingVertical: 50,
	},
	emptyText: {
		fontSize: 16,
		color: '#6c757d',
	},
	addButton: {
		backgroundColor: '#007bff',
		padding: 14,
		borderRadius: 12,
		alignItems: 'center',
	},
	addButtonText: {
		color: '#fff',
		fontSize: 16,
		fontWeight: '700',
	},
	centeredView: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
	},
	modalView: {
		width: '90%',
		maxHeight: '80%',
		backgroundColor: '#fff',
		padding: 20,
		borderRadius: 16,
		elevation: 10,
	},
	modalTitle: {
		fontSize: 20,
		fontWeight: '700',
		marginBottom: 15,
		textAlign: 'center',
		color: '#0f172a',
	},
	input: {
		backgroundColor: '#f8f9fa',
		padding: 12,
		marginBottom: 10,
		borderRadius: 8,
		borderWidth: 1,
		borderColor: '#e9ecef',
		fontSize: 16,
	},
	picker: {
		backgroundColor: '#f8f9fa',
		marginBottom: 15,
		borderRadius: 8,
	},
	modalButtons: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginTop: 10,
	},
	button: {
		flex: 1,
		paddingVertical: 12,
		marginHorizontal: 5,
		borderRadius: 8,
		alignItems: 'center',
	},
	buttonText: {
		color: '#fff',
		fontWeight: '700',
		fontSize: 14,
	},
});