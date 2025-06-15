import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';

export default function RendezVousList({ data }) {
  return (
    <View>
      <Text style={styles.title}>📅 Rendez-vous programmés</Text>
      <FlatList
        data={data}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <Text style={styles.item}>{item.date} avec {item.medecin}</Text>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 10,
  },
  item: {
    padding: 10,
    backgroundColor: 'white',
    marginBottom: 5,
    borderRadius: 4,
  },
});
