import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import * as NavigationBar from 'expo-navigation-bar';
import * as ExpoSplashScreen from 'expo-splash-screen';
import { Platform, View } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SplashScreenAnimated from '../components/SplashScreenAnimated';

// Prevent the native splash from auto-hiding — we control it manually
ExpoSplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

export default function RootLayout() {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const [showCustomSplash, setShowCustomSplash] = useState(true);
    const [appReady, setAppReady] = useState(false);

    useEffect(() => {
        prepare();
    }, []);

    const prepare = async () => {
        try {
            // Check auth token
            const token = await AsyncStorage.getItem('userToken');
            setIsAuthenticated(!!token);

            // Set up navigation bar
            if (Platform.OS === 'android') {
                NavigationBar.setBackgroundColorAsync('#1A1A2E');
                NavigationBar.setButtonStyleAsync('light');
            }
        } catch {
            setIsAuthenticated(false);
        } finally {
            // Hide native splash and mark app ready
            await ExpoSplashScreen.hideAsync();
            setAppReady(true);
        }
    };

    // Don't render anything until app is ready (fonts loaded, auth checked)
    if (!appReady || isAuthenticated === null) return null;

    return (
        <QueryClientProvider client={queryClient}>
            <View style={{ flex: 1, backgroundColor: '#1A1A2E' }}>
                <StatusBar style="light" backgroundColor="#1A1A2E" translucent={false} />
                <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="index" />
                    <Stack.Screen name="login" />
                    <Stack.Screen name="signup" />
                    <Stack.Screen name="(main)" />
                </Stack>

                {/* Show our custom animated splash as an overlay on top of the app */}
                {showCustomSplash && (
                    <SplashScreenAnimated onFinish={() => setShowCustomSplash(false)} />
                )}
            </View>
        </QueryClientProvider>
    );
}
