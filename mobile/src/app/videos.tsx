import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import api from '../services/api';

export default function Videos() {
  const router = useRouter();
  const [videos, setVideos] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/videos')
      .then((res) => setVideos(res.data))
      .catch((err) => {
        setMessage(err.response?.status === 403
          ? 'Subscribe on our website to watch videos.'
          : 'Could not load videos.');
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
      <Text style={styles.heading}>Video Lessons</Text>

      {loading && <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 20 }} />}
      {message ? <Text style={styles.message}>{message}</Text> : null}

      {videos.map((video) => (
        <View key={video.id} style={styles.videoCard}>
          <Text style={styles.videoTitle}>{video.title}</Text>
          <Text style={styles.videoDesc}>{video.description}</Text>
          <TouchableOpacity
            style={styles.playBtn}
            onPress={() => router.push(`/video-play?videoId=${video.videoUrl}`)}
          >
            <Text style={styles.playBtnText}>▶ Play Lesson</Text>
          </TouchableOpacity>
        </View>
      ))}

      {!loading && !message && videos.length === 0 && (
        <Text style={styles.empty}>No videos yet.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingTop: 50, backgroundColor: '#f5f7fb', minHeight: '100%' },
  backText: { color: '#2563eb', fontSize: 16, marginBottom: 8 },
  heading: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  message: { color: '#dc2626', marginTop: 16, fontSize: 15 },
  empty: { color: '#666', marginTop: 16 },
  videoCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12 },
  videoTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  videoDesc: { color: '#666', marginBottom: 10 },
  playBtn: { backgroundColor: '#2563eb', padding: 10, borderRadius: 8, alignItems: 'center' },
  playBtnText: { color: '#fff', fontWeight: '600' },
});