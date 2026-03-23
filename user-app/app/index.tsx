import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Index() {
    const router = useRouter();

    useEffect(() => {
        setTimeout(async () => {
            const token = await AsyncStorage.getItem('userToken');
            if (token) {
                router.replace('/(main)');
            } else {
                router.replace('/login');
            }
        }, 500);
    }, []);

    return (
        <View style={{ flex: 1, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#4CAF50" />
        </View>
    );
}
