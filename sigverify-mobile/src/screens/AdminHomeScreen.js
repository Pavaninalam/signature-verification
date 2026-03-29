import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';

export default function AdminHomeScreen({ navigation }) {
  const logout = async () => {
    await SecureStore.deleteItemAsync('adminToken');
    navigation.replace('AdminLogin');
  };

  return (
    <ScrollView style={s.root} contentContainerStyle={s.scroll}>
      <Text style={s.title}>🛡️ Admin Dashboard</Text>
      <Text style={s.sub}>Manage users and monitor the system</Text>

      <TouchableOpacity style={s.card} onPress={() => navigation.navigate('ManageUsers')}>
        <Text style={s.cardIcon}>👥</Text>
        <Text style={s.cardTitle}>Manage Users</Text>
        <Text style={s.cardDesc}>View all registered users, activate pending accounts, or remove users.</Text>
        <Text style={s.cardBtn}>View Users →</Text>
      </TouchableOpacity>

      <View style={s.infoCard}>
        <Text style={s.infoTitle}>System Info</Text>
        <Text style={s.infoLine}>🔑 Admin Login: admin / admin</Text>
        <Text style={s.infoLine}>🗄️ Database: SQLite</Text>
        <Text style={s.infoLine}>🧠 Model: Siamese Network (CV Engine)</Text>
        <Text style={s.infoLine}>🌐 API: Django REST Framework + JWT</Text>
      </View>

      <TouchableOpacity style={s.logoutBtn} onPress={logout}>
        <Text style={s.logoutText}>🚪 Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root:      { flex: 1, backgroundColor: '#0f0c29' },
  scroll:    { padding: 20, paddingBottom: 40 },
  title:     { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  sub:       { color: '#aaa', marginBottom: 24, fontSize: 14 },
  card:      { backgroundColor: '#1a1a2e', borderRadius: 16, padding: 20, marginBottom: 16 },
  cardIcon:  { fontSize: 32, marginBottom: 8 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 6 },
  cardDesc:  { color: '#aaa', fontSize: 14, marginBottom: 12, lineHeight: 20 },
  cardBtn:   { color: '#00ffc8', fontWeight: '600', fontSize: 14 },
  infoCard:  { backgroundColor: '#1a1a2e', borderRadius: 16, padding: 20, marginBottom: 24 },
  infoTitle: { fontSize: 16, fontWeight: 'bold', color: '#fff', marginBottom: 12 },
  infoLine:  { color: '#aaa', fontSize: 14, marginBottom: 6 },
  logoutBtn: { backgroundColor: '#1a1a2e', borderRadius: 10, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#ff6b6b' },
  logoutText:{ color: '#ff6b6b', fontWeight: '600', fontSize: 15 },
});
