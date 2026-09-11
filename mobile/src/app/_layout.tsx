import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="notes" />
      <Stack.Screen name="note-view" />
      <Stack.Screen name="doubts" />
      <Stack.Screen name="tests" />
      <Stack.Screen name="take-test" />
      <Stack.Screen name="videos" />
      <Stack.Screen name="video-play" />
    </Stack>
  );
}