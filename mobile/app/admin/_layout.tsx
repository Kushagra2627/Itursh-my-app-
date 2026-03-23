import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { useRouter, useSegments } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { ActivityIndicator, View } from 'react-native';

const VIOLET = '#6A0DAD';

function AdminAuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const segments = useSegments();
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const token = await SecureStore.getItemAsync('admin_token');
                const inLoginPage = segments.includes('login');

                if (!token && !inLoginPage) {
                    router.replace('/admin/login');
                }
            } catch {
                router.replace('/admin/login');
            } finally {
                setChecking(false);
            }
        };
        checkAuth();
    }, []);

    if (checking) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: VIOLET }}>
                <ActivityIndicator color="#fff" size="large" />
            </View>
        );
    }

    return <>{children}</>;
}

export default function AdminLayout() {
    return (
        <AdminAuthGuard>
            <Stack
                screenOptions={{
                    headerStyle: { backgroundColor: VIOLET },
                    headerTintColor: '#fff',
                    headerTitleStyle: { fontWeight: '700', fontSize: 18 },
                    contentStyle: { backgroundColor: '#F5F0FF' },
                    headerBackTitle: 'Back',
                }}
            >
                <Stack.Screen name="login" options={{ headerShown: false }} />
                <Stack.Screen name="index" options={{ title: 'Admin Dashboard', headerLeft: () => null }} />
                <Stack.Screen name="add-property" options={{ title: 'Add Property' }} />
                <Stack.Screen name="edit-property/[id]" options={{ title: 'Edit Property' }} />
                <Stack.Screen name="manage-properties" options={{ title: 'Manage Properties' }} />
                <Stack.Screen name="bookings" options={{ title: 'All Bookings' }} />
                <Stack.Screen name="analytics" options={{ title: 'Analytics' }} />
            </Stack>
        </AdminAuthGuard>
    );
}
