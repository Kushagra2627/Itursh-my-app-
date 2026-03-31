import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, Dimensions, ScrollView,
    TouchableOpacity, FlatList, Image, RefreshControl, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { setStatusBarStyle, setStatusBarBackgroundColor } from 'expo-status-bar';
import * as NavigationBar from 'expo-navigation-bar';
import { useFocusEffect, useRouter } from 'expo-router';
import apiClient from '../../src/lib/axios';
import { useAutoRefresh } from '../../src/hooks/useAutoRefresh';
import { Colors, Shadow, Radius, Spacing } from '../../src/constants/theme';

const { width } = Dimensions.get('window');
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
    createdAt?: string;
};



const PROPERTY_GRADIENTS: [string, string][] = [
    ['#1DADA8', '#0F6E6A'],
    ['#2E6EDB', '#1A4BA8'],
    ['#7C3AED', '#4C1D95'],
    ['#D97706', '#92400E'],
    ['#DB2777', '#881337'],
    ['#059669', '#065F46'],
];

// Decorative city map background (no SVG needed)
function CityMapBackground() {
    return (
        <View style={mapStyles.mapBg}>
            <View style={[mapStyles.road, { top: '25%', left: 0, right: 0, height: 2 }]} />
            <View style={[mapStyles.road, { top: '50%', left: 0, right: 0, height: 2 }]} />
            <View style={[mapStyles.road, { top: '72%', left: 0, right: 0, height: 2 }]} />
            <View style={[mapStyles.road, { left: '25%', top: 0, bottom: 0, width: 2 }]} />
            <View style={[mapStyles.road, { left: '55%', top: 0, bottom: 0, width: 2 }]} />
            <View style={[mapStyles.road, { left: '80%', top: 0, bottom: 0, width: 2 }]} />
            <View style={[mapStyles.block, { top: '10%', left: '5%', width: '17%', height: '12%' }]} />
            <View style={[mapStyles.block, { top: '10%', left: '30%', width: '20%', height: '12%' }]} />
            <View style={[mapStyles.block, { top: '10%', left: '60%', width: '17%', height: '12%' }]} />
            <View style={[mapStyles.block, { top: '30%', left: '5%', width: '17%', height: '18%' }]} />
            <View style={[mapStyles.block, { top: '30%', left: '30%', width: '20%', height: '18%' }]} />
            <View style={[mapStyles.block, { top: '30%', left: '60%', width: '17%', height: '10%' }]} />
            <View style={[mapStyles.block, { top: '44%', left: '60%', width: '17%', height: '5%' }]} />
            <View style={[mapStyles.block, { top: '54%', left: '5%', width: '17%', height: '10%' }]} />
            <View style={[mapStyles.block, { top: '54%', left: '30%', width: '20%', height: '15%' }]} />
            <View style={[mapStyles.block, { top: '54%', left: '60%', width: '17%', height: '15%' }]} />
            <View style={[mapStyles.block, { top: '76%', left: '5%', width: '17%', height: '15%' }]} />
            <View style={[mapStyles.block, { top: '76%', left: '30%', width: '20%', height: '15%' }]} />
            <View style={[mapStyles.block, { top: '76%', left: '60%', width: '30%', height: '15%' }]} />
        </View>
    );
}

// Spread bubble positions evenly across the map for up to N locations
const MAP_POSITIONS = [
    { top: '12%', left: '26%' },
    { top: '12%', left: '62%' },
    { top: '36%', left: '4%' },
    { top: '36%', left: '58%' },
    { top: '60%', left: '26%' },
    { top: '60%', left: '62%' },
    { top: '80%', left: '4%' },
    { top: '80%', left: '58%' },
];

function LocationBubble({
    location, count, selected, onPress, index, style,
}: {
    location: string; count: number; selected: boolean; onPress: () => void; index: number; style?: any;
}) {
    const gradientPair = PROPERTY_GRADIENTS[index % PROPERTY_GRADIENTS.length];
    return (
        <TouchableOpacity style={[mapStyles.bubbleTouch, style]} onPress={onPress} activeOpacity={0.8}>
            <LinearGradient
                colors={selected ? ['#fff', '#E1F7F6'] : gradientPair}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[mapStyles.bubble, selected && { borderWidth: 2, borderColor: Colors.primary }]}
            >
                <Text style={[mapStyles.bubbleText, selected && { color: Colors.primaryDark }]}>
                    {location.length > 12 ? location.slice(0, 12) + '…' : location}
                </Text>
                <View style={[mapStyles.bubbleCount, selected && { backgroundColor: Colors.primary }]}>
                    <Text style={mapStyles.bubbleCountText}>{count}</Text>
                </View>
            </LinearGradient>
        </TouchableOpacity>
    );
}

/**
 * Extract distinct location groups from the full properties list.
 * Each unique `location` string (trimmed, case-insensitive dedup) becomes its own group.
 */
function getLocationGroups(properties: Property[]): string[] {
    const seen = new Set<string>();
    const groups: string[] = [];
    for (const p of properties) {
        const loc = p.location?.trim();
        if (!loc) continue;
        const key = loc.toLowerCase();
        if (!seen.has(key)) {
            seen.add(key);
            groups.push(loc); // preserve original casing
        }
    }
    return groups.sort();
}

function propertiesForLocation(properties: Property[], location: string): Property[] {
    return properties.filter(p => p.location?.trim().toLowerCase() === location.toLowerCase());
}

export default function ExploreScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

    const scrollRef = React.useRef<ScrollView>(null);
    const locationSectionRefs = React.useRef<Record<string, number>>({});

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

    const fetchProperties = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const res = await apiClient.get('/api/user/properties');
            setProperties(res.data.properties || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(useCallback(() => { fetchProperties(); }, [fetchProperties]));
    useAutoRefresh(() => fetchProperties(true), 15000);


    const locationGroups = getLocationGroups(properties);

    const handleLocationTap = (location: string) => {
        const next = selectedLocation?.toLowerCase() === location.toLowerCase() ? null : location;
        setSelectedLocation(next);
        if (next) {
            const yOffset = locationSectionRefs.current[location.toLowerCase()];
            if (yOffset !== undefined) {
                setTimeout(() => scrollRef.current?.scrollTo({ y: yOffset, animated: true }), 120);
            }
        }
    };

    const getImageUri = (img: string) => `${BACKEND_URL}/${img.replace(/^\/+/, '')}`;

    // ─── Card renderers ───────────────────────────────────────────────────────

    const renderHorizCard = ({ item, index }: { item: Property; index: number }) => {
        const colors = PROPERTY_GRADIENTS[index % PROPERTY_GRADIENTS.length];
        const hasImage = item.images?.length > 0;
        return (
            <TouchableOpacity
                style={styles.horizCard}
                activeOpacity={0.9}
                onPress={() => router.push(`/(main)/property/${item.id}` as any)}
            >
                <View style={styles.horizImage}>
                    {hasImage ? (
                        <Image source={{ uri: getImageUri(item.images[0]) }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
                    ) : (
                        <LinearGradient colors={colors} style={StyleSheet.absoluteFillObject}>
                            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                                <Ionicons name="home" size={24} color="rgba(255,255,255,0.5)" />
                            </View>
                        </LinearGradient>
                    )}
                </View>
                <View style={styles.horizContent}>
                    <Text style={styles.gridTitle} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.gridLocation} numberOfLines={1}>{item.location}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 }}>
                        <View style={styles.bhkBadge}>
                            <Ionicons name="bed-outline" size={10} color={Colors.primaryDark} />
                            <Text style={styles.bhkText}>{item.bedrooms} BHK</Text>
                        </View>
                    </View>
                    <Text style={styles.gridPrice}>
                        ₹{item.price.toLocaleString('en-IN')}
                        <Text style={{ fontSize: 10, color: Colors.textMuted }}>/mo</Text>
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <View style={{ flex: 1, backgroundColor: Colors.bgScreen }}>
            {/* Status bar separator */}
            <View style={{ height: insets.top, backgroundColor: Colors.bgDark, borderBottomWidth: 1.5, borderBottomColor: Colors.primary }} />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerGlow} pointerEvents="none" />
                <View style={styles.headerRow}>
                    <View>
                        <Text style={styles.headerTitle}>Explore</Text>
                        <Text style={styles.headerSub}>
                            {locationGroups.length > 0
                                ? `${locationGroups.length} area${locationGroups.length !== 1 ? 's' : ''} · ${properties.length} listings`
                                : 'Browse all properties'}
                        </Text>
                    </View>

                </View>

                {/* Active location chip */}
                {selectedLocation && (
                    <View style={styles.filterRow}>
                        <TouchableOpacity
                            style={[styles.chip, styles.chipLocationActive]}
                            onPress={() => setSelectedLocation(null)}
                        >
                            <Ionicons name="location" size={12} color="#fff" />
                            <Text style={styles.chipTextActive}>{selectedLocation}</Text>
                            <Ionicons name="close-circle" size={13} color="rgba(255,255,255,0.8)" />
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            <ScrollView
                ref={scrollRef}
                style={{ flex: 1 }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => { setRefreshing(true); fetchProperties(true); }}
                        tintColor={Colors.primary}
                        colors={[Colors.primary]}
                    />
                }
            >
                {/* ── Map View */}
                <View style={styles.mapSection}>
                    <View style={styles.mapContainer}>
                        <CityMapBackground />
                        {/* Dynamic location bubbles from actual data */}
                        {locationGroups.slice(0, MAP_POSITIONS.length).map((location, index) => {
                            const pos = MAP_POSITIONS[index];
                            const count = propertiesForLocation(properties, location).length;
                            return (
                                <LocationBubble
                                    key={location}
                                    location={location}
                                    count={count}
                                    selected={selectedLocation?.toLowerCase() === location.toLowerCase()}
                                    onPress={() => handleLocationTap(location)}
                                    index={index}
                                    style={{ position: 'absolute', top: pos.top, left: pos.left }}
                                />
                            );
                        })}
                        {locationGroups.length === 0 && !loading && (
                            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>No areas to display yet</Text>
                            </View>
                        )}
                    </View>
                    <Text style={styles.mapHint}>Tap a location bubble to see its properties</Text>
                </View>



                {/* ── Browse by Location — always shown */}
                {locationGroups.length > 0 && (
                    <View style={styles.browseSection}>
                        <Text style={styles.sectionTitle}>Browse by Location</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.areaCardsRow}>
                            {locationGroups.map((location, index) => {
                                const count = propertiesForLocation(properties, location).length;
                                const colors = PROPERTY_GRADIENTS[index % PROPERTY_GRADIENTS.length];
                                const isSelected = selectedLocation?.toLowerCase() === location.toLowerCase();
                                return (
                                    <TouchableOpacity
                                        key={location}
                                        onPress={() => handleLocationTap(location)}
                                        activeOpacity={0.85}
                                    >
                                        <LinearGradient
                                            colors={isSelected ? [Colors.primary, Colors.primaryDark] : colors}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                            style={[styles.areaCard, isSelected && styles.areaCardActive]}
                                        >
                                            <Ionicons name="location" size={14} color="rgba(255,255,255,0.8)" />
                                            <Text style={styles.areaCardName}>{location}</Text>
                                            <Text style={styles.areaCardCount}>
                                                {count} {count === 1 ? 'property' : 'properties'}
                                            </Text>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>
                )}

                {/* ── Per-Location Property Rows */}
                {locationGroups.map((location, locIndex) => {
                    const locProps = propertiesForLocation(properties, location);
                    if (locProps.length === 0) return null;
                    const isSelected = selectedLocation?.toLowerCase() === location.toLowerCase();
                    return (
                        <View
                            key={location}
                            onLayout={e => {
                                locationSectionRefs.current[location.toLowerCase()] = e.nativeEvent.layout.y;
                            }}
                            style={isSelected ? styles.selectedSection : undefined}
                        >
                            <View style={styles.areaSectionHeader}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.sectionTitle}>
                                        {location}
                                    </Text>
                                    <Text style={styles.sectionSubtitle}>
                                        {locProps.length} {locProps.length === 1 ? 'property' : 'properties'} available
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    onPress={() => {
                                        setSelectedLocation(location);
                                    }}
                                >
                                    <Text style={styles.seeAll}>See all</Text>
                                </TouchableOpacity>
                            </View>
                            <FlatList
                                data={locProps.slice(0, 6)}
                                renderItem={({ item, index }) => renderHorizCard({ item, index: locIndex * 10 + index })}
                                keyExtractor={item => item.id}
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={{ paddingLeft: Spacing.xl, paddingRight: Spacing.md, paddingBottom: 4 }}
                                ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
                            />
                        </View>
                    );
                })}

                {/* Empty state when no properties at all */}
                {locationGroups.length === 0 && !loading && (
                    <View style={styles.emptyBox}>
                        <Ionicons name="location-outline" size={52} color={Colors.textMuted} />
                        <Text style={styles.emptyText}>No properties available yet</Text>
                        <Text style={{ color: Colors.textMuted, fontSize: 12, marginTop: 6, textAlign: 'center', paddingHorizontal: 20 }}>
                            Properties will appear here once the admin adds listings.
                        </Text>
                    </View>
                )}

                <View style={{ height: 32 }} />
            </ScrollView>
        </View>
    );
}

const mapStyles = StyleSheet.create({
    mapBg: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#0D1F2D',
    },
    road: {
        position: 'absolute',
        backgroundColor: 'rgba(29,173,168,0.15)',
    },
    block: {
        position: 'absolute',
        backgroundColor: 'rgba(29,173,168,0.06)',
        borderRadius: 4,
        borderWidth: 1,
        borderColor: 'rgba(29,173,168,0.08)',
    },
    bubbleTouch: { zIndex: 10 },
    bubble: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 9,
        paddingVertical: 5,
        borderRadius: 20,
        gap: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.35,
        shadowRadius: 4,
        elevation: 6,
    },
    bubbleText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '700',
    },
    bubbleCount: {
        backgroundColor: 'rgba(255,255,255,0.25)',
        paddingHorizontal: 5,
        paddingVertical: 1,
        borderRadius: 10,
    },
    bubbleCountText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '800',
    },
});

const styles = StyleSheet.create({
    header: {
        backgroundColor: Colors.bgDark,
        overflow: 'hidden',
    },
    headerGlow: {
        position: 'absolute',
        top: -40,
        right: -40,
        width: 130,
        height: 130,
        borderRadius: 65,
        backgroundColor: Colors.primary,
        opacity: 0.10,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.md,
        paddingBottom: Spacing.sm,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: 0.3,
    },
    headerSub: {
        fontSize: 12,
        color: Colors.textMuted,
        marginTop: 2,
    },
    togglePill: {
        flexDirection: 'row',
        backgroundColor: Colors.bgSoft,
        borderRadius: Radius.pill,
        padding: 3,
    },
    toggleBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: Radius.pill,
        gap: 4,
    },
    toggleBtnActive: {
        backgroundColor: Colors.primary,
    },
    toggleLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.textMuted,
    },
    filterRow: {
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing.md,
        paddingTop: 4,
        gap: 8,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 13,
        paddingVertical: 7,
        borderRadius: Radius.pill,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        gap: 5,
    },
    chipActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    chipLocationActive: {
        backgroundColor: Colors.primaryDark,
        borderColor: Colors.primaryMid,
    },
    chipText: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.textMuted,
    },
    chipTextActive: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    // Map
    mapSection: {
        paddingVertical: Spacing.xl,
    },
    mapContainer: {
        marginHorizontal: Spacing.xl,
        height: 280,
        borderRadius: Radius.xl,
        overflow: 'hidden',
        position: 'relative',
        ...Shadow.card,
    },
    mapHint: {
        textAlign: 'center',
        color: Colors.textMuted,
        fontSize: 12,
        marginTop: 10,
    },
    // Grid
    gridSection: {
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.xl,
    },
    resultRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 14,
    },
    resultCount: {
        fontSize: 14,
        color: Colors.textSecondary,
        fontWeight: '600',
    },
    filterBadge: {
        backgroundColor: Colors.primaryLight,
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: Radius.pill,
    },
    filterBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: Colors.primaryDark,
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    gridCard: {
        backgroundColor: Colors.white,
        borderRadius: Radius.lg,
        overflow: 'hidden',
        marginBottom: 12,
        ...Shadow.card,
    },
    gridImage: {
        height: 120,
        position: 'relative',
        backgroundColor: Colors.primaryLight,
    },
    gridBadge: {
        position: 'absolute',
        top: 8,
        left: 8,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: Radius.pill,
    },
    gridBadgeText: {
        color: '#fff',
        fontSize: 9,
        fontWeight: '700',
    },
    gridContent: {
        padding: 10,
    },
    gridTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.textPrimary,
        marginBottom: 3,
    },
    gridLocation: {
        fontSize: 11,
        color: Colors.textMuted,
        marginBottom: 4,
        flex: 1,
    },
    gridPrice: {
        fontSize: 14,
        fontWeight: '800',
        color: Colors.primary,
    },
    bhkBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        backgroundColor: Colors.primaryLight,
        paddingHorizontal: 7,
        paddingVertical: 2,
        borderRadius: Radius.pill,
    },
    bhkText: {
        fontSize: 10,
        fontWeight: '700',
        color: Colors.primaryDark,
    },
    // Horizontal card
    horizCard: {
        width: 160,
        backgroundColor: Colors.white,
        borderRadius: Radius.lg,
        overflow: 'hidden',
        ...Shadow.card,
    },
    horizImage: {
        height: 100,
        position: 'relative',
        backgroundColor: Colors.primaryLight,
        overflow: 'hidden',
    },
    horizContent: {
        padding: 10,
    },
    // Browse by Location
    browseSection: {
        paddingTop: Spacing.xl,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.textPrimary,
        paddingHorizontal: Spacing.xl,
        marginBottom: 2,
    },
    sectionSubtitle: {
        fontSize: 12,
        color: Colors.textMuted,
        paddingHorizontal: Spacing.xl,
        marginBottom: Spacing.md,
    },
    areaCardsRow: {
        paddingHorizontal: Spacing.xl,
        gap: 10,
        paddingBottom: Spacing.md,
        paddingTop: 4,
    },
    areaCard: {
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: Radius.lg,
        minWidth: 130,
        gap: 4,
    },
    areaCardActive: {
        borderWidth: 2.5,
        borderColor: '#fff',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 6,
    },
    areaCardName: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '700',
    },
    areaCardCount: {
        color: 'rgba(255,255,255,0.75)',
        fontSize: 11,
        fontWeight: '500',
    },
    areaSectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingRight: Spacing.xl,
        marginTop: Spacing.xl,
    },
    selectedSection: {
        borderLeftWidth: 3,
        borderLeftColor: Colors.primary,
        marginLeft: 4,
    },
    seeAll: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.primary,
        marginTop: 4,
    },
    emptyBox: {
        alignItems: 'center',
        paddingVertical: 40,
        paddingHorizontal: Spacing.xl,
    },
    emptyText: {
        fontSize: 15,
        color: Colors.textMuted,
        marginTop: 12,
        fontWeight: '500',
        textAlign: 'center',
    },
});
