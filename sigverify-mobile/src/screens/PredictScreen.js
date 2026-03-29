import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, Image, StyleSheet,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { predictSignature, BASE_URL } from '../services/api';

export default function PredictScreen() {
  const [img1,    setImg1]    = useState(null);
  const [img2,    setImg2]    = useState(null);
  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const pickImage = async (setter) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow photo library access.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],   // SDK 54: array syntax (MediaTypeOptions removed)
      quality: 0.9,
      allowsEditing: false,
    });
    if (!res.canceled && res.assets?.[0]) {
      setter(res.assets[0]);
    }
  };

  const takePhoto = async (setter) => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow camera access.');
      return;
    }
    const res = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],   // SDK 54: array syntax
      quality: 0.9,
      allowsEditing: false,
    });
    if (!res.canceled && res.assets?.[0]) {
      setter(res.assets[0]);
    }
  };

  const showPicker = (setter) => {
    Alert.alert('Select Image', 'Choose source', [
      { text: 'Camera',        onPress: () => takePhoto(setter) },
      { text: 'Photo Library', onPress: () => pickImage(setter) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handlePredict = async () => {
    if (!img1 || !img2) {
      setError('Please select both signature images.');
      return;
    }
    setError(''); setResult(null); setLoading(true);

    try {
      const fd = new FormData();

      // Append image1 — works with any format (JPEG, PNG, HEIC)
      const ext1  = (img1.uri.split('.').pop() || 'jpg').toLowerCase();
      const mime1 = ext1 === 'png' ? 'image/png' : 'image/jpeg';
      fd.append('image1', { uri: img1.uri, name: `sig1.${ext1}`, type: mime1 });

      const ext2  = (img2.uri.split('.').pop() || 'jpg').toLowerCase();
      const mime2 = ext2 === 'png' ? 'image/png' : 'image/jpeg';
      fd.append('image2', { uri: img2.uri, name: `sig2.${ext2}`, type: mime2 });

      const res = await predictSignature(fd);
      setResult(res.data);
    } catch (err) {
      const status = err.response?.status;
      const msg    = err.response?.data?.error || '';
      if (status === 401 || status === 403) {
        setError(msg || 'Session expired. Please log out and log in again.');
      } else if (!err.response) {
        setError('Cannot reach server. Make sure Django is running and BASE_URL is correct.');
      } else {
        setError(msg || 'Prediction failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const isMatch = result?.result === 'Match';

  return (
    <ScrollView style={s.root} contentContainerStyle={s.scroll}>
      <Text style={s.heading}>Upload two signature images to check if they match</Text>

      {/* Image pickers */}
      <View style={s.row}>
        <View style={s.uploadBox}>
          <Text style={s.uploadLabel}>Original Signature</Text>
          <TouchableOpacity style={s.pickBtn} onPress={() => showPicker(setImg1)}>
            <Text style={s.pickBtnText}>{img1 ? '✓ Selected' : '+ Choose'}</Text>
          </TouchableOpacity>
          {img1 && <Image source={{ uri: img1.uri }} style={s.preview} resizeMode="contain" />}
        </View>

        <View style={s.uploadBox}>
          <Text style={s.uploadLabel}>Test / Forged</Text>
          <TouchableOpacity style={s.pickBtn} onPress={() => showPicker(setImg2)}>
            <Text style={s.pickBtnText}>{img2 ? '✓ Selected' : '+ Choose'}</Text>
          </TouchableOpacity>
          {img2 && <Image source={{ uri: img2.uri }} style={s.preview} resizeMode="contain" />}
        </View>
      </View>

      {/* Error */}
      {!!error && (
        <View style={s.errorBox}>
          <Text style={s.errorText}>{error}</Text>
        </View>
      )}

      {/* Submit */}
      <TouchableOpacity
        style={[s.submitBtn, loading && s.submitDisabled]}
        onPress={handlePredict}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator color="#0f0c29" />
          : <Text style={s.submitText}>Check Match</Text>}
      </TouchableOpacity>

      {loading && <Text style={s.loadingHint}>Analyzing signatures...</Text>}

      {/* Result */}
      {result && (
        <View style={s.resultBox}>
          <Text style={[s.resultLabel, isMatch ? s.matchColor : s.noMatchColor]}>
            {isMatch ? '✅ Match' : '❌ No Match'}
          </Text>

          {/* Confidence badge */}
          <View style={[s.badge, result.confidence === 'High' ? s.badgeHigh : s.badgeMed]}>
            <Text style={[s.badgeText, result.confidence === 'High' ? s.badgeHighText : s.badgeMedText]}>
              {result.confidence} Confidence
            </Text>
          </View>

          {/* Metrics */}
          <View style={s.metricsRow}>
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

          {/* Analysis breakdown */}
          {result.metrics && (
            <View style={s.breakdown}>
              <Text style={s.breakdownTitle}>📊 Analysis Breakdown</Text>
              <View style={s.metricsRow}>
                <View style={s.metricItem}>
                  <Text style={s.metricVal}>{((result.metrics.ssim || 0) * 100).toFixed(1)}%</Text>
                  <Text style={s.metricLbl}>SSIM</Text>
                </View>
                <View style={s.metricItem}>
                  <Text style={s.metricVal}>
                    {result.metrics.model_available ? result.metrics.model_distance?.toFixed(3) : 'N/A'}
                  </Text>
                  <Text style={s.metricLbl}>Neural Net</Text>
                </View>
              </View>
            </View>
          )}

          {/* Uploaded images */}
          {(result.img1_url || result.img2_url) && (
            <View style={s.resultImgRow}>
              {result.img1_url && (
                <View style={s.resultImgBox}>
                  <Text style={s.metricLbl}>Signature 1</Text>
                  <Image source={{ uri: `${BASE_URL}${result.img1_url}` }} style={s.resultImg} resizeMode="contain" />
                </View>
              )}
              {result.img2_url && (
                <View style={s.resultImgBox}>
                  <Text style={s.metricLbl}>Signature 2</Text>
                  <Image source={{ uri: `${BASE_URL}${result.img2_url}` }} style={s.resultImg} resizeMode="contain" />
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
  root:          { flex: 1, backgroundColor: '#0f0c29' },
  scroll:        { padding: 16, paddingBottom: 40 },
  heading:       { color: '#aaa', fontSize: 13, marginBottom: 16, textAlign: 'center' },
  row:           { flexDirection: 'row', gap: 12, marginBottom: 16 },
  uploadBox:     { flex: 1, backgroundColor: '#1a1a2e', borderRadius: 12, padding: 12, alignItems: 'center' },
  uploadLabel:   { color: '#aaa', fontSize: 12, marginBottom: 8, textAlign: 'center' },
  pickBtn:       { backgroundColor: '#0f0c29', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 16, borderWidth: 1, borderColor: '#00ffc8', marginBottom: 8 },
  pickBtnText:   { color: '#00ffc8', fontSize: 13, fontWeight: '600' },
  preview:       { width: '100%', height: 100, borderRadius: 8, marginTop: 4 },
  errorBox:      { backgroundColor: 'rgba(255,80,80,0.15)', borderRadius: 8, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,80,80,0.3)' },
  errorText:     { color: '#ff6b6b', fontSize: 14 },
  submitBtn:     { backgroundColor: '#00ffc8', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 8 },
  submitDisabled:{ opacity: 0.6 },
  submitText:    { color: '#0f0c29', fontWeight: 'bold', fontSize: 16 },
  loadingHint:   { color: '#aaa', textAlign: 'center', fontSize: 13, marginBottom: 16 },
  resultBox:     { backgroundColor: '#1a1a2e', borderRadius: 16, padding: 20, marginTop: 8 },
  resultLabel:   { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 12 },
  matchColor:    { color: '#00ffc8' },
  noMatchColor:  { color: '#ff6b6b' },
  badge:         { alignSelf: 'center', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, marginBottom: 16, borderWidth: 1 },
  badgeHigh:     { backgroundColor: 'rgba(0,255,200,0.15)', borderColor: '#00ffc8' },
  badgeMed:      { backgroundColor: 'rgba(255,200,0,0.15)', borderColor: '#ffd700' },
  badgeText:     { fontWeight: '600', fontSize: 13 },
  badgeHighText: { color: '#00ffc8' },
  badgeMedText:  { color: '#ffd700' },
  metricsRow:    { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
  metricItem:    { alignItems: 'center' },
  metricVal:     { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  metricLbl:     { color: '#aaa', fontSize: 12, marginTop: 2 },
  breakdown:     { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 12, marginBottom: 12 },
  breakdownTitle:{ color: '#00ffc8', fontWeight: '600', marginBottom: 10, fontSize: 13 },
  resultImgRow:  { flexDirection: 'row', gap: 12, marginTop: 8 },
  resultImgBox:  { flex: 1, alignItems: 'center' },
  resultImg:     { width: '100%', height: 80, borderRadius: 8, marginTop: 4 },
});
