import React, { useEffect, useState } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import PatientList from '../components/PatientList';
import TraitementList from '../components/TraitementList';
import RendezVousList from '../components/RendezVousList';
import MessageList from '../components/MessageList';
import { getDataWithToken } from '../utils/api';

export default function DashboardScreen({ token }) {
  const [patients, setPatients] = useState([]);
  const [traitements, setTraitements] = useState([]);
  const [rdvs, setRdvs] = useState([]);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (token) {
      getDataWithToken('patients', token, setPatients);
      getDataWithToken('traitements', token, setTraitements);
      getDataWithToken('rendez-vous', token, setRdvs);
      getDataWithToken('messages', token, setMessages);
    }
  }, [token]);

  return (
    <ScrollView style={styles.container}>
      <PatientList data={patients} />
      <TraitementList data={traitements} />
      <RendezVousList data={rdvs} />
      <MessageList data={messages} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5',
    flex: 1
  }
});
