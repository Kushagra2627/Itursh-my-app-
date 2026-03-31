import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View, Text, StyleSheet, FlatList, Image,
    RefreshControl, AppState, Platform, TouchableOpacity, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { setStatusBarStyle, setStatusBarBackgroundColor } from 'expo-status-bar';
import * as NavigationBar from 'expo-navigation-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../../src/lib/axios';
import { useAutoRefresh } from '../../src/hooks/useAutoRefresh';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Colors, Shadow, Radius, Spacing } from '../../src/constants/theme';

const BACKEND_URL = (apiClient.defaults.baseURL || '').replace('/api', '');

type BookingStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'BOOKED' | 'CANCELLED';

type Booking = {
    id: string;
    status: BookingStatus;
    tenantName: string;
    createdAt: string;
    property: {
        title: string;
        location: string;
        price: number;
        images: string[];
    };
};

// ─── Progress Tracker Config ───────────────────────────────────────────────────
// The 4 milestones in the normal flow
const STEPS = [
    { key: 'REQUESTED', label: 'Requested', icon: 'document-text-outline' },
    { key: 'PENDING',   label: 'Under Review', icon: 'time-outline' },
    { key: 'APPROVED',  label: 'Approved', icon: 'checkmark-circle-outline' },
    { key: 'BOOKED',    label: 'Booked', icon: 'home-outline' },
] as const;

/** Returns how many steps are "done" for a given status */
function getStepIndex(status: BookingStatus): number {
    switch (status) {
        case 'PENDING':   return 1; // step 0 done, on step 1
        case 'APPROVED':  return 2;
        case 'BOOKED':    return 3;
        default:          return 0; // REQUESTED / initial
    }
}

const isCancelled = (status: BookingStatus) =>
    status === 'REJECTED' || status === 'CANCELLED';

// ─── Journey Tracker ───────────────────────────────────────────────────────────
function BookingTracker({ status }: { status: BookingStatus }) {
    const cancelled = isCancelled(status);
    const activeIdx = getStepIndex(status);

    return (
        <View style={tracker.wrapper}>
            {STEPS.map((step, idx) => {
                const done    = idx < activeIdx;
                const active  = idx === activeIdx && !cancelled;
                const isLast  = idx === STEPS.length - 1;

                const nodeColor = cancelled
                    ? idx <= activeIdx ? '#EF4444' : Colors.border
                    : done || active  ? Colors.primary : Colors.border;

                const lineColor = cancelled
                    ? idx < activeIdx ? '#EF4444' : Colors.border
                    : done ? Colors.primary : Colors.border;

                const labelColor = cancelled
                    ? idx <= activeIdx ? '#EF4444' : Colors.textMuted
                    : done || active   ? Colors.primary : Colors.textMuted;

                return (
                    <View key={step.key} style={tracker.stepRow}>
                        {/* Node */}
                        <View style={tracker.nodeCol}>
                            <View style={[
                                tracker.node,
                                { borderColor: nodeColor },
                                (done || active) && !cancelled && { backgroundColor: Colors.primary },
                                cancelled && idx <= activeIdx && { borderColor: '#EF4444', backgroundColor: '#FEE2E2' },
                            ]}>
                                <Ionicons
                                    name={
                                        cancelled && idx === activeIdx
                                            ? 'close-circle-outline'
                                            : done && !cancelled
                                            ? 'checkmark'
                                            : step.icon as any
                                    }
                                    size={12}
                                    color={
                                        cancelled && idx <= activeIdx
                                            ? '#EF4444'
                                            : done || active
                                            ? '#fff'
                                            : Colors.textMuted
                                    }
                                />
                            </View>
                            {/* Connector line */}
                            {!isLast && (
                                <View style={[tracker.line, { backgroundColor: lineColor }]} />
                            )}
                        </View>

                        {/* Label */}
                        <Text
                            style={[
                                tracker.label,
                                { color: labelColor },
                                (done || active) && !cancelled && { fontWeight: '700' },
                                cancelled && idx <= activeIdx && { color: '#EF4444', fontWeight: '600' },
                            ]}
                            numberOfLines={1}
                        >
                            {step.label}
                        </Text>
                    </View>
                );
            })}

            {/* Cancelled pill overlay */}
            {cancelled && (
                <View style={tracker.cancelledPill}>
                    <Ionicons name="ban-outline" size={11} color="#EF4444" />
                    <Text style={tracker.cancelledText}>
                        {status === 'REJECTED' ? 'Rejected' : 'Cancelled'}
                    </Text>
                </View>
            )}
        </View>
    );
}

// ─── Skeleton ──────────────────────────────────────────────────────────────────
function SkeletonBooking() {
    return (
        <View style={styles.card}>
            <View style={styles.cardRow}>
                <View style={[styles.cardThumb, { backgroundColor: '#E0EDED' }]} />
                <View style={{ flex: 1, marginLeft: 14 }}>
                    <View style={styles.skelLine} />
                    <View style={[styles.skelLine, { width: '55%', marginTop: 8 }]} />
                    <View style={[styles.skelLine, { width: '40%', marginTop: 8 }]} />
                </View>
            </View>
            {/* skeleton tracker */}
            <View style={{ flexDirection: 'row', marginTop: 14, gap: 0 }}>
                {[0, 1, 2, 3].map(i => (
                    <View key={i} style={{ flex: 1, alignItems: 'center' }}>
                        <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: '#E0EDED' }} />
                        <View style={{ height: 8, width: '60%', backgroundColor: '#E0EDED', borderRadius: 4, marginTop: 6 }} />
                    </View>
                ))}
            </View>
        </View>
    );
}

// ─── Screen ────────────────────────────────────────────────────────────────────
export default function BookingsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const queryClient = useQueryClient();

    useFocusEffect(
        useCallback(() => {
            setStatusBarStyle('light');
            setStatusBarBackgroundColor(Colors.bgDark, true);
            if (Platform.OS === 'android') {
                NavigationBar.setBackgroundColorAsync(Colors.bgDark);
                NavigationBar.setButtonStyleAsync('light');
            }
        }, [])
    );

    const { data: bookings = [], isLoading: loading, refetch, isRefetching } = useQuery({
        queryKey: ['bookings'],
        queryFn: async () => {
            const res = await apiClient.get('/api/user/my-bookings');
            return res.data.bookings as Booking[] || [];
        },
        staleTime: 1 * 60 * 1000,
        retry: (failureCount, error: any) => {
            if (error.response?.status === 401) {
                AsyncStorage.removeItem('userToken').then(() => {
                    queryClient.clear();
                    router.replace('/login' as any);
                });
                return false;
            }
            return failureCount < 3;
        }
    });

    // ─── Render booking card ───────────────────────────────────────────────────
    const renderBooking = ({ item, index }: { item: Booking; index: number }) => {
        const rawImage = item.property.images?.[0];
        const imageUri = rawImage ? `${BACKEND_URL}/${rawImage.replace(/^\/+/, '')}` : null;
        const cancelled = isCancelled(item.status);
        const dateStr = new Date(item.createdAt).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric',
        });

        return (
            <View style={[styles.card, cancelled && styles.cardCancelled]}>
                {/* ── Property row ── */}
                <View style={styles.cardRow}>
                    {/* Thumbnail */}
                    <View style={styles.cardThumb}>
                        {imageUri ? (
                            <Image
                                source={{ uri: imageUri }}
                                style={StyleSheet.absoluteFillObject}
                                resizeMode="cover"
                            />
                        ) : (
                            <View style={[StyleSheet.absoluteFillObject, styles.cardThumbFallback]}>
                                <Ionicons name="home-outline" size={22} color={Colors.primary} />
                            </View>
                        )}
                        {/* order number chip */}
                        <View style={styles.orderChip}>
                            <Text style={styles.orderChipText}>#{index + 1}</Text>
                        </View>
                    </View>

                    {/* Info */}
                    <View style={styles.cardInfo}>
                        <Text style={styles.cardTitle} numberOfLines={1}>
                            {item.property.title}
                        </Text>
                        <View style={styles.cardLocRow}>
                            <Ionicons name="location-outline" size={11} color={Colors.textMuted} />
                            <Text style={styles.cardLocation} numberOfLines={1}>
                                {item.property.location}
                            </Text>
                        </View>
                        <Text style={styles.cardPrice}>
                            ₹{item.property.price.toLocaleString()}
                            <Text style={styles.cardPriceSuffix}>/mo</Text>
                        </Text>
                        <Text style={styles.cardDate}>Requested {dateStr}</Text>
                    </View>
                </View>

                {/* ── Divider ── */}
                <View style={styles.divider} />

                {/* ── Amazon-style tracker ── */}
                <BookingTracker status={item.status} />
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {/* ─── Status bar zone ─── */}
            <View style={{ height: insets.top, backgroundColor: Colors.bgDark, borderBottomWidth: 1.5, borderBottomColor: Colors.primary }} />

            {/* ─── Header ─── */}
            <View style={styles.header}>
                <View style={styles.headerGlow} pointerEvents="none" />
                <View style={styles.headerRow}>
                    <View>
                        <Text style={styles.headerTitle}>My Bookings</Text>
                        <Text style={styles.headerSub}>
                            {loading ? 'Loading...' : `${bookings.length} booking${bookings.length !== 1 ? 's' : ''}`}
                        </Text>
                    </View>
                    <View style={styles.headerIcon}>
                        <Ionicons name="receipt-outline" size={22} color={Colors.primary} />
                    </View>
                </View>
            </View>

            {/* ─── List ─── */}
            {loading ? (
                <ScrollView contentContainerStyle={styles.listContent}>
                    {[1, 2, 3].map(i => <SkeletonBooking key={i} />)}
                </ScrollView>
            ) : bookings.length === 0 ? (
                <View style={styles.emptyBox}>
                    <Ionicons name="calendar-outline" size={64} color={Colors.textMuted} />
                    <Text style={styles.emptyTitle}>No bookings yet</Text>
                    <Text style={styles.emptySub}>
                        Browse properties and submit a booking request.
                    </Text>
                    <TouchableOpacity
                        style={styles.browseBtn}
                        onPress={() => router.push('/(main)' as any)}
                    >
                        <Text style={styles.browseBtnText}>Browse Properties</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={bookings}
                    keyExtractor={item => item.id}
                    renderItem={renderBooking}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefetching}
                            onRefresh={refetch}
                            colors={[Colors.primary]}
                            tintColor={Colors.primary}
                        />
                    }
                />
            )}
        </View>
    );
}

// ─── Tracker styles ────────────────────────────────────────────────────────────
const tracker = StyleSheet.create({
    wrapper: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginTop: 4,
        paddingHorizontal: 2,
        position: 'relative',
    },
    stepRow: {
        flex: 1,
        alignItems: 'center',
    },
    nodeCol: {
        alignItems: 'center',
        width: '100%',
        flexDirection: 'row',
    },
    node: {
        width: 26,
        height: 26,
        borderRadius: 13,
        borderWidth: 2,
        borderColor: Colors.border,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2,
    },
    line: {
        flex: 1,
        height: 2,
        backgroundColor: Colors.border,
        marginTop: 0,
    },
    label: {
        fontSize: 9,
        color: Colors.textMuted,
        marginTop: 5,
        textAlign: 'center',
        fontWeight: '500',
        paddingHorizontal: 2,
    },
    cancelledPill: {
        position: 'absolute',
        right: 0,
        top: -2,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        backgroundColor: '#FEE2E2',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 99,
    },
    cancelledText: {
        fontSize: 10,
        color: '#EF4444',
        fontWeight: '700',
    },
});

// ─── Screen styles ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.bgScreen,
    },
    // Header
    header: {
        backgroundColor: Colors.bgDark,
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.md,
        paddingBottom: Spacing.lg,
        overflow: 'hidden',
    },
    headerGlow: {
        position: 'absolute',
        top: -50,
        right: -50,
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: Colors.primary,
        opacity: 0.10,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: 0.3,
    },
    headerSub: {
        fontSize: 13,
        color: Colors.textMuted,
        marginTop: 3,
    },
    headerIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(29,173,168,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    // List
    listContent: {
        padding: Spacing.xl,
        paddingBottom: 100,
        gap: 16,
    },
    // Card
    card: {
        backgroundColor: '#fff',
        borderRadius: Radius.lg,
        padding: 14,
        ...Shadow.card,
    },
    cardCancelled: {
        opacity: 0.82,
        borderWidth: 1,
        borderColor: '#FECACA',
    },
    cardRow: {
        flexDirection: 'row',
        marginBottom: 4,
    },
    cardThumb: {
        width: 86,
        height: 86,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: Colors.primaryLight,
        position: 'relative',
    },
    cardThumbFallback: {
        backgroundColor: Colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    orderChip: {
        position: 'absolute',
        bottom: 4,
        left: 4,
        backgroundColor: 'rgba(0,0,0,0.55)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    orderChipText: {
        color: '#fff',
        fontSize: 9,
        fontWeight: '700',
    },
    cardInfo: {
        flex: 1,
        marginLeft: 14,
    },
    cardLocRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        marginTop: 3,
    },
    cardTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.textPrimary,
    },
    cardLocation: {
        fontSize: 11,
        color: Colors.textMuted,
        flex: 1,
    },
    cardPrice: {
        fontSize: 16,
        fontWeight: '800',
        color: Colors.primary,
        marginTop: 6,
    },
    cardPriceSuffix: {
        fontSize: 11,
        fontWeight: '500',
        color: Colors.textMuted,
    },
    cardDate: {
        fontSize: 10,
        color: Colors.textMuted,
        marginTop: 4,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.border,
        marginVertical: 12,
    },
    // Skeleton
    skelLine: {
        height: 13,
        width: '75%',
        backgroundColor: '#E0EDED',
        borderRadius: 4,
    },
    // Empty
    emptyBox: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.textPrimary,
        marginTop: 20,
        marginBottom: 8,
    },
    emptySub: {
        fontSize: 14,
        color: Colors.textMuted,
        textAlign: 'center',
        lineHeight: 20,
    },
    browseBtn: {
        marginTop: 20,
        backgroundColor: Colors.primary,
        paddingHorizontal: 28,
        paddingVertical: 14,
        borderRadius: Radius.lg,
    },
    browseBtnText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
    },
});
