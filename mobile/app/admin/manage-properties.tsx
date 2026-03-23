import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import apiClient from '../../lib/axios';

const VIOLET = '#6A0DAD';
const VIOLET_DARK = '#4B0082';

type Property = {
    id: string;
    title: string;
    location: string;
    price: number;
    bedrooms: number;
    bathrooms: number;
    isBooked: boolean;
    createdAt: string;
};

export default function ManageProperties() {
    const router = useRouter();
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchProperties = useCallback(async () => {
        try {
            const res = await apiClient.get('/api/admin/properties');
            setProperties(res.data.properties || []);
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to fetch properties.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            setLoading(true);
            fetchProperties();
        }, [fetchProperties])
    );

    const handleDelete = (id: string, title: string) => {
        Alert.alert(
            'Delete Property',
            `Are you sure you want to delete "${title}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await apiClient.delete(`/api/admin/properties/${id}`);
                            setProperties((prev) => prev.filter((p) => p.id !== id));
                            Alert.alert('Deleted', 'Property has been removed.');
                        } catch (err: any) {
                            Alert.alert('Error', err.message || 'Failed to delete property.');
                        }
                    },
                },
            ]
        );
    };

    const handleMarkBooked = (id: string, title: string) => {
        Alert.alert(
            'Mark as Booked',
            `Mark "${title}" as booked?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Mark Booked',
                    onPress: async () => {
                        try {
                            await apiClient.patch(`/api/admin/properties/${id}/book`);
                            setProperties((prev) =>
                                prev.map((p) => (p.id === id ? { ...p, isBooked: true } : p))
                            );
                            Alert.alert('Updated', 'Property marked as booked.');
                        } catch (err: any) {
                            Alert.alert('Error', err.message || 'Failed to update property.');
                        }
                    },
                },
            ]
        );
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={VIOLET} />
                <Text style={styles.loadingText}>Loading properties...</Text>
            </View>
        );
    }

    const renderItem = ({ item }: { item: Property }) => (
        <View style={styles.card}>
            {/* Status badge */}
            <View style={[styles.badge, item.isBooked ? styles.badgeBooked : styles.badgeAvailable]}>
                <Text style={styles.badgeText}>{item.isBooked ? 'BOOKED' : 'AVAILABLE'}</Text>
            </View>

            <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.location}>📍 {item.location}</Text>

            <View style={styles.meta}>
                <Text style={styles.metaText}>💰 ₹{item.price.toLocaleString()}/mo</Text>
                <Text style={styles.metaText}>🛏 {item.bedrooms} bd  🚿 {item.bathrooms} ba</Text>
            </View>

            <View style={styles.actions}>
                <TouchableOpacity
                    style={styles.editBtn}
                    onPress={() => router.push(`/admin/edit-property/${item.id}` as any)}
                    activeOpacity={0.8}
                >
                    <Text style={styles.editBtnText}>✏️ Edit</Text>
                </TouchableOpacity>

                {!item.isBooked && (
                    <TouchableOpacity
                        style={styles.bookBtn}
                        onPress={() => handleMarkBooked(item.id, item.title)}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.bookBtnText}>📌 Book</Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDelete(item.id, item.title)}
                    activeOpacity={0.8}
                >
                    <Text style={styles.deleteBtnText}>🗑️ Delete</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.root}>
            <FlatList
                data={properties}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => { setRefreshing(true); fetchProperties(); }}
                        colors={[VIOLET]}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Text style={styles.emptyIcon}>🏘️</Text>
                        <Text style={styles.emptyText}>No properties found</Text>
                        <Text style={styles.emptySubtext}>Add your first property to get started</Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#F5F0FF' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F0FF' },
    loadingText: { marginTop: 12, color: VIOLET, fontSize: 14 },
    list: { padding: 16, paddingBottom: 32 },

    card: {
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: 16,
        marginBottom: 14,
        shadowColor: VIOLET,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    badge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 20,
        marginBottom: 8,
    },
    badgeBooked: { backgroundColor: '#FF8F00' },
    badgeAvailable: { backgroundColor: '#2E7D32' },
    badgeText: { color: '#fff', fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },

    title: { fontSize: 16, fontWeight: '700', color: VIOLET_DARK, marginBottom: 4 },
    location: { fontSize: 13, color: '#666', marginBottom: 8 },
    meta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
    metaText: { fontSize: 13, color: '#555' },

    actions: { flexDirection: 'row', gap: 8 },
    editBtn: {
        flex: 1,
        backgroundColor: '#EDE7F6',
        borderRadius: 8,
        paddingVertical: 9,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#C5B0E8',
    },
    editBtnText: { color: VIOLET_DARK, fontSize: 13, fontWeight: '600' },
    bookBtn: {
        flex: 1,
        backgroundColor: '#FFF3E0',
        borderRadius: 8,
        paddingVertical: 9,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FFB74D',
    },
    bookBtnText: { color: '#E65100', fontSize: 13, fontWeight: '600' },
    deleteBtn: {
        flex: 1,
        backgroundColor: '#FFEBEE',
        borderRadius: 8,
        paddingVertical: 9,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#EF9A9A',
    },
    deleteBtnText: { color: '#C62828', fontSize: 13, fontWeight: '600' },

    empty: { alignItems: 'center', paddingVertical: 60 },
    emptyIcon: { fontSize: 56, marginBottom: 16 },
    emptyText: { fontSize: 18, fontWeight: '700', color: VIOLET_DARK, marginBottom: 6 },
    emptySubtext: { fontSize: 14, color: '#888' },
});
