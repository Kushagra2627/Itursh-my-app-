import React, { useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList,
    TouchableOpacity, RefreshControl, Platform,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { setStatusBarStyle, setStatusBarBackgroundColor } from 'expo-status-bar';
import * as NavigationBar from 'expo-navigation-bar';
import { useNotifications, Notification } from '../../src/hooks/useNotifications';
import { Colors, Shadow, Radius, Spacing, getRelativeTime } from '../../src/constants/theme';

type NotifType = 'approved' | 'pending' | 'info';

function getNotifType(title: string): NotifType {
    const t = title.toLowerCase();
    if (t.includes('approv')) return 'approved';
    if (t.includes('pend')) return 'pending';
    return 'info';
}

function getTypeIcon(type: NotifType) {
    if (type === 'approved') return { icon: 'checkmark-circle', color: Colors.statusApproved };
    if (type === 'pending') return { icon: 'time', color: Colors.statusPending };
    return { icon: 'information-circle', color: Colors.accentBlue };
}

export default function NotificationsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { notifications, loading, refresh, markAsRead, unreadCount } = useNotifications();

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

    const unread = notifications.filter(n => !n.isRead);
    const read = notifications.filter(n => n.isRead);

    const onPress = (item: Notification) => {
        if (!item.isRead) markAsRead(item.id);
    };

    const renderItem = ({ item }: { item: Notification }) => {
        const type = getNotifType(item.title);
        const { icon, color } = getTypeIcon(type);
        const isUnread = !item.isRead;

        return (
            <TouchableOpacity
                style={[styles.item, isUnread && styles.itemUnread]}
                onPress={() => onPress(item)}
                activeOpacity={0.75}
            >
                {/* Left teal border for unread */}
                {isUnread && <View style={styles.unreadBorder} />}

                <View style={[styles.iconCircle, { backgroundColor: `${color}18` }]}>
                    <Ionicons name={icon as any} size={22} color={color} />
                </View>

                <View style={styles.textBlock}>
                    <View style={styles.titleRow}>
                        <Text style={[styles.itemTitle, isUnread && styles.itemTitleBold]} numberOfLines={1}>
                            {item.title}
                        </Text>
                        {isUnread && <View style={styles.unreadDot} />}
                    </View>
                    <Text style={styles.itemMessage} numberOfLines={2}>{item.message}</Text>
                    <Text style={styles.itemTime}>{getRelativeTime(item.createdAt)}</Text>
                </View>
            </TouchableOpacity>
        );
    };

    const listData: { type: 'header' | 'item'; label?: string; item?: Notification }[] = [];
    if (unread.length > 0) {
        listData.push({ type: 'header', label: 'New' });
        unread.forEach(n => listData.push({ type: 'item', item: n }));
    }
    if (read.length > 0) {
        listData.push({ type: 'header', label: 'Earlier' });
        read.forEach(n => listData.push({ type: 'item', item: n }));
    }

    return (
        <View style={styles.container}>
            {/* ─── STATUS BAR ZONE ─── */}
            <View style={{ height: insets.top, backgroundColor: Colors.bgDark, borderBottomWidth: 1.5, borderBottomColor: Colors.primary }} />
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerGlow} pointerEvents="none" />
                <View style={styles.headerRow}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={22} color="#fff" />
                    </TouchableOpacity>
                    <View>
                        <Text style={styles.headerTitle}>Notifications</Text>
                    </View>
                    {unreadCount > 0 && (
                        <View style={styles.newBadge}>
                            <Text style={styles.newBadgeText}>{unreadCount} new</Text>
                        </View>
                    )}
                </View>
            </View>

            {loading && notifications.length === 0 ? (
                <View style={styles.empty}>
                    <Text style={{ color: Colors.textMuted }}>Loading...</Text>
                </View>
            ) : notifications.length === 0 ? (
                <View style={styles.empty}>
                    <View style={styles.emptyIconCircle}>
                        <Ionicons name="notifications-off-outline" size={44} color={Colors.textMuted} />
                    </View>
                    <Text style={styles.emptyTitle}>No notifications yet</Text>
                    <Text style={styles.emptySub}>We'll notify you when your bookings are updated.</Text>
                </View>
            ) : (
                <FlatList
                    data={listData}
                    keyExtractor={(_, i) => String(i)}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={loading}
                            onRefresh={() => refresh()}
                            colors={[Colors.primary]}
                            tintColor={Colors.primary}
                        />
                    }
                    renderItem={({ item: row }) => {
                        if (row.type === 'header') {
                            return <Text style={styles.groupHeader}>{row.label}</Text>;
                        }
                        if (row.item) return renderItem({ item: row.item });
                        return null;
                    }}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.bgScreen,
    },
    header: {
        backgroundColor: Colors.bgDark,
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.md,
        paddingBottom: Spacing.lg,
        overflow: 'hidden',
    },
    headerGlow: {
        position: 'absolute',
        top: -40,
        right: -40,
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: Colors.primary,
        opacity: 0.10,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    backBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: 0.3,
    },
    newBadge: {
        marginLeft: 'auto',
        backgroundColor: Colors.accentBlue,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: Radius.pill,
    },
    newBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
    },
    listContent: {
        paddingVertical: Spacing.md,
        paddingBottom: 80,
    },
    groupHeader: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.textMuted,
        letterSpacing: 0.8,
        textTransform: 'uppercase',
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.lg,
        paddingBottom: Spacing.sm,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#fff',
        marginHorizontal: Spacing.xl,
        marginVertical: 5,
        borderRadius: Radius.lg,
        padding: 14,
        overflow: 'hidden',
        ...Shadow.card,
    },
    itemUnread: {
        backgroundColor: Colors.bgScreen,
        borderColor: 'rgba(29,173,168,0.1)',
        borderWidth: 1,
    },
    unreadBorder: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        width: 3,
        backgroundColor: Colors.primary,
        borderTopLeftRadius: Radius.lg,
        borderBottomLeftRadius: Radius.lg,
    },
    iconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 13,
        flexShrink: 0,
    },
    textBlock: {
        flex: 1,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    itemTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.textSecondary,
        flex: 1,
    },
    itemTitleBold: {
        fontWeight: '700',
        color: Colors.textPrimary,
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.accentBlue,
        marginLeft: 8,
        flexShrink: 0,
    },
    itemMessage: {
        fontSize: 13,
        color: Colors.textMuted,
        lineHeight: 18,
        marginBottom: 6,
    },
    itemTime: {
        fontSize: 11,
        color: Colors.textMuted,
    },
    // Empty
    empty: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyIconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: Colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.textPrimary,
        marginBottom: 8,
    },
    emptySub: {
        fontSize: 14,
        color: Colors.textMuted,
        textAlign: 'center',
        lineHeight: 20,
    },
});
