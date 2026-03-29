import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Image,
} from 'react-native';
import { simulateTrain, BASE_URL } from '../services/api';

export default function TrainScreen() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const handleTrain = async () => {
    setError(''); setData(null); setLoading(true);
    try {
      const res = await simulateTrain();
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Training simulation failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={s.root} contentContainerStyle={s.scroll}>
      {!!error && (
        <View style={s.errorBox}>
          <Text style={s.errorText}>{error}</Text>
        </View>
      )}

      {!data && !loading && (
        <View style={s.center}>
          <Text style={s.icon}>🖊️</Text>
          <Text style={s.hint}>
            Tap the button below to run the training simulation.{'\n'}
            This will compute evaluation metrics.
          </Text>
          <TouchableOpacity style={s.btn} onPress={handleTrain}>
            <Text style={s.btnText}>Start Training Simulation</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading && (
        <View style={s.center}>
          <ActivityIndicator size="large" color="#00ffc8" />
          <Text style={s.hint}>Running simulation... this may take a moment.</Text>
        </View>
      )}

      {data && (
        <>
          <View style={s.pathBox}>
            <Text style={s.pathLabel}>Genuine Path: <Text style={s.pathVal}>{data.dataset_paths?.genuine_path}</Text></Text>
            <Text style={s.pathLabel}>Forged Path:  <Text style={s.pathVal}>{data.dataset_paths?.forged_path}</Text></Text>
          </View>

          <Text style={s.sectionTitle}>📈 Evaluation Metrics</Text>
          <View style={s.metricsGrid}>
            {[
              { label: 'Accuracy',  val: data.accuracy },
              { label: 'Precision', val: data.precision },
              { label: 'Recall',    val: data.recall },
              { label: 'AUC',       val: data.auc },
            ].map(m => (
              <View key={m.label} style={s.metricBox}>
                <Text style={s.metricVal}>{((m.val || 0) * 100).toFixed(2)}%</Text>
                <Text style={s.metricLbl}>{m.label}</Text>
              </View>
            ))}
          </View>

          <Text style={s.sectionTitle}>📊 Performance Graphs</Text>
          <View style={s.graphRow}>
            <View style={s.graphBox}>
              <Text style={s.graphLabel}>Confusion Matrix</Text>
              <Image
                source={{ uri: `${BASE_URL}/django-static/confusion_matrix.png` }}
                style={s.graph}
                resizeMode="contain"
              />
            </View>
            <View style={s.graphBox}>
              <Text style={s.graphLabel}>Training Graph</Text>
              <Image
                source={{ uri: `${BASE_URL}/django-static/training_graph.png` }}
                style={s.graph}
                resizeMode="contain"
              />
            </View>
          </View>

          <TouchableOpacity style={s.rerunBtn} onPress={handleTrain}>
            <Text style={s.rerunText}>🔄 Run Again</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: '#0f0c29' },
  scroll:       { padding: 20, paddingBottom: 40 },
  center:       { alignItems: 'center', paddingVertical: 40 },
  icon:         { fontSize: 48, marginBottom: 16 },
  hint:         { color: '#aaa', textAlign: 'center', fontSize: 14, lineHeight: 22, marginBottom: 24 },
  btn:          { backgroundColor: '#00ffc8', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32 },
  btnText:      { color: '#0f0c29', fontWeight: 'bold', fontSize: 15 },
  errorBox:     { backgroundColor: 'rgba(255,80,80,0.15)', borderRadius: 8, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,80,80,0.3)' },
  errorText:    { color: '#ff6b6b', fontSize: 14 },
  pathBox:      { backgroundColor: '#1a1a2e', borderRadius: 12, padding: 14, marginBottom: 20 },
  pathLabel:    { color: '#aaa', fontSize: 12, marginBottom: 4 },
  pathVal:      { color: '#fff' },
  sectionTitle: { color: '#00ffc8', fontWeight: '600', fontSize: 16, marginBottom: 12 },
  metricsGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  metricBox:    { flex: 1, minWidth: '45%', backgroundColor: '#1a1a2e', borderRadius: 12, padding: 16, alignItems: 'center' },
  metricVal:    { color: '#00ffc8', fontSize: 22, fontWeight: 'bold' },
  metricLbl:    { color: '#aaa', fontSize: 13, marginTop: 4 },
  graphRow:     { flexDirection: 'row', gap: 12, marginBottom: 20 },
  graphBox:     { flex: 1, backgroundColor: '#1a1a2e', borderRadius: 12, padding: 10, alignItems: 'center' },
  graphLabel:   { color: '#aaa', fontSize: 12, marginBottom: 8 },
  graph:        { width: '100%', height: 120, borderRadius: 8 },
  rerunBtn:     { borderWidth: 1, borderColor: '#00ffc8', borderRadius: 10, padding: 12, alignItems: 'center' },
  rerunText:    { color: '#00ffc8', fontSize: 14 },
});
