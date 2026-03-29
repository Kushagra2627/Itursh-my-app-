import React, { useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNotifications, Notification } from '../../src/hooks/useNotifications';
import { LinearGradient } from 'expo-linear-gradient';

const GREEN = '#4CAF50';
const GREEN_DARK = '#2E7D32';
const GREEN_LIGHT = '#E8F5E9';

export default function NotificationsScreen() {
    const router = useRouter();
    const { notifications, loading, refresh, markAsRead } = useNotifications();

    const onNotificationPress = (item: Notification) => {
        if (!item.isRead) {
            markAsRead(item.id);
        }
        // Could navigate to booking details if id was included, 
        // but for now just marking as read is enough.
    };

    const renderItem = ({ item }: { item: Notification }) => (
        <TouchableOpacity 
            style={[styles.notificationItem, !item.isRead && styles.unreadItem]}
            onPress={() => onNotificationPress(item)}
            activeOpacity={0.7}
        >
            <View style={[styles.iconContainer, !item.isRead && styles.unreadIconContainer]}>
                <Ionicons 
                    name={item.isRead ? "notifications-outline" : "notifications"} 
                    size={22} 
                    color={item.isRead ? "#666" : GREEN} 
                />
            </View>
            <View style={styles.textContainer}>
                <View style={styles.row}>
                    <Text style={[styles.title, !item.isRead && styles.unreadTitle]}>{item.title}</Text>
                    {!item.isRead && <View style={styles.unreadDot} />}
                </View>
                <Text style={styles.message}>{item.message}</Text>
                <Text style={styles.time}>{new Date(item.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen 
                options={{ 
                    headerShown: true, 
                    title: 'Notifications',
                    headerStyle: { backgroundColor: '#F9FBF9' },
                    headerShadowVisible: false,
                    headerLeft: () => (
                        <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 8 }}>
                            <Ionicons name="arrow-back" size={24} color="#333" />
                        </TouchableOpacity>
                    )
                }} 
            />

            {loading && notifications.length === 0 ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={GREEN} />
                </View>
            ) : notifications.length === 0 ? (
                <View style={styles.center}>
                    <View style={styles.emptyIconContainer}>
                        <Ionicons name="notifications-off-outline" size={64} color="#CCC" />
                    </View>
                    <Text style={styles.emptyTitle}>No notifications yet</Text>
                    <Text style={styles.emptySubtitle}>We'll notify you when your bookings are updated.</Text>
                </View>
            ) : (
                <FlatList
                    data={notifications}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={loading} onRefresh={() => refresh(true)} colors={[GREEN]} />
                    }
                />
            )}
        </SafeAreaView>
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
        paddingHorizontal: 40,
    },
    listContent: {
        paddingVertical: 12,
    },
    notificationItem: {
        flexDirection: 'row',
        padding: 16,
        backgroundColor: '#FFF',
        marginHorizontal: 16,
        marginVertical: 6,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    unreadItem: {
        backgroundColor: '#F5FBF5',
        borderColor: 'rgba(76,175,80,0.1)',
        borderWidth: 1,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    unreadIconContainer: {
        backgroundColor: GREEN_LIGHT,
    },
    textContainer: {
        flex: 1,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    unreadTitle: {
        color: '#111',
        fontWeight: '700',
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: GREEN,
    },
    message: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
        marginBottom: 8,
    },
    time: {
        fontSize: 12,
        color: '#999',
    },
    emptyIconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#F0F0F0',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#333',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
    },
});
