import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, StyleSheet } from 'react-native';
import { Colors } from '../../src/constants/theme';

function TabIcon({ name, color, focused }: { name: any; color: string; focused: boolean }) {
    return (
        <View style={styles.tabIconWrapper}>
            <Ionicons name={name} size={24} color={color} />
            {focused && <View style={styles.activeDot} />}
        </View>
    );
}

import { usePushNotifications } from '../../src/hooks/usePushNotifications';

export default function MainLayout() {
    const insets = useSafeAreaInsets();
    usePushNotifications(); // initialize push tokens

    return (
        <Tabs
            backBehavior="history"
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: Colors.primary,
                tabBarInactiveTintColor: Colors.textMuted,
                tabBarStyle: {
                    backgroundColor: Colors.bgDark,
                    borderTopWidth: 0,
                    height: 64 + insets.bottom,
                    paddingBottom: 8 + insets.bottom,
                    paddingTop: 8,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 12,
                    elevation: 20,
                },
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '600',
                    letterSpacing: 0.3,
                    marginTop: 2,
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color, focused }) => (
                        <TabIcon name={focused ? 'home' : 'home-outline'} color={color} focused={focused} />
                    ),
                }}
            />
            <Tabs.Screen
                name="explore"
                options={{
                    title: 'Explore',
                    tabBarIcon: ({ color, focused }) => (
                        <TabIcon name={focused ? 'map' : 'map-outline'} color={color} focused={focused} />
                    ),
                }}
            />
            <Tabs.Screen
                name="bookings"
                options={{
                    title: 'Bookings',
                    tabBarIcon: ({ color, focused }) => (
                        <TabIcon name={focused ? 'calendar' : 'calendar-outline'} color={color} focused={focused} />
                    ),
                }}
            />
            {/* Hidden screens */}
            <Tabs.Screen name="profile" options={{ href: null }} />
            <Tabs.Screen name="notifications" options={{ href: null }} />
            <Tabs.Screen name="book/[id]" options={{ href: null, headerShown: false }} />
            <Tabs.Screen name="book-[id]" options={{ href: null }} />
            <Tabs.Screen name="property/[id]" options={{ href: null, headerShown: false }} />
            <Tabs.Screen name="feedback" options={{ href: null }} />
            <Tabs.Screen name="edit-profile" options={{ href: null }} />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    tabIconWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 40,
    },
    activeDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: Colors.primary,
        marginTop: 4,
    },
});
