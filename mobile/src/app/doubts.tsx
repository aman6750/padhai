import { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import api from '../services/api';

export default function Doubts() {
  const router = useRouter();
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const pollRef = useRef(null);
  const scrollRef = useRef(null);

  // Load subjects
  useEffect(() => {
    api.get('/api/subjects')
      .then((res) => setSubjects(res.data))
      .catch(() => setSubjects([]));
  }, []);

  const loadMessages = async (subjectId) => {
    try {
      const res = await api.get(`/api/doubts/subject/${subjectId}`);
      setMessages(res.data);
      setError('');
    } catch (err) {
      if (err.response?.status === 403) {
        setError('Subscribe on our website to join the discussion.');
      } else {
        setError('Could not load messages.');
      }
    }
  };

  const openSubject = (subject) => {
    setSelectedSubject(subject);
    setMessages([]);
    setError('');
    setLoading(true);
    loadMessages(subject.id).finally(() => setLoading(false));

    // start polling every 4 seconds
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => loadMessages(subject.id), 4000);
  };

  // cleanup polling when leaving
  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedSubject) return;
    try {
      await api.post(`/api/doubts/subject/${selectedSubject.id}`, { message: newMessage });
      setNewMessage('');
      loadMessages(selectedSubject.id);
    } catch (err) {
      setError(err.response?.status === 403 ? 'Subscribe to ask doubts.' : 'Could not send.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#f5f7fb' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.heading}>Doubt Discussion</Text>
      </View>

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

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {loading && <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 20 }} />}

      {/* Messages */}
      {selectedSubject && !error && (
        <>
          <ScrollView
            style={styles.messagesArea}
            ref={scrollRef}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
          >
            {messages.length === 0 && <Text style={styles.empty}>No doubts yet. Be the first to ask!</Text>}
            {messages.map((m) => {
              const isTeacher = m.userRole === 'TEACHER' || m.userRole === 'ADMIN';
              return (
                <View key={m.id} style={[styles.bubble, isTeacher ? styles.teacherBubble : styles.studentBubble]}>
                  <Text style={[styles.senderName, isTeacher && { color: '#1d4ed8' }]}>
                    {m.userName} {isTeacher ? '👨‍🏫 Teacher' : ''}
                  </Text>
                  <Text style={styles.messageText}>{m.message}</Text>
                </View>
              );
            })}
          </ScrollView>

          {/* Compose box */}
          <View style={styles.composeRow}>
            <TextInput
              style={styles.composeInput}
              placeholder="Type your doubt..."
              value={newMessage}
              onChangeText={setNewMessage}
            />
            <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
              <Text style={styles.sendBtnText}>Send</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: 40, paddingHorizontal: 16, paddingBottom: 8 },
  backText: { color: '#2563eb', fontSize: 16, marginBottom: 8 },
  heading: { fontSize: 22, fontWeight: 'bold' },
  subjectRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, marginBottom: 8 },
  subjectBtn: { backgroundColor: '#e5e7eb', paddingVertical: 6, paddingHorizontal: 14, borderRadius: 18 },
  subjectBtnActive: { backgroundColor: '#2563eb' },
  subjectText: { color: '#333', fontWeight: '500' },
  subjectTextActive: { color: '#fff' },
  error: { color: '#dc2626', paddingHorizontal: 16, marginTop: 12 },
  empty: { color: '#666', padding: 16 },
  messagesArea: { flex: 1, paddingHorizontal: 16 },
  bubble: { padding: 12, borderRadius: 10, marginVertical: 6, borderWidth: 1 },
  studentBubble: { backgroundColor: '#fff', borderColor: '#e5e7eb' },
  teacherBubble: { backgroundColor: '#dbeafe', borderColor: '#93c5fd' },
  senderName: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 4 },
  messageText: { fontSize: 15 },
  composeRow: { flexDirection: 'row', padding: 12, gap: 8, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  composeInput: { flex: 1, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, fontSize: 15 },
  sendBtn: { backgroundColor: '#2563eb', paddingHorizontal: 20, justifyContent: 'center', borderRadius: 8 },
  sendBtnText: { color: '#fff', fontWeight: '600' },
});