import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView,
    Alert, Linking, ActivityIndicator, BackHandler, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { setStatusBarStyle, setStatusBarBackgroundColor } from 'expo-status-bar';
import * as NavigationBar from 'expo-navigation-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import apiClient from '../../src/lib/axios';
import { useNotifications } from '../../src/hooks/useNotifications';
import { Colors, Shadow, Radius, Spacing, getInitials } from '../../src/constants/theme';

const SUPPORT_PHONE = '8770676598';

type UserProfile = {
    id: string;
    name: string;
    email: string;
    phone: string | null;
};

export default function ProfileScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const { unreadCount } = useNotifications();

    useFocusEffect(
        useCallback(() => {
            fetchProfile();
            setStatusBarStyle('light');
            setStatusBarBackgroundColor(Colors.bgDark, true);
            if (Platform.OS === 'android') {
                NavigationBar.setBackgroundColorAsync(Colors.bgDark);
                NavigationBar.setButtonStyleAsync('light');
            }
        }, [])
    );

    useFocusEffect(
        useCallback(() => {
            const handler = BackHandler.addEventListener('hardwareBackPress', () => {
                router.back();
                return true;
            });
            return () => handler.remove();
        }, [])
    );

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const res = await apiClient.get('/api/user/profile');
            const user = res.data.user;
            setProfile(user);
            if (user?.name) await AsyncStorage.setItem('userName', user.name);
        } catch (error: any) {
            if (error.response?.status === 401) {
                await AsyncStorage.removeItem('userToken');
                router.replace('/login' as any);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        Alert.alert('Logout', 'Are you sure you want to log out?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Logout',
                style: 'destructive',
                onPress: async () => {
                    await AsyncStorage.multiRemove(['userToken', 'userName']);
                    router.replace('/login' as any);
                },
            },
        ]);
    };

    const handleCall = async () => {
        const url = `tel:${SUPPORT_PHONE}`;
        try {
            await Linking.openURL(url);
        } catch (error) {
            Alert.alert('Error', 'Calling not supported on this device');
        }
    };

    const handleWhatsApp = async () => {
        const url = `https://wa.me/91${SUPPORT_PHONE}?text=Hello, I need help!`;
        try {
            await Linking.openURL(url);
        } catch (error) {
            Alert.alert('Error', 'Could not open WhatsApp');
        }
    };

    if (loading && !profile) {
        return (
            <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    const initials = profile?.name ? getInitials(profile.name) : 'U';

    return (
        <View style={{ flex: 1, backgroundColor: Colors.bgScreen }}>
            {/* ─── STATUS BAR ZONE ─── */}
            <View style={{ height: insets.top, backgroundColor: Colors.bgDark, borderBottomWidth: 1.5, borderBottomColor: Colors.primary }} />

            <ScrollView
                style={styles.container}
                contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
            >
                {/* ── Header */}
                <View style={[styles.header, { paddingTop: Spacing.md }]}>
                    <View style={styles.headerGlow} pointerEvents="none" />

                    {/* Back + notifications row */}
                    <View style={styles.headerTopRow}>
                        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
                            <Ionicons name="arrow-back" size={22} color="#fff" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.iconBtn}
                            onPress={() => router.push('/(main)/notifications' as any)}
                        >
                            <Ionicons name="notifications-outline" size={22} color="#fff" />
                            {unreadCount > 0 && (
                                <View style={styles.notifBadge}>
                                    <Text style={styles.notifBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Avatar */}
                    <View style={styles.avatarWrapper}>
                        <LinearGradient
                            colors={[Colors.primaryMid, Colors.primary, Colors.primaryDark]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.avatarCircle}
                        >
                            <Text style={styles.avatarText}>{initials}</Text>
                        </LinearGradient>
                    </View>

                    <Text style={styles.profileName}>{profile?.name || 'User'}</Text>
                    <Text style={styles.profileEmail}>{profile?.email || ''}</Text>
                    {profile?.phone && <Text style={styles.profilePhone}>{profile.phone}</Text>}
                </View>

                {/* ── Menu */}
                <View style={styles.section}>

                    <MenuItem
                        icon="notifications-outline"
                        label="Notifications"
                        onPress={() => router.push('/(main)/notifications' as any)}
                        badge={unreadCount}
                    />
                    <MenuItem
                        icon="create-outline"
                        label="Edit Profile"
                        onPress={() => router.push('/(main)/edit-profile' as any)}
                        badge={0}
                    />
                    <MenuItem
                        icon="chatbubbles-outline"
                        label="Send Feedback"
                        onPress={() => router.push('/(main)/feedback' as any)}
                        badge={0}
                        last
                    />
                </View>

                {/* ── Support */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Support</Text>
                    <View style={styles.supportRow}>
                        <TouchableOpacity style={styles.supportBtn} onPress={handleCall}>
                            <View style={[styles.supportIcon, { backgroundColor: '#E3F2FD' }]}>
                                <Ionicons name="call" size={20} color="#1976D2" />
                            </View>
                            <Text style={[styles.supportText, { color: '#1976D2' }]}>Call Support</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.supportBtn} onPress={handleWhatsApp}>
                            <View style={[styles.supportIcon, { backgroundColor: Colors.primaryLight }]}>
                                <Ionicons name="logo-whatsapp" size={20} color={Colors.primaryDark} />
                            </View>
                            <Text style={[styles.supportText, { color: Colors.primaryDark }]}>WhatsApp</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* ── Logout */}
                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={20} color="#DC2626" />
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

function MenuItem({
    icon, label, onPress, badge, last,
}: {
    icon: string; label: string; onPress: () => void; badge: number; last?: boolean;
}) {
    return (
        <TouchableOpacity
            style={[styles.menuItem, last && { borderBottomWidth: 0 }]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={styles.menuLeft}>
                <View style={styles.menuIconBox}>
                    <Ionicons name={icon as any} size={20} color={Colors.primary} />
                </View>
                <Text style={styles.menuLabel}>{label}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {badge > 0 && (
                    <View style={styles.menuBadge}>
                        <Text style={styles.menuBadgeText}>{badge}</Text>
                    </View>
                )}
                <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.bgScreen,
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    // Header
    header: {
        backgroundColor: Colors.bgDark,
        alignItems: 'center',
        paddingBottom: Spacing.xxxl,
        overflow: 'hidden',
    },
    headerGlow: {
        position: 'absolute',
        top: -60,
        right: -60,
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: Colors.primary,
        opacity: 0.12,
    },
    headerTopRow: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.xl,
        marginBottom: Spacing.xl,
    },
    iconBtn: {
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
        minWidth: 16,
        height: 16,
        borderRadius: 8,
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
    avatarWrapper: {
        width: 96,
        height: 96,
        borderRadius: 48,
        borderWidth: 3,
        borderColor: 'rgba(29,173,168,0.4)',
        marginBottom: 14,
    },
    avatarCircle: {
        width: '100%',
        height: '100%',
        borderRadius: 48,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: '#fff',
        fontSize: 32,
        fontWeight: '700',
    },
    profileName: {
        fontSize: 24,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: 0.3,
        marginBottom: 4,
    },
    profileEmail: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.65)',
    },
    profilePhone: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.5)',
        marginTop: 2,
    },
    // Section
    section: {
        backgroundColor: '#fff',
        marginHorizontal: Spacing.xl,
        marginTop: Spacing.xl,
        borderRadius: Radius.lg,
        overflow: 'hidden',
        ...Shadow.card,
    },
    sectionLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.textMuted,
        letterSpacing: 0.8,
        textTransform: 'uppercase',
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.md,
        paddingBottom: 4,
    },
    // Menu Item
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    menuLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    menuIconBox: {
        width: 38,
        height: 38,
        borderRadius: 10,
        backgroundColor: Colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    menuLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.textPrimary,
    },
    menuBadge: {
        backgroundColor: Colors.accentBlue,
        paddingHorizontal: 7,
        paddingVertical: 2,
        borderRadius: Radius.pill,
    },
    menuBadgeText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '700',
    },
    // Support
    supportRow: {
        flexDirection: 'row',
        gap: 12,
        padding: Spacing.lg,
    },
    supportBtn: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 14,
        borderRadius: Radius.md,
        backgroundColor: Colors.bgScreen,
        gap: 6,
    },
    supportIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    supportText: {
        fontSize: 12,
        fontWeight: '600',
    },
    // Logout
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: Spacing.xl,
        marginTop: Spacing.xl,
        paddingVertical: 16,
        borderRadius: Radius.lg,
        backgroundColor: '#FEF2F2',
        gap: 8,
    },
    logoutText: {
        color: '#DC2626',
        fontSize: 16,
        fontWeight: '700',
    },
});
