import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../lib/axios';

export type Notification = {
    id: string;
    userId: string;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
};

export const useNotifications = () => {
    const queryClient = useQueryClient();

    const { data: notifications = [], isLoading: loading, refetch } = useQuery({
        queryKey: ['notifications'],
        queryFn: async () => {
            const res = await apiClient.get('/api/user/notifications');
            return res.data.notifications as Notification[] || [];
        },
        staleTime: 30 * 1000,
    });

    const unreadCount = notifications.filter((n: Notification) => !n.isRead).length;

    const { mutate: markAsRead } = useMutation({
        mutationFn: async (id: string) => {
            await apiClient.patch(`/api/user/notifications/${id}/read`);
        },
        onMutate: async (id: string) => {
            await queryClient.cancelQueries({ queryKey: ['notifications'] });
            const previousNotifs = queryClient.getQueryData<Notification[]>(['notifications']);
            
            if (previousNotifs) {
                queryClient.setQueryData<Notification[]>(['notifications'], (old: Notification[] | undefined) => 
                    old ? old.map((n: Notification) => n.id === id ? { ...n, isRead: true } : n) : []
                );
            }
            return { previousNotifs };
        },
        onError: (err: any, id: string, context: any) => {
            if (context?.previousNotifs) {
                queryClient.setQueryData(['notifications'], context.previousNotifs);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }
    });

    return {
        notifications,
        unreadCount,
        loading,
        refresh: refetch,
        markAsRead
    };
};
