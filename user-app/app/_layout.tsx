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
        // Global Bottom Navigation Bar for Android
        if (Platform.OS === 'android') {
            NavigationBar.setBackgroundColorAsync('#F1F5F1'); // Light gray-green to contrast slightly with #F9FBF9
            NavigationBar.setButtonStyleAsync('dark');
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

    if (isAuthenticated === null) return null; // loading screen

    return (
        <>
            {/* Global status bar: dark icons on light screens */}
            <StatusBar style="dark" backgroundColor="#E8F5E9" translucent={false} />
            <Stack screenOptions={{ headerShown: false }}>
                {/* Auth Screens */}
                <Stack.Screen name="index" />
                <Stack.Screen name="login" />
                <Stack.Screen name="signup" />

                {/* Main App Screens */}
                <Stack.Screen name="(main)" />
            </Stack>
        </>
    );
}
