import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Platform,
} from "react-native";
import axios from "axios";
import { REGISTER_URL } from "../../constants/config";

export default function RegisterScreen({ navigation }) {
  const [form, setForm] = useState({
    name: "", loginid: "", password: "",
    mobile: "", email: "", locality: "",
    address: "", city: "", state: "",
  });
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleRegister = async () => {
    if (!form.name || !form.loginid || !form.password || !form.mobile || !form.email) {
      Alert.alert("Error", "Fill in all required fields (Name, Login ID, Password, Mobile, Email).");
      return;
    }
    setLoading(true);
    try {
      await axios.post(REGISTER_URL, form, { timeout: 60000 });
      Alert.alert(
        "Registered!",
        "Registration successful. Please wait for admin to activate your account.",
        [{ text: "OK", onPress: () => navigation.navigate("Login") }]
      );
    } catch (err) {
      const data = err.response?.data;
      const msg = data ? Object.values(data).flat().join("\n") : (err.message || "Registration failed.");
      Alert.alert("Error", msg);
    } finally {
      setLoading(false);
    }
  };

  const Field = ({ label, k, placeholder, secure, keyboard, maxLen }) => (
    <View>
      <Text style={s.label}>{label}</Text>
      <TextInput
        style={s.input}
        placeholder={placeholder || label}
        placeholderTextColor="#555"
        value={form[k]}
        onChangeText={v => set(k, v)}
        secureTextEntry={!!secure}
        keyboardType={keyboard || "default"}
        maxLength={maxLen}
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  );

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <View style={s.card}>
          <Text style={s.title}>Create Account</Text>

          <Field label="Full Name *"  k="name"     placeholder="Your full name" />
          <Field label="Login ID *"   k="loginid"  placeholder="Choose a login ID" />
          <Field label="Password *"   k="password" placeholder="Password" secure />
          <Field label="Mobile *"     k="mobile"   placeholder="10-digit mobile" keyboard="phone-pad" maxLen={10} />
          <Field label="Email *"      k="email"    placeholder="Email address" keyboard="email-address" />
          <Field label="Locality"     k="locality" placeholder="Locality" />
          <Field label="City"         k="city"     placeholder="City" />
          <Field label="State"        k="state"    placeholder="State" />
          <Field label="Address"      k="address"  placeholder="Full address" />

          <TouchableOpacity style={[s.btn, loading && { opacity: 0.6 }]} onPress={handleRegister} disabled={loading}>
            {loading ? <ActivityIndicator color="#0f0c29" /> : <Text style={s.btnText}>Register</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate("Login")}>
            <Text style={s.link}>Already have an account? Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: "#0f0c29" },
  scroll:  { padding: 24, paddingBottom: 40 },
  card:    { backgroundColor: "#1a1a2e", borderRadius: 16, padding: 24 },
  title:   { fontSize: 24, fontWeight: "bold", color: "#00ffc8", textAlign: "center", marginBottom: 20 },
  label:   { color: "#aaa", fontSize: 12, marginBottom: 4 },
  input:   { backgroundColor: "#0f0c29", color: "#fff", borderRadius: 10, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: "#333", fontSize: 15 },
  btn:     { backgroundColor: "#00ffc8", borderRadius: 10, padding: 15, alignItems: "center", marginBottom: 14 },
  btnText: { color: "#0f0c29", fontWeight: "bold", fontSize: 16 },
  link:    { color: "#aaa", textAlign: "center", fontSize: 13 },
});
