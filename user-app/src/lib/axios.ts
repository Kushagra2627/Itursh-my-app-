import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// In Expo, localhost on an emulator maps to 10.0.2.2 (Android) or 127.0.0.1 (iOS).
// For physical devices, we must use the machine's local IP on the network.
// Based on previous conversation, the user's IP is 192.168.29.164.
const BASE_URL = 'https://itursh-my-app-3.onrender.com';

const apiClient = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to attach JWT token
apiClient.interceptors.request.use(
    async (config) => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            if (token && config.headers) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (error) {
            console.error('Error attaching token:', error);
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default apiClient;
