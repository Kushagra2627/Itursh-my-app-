import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// ─── Change this to your local machine's IP when testing on a physical device ─
// For Android emulator use: 10.0.2.2
// For iOS simulator use: localhost
// For physical device use your machine's LAN IP (e.g. 192.168.1.7)
const BASE_URL = 'http://13.127.164.104';

const apiClient = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000,
});

// ─── Request interceptor: attach admin JWT ────────────────────────────────────
apiClient.interceptors.request.use(
    async (config) => {
        try {
            const token = await SecureStore.getItemAsync('admin_token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (err) {
            console.warn('Could not read token from SecureStore:', err);
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ─── Response interceptor: surface errors ─────────────────────────────────────
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('--- AXIOS ERROR ---');
        console.error('Message:', error.message);
        console.error('Status:', error.response?.status);
        console.error('Data:', JSON.stringify(error.response?.data));
        console.error('URL:', error.config?.url);
        console.error('-------------------');
        
        const message =
            error?.response?.data?.error || error?.message || 'An unknown error occurred';
        return Promise.reject(new Error(message));
    }
);

export default apiClient;
