import { useState } from "react";
import {
  View, Text, TouchableOpacity, Image,
  StyleSheet, ActivityIndicator, Alert, ScrollView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { PREDICT_URL, SERVER_URL } from "../../constants/config";

export default function PredictionScreen() {
  const [img1,    setImg1]    = useState(null);
  const [img2,    setImg2]    = useState(null);
  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const pickImage = async (setter) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Allow photo library access."); return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],   // SDK 54 — array syntax, MediaTypeOptions removed
      quality: 0.9,
    });
    if (!res.canceled && res.assets?.[0]) setter(res.assets[0]);
  };

  const takePhoto = async (setter) => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Allow camera access."); return;
    }
    const res = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.9,
    });
    if (!res.canceled && res.assets?.[0]) setter(res.assets[0]);
  };

  const showPicker = (setter) => {
    Alert.alert("Select Image", "Choose source", [
      { text: "Camera",        onPress: () => takePhoto(setter) },
      { text: "Photo Library", onPress: () => pickImage(setter) },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const submit = async () => {
    if (!img1 || !img2) { setError("Please select both signature images."); return; }
    setError(""); setResult(null); setLoading(true);

    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) { setError("Session expired. Please log in again."); setLoading(false); return; }

      const form = new FormData();
      const ext1 = (img1.uri.split(".").pop() || "jpg").toLowerCase();
      const ext2 = (img2.uri.split(".").pop() || "jpg").toLowerCase();
      form.append("image1", { uri: img1.uri, name: `sig1.${ext1}`, type: ext1 === "png" ? "image/png" : "image/jpeg" });
      form.append("image2", { uri: img2.uri, name: `sig2.${ext2}`, type: ext2 === "png" ? "image/png" : "image/jpeg" });

      const res = await axios.post(PREDICT_URL, form, {
        headers: {
          "Content-Type": "multipart/form-data",
          "Authorization": `Bearer ${token}`,
        },
        timeout: 60000,
      });
      setResult(res.data);
    } catch (err) {
      const status = err.response?.status;
      const msg    = err.response?.data?.error || "";
      if (status === 401 || status === 403) {
        setError(msg || "Session expired. Please log in again.");
      } else if (!err.response) {
        setError("Cannot reach server. Check your internet connection.");
      } else {
        setError(msg || "Prediction failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const isMatch = result?.result === "Match";

  return (
    <ScrollView style={s.root} contentContainerStyle={s.scroll}>
      <Text style={s.heading}>Upload two signatures to check if they match</Text>

      <View style={s.row}>
        <View style={s.box}>
          <Text style={s.label}>Original Signature</Text>
          <TouchableOpacity style={s.pickBtn} onPress={() => showPicker(setImg1)}>
            <Text style={s.pickText}>{img1 ? "✓ Selected" : "+ Choose"}</Text>
          </TouchableOpacity>
          {img1 && <Image source={{ uri: img1.uri }} style={s.preview} resizeMode="contain" />}
        </View>

        <View style={s.box}>
          <Text style={s.label}>Test / Forged</Text>
          <TouchableOpacity style={s.pickBtn} onPress={() => showPicker(setImg2)}>
            <Text style={s.pickText}>{img2 ? "✓ Selected" : "+ Choose"}</Text>
          </TouchableOpacity>
          {img2 && <Image source={{ uri: img2.uri }} style={s.preview} resizeMode="contain" />}
        </View>
      </View>

      {!!error && <Text style={s.error}>{error}</Text>}

      <TouchableOpacity style={[s.submitBtn, loading && { opacity: 0.6 }]} onPress={submit} disabled={loading}>
        {loading ? <ActivityIndicator color="#0f0c29" /> : <Text style={s.submitText}>Check Match</Text>}
      </TouchableOpacity>

      {loading && <Text style={s.hint}>Analyzing signatures...</Text>}

      {result && (
        <View style={s.resultBox}>
          <Text style={[s.resultLabel, isMatch ? s.matchColor : s.noMatchColor]}>
            {isMatch ? "✅ Match" : "❌ No Match"}
          </Text>

          <View style={[s.badge, isMatch ? s.badgeMatch : s.badgeNoMatch]}>
            <Text style={[s.badgeText, isMatch ? s.badgeMatchText : s.badgeNoMatchText]}>
              {result.confidence} Confidence
            </Text>
          </View>

          <View style={s.metrics}>
            <View style={s.metricItem}>
              <Text style={s.metricVal}>{((result.similarity || 0) * 100).toFixed(1)}%</Text>
              <Text style={s.metricLbl}>Similarity</Text>
            </View>
            <View style={s.metricItem}>
              <Text style={s.metricVal}>{result.distance?.toFixed(4)}</Text>
              <Text style={s.metricLbl}>Distance</Text>
            </View>
            <View style={s.metricItem}>
              <Text style={s.metricVal}>{result.loss?.toFixed(4)}</Text>
              <Text style={s.metricLbl}>Loss</Text>
            </View>
          </View>

          {result.metrics && (
            <View style={s.breakdown}>
              <Text style={s.breakdownTitle}>📊 Analysis</Text>
              <Text style={s.breakdownText}>SSIM: {((result.metrics.ssim || 0) * 100).toFixed(1)}%</Text>
            </View>
          )}

          {(result.img1_url || result.img2_url) && (
            <View style={s.imgRow}>
              {result.img1_url && (
                <View style={s.imgBox}>
                  <Text style={s.metricLbl}>Signature 1</Text>
                  <Image source={{ uri: `${SERVER_URL}${result.img1_url}` }} style={s.resultImg} resizeMode="contain" />
                </View>
              )}
              {result.img2_url && (
                <View style={s.imgBox}>
                  <Text style={s.metricLbl}>Signature 2</Text>
                  <Image source={{ uri: `${SERVER_URL}${result.img2_url}` }} style={s.resultImg} resizeMode="contain" />
                </View>
              )}
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: "#0f0c29" },
  scroll:        { padding: 16, paddingBottom: 40 },
  heading:       { color: "#aaa", fontSize: 13, textAlign: "center", marginBottom: 16 },
  row:           { flexDirection: "row", gap: 10, marginBottom: 14 },
  box:           { flex: 1, backgroundColor: "#1a1a2e", borderRadius: 12, padding: 10, alignItems: "center" },
  label:         { color: "#aaa", fontSize: 11, marginBottom: 8, textAlign: "center" },
  pickBtn:       { backgroundColor: "#0f0c29", borderRadius: 8, paddingVertical: 10, paddingHorizontal: 14, borderWidth: 1, borderColor: "#00ffc8", marginBottom: 6 },
  pickText:      { color: "#00ffc8", fontSize: 12, fontWeight: "600" },
  preview:       { width: "100%", height: 90, borderRadius: 8, marginTop: 4 },
  error:         { color: "#ff6b6b", textAlign: "center", marginBottom: 10, fontSize: 13 },
  submitBtn:     { backgroundColor: "#00ffc8", borderRadius: 12, padding: 15, alignItems: "center", marginBottom: 8 },
  submitText:    { color: "#0f0c29", fontWeight: "bold", fontSize: 16 },
  hint:          { color: "#aaa", textAlign: "center", fontSize: 12, marginBottom: 10 },
  resultBox:     { backgroundColor: "#1a1a2e", borderRadius: 16, padding: 18, marginTop: 8 },
  resultLabel:   { fontSize: 26, fontWeight: "bold", textAlign: "center", marginBottom: 10 },
  matchColor:    { color: "#00ffc8" },
  noMatchColor:  { color: "#ff6b6b" },
  badge:         { alignSelf: "center", paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20, marginBottom: 14, borderWidth: 1 },
  badgeMatch:    { backgroundColor: "rgba(0,255,200,0.15)", borderColor: "#00ffc8" },
  badgeNoMatch:  { backgroundColor: "rgba(255,80,80,0.15)", borderColor: "#ff6b6b" },
  badgeText:     { fontWeight: "600", fontSize: 12 },
  badgeMatchText:{ color: "#00ffc8" },
  badgeNoMatchText: { color: "#ff6b6b" },
  metrics:       { flexDirection: "row", justifyContent: "space-around", marginBottom: 10 },
  metricItem:    { alignItems: "center" },
  metricVal:     { color: "#fff", fontWeight: "bold", fontSize: 15 },
  metricLbl:     { color: "#aaa", fontSize: 11, marginTop: 2 },
  breakdown:     { backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 8, padding: 10, marginBottom: 10 },
  breakdownTitle:{ color: "#00ffc8", fontWeight: "600", marginBottom: 6, fontSize: 12 },
  breakdownText: { color: "#ccc", fontSize: 12 },
  imgRow:        { flexDirection: "row", gap: 10, marginTop: 6 },
  imgBox:        { flex: 1, alignItems: "center" },
  resultImg:     { width: "100%", height: 70, borderRadius: 8, marginTop: 4 },
});
