import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import api from '../services/api';

export default function Dashboard() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const checkStatus = async () => {
    try {
      const res = await api.get('/api/subscriptions/status');
      setIsSubscribed(res.data.active);
    } catch (error) {
      // if this fails, likely not logged in
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    router.replace('/');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.brand}>पढ़<Text style={styles.ai}>AI</Text></Text>

      {/* Subscription status */}
      {loading ? (
        <Text style={styles.status}>Loading...</Text>
      ) : isSubscribed ? (
        <Text style={styles.subscribed}>✅ You are subscribed</Text>
      ) : (
        <View style={styles.notSubBox}>
          <Text style={styles.notSubscribed}>❌ Not subscribed</Text>
          <Text style={styles.hint}>Subscribe on our website to unlock content.</Text>
        </View>
      )}

      {/* Navigation buttons */}
      <View style={styles.grid}>
        <TouchableOpacity style={styles.card} onPress={() => router.push('/notes')}>
          <Text style={styles.cardText}>📄 Notes</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.card} onPress={() => router.push('/tests')}>
          <Text style={styles.cardText}>📝 Tests</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.card} onPress={() => router.push('/videos')}>
          <Text style={styles.cardText}>🎬 Videos</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.card} onPress={() => router.push('/doubts')}>
          <Text style={styles.cardText}>💬 Doubts</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logout} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingTop: 60, backgroundColor: '#f5f7fb', minHeight: '100%' },
  brand: { fontSize: 32, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  ai: { color: '#2563eb' },
  status: { textAlign: 'center', fontSize: 16 },
  subscribed: { textAlign: 'center', fontSize: 18, color: '#16a34a', fontWeight: '600', marginBottom: 24 },
  notSubBox: { alignItems: 'center', marginBottom: 24 },
  notSubscribed: { fontSize: 18, color: '#dc2626', fontWeight: '600' },
  hint: { fontSize: 13, color: '#666', marginTop: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 },
  card: {
    backgroundColor: '#fff', width: '47%', padding: 24, borderRadius: 12,
    alignItems: 'center', marginBottom: 12,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  cardText: { fontSize: 16, fontWeight: '600' },
  logout: {
    marginTop: 24, backgroundColor: '#e5e7eb', padding: 14,
    borderRadius: 8, alignItems: 'center',
  },
  logoutText: { fontSize: 15, fontWeight: '600', color: '#333' },
});