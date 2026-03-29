import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert,
} from 'react-native';
import { getUser, clearAuth } from '../services/api';

export default function UserHomeScreen({ navigation }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    getUser().then(setUser);
  }, []);

  const logout = async () => {
    await clearAuth();
    navigation.replace('Login');
  };

  return (
    <ScrollView style={s.root} contentContainerStyle={s.scroll}>
      <Text style={s.welcome}>Welcome, {user?.name || 'User'} 👋</Text>
      <Text style={s.sub}>Online Signature Verification System</Text>

      <TouchableOpacity style={s.card} onPress={() => navigation.navigate('Predict')}>
        <Text style={s.cardIcon}>🔍</Text>
        <Text style={s.cardTitle}>Verify Signature</Text>
        <Text style={s.cardDesc}>Upload two signature images and check if they match using our AI engine.</Text>
        <Text style={s.cardBtn}>Start Verification →</Text>
      </TouchableOpacity>

      <TouchableOpacity style={s.card} onPress={() => navigation.navigate('Train')}>
        <Text style={s.cardIcon}>🧠</Text>
        <Text style={s.cardTitle}>Train Model</Text>
        <Text style={s.cardDesc}>Run a training simulation and view accuracy, precision, recall, and AUC metrics.</Text>
        <Text style={s.cardBtn}>View Training →</Text>
      </TouchableOpacity>

      <View style={s.infoCard}>
        <Text style={s.infoTitle}>How It Works</Text>
        <Text style={s.infoText}>1. Upload an original signature image</Text>
        <Text style={s.infoText}>2. Upload a test signature to compare</Text>
        <Text style={s.infoText}>3. The engine computes structural similarity</Text>
        <Text style={s.infoText}>4. Distance &lt; threshold → Match ✅</Text>
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
  welcome:   { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  sub:       { color: '#aaa', marginBottom: 24, fontSize: 14 },
  card:      { backgroundColor: '#1a1a2e', borderRadius: 16, padding: 20, marginBottom: 16 },
  cardIcon:  { fontSize: 32, marginBottom: 8 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 6 },
  cardDesc:  { color: '#aaa', fontSize: 14, marginBottom: 12, lineHeight: 20 },
  cardBtn:   { color: '#00ffc8', fontWeight: '600', fontSize: 14 },
  infoCard:  { backgroundColor: '#1a1a2e', borderRadius: 16, padding: 20, marginBottom: 24 },
  infoTitle: { fontSize: 16, fontWeight: 'bold', color: '#fff', marginBottom: 12 },
  infoText:  { color: '#aaa', fontSize: 14, marginBottom: 6 },
  logoutBtn: { backgroundColor: '#1a1a2e', borderRadius: 10, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#ff6b6b' },
  logoutText:{ color: '#ff6b6b', fontWeight: '600', fontSize: 15 },
});
