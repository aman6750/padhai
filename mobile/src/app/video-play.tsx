import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { useRouter, useLocalSearchParams } from 'expo-router';
import api from '../services/api';

export default function VideoPlay() {
  const router = useRouter();
  const { videoId } = useLocalSearchParams();
  const [otpData, setOtpData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadOtp = async () => {
      try {
        const res = await api.get(`/api/videos/${videoId}/otp`);
        setOtpData(res.data); // { otp, playbackInfo }
      } catch (err) {
        setError('Could not load video. Make sure you are subscribed.');
      }
    };
    loadOtp();
  }, [videoId]);

  // VdoCipher player HTML
  const playerHtml = otpData ? `
    <html>
      <head><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="margin:0;background:#000;">
        <iframe
          src="https://player.vdocipher.com/v2/?otp=${otpData.otp}&playbackInfo=${otpData.playbackInfo}"
          style="width:100%;height:100%;border:0;position:absolute;top:0;left:0;"
          allow="encrypted-media"
          allowfullscreen>
        </iframe>
      </body>
    </html>
  ` : '';

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.back}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : !otpData ? (
        <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 40 }} />
      ) : (
        <WebView
          originWhitelist={['*']}
          source={{ html: playerHtml }}
          style={{ flex: 1 }}
          allowsFullscreenVideo
          mediaPlaybackRequiresUserAction={false}
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