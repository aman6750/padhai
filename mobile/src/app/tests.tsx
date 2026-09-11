import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import api from '../services/api';

export default function Tests() {
  const router = useRouter();
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [tests, setTests] = useState([]);

  useEffect(() => {
    api.get('/api/subjects').then((res) => setSubjects(res.data)).catch(() => setSubjects([]));
  }, []);

  const openSubject = async (subject) => {
    setSelectedSubject(subject);
    try {
      const res = await api.get(`/api/tests/subject/${subject.id}`);
      setTests(res.data);
    } catch { setTests([]); }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
      <Text style={styles.heading}>Mock Tests</Text>

      <View style={styles.subjectRow}>
        {subjects.map((s) => (
          <TouchableOpacity
            key={s.id}
            style={[styles.subjectBtn, selectedSubject?.id === s.id && styles.subjectBtnActive]}
            onPress={() => openSubject(s)}
          >
            <Text style={[styles.subjectText, selectedSubject?.id === s.id && styles.subjectTextActive]}>
              {s.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {selectedSubject && (
        <View style={{ marginTop: 16 }}>
          <Text style={styles.subheading}>{selectedSubject.name} — Tests ({tests.length})</Text>
          {tests.length === 0 && <Text style={styles.empty}>No tests yet.</Text>}
          {tests.map((t) => (
            <View key={t.id} style={styles.testCard}>
              <Text style={styles.testTitle}>
                {t.title} {t.isFree ? <Text style={styles.freeTag}>(Free)</Text> : null}
              </Text>
              <Text style={styles.testDesc}>{t.description} · ⏱ {t.durationMinutes} min</Text>
              <TouchableOpacity
                style={styles.startBtn}
                onPress={() => router.push(`/take-test?testId=${t.id}&duration=${t.durationMinutes}`)}
              >
                <Text style={styles.startBtnText}>Start Test</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingTop: 50, backgroundColor: '#f5f7fb', minHeight: '100%' },
  backText: { color: '#2563eb', fontSize: 16, marginBottom: 8 },
  heading: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  subheading: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  subjectRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  subjectBtn: { backgroundColor: '#e5e7eb', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20 },
  subjectBtnActive: { backgroundColor: '#2563eb' },
  subjectText: { color: '#333', fontWeight: '500' },
  subjectTextActive: { color: '#fff' },
  empty: { color: '#666' },
  testCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12 },
  testTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  freeTag: { color: '#16a34a', fontSize: 13 },
  testDesc: { color: '#666', marginBottom: 10 },
  startBtn: { backgroundColor: '#2563eb', padding: 10, borderRadius: 8, alignItems: 'center' },
  startBtnText: { color: '#fff', fontWeight: '600' },
});