import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Point at your LIVE backend (same one the website uses)
const api = axios.create({
  baseURL: 'https://padhai-backend-a3vv.onrender.com',
});

// Attach the token to every request (mobile uses AsyncStorage, not localStorage)
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = 'Bearer ' + token;
  }
  return config;
});

export default api;