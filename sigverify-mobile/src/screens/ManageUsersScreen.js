import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { getUsers, activateUser, deleteUser } from '../services/api';

export default function ManageUsersScreen() {
  const [users,     setUsers]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [refreshing,setRefreshing]= useState(false);
  const [error,     setError]     = useState('');
  const [msg,       setMsg]       = useState('');

  const fetchUsers = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const res = await getUsers();
      setUsers(res.data);
      setError('');
    } catch {
      setError('Failed to load users. Check your admin session.');
    } finally {
      setLoading(false); setRefreshing(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleActivate = async (id, name) => {
    try {
      const res = await activateUser(id);
      setMsg(res.data.message);
      fetchUsers();
    } catch { setMsg('Activation failed.'); }
  };

  const handleDelete = (id, name) => {
    Alert.alert('Confirm Delete', `Delete user "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          const res = await deleteUser(id);
          setMsg(res.data.message);
          fetchUsers();
        } catch { setMsg('Deletion failed.'); }
      }},
    ]);
  };

  const waiting   = users.filter(u => u.status === 'waiting');
  const activated = users.filter(u => u.status === 'activated');

  if (loading) return (
    <View style={s.center}>
      <ActivityIndicator size="large" color="#00ffc8" />
      <Text style={s.loadingText}>Loading users...</Text>
    </View>
  );

  return (
    <ScrollView
      style={s.root}
      contentContainerStyle={s.scroll}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchUsers(true)} tintColor="#00ffc8" />}
    >
      {!!msg && (
        <TouchableOpacity style={s.msgBox} onPress={() => setMsg('')}>
          <Text style={s.msgText}>✅ {msg}  ✕</Text>
        </TouchableOpacity>
      )}

      {!!error && <Text style={s.errorText}>{error}</Text>}

      {/* Stats */}
      <View style={s.statsRow}>
        <View style={s.statBox}>
          <Text style={s.statVal}>{users.length}</Text>
          <Text style={s.statLbl}>Total</Text>
        </View>
        <View style={s.statBox}>
          <Text style={[s.statVal, { color: '#ffd700' }]}>{waiting.length}</Text>
          <Text style={s.statLbl}>Pending</Text>
        </View>
        <View style={s.statBox}>
          <Text style={[s.statVal, { color: '#00ffc8' }]}>{activated.length}</Text>
          <Text style={s.statLbl}>Active</Text>
        </View>
      </View>

      {/* User cards */}
      {users.length === 0
        ? <Text style={s.empty}>No users registered yet.</Text>
        : users.map((u, i) => (
          <View key={u.id} style={s.userCard}>
            <View style={s.userHeader}>
              <Text style={s.userName}>{i + 1}. {u.name}</Text>
              <View style={[s.badge, u.status === 'activated' ? s.badgeActive : s.badgeWait]}>
                <Text style={s.badgeText}>{u.status === 'activated' ? '✅ Active' : '⏳ Waiting'}</Text>
              </View>
            </View>
            <Text style={s.userInfo}>ID: {u.loginid}  •  {u.mobile}</Text>
            <Text style={s.userInfo}>{u.email}</Text>
            {u.locality ? <Text style={s.userInfo}>{u.locality}, {u.city}</Text> : null}

            {u.status === 'waiting'
              ? <TouchableOpacity style={s.activateBtn} onPress={() => handleActivate(u.id, u.name)}>
                  <Text style={s.activateBtnText}>Activate</Text>
                </TouchableOpacity>
              : <TouchableOpacity style={s.deleteBtn} onPress={() => handleDelete(u.id, u.name)}>
                  <Text style={s.deleteBtnText}>Delete</Text>
                </TouchableOpacity>
            }
          </View>
        ))
      }
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: '#0f0c29' },
  scroll:        { padding: 16, paddingBottom: 40 },
  center:        { flex: 1, backgroundColor: '#0f0c29', justifyContent: 'center', alignItems: 'center' },
  loadingText:   { color: '#aaa', marginTop: 12 },
  msgBox:        { backgroundColor: 'rgba(0,255,200,0.1)', borderRadius: 8, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#00ffc8' },
  msgText:       { color: '#00ffc8', fontSize: 13 },
  errorText:     { color: '#ff6b6b', marginBottom: 12 },
  statsRow:      { flexDirection: 'row', gap: 12, marginBottom: 20 },
  statBox:       { flex: 1, backgroundColor: '#1a1a2e', borderRadius: 12, padding: 14, alignItems: 'center' },
  statVal:       { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  statLbl:       { color: '#aaa', fontSize: 12, marginTop: 2 },
  empty:         { color: '#aaa', textAlign: 'center', marginTop: 40 },
  userCard:      { backgroundColor: '#1a1a2e', borderRadius: 12, padding: 16, marginBottom: 12 },
  userHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  userName:      { color: '#fff', fontWeight: 'bold', fontSize: 15, flex: 1 },
  badge:         { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeActive:   { backgroundColor: 'rgba(0,255,200,0.15)' },
  badgeWait:     { backgroundColor: 'rgba(255,200,0,0.15)' },
  badgeText:     { fontSize: 12, fontWeight: '600', color: '#fff' },
  userInfo:      { color: '#aaa', fontSize: 13, marginBottom: 2 },
  activateBtn:   { backgroundColor: '#00ffc8', borderRadius: 8, padding: 10, alignItems: 'center', marginTop: 10 },
  activateBtnText:{ color: '#0f0c29', fontWeight: 'bold', fontSize: 14 },
  deleteBtn:     { backgroundColor: 'rgba(255,80,80,0.15)', borderRadius: 8, padding: 10, alignItems: 'center', marginTop: 10, borderWidth: 1, borderColor: '#ff6b6b' },
  deleteBtnText: { color: '#ff6b6b', fontWeight: 'bold', fontSize: 14 },
});
