import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { forgotPassword, verifyOTP, resetPassword } from '../services/api';

export default function ForgotScreen({ navigation }) {
  const [step,     setStep]     = useState(1); // 1=email, 2=otp, 3=newpass
  const [email,    setEmail]    = useState('');
  const [otp,      setOtp]      = useState('');
  const [newPass,  setNewPass]  = useState('');
  const [loading,  setLoading]  = useState(false);

  const sendOTP = async () => {
    if (!email.trim()) { Alert.alert('Error', 'Enter your email.'); return; }
    setLoading(true);
    try {
      await forgotPassword({ email: email.trim() });
      setStep(2);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Email not found.');
    } finally { setLoading(false); }
  };

  const checkOTP = async () => {
    if (!otp.trim()) { Alert.alert('Error', 'Enter the OTP.'); return; }
    setLoading(true);
    try {
      await verifyOTP({ email: email.trim(), otp: otp.trim() });
      setStep(3);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Invalid OTP.');
    } finally { setLoading(false); }
  };

  const doReset = async () => {
    if (!newPass.trim()) { Alert.alert('Error', 'Enter new password.'); return; }
    setLoading(true);
    try {
      await resetPassword({ email: email.trim(), new_password: newPass });
      Alert.alert('Success', 'Password reset! Please login.', [
        { text: 'OK', onPress: () => navigation.navigate('Login') }
      ]);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Reset failed.');
    } finally { setLoading(false); }
  };

  return (
    <ScrollView style={s.root} contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
      <View style={s.card}>
        <Text style={s.title}>Reset Password</Text>

        {step === 1 && <>
          <Text style={s.label}>Email Address</Text>
          <TextInput style={s.input} placeholder="Enter your email" placeholderTextColor="#666"
            value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <TouchableOpacity style={s.btn} onPress={sendOTP} disabled={loading}>
            {loading ? <ActivityIndicator color="#0f0c29" /> : <Text style={s.btnText}>Send OTP</Text>}
          </TouchableOpacity>
        </>}

        {step === 2 && <>
          <Text style={s.info}>OTP sent to {email}</Text>
          <Text style={s.label}>Enter OTP</Text>
          <TextInput style={s.input} placeholder="6-digit OTP" placeholderTextColor="#666"
            value={otp} onChangeText={setOtp} keyboardType="number-pad" maxLength={6} />
          <TouchableOpacity style={s.btn} onPress={checkOTP} disabled={loading}>
            {loading ? <ActivityIndicator color="#0f0c29" /> : <Text style={s.btnText}>Verify OTP</Text>}
          </TouchableOpacity>
        </>}

        {step === 3 && <>
          <Text style={s.label}>New Password</Text>
          <TextInput style={s.input} placeholder="Enter new password" placeholderTextColor="#666"
            value={newPass} onChangeText={setNewPass} secureTextEntry />
          <TouchableOpacity style={s.btn} onPress={doReset} disabled={loading}>
            {loading ? <ActivityIndicator color="#0f0c29" /> : <Text style={s.btnText}>Reset Password</Text>}
          </TouchableOpacity>
        </>}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#0f0c29' },
  scroll:  { flexGrow: 1, justifyContent: 'center', padding: 24 },
  card:    { backgroundColor: '#1a1a2e', borderRadius: 16, padding: 24 },
  title:   { fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 20 },
  label:   { color: '#aaa', fontSize: 13, marginBottom: 6 },
  info:    { color: '#00ffc8', marginBottom: 16, fontSize: 14 },
  input:   { backgroundColor: '#0f0c29', color: '#fff', borderRadius: 10, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#333', fontSize: 15 },
  btn:     { backgroundColor: '#00ffc8', borderRadius: 10, padding: 16, alignItems: 'center' },
  btnText: { color: '#0f0c29', fontWeight: 'bold', fontSize: 16 },
});
