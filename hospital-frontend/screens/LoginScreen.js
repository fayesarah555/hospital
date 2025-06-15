import React, { useState } from 'react';
import { View, Alert, StyleSheet } from 'react-native';
import AuthForm from '../components/AuthForm';
import { login } from '../utils/api';

export default function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    const result = await login(email, password);
    if (result.success) {
      onLogin(result.token);
    } else {
      Alert.alert('Erreur de connexion', result.message);
    }
  };

  return (
    <View style={styles.container}>
      <AuthForm
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        onSubmit={handleLogin}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5'
  }
});
