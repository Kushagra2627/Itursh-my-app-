import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, FlatList, Image, TouchableOpacity, ActivityIndicator, Modal, TextInput, BackHandler, ToastAndroid, AppState, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import apiClient from '../../src/lib/axios';
import { SafeAreaView } from "react-native-safe-area-context";
import { useAutoRefresh } from '../../src/hooks/useAutoRefresh';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setStatusBarStyle, setStatusBarBackgroundColor } from 'expo-status-bar';
import * as NavigationBar from 'expo-navigation-bar';

const { width, height } = Dimensions.get('window');

const GREEN = '#4CAF50';
const GREEN_DARK = '#2E7D32';
const GREEN_LIGHT = '#E8F5E9';

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
};

export default function HomeScreen() {

    const router = useRouter();

    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filterModal, setFilterModal] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const [showHint, setShowHint] = useState(false);

    // Refresh spin animation
    const spinAnim = useRef(new Animated.Value(0)).current;

    // Swipe hint animations
    const hintOpacity = useRef(new Animated.Value(0)).current;
    const hintSlide = useRef(new Animated.Value(-20)).current;

    const startSpin = () => {
        spinAnim.setValue(0);
        Animated.timing(spinAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
        }).start();
    };

    const spin = spinAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    // Show swipe hint once per install
    useEffect(() => {
        AsyncStorage.getItem('swipeHintShown').then((val) => {
            if (!val) {
                setShowHint(true);
                Animated.parallel([
                    Animated.timing(hintOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
                    Animated.timing(hintSlide, { toValue: 0, duration: 500, useNativeDriver: true }),
                ]).start();
                setTimeout(() => {
                    Animated.timing(hintOpacity, { toValue: 0, duration: 600, useNativeDriver: true }).start(() => {
                        setShowHint(false);
                    });
                    AsyncStorage.setItem('swipeHintShown', 'true');
                }, 3500);
            }
        });
    }, []);

    const [maxPrice, setMaxPrice] = useState('');
    const [bhk, setBhk] = useState('');
    const [location, setLocation] = useState('');

    // Set status bar and navigation bar style when this tab is focused
    useFocusEffect(
        useCallback(() => {
            setStatusBarStyle('dark');
            setStatusBarBackgroundColor('#E8F5E9', true);
            // Android navigation bar
            if (Platform.OS === 'android') {
                NavigationBar.setBackgroundColorAsync('#F1F5F1');
                NavigationBar.setButtonStyleAsync('dark');
            }
        }, [])
    );

    const lastBackPressTime = React.useRef(0);

    useFocusEffect(
        React.useCallback(() => {
            const onBackPress = () => {
                if (filterModal) {
                    setFilterModal(false);
                    return true;
                }

                const now = Date.now();
                if (now - lastBackPressTime.current < 2000) {
                    BackHandler.exitApp();
                    return true;
                }
                lastBackPressTime.current = now;
                ToastAndroid.show("Press back again to exit", ToastAndroid.SHORT);
                return true;
            };

            const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

            return () => subscription.remove();
        }, [filterModal])
    );

    const fetchProperties = async (silent = false) => {
        if (!silent) setLoading(true);

        try {
            const params = new URLSearchParams();
            if (maxPrice) params.append('maxPrice', maxPrice);
            if (bhk) params.append('bedrooms', bhk);
            if (location) params.append('location', location);

            const res = await apiClient.get(`/api/user/properties?${params.toString()}`);
            setProperties(res.data.properties || []);
        } catch (error) {
            console.error('Fetch properties error', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const fetchPropertiesRef = useRef(fetchProperties);
    fetchPropertiesRef.current = fetchProperties;

    // Fetch on screen focus
    useFocusEffect(
        React.useCallback(() => {
            fetchPropertiesRef.current();
        }, [])
    );

    // Poll every 5 seconds silently
    useAutoRefresh(() => fetchProperties(true), 5000);

    // Refresh when app comes back from background
    const appState = useRef(AppState.currentState);
    useEffect(() => {
        const sub = AppState.addEventListener('change', (nextState) => {
            if (appState.current.match(/inactive|background/) && nextState === 'active') {
                fetchProperties(true);
            }
            appState.current = nextState;
        });
        return () => sub.remove();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        startSpin();
        await fetchProperties(true);
    };

    const applyFilters = () => {
        setFilterModal(false);
        fetchProperties();
    };

    const renderCard = ({ item }: { item: Property }) => {

        return (

            <View style={styles.cardContainer}>

                <TouchableOpacity
                    style={styles.card}
                    activeOpacity={0.9}
                    onPress={() => router.push(`/(main)/property/${item.id}` as any)}
                >

                    <View style={styles.imageContainer}>

                        {item.images && item.images.length > 0 ? (

                            <FlatList
                                style={{ width: '100%', height: '100%' }}
                                data={item.images}
                                horizontal
                                pagingEnabled
                                showsHorizontalScrollIndicator={false}
                                keyExtractor={(img, index) => `${item.id}-${index}`}
                                renderItem={({ item: img }) => (
                                    <Image
                                        source={{ uri: `${BACKEND_URL}${img}` }}
                                        style={styles.image}
                                        defaultSource={require('../../assets/images/icon.png')}
                                    />
                                )}
                            />

                        ) : (

                            <View style={[styles.image, styles.noImage]}>

                                <Ionicons name="home-outline" size={48} color="#CCC" />

                            </View>

                        )}

                    </View>

                    <View style={styles.cardContent}>

                        <View style={styles.rowBetween}>

                            <Text style={styles.title} numberOfLines={1}>{item.title}</Text>

                            <Text style={styles.price}>₹ {item.price}/mo</Text>

                        </View>

                        <View style={styles.metaRow}>

                            <View style={styles.badge}>
                                <Ionicons name="bed-outline" size={14} color={GREEN_DARK} />
                                <Text style={styles.badgeText}>{item.bedrooms} BHK</Text>
                            </View>

                            <View style={styles.badge}>
                                <Ionicons name="water-outline" size={14} color={GREEN_DARK} />
                                <Text style={styles.badgeText}>{item.bathrooms} Bath</Text>
                            </View>

                            <View style={styles.badge}>
                                <Ionicons name="location-outline" size={14} color={GREEN_DARK} />
                                <Text style={styles.badgeText}>{item.location}</Text>
                            </View>

                        </View>

                        <Text style={styles.description} numberOfLines={2}>
                            {item.description}
                        </Text>

                        {item.isInProcess ? (
                            <TouchableOpacity
                                style={[styles.bookBtn, { backgroundColor: '#A0A0A0' }]}
                                activeOpacity={1}
                            >
                                <Text style={styles.bookBtnText}>In Process</Text>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                style={styles.bookBtn}
                                onPress={() => router.push(`/(main)/book/${item.id}` as any)}
                            >
                                <Text style={styles.bookBtnText}>Book Now</Text>
                            </TouchableOpacity>
                        )}

                    </View>

                </TouchableOpacity>

            </View>

        );
    };

    if (loading && properties.length === 0) {

        return (

            <SafeAreaView style={styles.center}>

                <ActivityIndicator size="large" color={GREEN} />

            </SafeAreaView>

        );

    }

    return (
        <SafeAreaView style={styles.container}>

            {/* ─── Header ─── */}
            <LinearGradient
                colors={['#E8F5E9', '#C8E6C9', '#A5D6A7']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <View>
                    <Text style={styles.headerTitle}>Discover</Text>
                    <Text style={styles.headerSubtitle}>Find your perfect home</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                    <TouchableOpacity onPress={onRefresh} style={[styles.filterBtn, refreshing && { opacity: 0.5 }]} disabled={refreshing}>
                        <Animated.View style={{ transform: [{ rotate: spin }] }}>
                            <Ionicons name="refresh" size={22} color={GREEN_DARK} />
                        </Animated.View>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.filterBtn} onPress={() => setFilterModal(true)}>
                        <Ionicons name="options" size={24} color={GREEN_DARK} />
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            {/* ─── Cards ─── */}
            {properties.length === 0 ? (
                <View style={styles.center}>
                    <Ionicons name="search-outline" size={48} color="#CCC" />
                    <Text style={styles.noData}>No properties match your filters</Text>
                </View>
            ) : (
                <View style={{ flex: 1 }}>
                    <FlatList
                        data={properties}
                        renderItem={renderCard}
                        keyExtractor={(item) => item.id}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onMomentumScrollEnd={(e) => {
                            const index = Math.round(e.nativeEvent.contentOffset.x / width);
                            setActiveIndex(index);
                        }}
                    />

                    {/* Pagination Dots */}
                    {properties.length > 1 && (
                        <View style={styles.dotsContainer}>
                            {properties.map((_, i) => (
                                <View
                                    key={i}
                                    style={[
                                        styles.dot,
                                        i === activeIndex ? styles.dotActive : null,
                                    ]}
                                />
                            ))}
                        </View>
                    )}

                    {/* Swipe Hint Overlay */}
                    {showHint && (
                        <Animated.View
                            style={[
                                styles.swipeHint,
                                { opacity: hintOpacity, transform: [{ translateX: hintSlide }] },
                            ]}
                            pointerEvents="none"
                        >
                            <Ionicons name="swap-horizontal" size={18} color="#fff" />
                            <Text style={styles.swipeHintText}>Swipe to see more properties</Text>
                            <Ionicons name="arrow-forward" size={18} color="#fff" />
                        </Animated.View>
                    )}
                </View>
            )}

            {/* ─── Filter Modal ─── */}
            <Modal
                visible={filterModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setFilterModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Filter Properties</Text>
                            <TouchableOpacity onPress={() => setFilterModal(false)}>
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.filterLabel}>Under Price (₹/mo)</Text>
                        <TextInput
                            style={styles.filterInput}
                            placeholder="Show properties under ₹..."
                            keyboardType="numeric"
                            value={maxPrice}
                            onChangeText={setMaxPrice}
                        />

                        <Text style={styles.filterLabel}>Bedrooms (BHK)</Text>
                        <TextInput
                            style={styles.filterInput}
                            placeholder="e.g. 2"
                            keyboardType="numeric"
                            value={bhk}
                            onChangeText={setBhk}
                        />

                        <Text style={styles.filterLabel}>Location</Text>
                        <TextInput
                            style={styles.filterInput}
                            placeholder="e.g. Mumbai"
                            value={location}
                            onChangeText={setLocation}
                        />

                        <TouchableOpacity style={styles.applyBtn} onPress={applyFilters}>
                            <Text style={styles.applyBtnText}>Apply Filters</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.clearBtn}
                            onPress={() => {
                                setMaxPrice('');
                                setBhk('');
                                setLocation('');
                                setFilterModal(false);
                                // Need to refetch without filters
                                setTimeout(() => fetchProperties(), 100);
                            }}
                        >
                            <Text style={styles.clearBtnText}>Clear Filters</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

        </SafeAreaView>

    );
}

const styles = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: '#F9FBF9'
    },

    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },

    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 20,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        shadowColor: '#4CAF50',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 8,
        elevation: 6,
    },

    headerTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: GREEN_DARK
    },

    headerSubtitle: {
        fontSize: 14,
        color: '#666',
        marginTop: 4
    },

    filterBtn: {
        backgroundColor: GREEN_LIGHT,
        padding: 12,
        borderRadius: 12
    },

    cardContainer: {
        width: width,
        alignItems: 'center',
        paddingVertical: 12,
    },

    card: {
        width: width * 0.9,
        backgroundColor: '#FFF',
        borderRadius: 24,
        overflow: 'hidden',
        elevation: 10,
        marginBottom: 20,
    },

    imageContainer: {
        width: '100%',
        height: 250,
        backgroundColor: '#F0F0F0',
    },

    image: {
        width: width * 0.9,
        height: 250, // Absolute height ensures it renders properly inside the FlatList
        resizeMode: 'cover'
    },

    noImage: {
        justifyContent: 'center',
        alignItems: 'center'
    },

    cardContent: {
        padding: 20
    },

    rowBetween: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12
    },

    title: {
        fontSize: 22,
        fontWeight: '700',
        color: '#111'
    },

    price: {
        fontSize: 20,
        fontWeight: '800',
        color: GREEN
    },

    metaRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 12,
        flexWrap: 'wrap'
    },

    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: GREEN_LIGHT,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8
    },

    badgeText: {
        fontSize: 12,
        color: GREEN_DARK,
        marginLeft: 4
    },

    description: {
        fontSize: 14,
        color: '#666',
        marginBottom: 20
    },

    bookBtn: {
        backgroundColor: GREEN,
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center'
    },

    bookBtnText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '700'
    },

    noData: {
        fontSize: 16,
        color: '#888',
        marginTop: 16,
        textAlign: 'center'
    },

    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end'
    },
    modalContent: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        minHeight: 400
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111'
    },
    filterLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#444',
        marginBottom: 8
    },
    filterInput: {
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        marginBottom: 16,
        color: '#111'
    },
    applyBtn: {
        backgroundColor: GREEN,
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 8
    },
    applyBtnText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '700'
    },
    clearBtn: {
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 8
    },
    clearBtnText: {
        color: '#888',
        fontSize: 16,
        fontWeight: '600'
    },

    dotsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 10,
        gap: 6,
    },

    dot: {
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: '#C8E6C9',
    },

    dotActive: {
        width: 20,
        backgroundColor: GREEN,
    },

    swipeHint: {
        position: 'absolute',
        bottom: 60,
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'rgba(46,125,50,0.88)',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 8,
    },

    swipeHintText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },

});