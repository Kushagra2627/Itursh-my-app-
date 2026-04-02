import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../src/lib/axios';

const TEAL = '#1DADA8';
const TEAL_DARK = '#0F6E6A';
const TEAL_LIGHT = '#E1F7F6';

export default function LoginScreen() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please enter email and password');
            return;
        }

        setLoading(true);
        try {
            const res = await apiClient.post('/api/user/login', { email, password });
            if (res.data.token) {
                await AsyncStorage.setItem('userToken', res.data.token);
                await AsyncStorage.setItem('userEmail', email);
                router.replace('/(main)');
            }
        } catch (error: any) {
            const msg = error.response?.data?.error || 'Login failed';
            Alert.alert('Login Failed', msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={styles.card}>
                {/* ── Logo */}
                <View style={styles.headerContainer}>
                    <View style={styles.logoRow}>
                        {/* "i" with teal dot */}
                        <View style={styles.iWrapper}>
                            <Text style={styles.logoI}>i</Text>
                            <LinearGradient
                                colors={['#5ECECA', '#1DADA8']}
                                style={styles.iDot}
                            />
                        </View>
                        <Text style={styles.logoRest}>TURSH</Text>
                    </View>
                    <Text style={styles.subtitle}>Welcome back</Text>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Email</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="you@example.com"
                        placeholderTextColor="#80CECC"
                        autoCapitalize="none"
                        keyboardType="email-address"
                        value={email}
                        onChangeText={setEmail}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Password</Text>
                    <View style={styles.passwordContainer}>
                        <TextInput
                            style={[styles.input, styles.passwordInput]}
                            placeholder="••••••••"
                            placeholderTextColor="#80CECC"
                            secureTextEntry={!showPassword}
                            value={password}
                            onChangeText={setPassword}
                        />
                        <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowPassword(!showPassword)}>
                            <Ionicons name={showPassword ? "eye-off" : "eye"} size={22} color="#1DADA8" />
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity style={styles.forgotBtn} onPress={() => Alert.alert('Forgot Password', 'Password recovery coming soon.')}>
                        <Text style={styles.forgotText}>Forgot Password?</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
                    onPress={handleLogin}
                    disabled={loading}
                    activeOpacity={0.8}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <Text style={styles.loginBtnText}>Login</Text>
                    )}
                </TouchableOpacity>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>Don&apos;t have an account? </Text>
                    <TouchableOpacity onPress={() => router.push('/signup')}>
                        <Text style={styles.linkText}>Sign Up</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5FAFA',
        justifyContent: 'center',
        padding: 24,
    },
    card: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 24,
        paddingVertical: 32,
        shadowColor: TEAL_DARK,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.08,
        shadowRadius: 20,
        elevation: 8,
    },
    headerContainer: {
        alignItems: 'center',
        marginBottom: 32,
    },
    logoRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginBottom: 8,
    },
    iWrapper: {
        alignItems: 'center',
        marginRight: 1,
    },
    logoI: {
        fontSize: 36,
        fontWeight: '800',
        color: '#1A1A2E',
        letterSpacing: -0.5,
        lineHeight: 40,
    },
    iDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        position: 'absolute',
        top: 2,
    },
    logoRest: {
        fontSize: 36,
        fontWeight: '800',
        color: '#1A1A2E',
        letterSpacing: -0.5,
        lineHeight: 40,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        fontWeight: '500',
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
        marginLeft: 4,
    },
    input: {
        backgroundColor: TEAL_LIGHT,
        borderWidth: 1,
        borderColor: '#B2E8E6',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: '#333',
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: TEAL_LIGHT,
        borderWidth: 1,
        borderColor: '#B2E8E6',
        borderRadius: 16,
    },
    passwordInput: {
        flex: 1,
        borderWidth: 0,
        backgroundColor: 'transparent',
    },
    eyeIcon: {
        padding: 14,
    },
    forgotBtn: {
        alignSelf: 'flex-end',
        marginTop: 8,
    },
    forgotText: {
        color: TEAL,
        fontSize: 13,
        fontWeight: '600',
    },
    loginBtn: {
        backgroundColor: TEAL,
        borderRadius: 16,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 12,
        shadowColor: TEAL,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    loginBtnDisabled: {
        opacity: 0.7,
    },
    loginBtnText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 24,
    },
    footerText: {
        color: '#666',
        fontSize: 14,
    },
    linkText: {
        color: TEAL,
        fontSize: 14,
        fontWeight: '700',
    },
});
