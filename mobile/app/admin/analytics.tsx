import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    Alert,
    TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import apiClient from '../../lib/axios';

const VIOLET = '#6A0DAD';
const VIOLET_DARK = '#4B0082';

type Analytics = {
    totalProperties: number;
    availableProperties: number;
    bookedProperties: number;
    totalBookings: number;
};

type StatCard = {
    icon: string;
    label: string;
    key: keyof Analytics;
    bg: string;
    iconBg: string;
    textColor: string;
};

const STAT_CARDS: StatCard[] = [
    {
        icon: '🏘️',
        label: 'Total Properties',
        key: 'totalProperties',
        bg: '#EDE7F6',
        iconBg: VIOLET,
        textColor: VIOLET_DARK,
    },
    {
        icon: '✅',
        label: 'Available',
        key: 'availableProperties',
        bg: '#E8F5E9',
        iconBg: '#2E7D32',
        textColor: '#1B5E20',
    },
    {
        icon: '🔒',
        label: 'Booked',
        key: 'bookedProperties',
        bg: '#FFF3E0',
        iconBg: '#E65100',
        textColor: '#BF360C',
    },
    {
        icon: '📋',
        label: 'Total Bookings',
        key: 'totalBookings',
        bg: '#E3F2FD',
        iconBg: '#1565C0',
        textColor: '#0D47A1',
    },
];

export default function Analytics() {
    const [data, setData] = useState<Analytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchAnalytics = useCallback(async () => {
        try {
            const res = await apiClient.get('/api/admin/analytics');
            setData(res.data.analytics);
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to fetch analytics.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            setLoading(true);
            fetchAnalytics();
        }, [fetchAnalytics])
    );

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={VIOLET} />
                <Text style={styles.loadingText}>Loading analytics...</Text>
            </View>
        );
    }

    const bookedPct =
        data && data.totalProperties > 0
            ? Math.round((data.bookedProperties / data.totalProperties) * 100)
            : 0;

    return (
        <ScrollView style={styles.root} contentContainerStyle={styles.scroll}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Platform Overview</Text>
                <Text style={styles.headerSubtitle}>Real-time stats from your database</Text>
            </View>

            {/* Stat Cards */}
            <View style={styles.grid}>
                {STAT_CARDS.map((card) => (
                    <View key={card.key} style={[styles.card, { backgroundColor: card.bg }]}>
                        <View style={[styles.iconCircle, { backgroundColor: card.iconBg }]}>
                            <Text style={styles.cardIcon}>{card.icon}</Text>
                        </View>
                        <Text style={[styles.cardValue, { color: card.textColor }]}>
                            {data ? data[card.key] : 0}
                        </Text>
                        <Text style={[styles.cardLabel, { color: card.textColor }]}>{card.label}</Text>
                    </View>
                ))}
            </View>

            {/* Occupancy Rate */}
            <View style={styles.occupancyCard}>
                <Text style={styles.occupancyTitle}>Occupancy Rate</Text>
                <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${bookedPct}%` }]} />
                </View>
                <Text style={styles.occupancyPct}>{bookedPct}% booked</Text>
                <Text style={styles.occupancyDetail}>
                    {data?.bookedProperties ?? 0} of {data?.totalProperties ?? 0} properties occupied
                </Text>
            </View>

            {/* Refresh */}
            <TouchableOpacity
                style={styles.refreshBtn}
                onPress={() => { setRefreshing(true); fetchAnalytics(); }}
                activeOpacity={0.8}
                disabled={refreshing}
            >
                {refreshing ? (
                    <ActivityIndicator color="#fff" size="small" />
                ) : (
                    <Text style={styles.refreshText}>🔄  Refresh Data</Text>
                )}
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#F5F0FF' },
    scroll: { padding: 20, paddingBottom: 40 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F0FF' },
    loadingText: { marginTop: 12, color: VIOLET, fontSize: 14 },

    header: { marginBottom: 24 },
    headerTitle: { fontSize: 22, fontWeight: '800', color: VIOLET_DARK },
    headerSubtitle: { fontSize: 13, color: '#888', marginTop: 4 },

    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 14,
        marginBottom: 20,
    },
    card: {
        width: '46%',
        borderRadius: 16,
        padding: 18,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 6,
        elevation: 3,
    },
    iconCircle: {
        width: 52,
        height: 52,
        borderRadius: 26,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    cardIcon: { fontSize: 24 },
    cardValue: { fontSize: 32, fontWeight: '800', marginBottom: 4 },
    cardLabel: { fontSize: 12, fontWeight: '600', textAlign: 'center' },

    occupancyCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        shadowColor: VIOLET,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    occupancyTitle: { fontSize: 16, fontWeight: '700', color: VIOLET_DARK, marginBottom: 14 },
    progressBar: {
        height: 12,
        backgroundColor: '#EDE7F6',
        borderRadius: 6,
        overflow: 'hidden',
        marginBottom: 8,
    },
    progressFill: {
        height: '100%',
        backgroundColor: VIOLET,
        borderRadius: 6,
    },
    occupancyPct: { fontSize: 24, fontWeight: '800', color: VIOLET_DARK, marginBottom: 4 },
    occupancyDetail: { fontSize: 13, color: '#888' },

    refreshBtn: {
        backgroundColor: VIOLET,
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
        shadowColor: VIOLET,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    refreshText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
