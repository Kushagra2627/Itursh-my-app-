import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    ActivityIndicator,
    Alert,
    RefreshControl,
    TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import apiClient from '../../lib/axios';

const VIOLET = '#6A0DAD';
const VIOLET_DARK = '#4B0082';

type Booking = {
    id: string;
    tenantName: string;
    tenantEmail: string;
    phone?: string;
    peopleCount?: number;
    notes?: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'BOOKED';
    createdAt: string;
    property: {
        id: string;
        title: string;
        location: string;
    };
};

const STATUS_CONFIG: Record<
    Booking['status'],
    { label: string; bg: string; text: string }
> = {
    PENDING: { label: 'PENDING', bg: '#FFF9C4', text: '#F57F17' },
    APPROVED: { label: 'APPROVED', bg: '#E8F5E9', text: '#2E7D32' },
    BOOKED: { label: 'BOOKED', bg: '#E3F2FD', text: '#1565C0' },
    REJECTED: { label: 'REJECTED', bg: '#FFEBEE', text: '#C62828' },
};

export default function Bookings() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

    const fetchBookings = useCallback(async () => {
        try {
            const res = await apiClient.get('/api/admin/bookings');
            setBookings(res.data.bookings || []);
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to fetch bookings.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    const handleApprove = async (id: string) => {
        try {
            await apiClient.patch(`/api/admin/bookings/${id}/approve`);
            Alert.alert('Success', 'Booking approved successfully!');
            fetchBookings();
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to approve booking.');
        }
    };

    const handleReject = async (id: string) => {
        try {
            await apiClient.patch(`/api/admin/bookings/${id}/reject`);
            Alert.alert('Success', 'Booking rejected successfully!');
            fetchBookings();
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to reject booking.');
        }
    };

    const handleBooked = async (id: string) => {
        try {
            await apiClient.patch(`/api/admin/bookings/${id}/booked`);
            Alert.alert('Success', 'Payment confirmed, property firmly booked!');
            fetchBookings();
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to mark as booked.');
        }
    };

    useFocusEffect(
        useCallback(() => {
            setLoading(true);
            fetchBookings();
        }, [fetchBookings])
    );

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={VIOLET} />
                <Text style={styles.loadingText}>Loading bookings...</Text>
            </View>
        );
    }

    const renderItem = ({ item }: { item: Booking }) => {
        const cfg = STATUS_CONFIG[item.status];
        const date = new Date(item.createdAt).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });

        return (
            <TouchableOpacity
                style={styles.card}
                activeOpacity={0.8}
                onPress={() => setSelectedBooking(item)}
            >
                {/* Status badge */}
                <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
                    <Text style={[styles.badgeText, { color: cfg.text }]}>{cfg.label}</Text>
                </View>

                {/* Property info */}
                <Text style={styles.propertyTitle} numberOfLines={1}>
                    🏠 {item.property?.title ?? 'Unknown Property'}
                </Text>
                <Text style={styles.location}>📍 {item.property?.location ?? '—'}</Text>

                {/* Divider */}
                <View style={styles.divider} />

                {/* Tenant info */}
                <Text style={styles.tenantLabel}>Tenant</Text>
                <Text style={styles.tenantName}>{item.tenantName}</Text>
                <Text style={styles.tenantEmail}>{item.tenantEmail}</Text>
                {item.phone && <Text style={styles.tenantPhone}>📞 {item.phone}</Text>}

                <Text style={styles.date}>📅 {date}</Text>

                {/* Actions for PENDING */}
                {item.status === 'PENDING' && (
                    <View style={styles.actionRow}>
                        <TouchableOpacity
                            style={[styles.actionBtn, styles.rejectBtn]}
                            onPress={(e) => { e.stopPropagation(); handleReject(item.id); }}
                        >
                            <Text style={styles.actionBtnText}>Reject</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.actionBtn, styles.approveBtn]}
                            onPress={(e) => { e.stopPropagation(); handleApprove(item.id); }}
                        >
                            <Text style={styles.actionBtnText}>Approve</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Actions for APPROVED */}
                {item.status === 'APPROVED' && (
                    <View style={styles.actionRow}>
                        <TouchableOpacity
                            style={[styles.actionBtn, styles.bookActionBtn]}
                            onPress={(e) => { e.stopPropagation(); handleBooked(item.id); }}
                        >
                            <Text style={styles.actionBtnText}>Mark as Booked</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.root}>
            <FlatList
                data={bookings}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => { setRefreshing(true); fetchBookings(); }}
                        colors={[VIOLET]}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Text style={styles.emptyIcon}>📋</Text>
                        <Text style={styles.emptyText}>No bookings yet</Text>
                        <Text style={styles.emptySubtext}>Bookings from tenants will appear here</Text>
                    </View>
                }
            />

            {/* --- Booking Detail Modal --- */}
            {selectedBooking && (
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Booking Details</Text>
                            <TouchableOpacity onPress={() => setSelectedBooking(null)}>
                                <Text style={styles.closeBtn}>Close</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalBody}>
                            <Text style={styles.modalSectionTitle}>Property</Text>
                            <Text style={styles.modalText}>Name: {selectedBooking.property.title}</Text>
                            <Text style={styles.modalText}>Location: {selectedBooking.property.location}</Text>

                            <View style={styles.divider} />

                            <Text style={styles.modalSectionTitle}>Tenant Information</Text>
                            <Text style={styles.modalText}>Name: {selectedBooking.tenantName}</Text>
                            <Text style={styles.modalText}>Email: {selectedBooking.tenantEmail}</Text>
                            <Text style={[styles.modalText, { fontWeight: 'bold' }]}>Phone: {selectedBooking.phone || 'N/A'}</Text>
                            <Text style={styles.modalText}>People Count: {selectedBooking.peopleCount || 1}</Text>

                            <View style={styles.divider} />

                            <Text style={styles.modalSectionTitle}>Additional Notes</Text>
                            <Text style={styles.modalText}>{selectedBooking.notes || 'No additional notes provided.'}</Text>
                        </View>

                        {selectedBooking.status === 'PENDING' && (
                            <View style={styles.modalActionRow}>
                                <TouchableOpacity
                                    style={[styles.actionBtn, styles.rejectBtn, { flex: 1 }]}
                                    onPress={() => {
                                        handleReject(selectedBooking.id);
                                        setSelectedBooking(null);
                                    }}
                                >
                                    <Text style={styles.actionBtnText}>Reject Booking</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.actionBtn, styles.approveBtn, { flex: 1, marginLeft: 12 }]}
                                    onPress={() => {
                                        handleApprove(selectedBooking.id);
                                        setSelectedBooking(null);
                                    }}
                                >
                                    <Text style={styles.actionBtnText}>Approve Booking</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {selectedBooking.status === 'APPROVED' && (
                            <View style={styles.modalActionRow}>
                                <TouchableOpacity
                                    style={[styles.actionBtn, styles.bookActionBtn, { flex: 1 }]}
                                    onPress={() => {
                                        handleBooked(selectedBooking.id);
                                        setSelectedBooking(null);
                                    }}
                                >
                                    <Text style={styles.actionBtnText}>Confirm Payment & Book</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>
            )}
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
        paddingVertical: 4,
        borderRadius: 20,
        marginBottom: 10,
    },
    badgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },

    propertyTitle: { fontSize: 16, fontWeight: '700', color: VIOLET_DARK, marginBottom: 4 },
    location: { fontSize: 13, color: '#666', marginBottom: 12 },

    divider: { height: 1, backgroundColor: '#F0EAF8', marginBottom: 12 },

    tenantLabel: { fontSize: 11, fontWeight: '600', color: '#AAA', textTransform: 'uppercase', marginBottom: 4 },
    tenantName: { fontSize: 15, fontWeight: '600', color: '#2D1B4E', marginBottom: 2 },
    tenantEmail: { fontSize: 13, color: '#666', marginBottom: 4 },
    tenantPhone: { fontSize: 13, color: '#444', fontWeight: '500', marginBottom: 8 },
    date: { fontSize: 12, color: '#999' },

    empty: { alignItems: 'center', paddingVertical: 60 },
    emptyIcon: { fontSize: 56, marginBottom: 16 },
    emptyText: { fontSize: 18, fontWeight: '700', color: VIOLET_DARK, marginBottom: 6 },
    emptySubtext: { fontSize: 14, color: '#888' },

    actionRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
        marginTop: 16,
    },
    actionBtn: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        minWidth: 90,
        alignItems: 'center',
    },
    approveBtn: { backgroundColor: '#2E7D32' },
    rejectBtn: { backgroundColor: '#C62828' },
    bookActionBtn: { backgroundColor: '#1976D2' },
    actionBtnText: { color: '#FFF', fontSize: 14, fontWeight: '600' },

    // Modal Styles
    modalOverlay: {
        position: 'absolute',
        top: 0, bottom: 0, left: 0, right: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalContent: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        width: '100%',
        padding: 24,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: VIOLET_DARK,
    },
    closeBtn: {
        fontSize: 16,
        color: VIOLET,
        fontWeight: '600',
    },
    modalBody: {
        marginBottom: 24,
    },
    modalSectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#444',
        marginBottom: 8,
        marginTop: 12,
    },
    modalText: {
        fontSize: 15,
        color: '#333',
        marginBottom: 6,
    },
    modalActionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    }
});
