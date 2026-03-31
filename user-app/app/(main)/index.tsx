import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
    View, Text, StyleSheet, Dimensions, FlatList, Image,
    TouchableOpacity, BackHandler, ToastAndroid, AppState,
    Platform, ScrollView, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { setStatusBarStyle, setStatusBarBackgroundColor } from 'expo-status-bar';
import * as NavigationBar from 'expo-navigation-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../../src/lib/axios';
import { useNotifications } from '../../src/hooks/useNotifications';
import { useAutoRefresh } from '../../src/hooks/useAutoRefresh';
import { Colors, Shadow, Radius, Spacing, getGreeting, getInitials } from '../../src/constants/theme';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.72;
const BACKEND_URL = (apiClient.defaults.baseURL || '').replace('/api', '');

type Property = {
    id: string;
    title: string;
    description: string;
    price: number;
    location: string;
    bedrooms: number;
    bathrooms: number;
    images: string[];
    isInProcess?: boolean;
    isBooked?: boolean;
};

const PROPERTY_GRADIENTS = [
    ['#1DADA8', '#0F6E6A'] as const,
    ['#2E6EDB', '#1A4BA8'] as const,
    ['#7C3AED', '#4C1D95'] as const,
    ['#D97706', '#92400E'] as const,
];

function SkeletonCard() {
    return (
        <View style={[styles.featuredCard, { marginRight: 16 }]}>
            <View style={styles.skeletonImage} />
            <View style={styles.skeletonContent}>
                <View style={[styles.skeletonLine, { width: '60%', height: 14 }]} />
                <View style={[styles.skeletonLine, { width: '40%', height: 11, marginTop: 6 }]} />
                <View style={[styles.skeletonLine, { width: '30%', height: 11, marginTop: 6 }]} />
            </View>
        </View>
    );
}

function SkeletonNearbyCard() {
    return (
        <View style={styles.nearbyCard}>
            <View style={[styles.skeletonImage, { width: 90, height: 90, borderRadius: 12 }]} />
            <View style={{ flex: 1, marginLeft: 14 }}>
                <View style={[styles.skeletonLine, { width: '70%', height: 14 }]} />
                <View style={[styles.skeletonLine, { width: '50%', height: 11, marginTop: 6 }]} />
                <View style={[styles.skeletonLine, { width: '35%', height: 11, marginTop: 6 }]} />
            </View>
        </View>
    );
}

export default function HomeScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [userInitials, setUserInitials] = useState('U');
    const { unreadCount } = useNotifications();

    const lastBackPressTime = useRef(0);

    // Status bar
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

    // Back press handler
    useFocusEffect(
        useCallback(() => {
            const handler = BackHandler.addEventListener('hardwareBackPress', () => {
                const now = Date.now();
                if (now - lastBackPressTime.current < 2000) {
                    BackHandler.exitApp();
                    return true;
                }
                lastBackPressTime.current = now;
                ToastAndroid.show('Press back again to exit', ToastAndroid.SHORT);
                return true;
            });
            return () => handler.remove();
        }, [])
    );

    // Load user initials
    useFocusEffect(
        useCallback(() => {
            AsyncStorage.getItem('userName').then(name => {
                if (name) setUserInitials(getInitials(name));
            });
        }, [])
    );

    const fetchProperties = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const res = await apiClient.get('/api/user/properties');
            setProperties(res.data.properties || []);
        } catch (error) {
            console.error('Fetch properties error', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(useCallback(() => { fetchProperties(); }, [fetchProperties]));
    useAutoRefresh(() => fetchProperties(true), 10000);

    const appState = useRef(AppState.currentState);
    useEffect(() => {
        const sub = AppState.addEventListener('change', (nextState) => {
            if (appState.current.match(/inactive|background/) && nextState === 'active') {
                fetchProperties(true);
            }
            appState.current = nextState;
        });
        return () => sub.remove();
    }, [fetchProperties]);

    const featuredProperties = properties.slice(0, 5);
    const nearbyProperties = properties.slice(5);

    const getImageUri = (img: string) =>
        `${BACKEND_URL}/${img.replace(/^\/+/, '')}`;

    const renderFeaturedCard = ({ item, index }: { item: Property; index: number }) => {
        const gradientColors = PROPERTY_GRADIENTS[index % PROPERTY_GRADIENTS.length];
        const hasImage = item.images && item.images.length > 0;
        const status = item.isBooked
            ? 'Booked'
            : item.isInProcess
            ? 'In Process'
            : 'Available';

        return (
            <TouchableOpacity
                style={styles.featuredCard}
                activeOpacity={0.92}
                onPress={() => router.push(`/(main)/property/${item.id}` as any)}
            >
                <View style={styles.featuredImageContainer}>
                    {hasImage ? (
                        <Image
                            source={{ uri: getImageUri(item.images[0]) }}
                            style={styles.featuredImage}
                            defaultSource={require('../../assets/images/icon.png')}
                        />
                    ) : (
                        <LinearGradient colors={gradientColors} style={styles.featuredImage}>
                            <Ionicons name="home" size={40} color="rgba(255,255,255,0.5)" />
                        </LinearGradient>
                    )}
                    {/* Availability Badge */}
                    <View style={[
                        styles.availBadge,
                        item.isInProcess || item.isBooked
                            ? { backgroundColor: Colors.bgDark }
                            : { backgroundColor: Colors.primary }
                    ]}>
                        <Text style={styles.availBadgeText}>{status}</Text>
                    </View>
                    {/* Heart */}
                    <TouchableOpacity style={styles.heartBtn}>
                        <Ionicons name="heart-outline" size={18} color="#fff" />
                    </TouchableOpacity>
                </View>
                <View style={styles.featuredContent}>
                    <Text style={styles.featuredTitle} numberOfLines={1}>{item.title}</Text>
                    <View style={styles.featuredRow}>
                        <Ionicons name="location-outline" size={12} color={Colors.textMuted} />
                        <Text style={styles.featuredLocation} numberOfLines={1}>{item.location}</Text>
                    </View>
                    <Text style={styles.featuredPrice}>
                        ₹{item.price.toLocaleString()}
                        <Text style={styles.featuredPriceSuffix}>/mo</Text>
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    const renderNearbyCard = ({ item, index }: { item: Property; index: number }) => {
        const gradientColors = PROPERTY_GRADIENTS[index % PROPERTY_GRADIENTS.length];
        const hasImage = item.images && item.images.length > 0;

        return (
            <TouchableOpacity
                style={styles.nearbyCard}
                activeOpacity={0.9}
                onPress={() => router.push(`/(main)/property/${item.id}` as any)}
            >
                <View style={styles.nearbyThumb}>
                    {hasImage ? (
                        <Image
                            source={{ uri: getImageUri(item.images[0]) }}
                            style={StyleSheet.absoluteFillObject}
                            resizeMode="cover"
                            defaultSource={require('../../assets/images/icon.png')}
                        />
                    ) : (
                        <LinearGradient colors={gradientColors} style={StyleSheet.absoluteFillObject}>
                            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                                <Ionicons name="home" size={28} color="rgba(255,255,255,0.6)" />
                            </View>
                        </LinearGradient>
                    )}
                    {/* Status dot */}
                    <View style={[
                        styles.nearbyStatusDot,
                        { backgroundColor: item.isInProcess || item.isBooked ? Colors.bgSoft : Colors.primary }
                    ]} />
                </View>
                <View style={styles.nearbyContent}>
                    <Text style={styles.nearbyTitle} numberOfLines={1}>{item.title}</Text>
                    <View style={styles.rowGap4}>
                        <Ionicons name="location-outline" size={12} color={Colors.textMuted} />
                        <Text style={styles.nearbyLocation} numberOfLines={1}>{item.location}</Text>
                    </View>
                    <View style={[styles.rowGap4, { marginTop: 4 }]}>
                        <View style={styles.nearbyBadge}>
                            <Ionicons name="bed-outline" size={11} color={Colors.primaryDark} />
                            <Text style={styles.nearbyBadgeText}>{item.bedrooms} BHK</Text>
                        </View>
                        <View style={styles.nearbyBadge}>
                            <Ionicons name="water-outline" size={11} color={Colors.primaryDark} />
                            <Text style={styles.nearbyBadgeText}>{item.bathrooms} Bath</Text>
                        </View>
                    </View>
                    <Text style={styles.nearbyPrice}>₹{item.price.toLocaleString()}<Text style={styles.nearbyPriceSuffix}>/mo</Text></Text>
                </View>
                <TouchableOpacity
                    style={styles.nearbyBookBtn}
                    onPress={() => router.push(`/(main)/book/${item.id}` as any)}
                    disabled={item.isInProcess || item.isBooked}
                >
                    <Ionicons
                        name={item.isInProcess || item.isBooked ? 'time-outline' : 'arrow-forward'}
                        size={18}
                        color={item.isInProcess || item.isBooked ? Colors.textMuted : Colors.primary}
                    />
                </TouchableOpacity>
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.container, { paddingBottom: 0 }]}>
            {/* ─── STATUS BAR ZONE ─── */}
            <View style={[styles.statusBarZone, { height: insets.top }]} />
            {/* ─── HEADER ─── */}
            <View style={styles.header}>
                {/* Teal radial glow top-right */}
                <View style={styles.headerGlow} pointerEvents="none" />

                <View style={styles.headerRow}>
                    {/* Logo */}
                    <View style={styles.logoContainer}>
                        <LinearGradient
                            colors={[Colors.primary, Colors.primaryDark]}
                            style={styles.logoBubble}
                        >
                            <Ionicons name="home" size={18} color="#fff" />
                        </LinearGradient>
                        <Text style={styles.logoText}>iTURSH</Text>
                    </View>

                    {/* Right actions */}
                    <View style={styles.headerActions}>
                        {/* Bell */}
                        <TouchableOpacity
                            style={styles.headerIconBtn}
                            onPress={() => router.push('/(main)/notifications' as any)}
                        >
                            <Ionicons name="notifications-outline" size={22} color="#fff" />
                            {unreadCount > 0 && (
                                <View style={styles.notifBadge}>
                                    <Text style={styles.notifBadgeText}>
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>

                        {/* Avatar */}
                        <TouchableOpacity
                            onPress={() => router.push('/(main)/profile' as any)}
                        >
                            <LinearGradient
                                colors={[Colors.primary, Colors.primaryDark]}
                                style={styles.avatarCircle}
                            >
                                <Text style={styles.avatarText}>{userInitials}</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Greeting */}
                <View style={styles.greetingContainer}>
                    <Text style={styles.greetingText}>{getGreeting()} 👋</Text>
                    <Text style={styles.greetingTitle}>Find Your Home</Text>
                    <Text style={styles.greetingSubtitle}>
                        {loading ? 'Loading...' : `${properties.length} properties available`}
                    </Text>
                </View>
            </View>

            {/* ─── BODY ─── */}
            <ScrollView
                style={styles.body}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 24 }}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => { setRefreshing(true); fetchProperties(true); }}
                        colors={[Colors.primary]}
                        tintColor={Colors.primary}
                    />
                }
            >
                {/* Featured */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Featured Properties</Text>
                    <TouchableOpacity onPress={() => router.push('/(main)/explore' as any)}>
                        <Text style={styles.sectionSeeAll}>See all</Text>
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featuredList}>
                        {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
                    </ScrollView>
                ) : featuredProperties.length === 0 ? (
                    <View style={styles.emptyBox}>
                        <Ionicons name="home-outline" size={36} color={Colors.textMuted} />
                        <Text style={styles.emptyText}>No properties found</Text>
                    </View>
                ) : (
                    <FlatList
                        data={featuredProperties}
                        renderItem={renderFeaturedCard}
                        keyExtractor={item => item.id}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.featuredList}
                        ItemSeparatorComponent={() => <View style={{ width: 16 }} />}
                        scrollEventThrottle={16}
                    />
                )}

                {/* Nearby */}
                {nearbyProperties.length > 0 && (
                    <>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>More Properties</Text>
                        </View>

                        {loading ? (
                            [1, 2, 3].map(i => <SkeletonNearbyCard key={i} />)
                        ) : (
                            nearbyProperties.map((item, index) => (
                                <View key={item.id} style={{ paddingHorizontal: Spacing.xl }}>
                                    {renderNearbyCard({ item, index })}
                                </View>
                            ))
                        )}
                    </>
                )}

                {!loading && properties.length === 0 && (
                    <View style={styles.emptyFull}>
                        <Ionicons name="search-outline" size={52} color={Colors.textMuted} />
                        <Text style={styles.emptyTitle}>No Properties Found</Text>
                        <Text style={styles.emptySubtitle}>Try a different filter</Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.bgScreen,
    },
    statusBarZone: {
        backgroundColor: Colors.bgDark,
        borderBottomWidth: 1.5,
        borderBottomColor: Colors.primary,
    },
    // ─── HEADER ───
    header: {
        backgroundColor: Colors.bgDark,
        paddingBottom: 0,
        overflow: 'hidden',
    },
    headerGlow: {
        position: 'absolute',
        top: -40,
        right: -40,
        width: 160,
        height: 160,
        borderRadius: 80,
        backgroundColor: Colors.primary,
        opacity: 0.12,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.md,
        paddingBottom: Spacing.md,
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    logoBubble: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoText: {
        fontSize: 20,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: 1.5,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    headerIconBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    notifBadge: {
        position: 'absolute',
        top: -2,
        right: -2,
        backgroundColor: Colors.accentBlue,
        minWidth: 17,
        height: 17,
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 3,
        borderWidth: 1.5,
        borderColor: Colors.bgDark,
    },
    notifBadgeText: {
        color: '#fff',
        fontSize: 9,
        fontWeight: '800',
    },
    avatarCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    greetingContainer: {
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing.md,
    },
    greetingText: {
        fontSize: 14,
        color: Colors.primaryMid,
        fontWeight: '500',
        marginBottom: 2,
    },
    greetingTitle: {
        fontSize: 26,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: 0.3,
    },
    greetingSubtitle: {
        fontSize: 13,
        color: Colors.textMuted,
        marginTop: 3,
    },
    chipsContainer: {
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing.lg,
        paddingTop: 4,
        gap: 8,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: Radius.pill,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    chipActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    chipText: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.textMuted,
    },
    chipTextActive: {
        color: '#fff',
    },
    // ─── BODY ───
    body: {
        flex: 1,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.xl,
        paddingBottom: Spacing.md,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.textPrimary,
        letterSpacing: 0.2,
    },
    sectionSeeAll: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.primary,
    },
    featuredList: {
        paddingLeft: Spacing.xl,
        paddingRight: Spacing.md,
    },
    // ─── FEATURED CARD ───
    featuredCard: {
        width: CARD_WIDTH,
        backgroundColor: Colors.white,
        borderRadius: Radius.xl,
        overflow: 'hidden',
        ...Shadow.card,
    },
    featuredImageContainer: {
        width: '100%',
        height: 160,
        position: 'relative',
        backgroundColor: Colors.primaryLight,
    },
    featuredImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
        justifyContent: 'center',
        alignItems: 'center',
    },
    availBadge: {
        position: 'absolute',
        top: 10,
        left: 10,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: Radius.pill,
    },
    availBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    heartBtn: {
        position: 'absolute',
        top: 10,
        right: 10,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(0,0,0,0.35)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    featuredContent: {
        padding: 14,
    },
    featuredTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.textPrimary,
        marginBottom: 4,
    },
    featuredRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        marginBottom: 6,
    },
    featuredLocation: {
        fontSize: 12,
        color: Colors.textMuted,
        flex: 1,
    },
    featuredPrice: {
        fontSize: 17,
        fontWeight: '800',
        color: Colors.primary,
    },
    featuredPriceSuffix: {
        fontSize: 12,
        fontWeight: '500',
        color: Colors.textMuted,
    },
    // ─── NEARBY CARD ───
    nearbyCard: {
        flexDirection: 'row',
        backgroundColor: Colors.white,
        borderRadius: Radius.lg,
        padding: 14,
        marginBottom: 12,
        alignItems: 'center',
        ...Shadow.card,
    },
    nearbyThumb: {
        width: 90,
        height: 90,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: Colors.primaryLight,
        position: 'relative',
    },
    nearbyStatusDot: {
        position: 'absolute',
        bottom: 6,
        right: 6,
        width: 10,
        height: 10,
        borderRadius: 5,
        borderWidth: 1.5,
        borderColor: '#fff',
    },
    nearbyContent: {
        flex: 1,
        marginLeft: 14,
    },
    rowGap4: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    nearbyTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.textPrimary,
        marginBottom: 4,
    },
    nearbyLocation: {
        fontSize: 12,
        color: Colors.textMuted,
        flex: 1,
    },
    nearbyBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        backgroundColor: Colors.primaryLight,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: Radius.pill,
    },
    nearbyBadgeText: {
        fontSize: 10,
        color: Colors.primaryDark,
        fontWeight: '600',
    },
    nearbyPrice: {
        fontSize: 15,
        fontWeight: '800',
        color: Colors.primary,
        marginTop: 6,
    },
    nearbyPriceSuffix: {
        fontSize: 11,
        fontWeight: '500',
        color: Colors.textMuted,
    },
    nearbyBookBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    // ─── SKELETON ───
    skeletonImage: {
        width: '100%',
        height: 160,
        backgroundColor: '#E0EDED',
    },
    skeletonContent: {
        padding: 14,
    },
    skeletonLine: {
        backgroundColor: '#E0EDED',
        borderRadius: 4,
    },
    // ─── EMPTY ───
    emptyBox: {
        alignItems: 'center',
        paddingVertical: 24,
    },
    emptyText: {
        fontSize: 14,
        color: Colors.textMuted,
        marginTop: 8,
    },
    emptyFull: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.textPrimary,
        marginTop: 16,
    },
    emptySubtitle: {
        fontSize: 14,
        color: Colors.textMuted,
        marginTop: 4,
    },
});