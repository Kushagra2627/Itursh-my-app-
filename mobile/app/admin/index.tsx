import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
    StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

const VIOLET = '#6A0DAD';
const VIOLET_DARK = '#4B0082';
const VIOLET_LIGHT = '#F3EEFF';

type DashboardItem = {
    id: string;
    icon: string;
    label: string;
    description: string;
    route: string;
    accent: string;
};

const MENU_ITEMS: DashboardItem[] = [
    {
        id: 'add',
        icon: '➕',
        label: 'Add Property',
        description: 'List a new rental property',
        route: '/admin/add-property',
        accent: '#7B1FA2',
    },
    {
        id: 'manage',
        icon: '🏘️',
        label: 'Manage Properties',
        description: 'Edit, delete or mark as booked',
        route: '/admin/manage-properties',
        accent: '#6A0DAD',
    },
    {
        id: 'bookings',
        icon: '📋',
        label: 'View Bookings',
        description: 'See all tenant bookings',
        route: '/admin/bookings',
        accent: '#512DA8',
    },
    {
        id: 'analytics',
        icon: '📊',
        label: 'Analytics',
        description: 'Overview of platform stats',
        route: '/admin/analytics',
        accent: '#4527A0',
    },
];

export default function AdminDashboard() {
    const router = useRouter();

    const handleLogout = () => {
        Alert.alert('Logout', 'Are you sure you want to logout?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Logout',
                style: 'destructive',
                onPress: async () => {
                    await SecureStore.deleteItemAsync('admin_token');
                    router.replace('/admin/login');
                },
            },
        ]);
    };

    return (
        <View style={styles.root}>
            <StatusBar barStyle="light-content" backgroundColor={VIOLET_DARK} />

            {/* Hero Banner */}
            <View style={styles.heroBanner}>
                <Text style={styles.heroGreeting}>Welcome back, Admin 👋</Text>
                <Text style={styles.heroSubtitle}>What would you like to manage today?</Text>
            </View>

            <ScrollView
                contentContainerStyle={styles.scroll}
                showsVerticalScrollIndicator={false}
            >
                {/* Grid */}
                <View style={styles.grid}>
                    {MENU_ITEMS.map((item) => (
                        <TouchableOpacity
                            key={item.id}
                            style={[styles.card, { borderLeftColor: item.accent }]}
                            onPress={() => router.push(item.route as any)}
                            activeOpacity={0.82}
                        >
                            <Text style={styles.cardIcon}>{item.icon}</Text>
                            <Text style={styles.cardLabel}>{item.label}</Text>
                            <Text style={styles.cardDesc}>{item.description}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Logout */}
                <TouchableOpacity
                    style={styles.logoutBtn}
                    onPress={handleLogout}
                    activeOpacity={0.85}
                >
                    <Text style={styles.logoutText}>🚪  Logout</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: VIOLET_LIGHT },
    heroBanner: {
        backgroundColor: VIOLET,
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 32,
    },
    heroGreeting: { fontSize: 22, fontWeight: '800', color: '#fff' },
    heroSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.75)', marginTop: 4 },

    scroll: { padding: 20, paddingBottom: 40 },

    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 14,
        marginTop: -24,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: 20,
        width: '46%',
        borderLeftWidth: 4,
        shadowColor: '#6A0DAD',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    cardIcon: { fontSize: 30, marginBottom: 10 },
    cardLabel: { fontSize: 15, fontWeight: '700', color: '#2D1B4E', marginBottom: 4 },
    cardDesc: { fontSize: 12, color: '#888', lineHeight: 16 },

    logoutBtn: {
        marginTop: 28,
        borderWidth: 1.5,
        borderColor: '#E53935',
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
    },
    logoutText: { color: '#E53935', fontSize: 15, fontWeight: '700' },
});
