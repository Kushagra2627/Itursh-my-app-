import { useState, useEffect, useCallback } from 'react';
import apiClient from '../lib/axios';
import { useFocusEffect } from 'expo-router';

export type Notification = {
    id: string;
    userId: string;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
};

export const useNotifications = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);

    const fetchNotifications = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const res = await apiClient.get('/api/user/notifications');
            const data = res.data.notifications || [];
            setNotifications(data);
            setUnreadCount(data.filter((n: Notification) => !n.isRead).length);
        } catch (error) {
            console.error('Fetch notifications error:', error);
        } finally {
            if (!silent) setLoading(false);
        }
    }, []);

    const markAsRead = async (id: string) => {
        try {
            // Optimistic update
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
            
            await apiClient.patch(`/api/user/notifications/${id}/read`);
        } catch (error) {
            console.error('Mark as read error:', error);
            // Revert on error if needed, but for notifications it's usually fine
        }
    };

    // Initial fetch
    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    // Refresh on focus
    useFocusEffect(
        useCallback(() => {
            fetchNotifications(true);
        }, [fetchNotifications])
    );

    return {
        notifications,
        unreadCount,
        loading,
        refresh: fetchNotifications,
        markAsRead
    };
};
