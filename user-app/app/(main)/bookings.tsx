import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Image, RefreshControl, AppState, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../../src/lib/axios';
import { useFocusEffect, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAutoRefresh } from '../../src/hooks/useAutoRefresh';
import { setStatusBarStyle, setStatusBarBackgroundColor } from 'expo-status-bar';
import * as NavigationBar from 'expo-navigation-bar';

const GREEN = '#4CAF50';
const GREEN_DARK = '#2E7D32';

const BACKEND_URL = (apiClient.defaults.baseURL || '').replace('/api', '');

type Booking = {
    id: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'BOOKED' | 'CANCELLED';
    tenantName: string;
    createdAt: string;
    property: {
        title: string;
        location: string;
        price: number;
        images: string[];
    };
};

export default function MyBookingsScreen() {
    const router = useRouter();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchBookings = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const res = await apiClient.get('/api/user/my-bookings');
            setBookings(res.data.bookings || []);
        } catch (error: any) {
            console.error('Fetch bookings error', error);
            if (error.response?.status === 401 || error.response?.status === 404) {
                await AsyncStorage.removeItem('userToken');
                router.replace('/login' as any);
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Refresh on screen focus
    // Set status bar and navigation bar when screen is focused
    useFocusEffect(
        useCallback(() => {
            fetchBookings();
            setStatusBarStyle('dark');
            setStatusBarBackgroundColor('#FFF', true);

            if (Platform.OS === 'android') {
                NavigationBar.setButtonStyleAsync('dark');
            }
        }, [])
    );

    // Poll every 5 seconds
    useAutoRefresh(() => fetchBookings(true), 5000);

    // Refresh when app comes from background
    const appState = useRef(AppState.currentState);
    useEffect(() => {
        const sub = AppState.addEventListener('change', (nextState) => {
            if (appState.current.match(/inactive|background/) && nextState === 'active') {
                fetchBookings(true);
            }
            appState.current = nextState;
        });
        return () => sub.remove();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchBookings(true);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'APPROVED': return '#4CAF50';
            case 'BOOKED': return '#2E7D32'; // darker green
            case 'REJECTED': return '#F44336';
            case 'CANCELLED': return '#9E9E9E'; // GREY
            default: return '#FF9800'; // PENDING
        }
    };

    const renderBooking = ({ item }: { item: Booking }) => {
        const imageUri = item.property.images?.[0]
            ? `${BACKEND_URL}${item.property.images[0]}`
            : null;

        return (
            <View style={styles.card}>
                <View style={styles.cardRow}>
                    {imageUri ? (
                        <Image
                            source={{ uri: imageUri }}
                            style={styles.image}
                            defaultSource={require('../../assets/images/icon.png')}
                        />
                    ) : (
                        <View style={[styles.image, styles.noImage]}>
                            <Ionicons name="home-outline" size={24} color="#CCC" />
                        </View>
                    )}

                    <View style={styles.content}>
                        <Text style={styles.title} numberOfLines={1}>{item.property.title}</Text>
                        <Text style={styles.location}>{item.property.location}</Text>
                        <Text style={styles.price}>₹ {item.property.price}/mo</Text>
                        <Text style={styles.date}>Booked on {new Date(item.createdAt).toLocaleDateString()}</Text>
                    </View>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.statusLabel}>Status:</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '15' }]}>
                        <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                            {item.status}
                        </Text>
                    </View>
                </View>
            </View>
        );
    };

    if (loading && bookings.length === 0) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={GREEN} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>My Bookings</Text>
            </View>

            {bookings.length === 0 ? (
                <View style={styles.center}>
                    <Ionicons name="calendar-outline" size={64} color="#CCC" />
                    <Text style={styles.noData}>You haven't made any bookings yet.</Text>
                </View>
            ) : (
                <FlatList
                    data={bookings}
                    keyExtractor={(item) => item.id}
                    renderItem={renderBooking}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={[GREEN]}
                            tintColor={GREEN}
                        />
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FBF9' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    headerTitle: { fontSize: 28, fontWeight: '800', color: GREEN_DARK },
    list: { padding: 20, paddingBottom: 100 },
    card: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    cardRow: { flexDirection: 'row', gap: 16, marginBottom: 16 },
    image: { width: 80, height: 80, borderRadius: 12, resizeMode: 'cover' },
    noImage: { backgroundColor: '#F0F0F0', justifyContent: 'center', alignItems: 'center' },
    content: { flex: 1, justifyContent: 'center' },
    title: { fontSize: 16, fontWeight: '700', color: '#111', marginBottom: 4 },
    location: { fontSize: 13, color: '#666', marginBottom: 6 },
    price: { fontSize: 15, fontWeight: '800', color: GREEN, marginBottom: 4 },
    date: { fontSize: 11, color: '#999' },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
        paddingTop: 12,
    },
    statusLabel: { fontSize: 13, fontWeight: '600', color: '#555' },
    statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    statusText: { fontSize: 12, fontWeight: '700' },
    noData: { marginTop: 16, color: '#999', fontSize: 16, fontWeight: '500' }
});
