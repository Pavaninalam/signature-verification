import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function HomeScreen({ navigation }) {
  const logout = async () => {
    await AsyncStorage.multiRemove(["token", "user"]);
    navigation.replace("Login");
  };

  return (
    <View style={s.root}>
      <Text style={s.title}>Welcome 👋</Text>
      <Text style={s.sub}>Signature Verification System</Text>

      <TouchableOpacity style={s.card} onPress={() => navigation.navigate("Prediction")}>
        <Text style={s.cardIcon}>🔍</Text>
        <Text style={s.cardTitle}>Verify Signature</Text>
        <Text style={s.cardDesc}>Upload two signatures and check if they match.</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[s.card, s.logoutCard]} onPress={logout}>
        <Text style={s.logoutText}>🚪 Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  root:      { flex: 1, backgroundColor: "#0f0c29", padding: 20, paddingTop: 60 },
  title:     { fontSize: 26, fontWeight: "bold", color: "#fff", marginBottom: 4 },
  sub:       { color: "#aaa", marginBottom: 30, fontSize: 13 },
  card:      { backgroundColor: "#1a1a2e", borderRadius: 16, padding: 20, marginBottom: 16 },
  cardIcon:  { fontSize: 30, marginBottom: 8 },
  cardTitle: { fontSize: 18, fontWeight: "bold", color: "#fff", marginBottom: 6 },
  cardDesc:  { color: "#aaa", fontSize: 13 },
  logoutCard:{ borderWidth: 1, borderColor: "#ff6b6b", alignItems: "center" },
  logoutText:{ color: "#ff6b6b", fontWeight: "600", fontSize: 15 },
});
