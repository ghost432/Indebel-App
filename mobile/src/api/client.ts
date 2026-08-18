import axios from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Linking from 'expo-linking';

const DEV_MACHINE_IP = '192.168.105.56'; // Current machine IP on the WiFi
let devUrl = `http://${DEV_MACHINE_IP}:5000/api`;

if (Platform.OS === 'web') {
  devUrl = 'http://localhost:5000/api';
} else {
  try {
    // Try to get IP from Expo's linking URL first (most reliable on physical devices and different WiFis)
    const url = Linking.createURL('/');
    const parsed = Linking.parse(url);
    if (parsed.hostname && parsed.hostname !== 'localhost' && parsed.hostname !== '127.0.0.1' && parsed.hostname !== '::1') {
      devUrl = `http://${parsed.hostname}:5000/api`;
      console.log('🔗 [API Client] IP dynamique résolue par expo-linking :', devUrl);
    } else {
      // Fallback to traditional hostUri detection
      const hostUri = Constants?.expoConfig?.hostUri || Constants?.manifest?.debuggerHost || (Constants?.manifest2 as any)?.extra?.expoGo?.debuggerHost;
      if (hostUri) {
        const ip = hostUri.split(':')[0];
        if (ip && ip !== 'localhost' && ip !== '127.0.0.1' && ip !== '::1') {
          devUrl = `http://${ip}:5000/api`;
          console.log('🔗 [API Client] IP résolue via hostUri :', devUrl);
        } else {
          // If loopback is detected, check if we are on emulator or physical device
          devUrl = Platform.OS === 'android' ? 'http://10.0.2.2:5000/api' : `http://${DEV_MACHINE_IP}:5000/api`;
          console.log('🔗 [API Client] IP locale de développement (émulateur/physique fallback) :', devUrl);
        }
      } else {
        devUrl = Platform.OS === 'android' ? 'http://10.0.2.2:5000/api' : `http://${DEV_MACHINE_IP}:5000/api`;
        console.log('🔗 [API Client] IP locale de développement (pas de hostUri) :', devUrl);
      }
    }
  } catch (error) {
    console.warn('🔗 [API Client] Erreur lors de la détection de l\'IP dynamique, fallback activé :', error);
    devUrl = `http://${DEV_MACHINE_IP}:5000/api`;
  }
}

// Production backend URL using the pro domain (fully certified HTTPS)
const BASE_URL = 'https://pro.indebel.be/api';

console.log('🔗 [API Client] Initialisé avec URL :', BASE_URL);

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    // On peut identifier que la requête vient du mobile
    'X-Client-Platform': Platform.OS,
  },
  timeout: 10000,
});

// Intercepteur pour ajouter le token d'authentification s'il existe
apiClient.interceptors.request.use(
  async (config) => {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur pour gérer les erreurs globales
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      console.log('🔒 Session expirée (401). Nettoyage du token...');
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        await AsyncStorage.multiRemove(['userToken', 'userData']);
      } catch (e) {
        console.error('Erreur lors du nettoyage d AsyncStorage 401:', e);
      }
    }
    return Promise.reject(error);
  }
);
