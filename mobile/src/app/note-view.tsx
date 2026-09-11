import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { useRouter, useLocalSearchParams } from 'expo-router';
import api from '../services/api';

export default function NoteView() {
  const { noteId } = useLocalSearchParams();
  const router = useRouter();
  const [pdfData, setPdfData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadPdf = async () => {
      try {
        const res = await api.get(`/api/notes/${noteId}/view`, { responseType: 'blob' });
        // Convert blob to base64 data URL
        const reader = new FileReader();
        reader.onloadend = () => {
          setPdfData(reader.result); // data:application/pdf;base64,...
        };
        reader.readAsDataURL(res.data);
      } catch (err) {
        setError('Could not load note. Make sure you are subscribed.');
      }
    };
    loadPdf();
  }, [noteId]);

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.back}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : !pdfData ? (
        <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 40 }} />
      ) : (
        <WebView
          originWhitelist={['*']}
          source={{ uri: pdfData }}
          style={{ flex: 1 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 40, backgroundColor: '#fff' },
  back: { padding: 16 },
  backText: { color: '#2563eb', fontSize: 16 },
  error: { padding: 20, color: '#dc2626', fontSize: 15 },
});