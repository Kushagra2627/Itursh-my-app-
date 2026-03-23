import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, FlatList, Image, TouchableOpacity, ActivityIndicator, ScrollView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ImageViewing from 'react-native-image-viewing';
import apiClient from '../../../src/lib/axios';
import { useAutoRefresh } from '../../../src/hooks/useAutoRefresh';

const { width } = Dimensions.get('window');

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

export default function PropertyDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const [property, setProperty] = useState<Property | null>(null);
    const [loading, setLoading] = useState(true);

    // Image Viewer state
    const [isViewerVisible, setIsViewerVisible] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [activeDotIndex, setActiveDotIndex] = useState(0);

    useFocusEffect(
        React.useCallback(() => {
            if (id) fetchProperty();
        }, [id])
    );

    useAutoRefresh(() => {
        if (id) fetchProperty();
    }, 5000);

    const fetchProperty = async () => {
        try {
            const res = await apiClient.get(`/api/user/properties/${id}`);
            setProperty(res.data.property);
        } catch (error) {
            console.error('Fetch property error', error);
        } finally {
            setLoading(false);
        }
    };

    const handleScroll = (event: any) => {
        const slideSize = event.nativeEvent.layoutMeasurement.width;
        const index = event.nativeEvent.contentOffset.x / slideSize;
        setActiveDotIndex(Math.round(index));
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={GREEN} />
            </View>
        );
    }

    if (!property) {
        return (
            <View style={styles.center}>
                <Text>Property not found</Text>
                <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
                    <Text style={{ color: GREEN }}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // Prepare full image URIs for Image Viewer
    const imageUris = (property.images || []).map(img => ({
        uri: `${BACKEND_URL}${img}`
    }));

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
                {/* ─── Image Gallery ─── */}
                <View style={[styles.imageCarouselContainer, { paddingTop: Platform.OS === 'ios' ? 0 : insets.top }]}>
                    {imageUris.length > 0 ? (
                        <>
                            <FlatList
                                data={property.images}
                                horizontal
                                pagingEnabled
                                showsHorizontalScrollIndicator={false}
                                onMomentumScrollEnd={handleScroll}
                                keyExtractor={(_, index) => `img-${index}`}
                                renderItem={({ item, index }) => (
                                    <TouchableOpacity
                                        activeOpacity={0.9}
                                        onPress={() => {
                                            setCurrentImageIndex(index);
                                            setIsViewerVisible(true);
                                        }}
                                    >
                                        <Image
                                            source={{ uri: `${BACKEND_URL}${item}` }}
                                            style={styles.carouselImage}
                                            defaultSource={require('../../../assets/images/icon.png')}
                                        />
                                    </TouchableOpacity>
                                )}
                            />
                            {/* Pagination Dots */}
                            <View style={styles.paginationContainer}>
                                {property.images.map((_, index) => (
                                    <View
                                        key={index}
                                        style={[
                                            styles.dot,
                                            activeDotIndex === index ? styles.activeDot : null
                                        ]}
                                    />
                                ))}
                            </View>
                        </>
                    ) : (
                        <View style={[styles.carouselImage, styles.noImage]}>
                            <Ionicons name="home-outline" size={64} color="#CCC" />
                        </View>
                    )}

                    {/* Back Button Floating on top of the image */}
                    <TouchableOpacity
                        style={[styles.backFloatingBtn, { top: insets.top + 16 }]}
                        onPress={() => router.back()}
                    >
                        <Ionicons name="chevron-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                </View>

                {/* ─── Property Details ─── */}
                <View style={styles.detailsContainer}>
                    <View style={styles.titleRow}>
                        <Text style={styles.title} numberOfLines={2}>{property.title}</Text>
                        <Text style={styles.price}>₹ {property.price}<Text style={styles.priceMonth}>/mo</Text></Text>
                    </View>

                    <View style={styles.locationContainer}>
                        <Ionicons name="location" size={18} color={GREEN} />
                        <Text style={styles.locationText}>{property.location}</Text>
                    </View>

                    {/* Features Badges */}
                    <View style={styles.featuresRow}>
                        <View style={styles.featureBadge}>
                            <Ionicons name="bed" size={20} color={GREEN_DARK} />
                            <Text style={styles.featureText}>{property.bedrooms} Bedrooms</Text>
                        </View>
                        <View style={styles.featureBadge}>
                            <Ionicons name="water" size={20} color={GREEN_DARK} />
                            <Text style={styles.featureText}>{property.bathrooms} Bathrooms</Text>
                        </View>
                    </View>

                    {/* Description */}
                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionTitle}>About this property</Text>
                        <Text style={styles.descriptionText}>{property.description}</Text>
                    </View>
                </View>
            </ScrollView>

            {/* ─── Bottom Action Bar ─── */}
            <View style={[styles.bottomBar, { paddingBottom: insets.bottom || 20 }]}>
                <View>
                    <Text style={styles.bottomPrice}>₹ {property.price}</Text>
                    <Text style={styles.bottomPriceLabel}>per month</Text>
                </View>
                {property.isInProcess ? (
                    <TouchableOpacity
                        style={[styles.bookBtn, { backgroundColor: '#A0A0A0', shadowColor: '#A0A0A0' }]}
                        activeOpacity={1}
                    >
                        <Text style={styles.bookBtnText}>In Process</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={styles.bookBtn}
                        onPress={() => router.push(`/(main)/book/${property.id}` as any)}
                    >
                        <Text style={styles.bookBtnText}>Book Now</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* ─── Full Screen Image Viewer ─── */}
            {imageUris.length > 0 && (
                <ImageViewing
                    images={imageUris}
                    imageIndex={currentImageIndex}
                    visible={isViewerVisible}
                    onRequestClose={() => setIsViewerVisible(false)}
                    swipeToCloseEnabled={true}
                    doubleTapToZoomEnabled={true}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF'
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    imageCarouselContainer: {
        width: width,
        height: width * 0.8,
        position: 'relative'
    },
    carouselImage: {
        width: width,
        height: width * 0.8,
        resizeMode: 'cover',
    },
    noImage: {
        backgroundColor: '#F0F0F0',
        justifyContent: 'center',
        alignItems: 'center'
    },
    backFloatingBtn: {
        position: 'absolute',
        left: 20,
        backgroundColor: 'rgba(0,0,0,0.4)',
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        backdropFilter: 'blur(10px)'
    },
    paginationContainer: {
        position: 'absolute',
        bottom: 20,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center'
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255,255,255,0.5)',
        marginHorizontal: 4
    },
    activeDot: {
        width: 24,
        backgroundColor: '#FFF'
    },
    detailsContainer: {
        padding: 24,
        paddingTop: 32,
        backgroundColor: '#FFF',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        marginTop: -32, // overlap the image slightly
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
        gap: 16
    },
    title: {
        flex: 1,
        fontSize: 26,
        fontWeight: '800',
        color: '#111',
        lineHeight: 32
    },
    price: {
        fontSize: 24,
        fontWeight: '800',
        color: GREEN,
        flexShrink: 0
    },
    priceMonth: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500'
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    locationText: {
        fontSize: 16,
        color: '#555',
        marginLeft: 6,
        fontWeight: '500'
    },
    featuresRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 32,
        paddingBottom: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0'
    },
    featureBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: GREEN_LIGHT,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 16,
        flex: 1,
        justifyContent: 'center'
    },
    featureText: {
        marginLeft: 8,
        fontSize: 14,
        fontWeight: '700',
        color: GREEN_DARK
    },
    sectionContainer: {
        marginBottom: 24
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111',
        marginBottom: 12
    },
    descriptionText: {
        fontSize: 16,
        lineHeight: 26,
        color: '#666'
    },
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFF',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#EEE',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 20,
    },
    bottomPrice: {
        fontSize: 22,
        fontWeight: '800',
        color: '#111'
    },
    bottomPriceLabel: {
        fontSize: 12,
        color: '#666',
        fontWeight: '500'
    },
    bookBtn: {
        backgroundColor: GREEN,
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 16,
        shadowColor: GREEN,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    bookBtnText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '700'
    }
});
