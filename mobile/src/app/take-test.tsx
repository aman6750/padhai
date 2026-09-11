import { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import api from '../services/api';

export default function TakeTest() {
  const router = useRouter();
  const { testId, duration } = useLocalSearchParams();
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(parseInt(duration) * 60 || 1800);
  const [result, setResult] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Load questions (without answers — backend hides them)
  useEffect(() => {
    api.get(`/api/tests/${testId}/take`)
      .then((res) => setQuestions(res.data))
      .catch((err) => {
        setMessage(err.response?.status === 403
          ? 'Subscribe on our website to take this test.'
          : 'Could not load test.');
      })
      .finally(() => setLoading(false));
  }, [testId]);

  const handleSubmit = useCallback(async () => {
    if (submitting || result) return;
    setSubmitting(true);
    try {
      const res = await api.post(`/api/tests/${testId}/submit`, answers);
      setResult(res.data);
    } catch {
      setMessage('Could not submit test.');
    } finally {
      setSubmitting(false);
    }
  }, [answers, testId, submitting, result]);

  // Countdown timer
  useEffect(() => {
    if (result || loading) return;
    if (timeLeft <= 0) { handleSubmit(); return; }
    const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, result, loading, handleSubmit]);

  const selectAnswer = (qId, opt) => setAnswers((prev) => ({ ...prev, [qId]: opt }));

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#2563eb" /></View>;
  if (message) return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.back()}><Text style={styles.backText}>← Back</Text></TouchableOpacity>
      <Text style={styles.error}>{message}</Text>
    </View>
  );

  // Result screen
  if (result) {
    return (
      <View style={styles.center}>
        <Text style={styles.resultTitle}>Test Submitted! ✅</Text>
        <Text style={styles.score}>{result.score} / {result.total}</Text>
        <TouchableOpacity style={styles.startBtn} onPress={() => router.replace('/tests')}>
          <Text style={styles.startBtnText}>Back to Tests</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f5f7fb' }}>
      {/* Sticky timer bar */}
      <View style={styles.timerBar}>
        <Text style={styles.answeredText}>{Object.keys(answers).length}/{questions.length} answered</Text>
        <Text style={[styles.timer, timeLeft < 60 && { color: '#dc2626' }]}>⏱ {formatTime(timeLeft)}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {questions.map((q, idx) => (
          <View key={q.id} style={styles.qCard}>
            <Text style={styles.qText}>{idx + 1}. {q.questionText}</Text>
            {['A', 'B', 'C', 'D'].map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[styles.option, answers[q.id] === opt && styles.optionSelected]}
                onPress={() => selectAnswer(q.id, opt)}
              >
                <Text style={answers[q.id] === opt ? styles.optionTextSelected : styles.optionText}>
                  {opt}. {q['option' + opt]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}

        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
          <Text style={styles.submitBtnText}>{submitting ? 'Submitting...' : 'Submit Test'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f7fb' },
  container: { padding: 16, paddingBottom: 40 },
  backText: { color: '#2563eb', fontSize: 16, margin: 16 },
  error: { color: '#dc2626', padding: 16, fontSize: 15 },
  timerBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, paddingTop: 44, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  answeredText: { fontSize: 14, fontWeight: '600' },
  timer: { fontSize: 18, fontWeight: 'bold', color: '#2563eb' },
  qCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12 },
  qText: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  option: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, marginBottom: 8 },
  optionSelected: { borderColor: '#2563eb', backgroundColor: '#dbeafe' },
  optionText: { fontSize: 15, color: '#333' },
  optionTextSelected: { fontSize: 15, color: '#1d4ed8', fontWeight: '600' },
  submitBtn: { backgroundColor: '#2563eb', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  resultTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  score: { fontSize: 40, fontWeight: 'bold', color: '#2563eb', marginBottom: 24 },
  startBtn: { backgroundColor: '#2563eb', paddingVertical: 12, paddingHorizontal: 32, borderRadius: 8 },
  startBtnText: { color: '#fff', fontWeight: '600' },
});