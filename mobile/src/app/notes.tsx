import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import api from '../services/api';

export default function Notes() {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [notes, setNotes] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Load subjects
  useEffect(() => {
    api.get('/api/subjects')
      .then((res) => setSubjects(res.data))
      .catch(() => setSubjects([]));
  }, []);

  const openSubject = async (subject) => {
    setSelectedSubject(subject);
    setMessage('');
    setLoading(true);
    try {
      const res = await api.get(`/api/notes/subject/${subject.id}`);
      setNotes(res.data);
    } catch (error) {
      if (error.response?.status === 403) {
        setMessage('Subscribe on our website to view notes.');
        setNotes([]);
      } else {
        setMessage('Could not load notes.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Study Notes</Text>

      {/* Subject buttons */}
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

      {loading && <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 20 }} />}
      {message ? <Text style={styles.message}>{message}</Text> : null}

      {/* Notes list */}
      {selectedSubject && !message && !loading && (
        <View style={{ marginTop: 16 }}>
          <Text style={styles.subheading}>{selectedSubject.name} — Notes ({notes.length})</Text>
          {notes.length === 0 && <Text style={styles.empty}>No notes yet.</Text>}
          {notes.map((note) => (
            <View key={note.id} style={styles.noteCard}>
              <Text style={styles.noteTitle}>{note.title}</Text>
              <Text style={styles.noteDesc}>{note.description}</Text>
              <TouchableOpacity style={styles.openBtn}>
                <Text style={styles.openBtnText}>Open Note (coming next)</Text>
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
  heading: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  subheading: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  subjectRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  subjectBtn: { backgroundColor: '#e5e7eb', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20 },
  subjectBtnActive: { backgroundColor: '#2563eb' },
  subjectText: { color: '#333', fontWeight: '500' },
  subjectTextActive: { color: '#fff' },
  message: { color: '#dc2626', marginTop: 16, fontSize: 15 },
  empty: { color: '#666' },
  noteCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12 },
  noteTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  noteDesc: { color: '#666', marginBottom: 10 },
  openBtn: { backgroundColor: '#2563eb', padding: 10, borderRadius: 8, alignItems: 'center' },
  openBtnText: { color: '#fff', fontWeight: '600' },
});