import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, ScrollView, Alert,
} from 'react-native';
import { registerUser } from '../services/api';

const FIELDS = [
  { key: 'name',     label: 'Full Name',    placeholder: 'Your full name' },
  { key: 'loginid',  label: 'Login ID',     placeholder: 'Choose a login ID' },
  { key: 'password', label: 'Password',     placeholder: 'Password', secure: true },
  { key: 'mobile',   label: 'Mobile',       placeholder: '10-digit mobile', keyboard: 'phone-pad', maxLen: 10 },
  { key: 'email',    label: 'Email',        placeholder: 'Email address', keyboard: 'email-address' },
  { key: 'locality', label: 'Locality',     placeholder: 'Locality' },
  { key: 'city',     label: 'City',         placeholder: 'City' },
  { key: 'state',    label: 'State',        placeholder: 'State' },
  { key: 'address',  label: 'Address',      placeholder: 'Full address', multi: true },
];

export default function RegisterScreen({ navigation }) {
  const [form,    setForm]    = useState({});
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleRegister = async () => {
    const required = ['name','loginid','password','mobile','email'];
    for (const k of required) {
      if (!form[k]?.trim()) {
        Alert.alert('Error', `Please fill in ${k}`); return;
      }
    }
    setLoading(true);
    try {
      await registerUser(form);
      Alert.alert('Success', 'Registration successful! Please wait for admin activation.', [
        { text: 'OK', onPress: () => navigation.navigate('Login') }
      ]);
    } catch (err) {
      const data = err.response?.data;
      const msg  = data ? Object.values(data).flat().join(' ') : 'Registration failed.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={s.root} contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
      <View style={s.card}>
        <Text style={s.title}>Create Account</Text>
        {FIELDS.map(f => (
          <View key={f.key}>
            <Text style={s.label}>{f.label}</Text>
            <TextInput
              style={[s.input, f.multi && { height: 80, textAlignVertical: 'top' }]}
              placeholder={f.placeholder}
              placeholderTextColor="#666"
              value={form[f.key] || ''}
              onChangeText={v => set(f.key, v)}
              secureTextEntry={!!f.secure}
              keyboardType={f.keyboard || 'default'}
              maxLength={f.maxLen}
              multiline={!!f.multi}
              autoCapitalize="none"
            />
          </View>
        ))}

        <TouchableOpacity style={s.btn} onPress={handleRegister} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#0f0c29" />
            : <Text style={s.btnText}>Register</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={s.link}>Already have an account? Login</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#0f0c29' },
  scroll:  { padding: 24, paddingBottom: 40 },
  card:    { backgroundColor: '#1a1a2e', borderRadius: 16, padding: 24 },
  title:   { fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 20 },
  label:   { color: '#aaa', fontSize: 13, marginBottom: 6 },
  input:   { backgroundColor: '#0f0c29', color: '#fff', borderRadius: 10, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#333', fontSize: 15 },
  btn:     { backgroundColor: '#00ffc8', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 4, marginBottom: 16 },
  btnText: { color: '#0f0c29', fontWeight: 'bold', fontSize: 16 },
  link:    { color: '#00ffc8', textAlign: 'center', fontSize: 14 },
});
