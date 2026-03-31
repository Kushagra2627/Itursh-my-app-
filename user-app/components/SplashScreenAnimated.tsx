import React, { useEffect, useRef } from 'react';
import { Animated, View, Image, Text, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

interface Props {
    onFinish: () => void;
}

export default function SplashScreenAnimated({ onFinish }: Props) {
    // Single group animation — Instagram-style pop
    const scale = useRef(new Animated.Value(0.7)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    const screenOpacity = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.sequence([
            // 1. Pop in — scale from 0.7 → 1.05 (overshoot), fade in
            Animated.parallel([
                Animated.spring(scale, {
                    toValue: 1.05,
                    friction: 5,
                    tension: 100,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 350,
                    useNativeDriver: true,
                }),
            ]),
            // 2. Settle back to 1.0
            Animated.spring(scale, {
                toValue: 1,
                friction: 8,
                tension: 120,
                useNativeDriver: true,
            }),
            // 3. Hold on screen
            Animated.delay(900),
            // 4. Fade out
            Animated.timing(screenOpacity, {
                toValue: 0,
                duration: 450,
                useNativeDriver: true,
            }),
        ]).start(() => onFinish());
    }, []);

    return (
        <Animated.View style={[styles.root, { opacity: screenOpacity }]}>
            <LinearGradient
                colors={['#1A1A2E', '#0D1F1F']}
                style={styles.gradient}
            >
                {/* Soft teal background glow */}
                <View style={styles.glow} />

                {/* ── Logo — entire group animates together ── */}
                <Animated.View
                    style={[
                        styles.logoGroup,
                        { opacity, transform: [{ scale }] },
                    ]}
                >
                    <Image
                        source={require('../assets/images/icon.png')}
                        style={styles.logoImage}
                        resizeMode="contain"
                    />
                </Animated.View>

                {/* Bottom tagline */}
                <Animated.Text style={[styles.tagline, { opacity }]}>
                    Find your perfect home
                </Animated.Text>
            </LinearGradient>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    root: {
        position: 'absolute',
        width,
        height,
        zIndex: 9999,
    },
    gradient: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    glow: {
        position: 'absolute',
        width: 360,
        height: 360,
        borderRadius: 180,
        backgroundColor: 'rgba(29,173,168,0.10)',
    },
    logoGroup: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoImage: {
        width: 260,
        height: 260,
        borderRadius: 130, // Half of width/height makes it a perfect circle
        overflow: 'hidden',
    },
    tagline: {
        position: 'absolute',
        bottom: 60,
        color: 'rgba(255,255,255,0.35)',
        fontSize: 13,
        letterSpacing: 1.5,
        fontWeight: '400',
    },
});
