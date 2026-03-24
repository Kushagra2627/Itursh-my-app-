import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

export default function Index() {
    const router = useRouter();

    useEffect(() => {
        // Short delay to ensure the router is ready
        const checkAuth = async () => {
            try {
                const token = await SecureStore.getItemAsync('admin_token');
                if (token) {
                    router.replace('/admin');
                } else {
                    router.replace('/admin/login');
                }
            } catch (error) {
                console.error('Error checking auth:', error);
                router.replace('/admin/login');
            }
        };

        checkAuth();
    }, []);

    return (
        <View style={{ flex: 1, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#6A0DAD" />
        </View>
    );
}
