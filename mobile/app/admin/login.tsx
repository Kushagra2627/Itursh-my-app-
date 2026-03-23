import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import apiClient from '../../lib/axios';

const VIOLET = '#6A0DAD';
const VIOLET_DARK = '#4B0082';
const VIOLET_LIGHT = '#EDE7F6';

export default function AdminLogin() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async () => {
        if (!email.trim() || !password.trim()) {
            Alert.alert('Missing Fields', 'Please enter both email and password.');
            return;
        }

        setLoading(true);
        try {
            const response = await apiClient.post('/api/admin/login', {
                email: email.trim(),
                password: password.trim(),
            });
            const { token } = response.data;
            await SecureStore.setItemAsync('admin_token', token);
            router.replace('/admin');
        } catch (err: any) {
            Alert.alert('Login Failed', err.message || 'Invalid credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <StatusBar barStyle="light-content" backgroundColor={VIOLET_DARK} />
            <ScrollView
                contentContainerStyle={styles.scroll}
                keyboardShouldPersistTaps="handled"
            >
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.iconContainer}>
                        <Text style={styles.iconText}>🏠</Text>
                    </View>
                    <Text style={styles.appName}>RentAdmin</Text>
                    <Text style={styles.subtitle}>Control Panel Access</Text>
                </View>

                {/* Card */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Admin Login</Text>
                    <Text style={styles.cardSubtitle}>Authorized personnel only</Text>

                    {/* Email Input */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email Address</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="admin@example.com"
                            placeholderTextColor="#B0A0CC"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            autoCorrect={false}
                        />
                    </View>

                    {/* Password Input */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Password</Text>
                        <View style={styles.passwordWrapper}>
                            <TextInput
                                style={[styles.input, styles.passwordInput]}
                                placeholder="Enter password"
                                placeholderTextColor="#B0A0CC"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                                autoCorrect={false}
                            />
                            <TouchableOpacity
                                style={styles.eyeBtn}
                                onPress={() => setShowPassword((v) => !v)}
                            >
                                <Text style={styles.eyeText}>{showPassword ? '🙈' : '👁️'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Login Button */}
                    <TouchableOpacity
                        style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
                        onPress={handleLogin}
                        disabled={loading}
                        activeOpacity={0.85}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.loginBtnText}>Login to Admin Panel</Text>
                        )}
                    </TouchableOpacity>

                    <Text style={styles.secureNote}>🔒 Secure admin access only</Text>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1, backgroundColor: VIOLET_DARK },
    scroll: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingVertical: 40,
        backgroundColor: VIOLET_DARK,
    },
    header: { alignItems: 'center', marginBottom: 32 },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    iconText: { fontSize: 36 },
    appName: { fontSize: 28, fontWeight: '800', color: '#fff', letterSpacing: 1 },
    subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 4 },

    card: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 28,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 12,
    },
    cardTitle: { fontSize: 22, fontWeight: '700', color: VIOLET_DARK, marginBottom: 4 },
    cardSubtitle: { fontSize: 13, color: '#888', marginBottom: 24 },

    inputGroup: { marginBottom: 18 },
    label: { fontSize: 13, fontWeight: '600', color: VIOLET_DARK, marginBottom: 6 },
    input: {
        borderWidth: 1.5,
        borderColor: '#DDD5EE',
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
        color: '#333',
        backgroundColor: VIOLET_LIGHT,
    },
    passwordWrapper: { position: 'relative' },
    passwordInput: { paddingRight: 46 },
    eyeBtn: {
        position: 'absolute',
        right: 12,
        top: 0,
        bottom: 0,
        justifyContent: 'center',
    },
    eyeText: { fontSize: 18 },

    loginBtn: {
        backgroundColor: VIOLET,
        borderRadius: 12,
        paddingVertical: 15,
        alignItems: 'center',
        marginTop: 8,
        shadowColor: VIOLET,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 6,
    },
    loginBtnDisabled: { opacity: 0.6 },
    loginBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },

    secureNote: {
        textAlign: 'center',
        color: '#AAA',
        fontSize: 12,
        marginTop: 16,
    },
});
