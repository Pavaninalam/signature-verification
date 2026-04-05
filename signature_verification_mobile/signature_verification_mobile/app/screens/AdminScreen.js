import { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  FlatList, ActivityIndicator, Alert, ScrollView,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ADMIN_LOGIN_URL, ADMIN_USERS_URL } from "../../constants/config";

export default function AdminScreen({ navigation }) {
  const [loginid,  setLoginid]  = useState("");
  const [password, setPassword] = useState("");
  const [token,    setToken]    = useState(null);
  const [users,    setUsers]    = useState([]);
  const [loading,  setLoading]  = useState(false);

  useEffect(() => {
    AsyncStorage.getItem("adminToken").then(t => {
      if (t) { setToken(t); fetchUsers(t); }
    });
  }, []);

  const login = async () => {
    if (!loginid.trim() || !password.trim()) {
      Alert.alert("Error", "Enter admin ID and password."); return;
    }
    setLoading(true);
    try {
      const res = await axios.post(ADMIN_LOGIN_URL, { loginid: loginid.trim(), password }, { timeout: 60000 });
      await AsyncStorage.setItem("adminToken", res.data.token);
      setToken(res.data.token);
      fetchUsers(res.data.token);
    } catch (err) {
      const msg = err.response?.data?.error || err.message || "Login failed.";
      Alert.alert("Login Failed", msg);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async (t) => {
    setLoading(true);
    try {
      const res = await axios.get(ADMIN_USERS_URL, {
        headers: { Authorization: `Bearer ${t}` },
        timeout: 60000,
      });
      setUsers(res.data);
    } catch (err) {
      Alert.alert("Error", "Failed to load users: " + (err.message || ""));
    } finally {
      setLoading(false);
    }
  };

  const activateUser = async (id) => {
    try {
      await axios.patch(`${ADMIN_USERS_URL}${id}/activate/`, {}, {
        headers: { Authorization: `Bearer ${token}` }, timeout: 60000,
      });
      fetchUsers(token);
    } catch (err) {
      Alert.alert("Error", "Activation failed: " + (err.message || ""));
    }
  };

  const deleteUser = async (id) => {
    Alert.alert("Confirm", "Delete this user?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        try {
          await axios.delete(`${ADMIN_USERS_URL}${id}/delete/`, {
            headers: { Authorization: `Bearer ${token}` }, timeout: 60000,
          });
          fetchUsers(token);
        } catch (err) {
          Alert.alert("Error", "Deletion failed: " + (err.message || ""));
        }
      }},
    ]);
  };

  const logout = async () => {
    await AsyncStorage.removeItem("adminToken");
    setToken(null); setUsers([]);
  };

  // ── Login form ────────────────────────────────────────────────────────────
  if (!token) {
    return (
      <ScrollView style={s.root} contentContainerStyle={s.loginScroll} keyboardShouldPersistTaps="handled">
        <View style={s.card}>
          <Text style={s.title}>🛡️ Admin Login</Text>

          <Text style={s.label}>Admin ID</Text>
          <TextInput
            style={s.input} placeholder="admin" placeholderTextColor="#555"
            value={loginid} onChangeText={setLoginid} autoCapitalize="none"
          />

          <Text style={s.label}>Password</Text>
          <TextInput
            style={s.input} placeholder="Password" placeholderTextColor="#555"
            value={password} onChangeText={setPassword} secureTextEntry
          />

          <TouchableOpacity style={[s.btn, loading && { opacity: 0.6 }]} onPress={login} disabled={loading}>
            {loading ? <ActivityIndicator color="#0f0c29" /> : <Text style={s.btnText}>Login as Admin</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate("Login")}>
            <Text style={s.link}>← Back to User Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // ── Users list ────────────────────────────────────────────────────────────
  return (
    <View style={s.root}>
      <View style={s.header}>
        <Text style={s.headerTitle}>👥 Users ({users.length})</Text>
        <TouchableOpacity onPress={logout}>
          <Text style={s.logoutBtn}>Logout</Text>
        </TouchableOpacity>
      </View>

      {loading && <ActivityIndicator color="#00ffc8" style={{ marginTop: 20 }} />}

      <FlatList
        data={users}
        keyExtractor={u => String(u.id)}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshing={loading}
        onRefresh={() => fetchUsers(token)}
        renderItem={({ item: u }) => (
          <View style={s.userCard}>
            <View style={s.userRow}>
              <Text style={s.userName}>{u.name}</Text>
              <Text style={[s.badge, u.status === "activated" ? s.badgeActive : s.badgeWait]}>
                {u.status === "activated" ? "✅ Active" : "⏳ Waiting"}
              </Text>
            </View>
            <Text style={s.userInfo}>ID: {u.loginid}</Text>
            <Text style={s.userInfo}>{u.email}</Text>
            {u.status === "waiting"
              ? <TouchableOpacity style={s.activateBtn} onPress={() => activateUser(u.id)}>
                  <Text style={s.activateText}>Activate</Text>
                </TouchableOpacity>
              : <TouchableOpacity style={s.deleteBtn} onPress={() => deleteUser(u.id)}>
                  <Text style={s.deleteText}>Delete</Text>
                </TouchableOpacity>
            }
          </View>
        )}
        ListEmptyComponent={!loading && (
          <Text style={s.empty}>No users registered yet.</Text>
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root:        { flex: 1, backgroundColor: "#0f0c29" },
  loginScroll: { flexGrow: 1, justifyContent: "center", padding: 24 },
  card:        { backgroundColor: "#1a1a2e", borderRadius: 16, padding: 24 },
  title:       { fontSize: 24, fontWeight: "bold", color: "#00ffc8", textAlign: "center", marginBottom: 20 },
  label:       { color: "#aaa", fontSize: 12, marginBottom: 4 },
  input:       { backgroundColor: "#0f0c29", color: "#fff", borderRadius: 10, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: "#333", fontSize: 15 },
  btn:         { backgroundColor: "#00ffc8", borderRadius: 10, padding: 15, alignItems: "center", marginBottom: 10 },
  btnText:     { color: "#0f0c29", fontWeight: "bold", fontSize: 16 },
  link:        { color: "#aaa", textAlign: "center", fontSize: 13 },
  header:      { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, paddingTop: 50, backgroundColor: "#1a1a2e" },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#fff" },
  logoutBtn:   { color: "#ff6b6b", fontSize: 13, fontWeight: "600" },
  userCard:    { backgroundColor: "#1a1a2e", borderRadius: 12, padding: 14, marginBottom: 10 },
  userRow:     { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  userName:    { color: "#fff", fontWeight: "bold", fontSize: 15, flex: 1 },
  badge:       { fontSize: 11, fontWeight: "600", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  badgeActive: { backgroundColor: "rgba(0,255,200,0.15)", color: "#00ffc8" },
  badgeWait:   { backgroundColor: "rgba(255,200,0,0.15)", color: "#ffd700" },
  userInfo:    { color: "#aaa", fontSize: 12, marginBottom: 2 },
  activateBtn: { backgroundColor: "#00ffc8", borderRadius: 8, padding: 8, alignItems: "center", marginTop: 8 },
  activateText:{ color: "#0f0c29", fontWeight: "bold", fontSize: 13 },
  deleteBtn:   { backgroundColor: "rgba(255,80,80,0.1)", borderRadius: 8, padding: 8, alignItems: "center", marginTop: 8, borderWidth: 1, borderColor: "#ff6b6b" },
  deleteText:  { color: "#ff6b6b", fontWeight: "bold", fontSize: 13 },
  empty:       { color: "#aaa", textAlign: "center", marginTop: 40, fontSize: 14 },
});
