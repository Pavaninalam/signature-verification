import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView, Alert,
} from 'react-native';
import { loginUser, saveAuth } from '../services/api';

export default function LoginScreen({ navigation }) {
  const [loginid,  setLoginid]  = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleLogin = async () => {
    if (!loginid.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter login ID and password.');
      return;
    }
    setLoading(true);
    try {
      const res = await loginUser({ loginid: loginid.trim(), password });
      await saveAuth(res.data.token, res.data.user);
      navigation.replace('UserHome');
    } catch (err) {
      const msg = err.response?.data?.error || 'Login failed. Check your credentials.';
      Alert.alert('Login Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <Text style={s.logo}>✍️ SigVerify</Text>
        <Text style={s.subtitle}>Signature Verification System</Text>

        <View style={s.card}>
          <Text style={s.title}>User Login</Text>

          <Text style={s.label}>Login ID</Text>
          <TextInput
            style={s.input}
            placeholder="Enter your login ID"
            placeholderTextColor="#666"
            value={loginid}
            onChangeText={setLoginid}
            autoCapitalize="none"
          />

          <Text style={s.label}>Password</Text>
          <TextInput
            style={s.input}
            placeholder="Enter your password"
            placeholderTextColor="#666"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity style={s.btn} onPress={handleLogin} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#0f0c29" />
              : <Text style={s.btnText}>Login</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Forgot')}>
            <Text style={s.link}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={s.link}>No account? Register here</Text>
          </TouchableOpacity>

          <View style={s.divider} />

          <TouchableOpacity onPress={() => navigation.navigate('AdminLogin')}>
            <Text style={[s.link, { color: '#aaa' }]}>Admin Login →</Text>
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
  btn:      { backgroundColor: '#00ffc8', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 4, marginBottom: 16 },
  btnText:  { color: '#0f0c29', fontWeight: 'bold', fontSize: 16 },
  link:     { color: '#00ffc8', textAlign: 'center', marginVertical: 6, fontSize: 14 },
  divider:  { height: 1, backgroundColor: '#333', marginVertical: 12 },
});
