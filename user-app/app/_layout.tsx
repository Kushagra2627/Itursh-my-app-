import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import * as NavigationBar from 'expo-navigation-bar';
import { Platform } from 'react-native';

export default function RootLayout() {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

    useEffect(() => {
        checkToken();
        if (Platform.OS === 'android') {
            NavigationBar.setBackgroundColorAsync('#1A1A2E');
            NavigationBar.setButtonStyleAsync('light');
        }
    }, []);

    const checkToken = async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            setIsAuthenticated(!!token);
        } catch {
            setIsAuthenticated(false);
        }
    };

    if (isAuthenticated === null) return null;

    return (
        <>
            <StatusBar style="light" backgroundColor="#1A1A2E" translucent={false} />
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="login" />
                <Stack.Screen name="signup" />
                <Stack.Screen name="(main)" />
            </Stack>
        </>
    );
}
