import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export default function Index() {
    const [route, setRoute] = useState<string | null>(null);

    useEffect(() => {
        SecureStore.getItemAsync('admin_token').then(token => {
            setRoute(token ? '/admin' : '/admin/login');
        }).catch(() => {
            setRoute('/admin/login');
        });
    }, []);

    if (!route) {
        return (
            <View style={{ flex: 1, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#6A0DAD" />
            </View>
        );
    }

    return <Redirect href={route as any} />;
}