import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../src/lib/axios';
import { auth } from '../src/lib/firebaseConfig';
import { PhoneAuthProvider, signInWithCredential } from 'firebase/auth';
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';

const TEAL = '#1DADA8';
const TEAL_DARK = '#0F6E6A';
const TEAL_LIGHT = '#E1F7F6';

export default function LoginScreen() {
    const router = useRouter();
    const recaptchaVerifier = useRef(null);
    const [phoneNumber, setPhoneNumber] = useState('+91');
    const [verificationId, setVerificationId] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1); // 1: Phone, 2: OTP

    const handleSendOTP = async () => {
        if (!phoneNumber || phoneNumber.length < 10) {
            Alert.alert('Error', 'Please enter a valid phone number with country code (e.g. +91...)');
            return;
        }

        setLoading(true);
        try {
            const phoneProvider = new PhoneAuthProvider(auth);
            const verId = await phoneProvider.verifyPhoneNumber(
                phoneNumber,
                recaptchaVerifier.current!
            );
            setVerificationId(verId);
            setStep(2);
            Alert.alert('OTP Sent', 'An OTP has been sent to your phone number.');
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async () => {
        if (!verificationCode || verificationCode.length < 6) {
            Alert.alert('Error', 'Please enter the 6-digit OTP code');
            return;
        }

        setLoading(true);
        try {
            const credential = PhoneAuthProvider.credential(
                verificationId,
                verificationCode
            );
            const userCredential = await signInWithCredential(auth, credential);
            const idToken = await userCredential.user.getIdToken();

            // Send token to backend
            const res = await apiClient.post('/api/user/firebase-auth', { idToken });
            
            if (res.data.token) {
                await AsyncStorage.setItem('userToken', res.data.token);
                await AsyncStorage.setItem('userPhone', phoneNumber);
                router.replace('/(main)');
            } else if (res.data.needsRegistration) {
                // This shouldn't happen on login if they have an account,
                // but we can redirect to signup if needed.
                router.push({
                    pathname: '/signup',
                    params: { phoneNumber, idToken }
                });
            }
        } catch (error: any) {
            Alert.alert('Verification Failed', 'Invalid OTP or network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <FirebaseRecaptchaVerifierModal
                ref={recaptchaVerifier}
                firebaseConfig={auth.app.options}
            />

            <View style={styles.card}>
                {/* ── Logo */}
                <View style={styles.headerContainer}>
                    <View style={styles.logoRow}>
                        <View style={styles.iWrapper}>
                            <Text style={styles.logoI}>i</Text>
                            <LinearGradient
                                colors={['#5ECECA', '#1DADA8']}
                                style={styles.iDot}
                            />
                        </View>
                        <Text style={styles.logoRest}>TURSH</Text>
                    </View>
                    <Text style={styles.subtitle}>
                        {step === 1 ? 'Login with Phone' : 'Verify OTP'}
                    </Text>
                </View>

                {step === 1 ? (
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Phone Number</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="+91 98765 43210"
                            placeholderTextColor="#80CECC"
                            keyboardType="phone-pad"
                            autoComplete="tel"
                            value={phoneNumber}
                            onChangeText={setPhoneNumber}
                        />
                        <TouchableOpacity
                            style={[styles.btn, loading && styles.btnDisabled]}
                            onPress={handleSendOTP}
                            disabled={loading}
                            activeOpacity={0.8}
                        >
                            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>Send OTP</Text>}
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Verification Code</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="6-digit code"
                            placeholderTextColor="#80CECC"
                            keyboardType="number-pad"
                            maxLength={6}
                            value={verificationCode}
                            onChangeText={setVerificationCode}
                        />
                        <TouchableOpacity
                            style={[styles.btn, loading && styles.btnDisabled]}
                            onPress={handleVerifyOTP}
                            disabled={loading}
                            activeOpacity={0.8}
                        >
                            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>Verify & Login</Text>}
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setStep(1)} style={styles.changePhoneBtn}>
                            <Text style={styles.changePhoneText}>Change Phone Number</Text>
                        </TouchableOpacity>
                    </View>
                )}

                <View style={styles.footer}>
                    <Text style={styles.footerText}>Don't have an account? </Text>
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
    btn: {
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
    btnDisabled: {
        opacity: 0.7,
    },
    btnText: {
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
    changePhoneBtn: {
        marginTop: 16,
        alignItems: 'center',
    },
    changePhoneText: {
        color: TEAL,
        fontSize: 14,
        fontWeight: '600',
    },
});
