import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { adminLogin } from '../services/api';

export default function AdminLoginScreen({ navigation }) {
  const [loginid,  setLoginid]  = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleLogin = async () => {
    if (!loginid.trim() || !password.trim()) {
      Alert.alert('Error', 'Enter admin ID and password.'); return;
    }
    setLoading(true);
    try {
      const res = await adminLogin({ loginid: loginid.trim(), password });
      await SecureStore.setItemAsync('adminToken', res.data.token);
      navigation.replace('AdminHome');
    } catch (err) {
      Alert.alert('Login Failed', err.response?.data?.error || 'Invalid admin credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <Text style={s.logo}>🛡️ Admin</Text>
        <Text style={s.subtitle}>SigVerify Administration</Text>

        <View style={s.card}>
          <Text style={s.title}>Admin Login</Text>

          <Text style={s.label}>Admin ID</Text>
          <TextInput style={s.input} placeholder="Enter admin ID" placeholderTextColor="#666"
            value={loginid} onChangeText={setLoginid} autoCapitalize="none" />

          <Text style={s.label}>Password</Text>
          <TextInput style={s.input} placeholder="Enter password" placeholderTextColor="#666"
            value={password} onChangeText={setPassword} secureTextEntry />

          <TouchableOpacity style={s.btn} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color="#0f0c29" /> : <Text style={s.btnText}>Login as Admin</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={s.link}>← Back to User Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root:     { flex: 1, backgroundColor: '#0f0c29' },
  scroll:   { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logo:     { fontSize: 32, fontWeight: 'bold', color: '#00ffc8', textAlign: 'center', marginBottom: 4 },
  subtitle: { color: '#aaa', textAlign: 'center', marginBottom: 32, fontSize: 14 },
  card:     { backgroundColor: '#1a1a2e', borderRadius: 16, padding: 24 },
  title:    { fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 20 },
  label:    { color: '#aaa', fontSize: 13, marginBottom: 6 },
  input:    { backgroundColor: '#0f0c29', color: '#fff', borderRadius: 10, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#333', fontSize: 15 },
  btn:      { backgroundColor: '#00ffc8', borderRadius: 10, padding: 16, alignItems: 'center', marginBottom: 16 },
  btnText:  { color: '#0f0c29', fontWeight: 'bold', fontSize: 16 },
  link:     { color: '#aaa', textAlign: 'center', fontSize: 14 },
});
