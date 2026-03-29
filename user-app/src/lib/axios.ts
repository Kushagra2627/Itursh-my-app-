import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// In Expo, localhost on an emulator maps to 10.0.2.2 (Android) or 127.0.0.1 (iOS).
// For physical devices, we must use the machine's local IP on the network.
// Based on previous conversation, the user's IP is 192.168.29.164.
const BASE_URL = 'http://51.20.251.206';

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

// Response interceptor for global error handling and logging
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('--- AXIOS ERROR ---');
        console.error('Message:', error.message);
        console.error('Status:', error.response?.status);
        console.error('Data:', JSON.stringify(error.response?.data));
        console.error('URL:', error.config?.url);
        console.error('-------------------');
        return Promise.reject(error);
    }
);

export default apiClient;
