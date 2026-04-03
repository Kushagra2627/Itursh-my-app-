import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://13.127.164.104';

const apiClient = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 15000,
});

// Request interceptor: attach JWT token
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
    (error) => Promise.reject(error)
);

// Response interceptor: log errors, handle 401
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            try {
                await AsyncStorage.removeItem('userToken');
                // The individual screens handle navigation on 401
            } catch (e) {
                console.error('Error clearing token on 401:', e);
            }
        }
        console.error('--- API ERROR ---');
        console.error('URL:', error.config?.url);
        console.error('Status:', error.response?.status);
        console.error('Message:', error.message);
        console.error('Data:', JSON.stringify(error.response?.data));
        console.error('-----------------');
        return Promise.reject(error);
    }
);

export default apiClient;
