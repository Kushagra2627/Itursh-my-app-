import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Linking, ActivityIndicator, BackHandler, ToastAndroid, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { setStatusBarStyle, setStatusBarBackgroundColor } from 'expo-status-bar';
import * as NavigationBar from 'expo-navigation-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../../src/lib/axios';
import { useNotifications } from '../../src/hooks/useNotifications';

const GREEN = '#4CAF50';
const GREEN_LIGHT = '#E8F5E9';
const SUPPORT_PHONE = '8770676598';

type UserProfile = {
    id: string;
    name: string;
    email: string;
    phone: string | null;
};

export default function ProfileScreen() {
    const router = useRouter();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const { unreadCount } = useNotifications();

    useFocusEffect(
        useCallback(() => {
            fetchProfile();
            // Imperatively set status bar when Profile tab gains focus
            setStatusBarStyle('light');
            setStatusBarBackgroundColor('#1B5E20', true);

            // Android navigation bar
            if (Platform.OS === 'android') {
                NavigationBar.setButtonStyleAsync('dark');
            }
        }, [])
    );

    const lastBackPressTime = React.useRef(0);

    useFocusEffect(
        useCallback(() => {
            const onBackPress = () => {
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
        }, [])
    );

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const res = await apiClient.get('/api/user/profile');
            setProfile(res.data.user);
        } catch (error: any) {
            console.error('Fetch profile error:', error);
            if (error.response?.status === 401 || error.response?.status === 404) {
                await AsyncStorage.removeItem('userToken');
                router.replace('/login' as any);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        Alert.alert(
            "Logout",
            "Are you sure you want to log out?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Logout",
                    style: "destructive",
                    onPress: async () => {
                        await AsyncStorage.removeItem('userToken');
                        router.replace('/login' as any); // Update this path if your login screen is somewhere else (e.g., '/(auth)/login')
                    }
                }
            ]
        );
    };

    const handleCall = () => {
        const url = `tel:${SUPPORT_PHONE}`;
        Linking.canOpenURL(url).then(supported => {
            if (supported) {
                Linking.openURL(url);
            } else {
                Alert.alert('Error', 'Calling is not supported on this device');
            }
        });
    };

    const handleWhatsApp = () => {
        const url = `whatsapp://send?phone=91${SUPPORT_PHONE}&text=Hello, I need some help!`;
        Linking.canOpenURL(url).then(supported => {
            if (supported) {
                Linking.openURL(url);
            } else {
                Alert.alert('Error', 'WhatsApp is not installed on this device');
            }
        });
    };

    if (loading && !profile) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={GREEN} />
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
            {/* Header / Profile Info */}
            <LinearGradient
                colors={['#1B5E20', '#2E7D32', '#388E3C']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <TouchableOpacity 
                    style={styles.notificationHeaderBtn}
                    onPress={() => router.push('/(main)/notifications' as any)}
                >
                    <Ionicons name="notifications" size={24} color="#fff" />
                    {unreadCount > 0 && (
                        <View style={styles.headerBadge}>
                            <Text style={styles.headerBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                        </View>
                    )}
                </TouchableOpacity>
                {/* outer glow ring */}
                <View style={styles.avatarRing}>
                    <LinearGradient
                        colors={['#A5D6A7', '#4CAF50', '#2E7D32']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.avatarContainer}
                    >
                        <Ionicons name="person" size={54} color="#fff" />
                    </LinearGradient>
                </View>
                <Text style={styles.name}>{profile?.name || 'User'}</Text>
                <Text style={styles.email}>{profile?.email || ''}</Text>
                {profile?.phone && <Text style={styles.phone}>{profile.phone}</Text>}
            </LinearGradient>

            {/* Main Menu */}
            <View style={styles.menuContainer}>
                <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/(main)/edit-profile' as any)}>
                    <View style={styles.menuItemLeft}>
                        <View style={styles.iconBox}>
                            <Ionicons name="create-outline" size={20} color={GREEN} />
                        </View>
                        <Text style={styles.menuItemText}>Edit Profile</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#CCC" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/(main)/notifications' as any)}>
                    <View style={styles.menuItemLeft}>
                        <View style={styles.iconBox}>
                            <Ionicons name="notifications-outline" size={20} color={GREEN} />
                        </View>
                        <Text style={styles.menuItemText}>Notifications</Text>
                        {unreadCount > 0 && (
                            <View style={styles.menuBadge}>
                                <Text style={styles.menuBadgeText}>{unreadCount}</Text>
                            </View>
                        )}
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#CCC" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/(main)/bookings' as any)}>
                    <View style={styles.menuItemLeft}>
                        <View style={styles.iconBox}>
                            <Ionicons name="calendar-outline" size={20} color={GREEN} />
                        </View>
                        <Text style={styles.menuItemText}>My Bookings</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#CCC" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/(main)/feedback' as any)}>
                    <View style={styles.menuItemLeft}>
                        <View style={styles.iconBox}>
                            <Ionicons name="chatbubbles-outline" size={20} color={GREEN} />
                        </View>
                        <Text style={styles.menuItemText}>Feedback</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#CCC" />
                </TouchableOpacity>
            </View>

            {/* Support Section */}
            <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Call & Support</Text>
                <Text style={styles.supportText}>For any query, call or WhatsApp on this number</Text>
                
                <View style={styles.supportRow}>
                    <TouchableOpacity style={[styles.supportBtn, { backgroundColor: '#E3F2FD' }]} onPress={handleCall}>
                        <Ionicons name="call" size={20} color="#1976D2" />
                        <Text style={[styles.supportBtnText, { color: '#1976D2' }]}>Call Support</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.supportBtn, { backgroundColor: '#E8F5E9' }]} onPress={handleWhatsApp}>
                        <Ionicons name="logo-whatsapp" size={20} color="#388E3C" />
                        <Text style={[styles.supportBtnText, { color: '#388E3C' }]}>WhatsApp</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Logout Button */}
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={20} color="#D32F2F" />
                <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>

        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FBF9',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        alignItems: 'center',
        paddingTop: 60,
        paddingBottom: 44,
        borderBottomLeftRadius: 36,
        borderBottomRightRadius: 36,
        marginBottom: 24,
        shadowColor: '#1B5E20',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
        elevation: 14,
    },
    avatarRing: {
        width: 136,
        height: 136,
        borderRadius: 68,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 3,
        borderColor: 'rgba(255,255,255,0.35)',
        shadowColor: '#81C784',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 20,
        elevation: 16,
    },
    avatarContainer: {
        width: 126,
        height: 126,
        borderRadius: 63,
        justifyContent: 'center',
        alignItems: 'center',
    },
    name: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
        letterSpacing: 0.5,
    },
    email: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
    },
    phone: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.75)',
        marginTop: 4,
    },
    menuContainer: {
        backgroundColor: '#FFF',
        marginHorizontal: 20,
        borderRadius: 16,
        paddingVertical: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
        marginBottom: 20,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: GREEN_LIGHT,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    menuItemText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    sectionContainer: {
        backgroundColor: '#FFF',
        marginHorizontal: 20,
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
        marginBottom: 30,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111',
        marginBottom: 8,
    },
    supportText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 20,
    },
    supportRow: {
        flexDirection: 'row',
        gap: 12,
    },
    supportBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        gap: 8,
    },
    supportBtnText: {
        fontSize: 15,
        fontWeight: '600',
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 20,
        paddingVertical: 16,
        borderRadius: 16,
        backgroundColor: '#FFEBEE',
        gap: 8,
    },
    logoutText: {
        color: '#D32F2F',
        fontSize: 16,
        fontWeight: 'bold',
    },
    notificationHeaderBtn: {
        position: 'absolute',
        top: 50,
        right: 24,
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 12,
    },
    headerBadge: {
        position: 'absolute',
        top: 2,
        right: 2,
        backgroundColor: '#FF3B30',
        minWidth: 16,
        height: 16,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#2E7D32',
    },
    headerBadgeText: {
        color: '#FFF',
        fontSize: 9,
        fontWeight: 'bold',
    },
    menuBadge: {
        backgroundColor: '#FF3B30',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
        marginLeft: 8,
    },
    menuBadgeText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
});
