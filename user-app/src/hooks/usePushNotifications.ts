import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../lib/axios';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

async function registerForPushNotificationsAsync(): Promise<string | undefined> {
    if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#1DADA8',
        });
    }

    if (!Device.isDevice) {
        console.log('Must use physical device for Push Notifications');
        return undefined;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return undefined;
    }

    try {
        const projectId =
            Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
            
        if (!projectId) {
            console.warn('Project ID not found in app.json. Add eas.projectId.');
        }
        
        const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
        console.log('Push token:', tokenData.data);
        return tokenData.data;
    } catch (e) {
        console.error('Error fetching Expo token:', e);
        return undefined;
    }
}

export function usePushNotifications() {
    const [expoPushToken, setExpoPushToken] = useState<string | undefined>();
    const [notification, setNotification] = useState<Notifications.Notification | false>(false);
    const notificationListener = useRef<any>(null);
    const responseListener = useRef<any>(null);

    useEffect(() => {
        registerForPushNotificationsAsync().then(async (token) => {
            if (token) {
                setExpoPushToken(token);
                // Save to backend if user is logged in
                const userToken = await AsyncStorage.getItem('userToken');
                if (userToken) {
                     try {
                          await apiClient.post('/api/user/push-token', { pushToken: token });
                     } catch (error) {
                          console.error('Failed to sync push token with backend', error);
                     }
                }
            }
        });

        notificationListener.current = Notifications.addNotificationReceivedListener((notification: any) => {
            setNotification(notification);
        });

        responseListener.current = Notifications.addNotificationResponseReceivedListener((response: any) => {
            // Can handle tapping on notification here
            console.log('Notification tapped:', response);
        });

        return () => {
             if (notificationListener.current) {
                 notificationListener.current.remove();
             }
             if (responseListener.current) {
                 responseListener.current.remove();
             }
        };
    }, []);

    return { expoPushToken, notification };
}
