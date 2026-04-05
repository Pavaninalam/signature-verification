import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LOGIN_URL } from "../../constants/config";

export default function LoginScreen({ navigation }) {
  const [loginid,  setLoginid]  = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);

  const handleLogin = async () => {
    if (!loginid.trim() || !password.trim()) {
      Alert.alert("Error", "Enter login ID and password.");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(
        LOGIN_URL,
        { loginid: loginid.trim(), password },
        { timeout: 60000 }
      );
      await AsyncStorage.setItem("token", res.data.token);
      await AsyncStorage.setItem("user", JSON.stringify(res.data.user || {}));
      navigation.replace("Home");
    } catch (err) {
      const serverMsg = err.response?.data?.error || err.response?.data?.detail;
      if (err.response?.status === 400) {
        Alert.alert("Login Failed", serverMsg || "Invalid request. Check your login ID and password.");
      } else if (err.response?.status === 401) {
        Alert.alert("Login Failed", "Wrong login ID or password.");
      } else if (err.response?.status === 403) {
        Alert.alert("Not Activated", "Account not activated. Contact admin.");
      } else if (serverMsg) {
        Alert.alert("Login Failed", serverMsg);
      } else {
        Alert.alert("Connection Error", "Cannot reach server. Check internet.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <View style={s.card}>
          <Text style={s.title}>✍️ SigVerify</Text>
          <Text style={s.sub}>Signature Verification System</Text>

          <Text style={s.label}>Login ID</Text>
          <TextInput
            style={s.input} placeholder="Enter your login ID" placeholderTextColor="#555"
            value={loginid} onChangeText={setLoginid}
            autoCapitalize="none" autoCorrect={false}
          />

          <Text style={s.label}>Password</Text>
          <TextInput
            style={s.input} placeholder="Password" placeholderTextColor="#555"
            value={password} onChangeText={setPassword} secureTextEntry
          />

          <TouchableOpacity style={[s.btn, loading && { opacity: 0.6 }]} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color="#0f0c29" /> : <Text style={s.btnText}>Login</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={s.outlineBtn} onPress={() => navigation.navigate("Register")}>
            <Text style={s.outlineBtnText}>Create Account</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate("Admin")}>
            <Text style={s.link}>Admin Login →</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: "#0f0c29" },
  scroll:       { flexGrow: 1, justifyContent: "center", padding: 24 },
  card:         { backgroundColor: "#1a1a2e", borderRadius: 16, padding: 24 },
  title:        { fontSize: 28, fontWeight: "bold", color: "#00ffc8", textAlign: "center", marginBottom: 4 },
  sub:          { color: "#aaa", textAlign: "center", marginBottom: 20, fontSize: 13 },
  label:        { color: "#aaa", fontSize: 12, marginBottom: 4 },
  input:        { backgroundColor: "#0f0c29", color: "#fff", borderRadius: 10, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: "#333", fontSize: 15 },
  btn:          { backgroundColor: "#00ffc8", borderRadius: 10, padding: 15, alignItems: "center", marginBottom: 10 },
  btnText:      { color: "#0f0c29", fontWeight: "bold", fontSize: 16 },
  outlineBtn:   { borderWidth: 1, borderColor: "#00ffc8", borderRadius: 10, padding: 14, alignItems: "center", marginBottom: 16 },
  outlineBtnText:{ color: "#00ffc8", fontWeight: "600", fontSize: 15 },
  link:         { color: "#aaa", textAlign: "center", fontSize: 13 },
});
