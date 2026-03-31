import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../../src/lib/axios';

const TEAL = '#1DADA8';
const TEAL_DARK = '#0F6E6A';
const TEAL_LIGHT = '#E1F7F6';

export default function BookPropertyScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();

    const [form, setForm] = useState({
        tenantName: '',
        tenantEmail: '',
        phone: '',
        peopleCount: '',
        notes: '',
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchUserEmail = async () => {
            const email = await AsyncStorage.getItem('userEmail');
            if (email) setForm(prev => ({ ...prev, tenantEmail: email }));
        };
        fetchUserEmail();
    }, []);

    const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

    const handleBooking = async () => {
        const { tenantName, tenantEmail, phone, peopleCount, notes } = form;

        if (!tenantName || !tenantEmail || !phone || !peopleCount) {
            Alert.alert('Missing Fields', 'Please fill in Name, Email, Phone, and People Count.');
            return;
        }

        setLoading(true);
        try {
            await apiClient.post('/api/user/bookings', {
                propertyId: id,
                tenantName,
                tenantEmail,
                phone,
                peopleCount: parseInt(peopleCount),
                notes,
            });
            Alert.alert('Success', 'Booking request submitted!', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error: any) {
            const msg = error.response?.data?.error || 'Failed to submit booking request';
            Alert.alert('Error', msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Book Property</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                <View style={styles.card}>
                    <Text style={styles.subtitle}>Please fill out your details to request a booking.</Text>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Full Name *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="John Doe"
                            value={form.tenantName}
                            onChangeText={(v) => update('tenantName', v)}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="you@example.com"
                            keyboardType="email-address"
                            value={form.tenantEmail}
                            onChangeText={(v) => update('tenantEmail', v)}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Phone Number *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="9876543210"
                            keyboardType="phone-pad"
                            value={form.phone}
                            onChangeText={(v) => update('phone', v)}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Number of People *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. 2"
                            keyboardType="numeric"
                            value={form.peopleCount}
                            onChangeText={(v) => update('peopleCount', v)}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Additional Notes (Optional)</Text>
                        <TextInput
                            style={[styles.input, styles.multiline]}
                            placeholder="Any special requests or details"
                            multiline
                            numberOfLines={3}
                            value={form.notes}
                            onChangeText={(v) => update('notes', v)}
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.btn, loading && styles.btnDisabled]}
                        onPress={handleBooking}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <Text style={styles.btnText}>Submit Booking Request</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FBF9' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 16,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    backBtn: { padding: 8, marginRight: 12, marginLeft: -8 },
    headerTitle: { fontSize: 20, fontWeight: '700', color: '#111' },
    scrollContent: { padding: 20, paddingBottom: 60 },
    card: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 24,
        shadowColor: TEAL_DARK,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.06,
        shadowRadius: 16,
        elevation: 6,
    },
    subtitle: { fontSize: 14, color: '#666', marginBottom: 24, lineHeight: 20 },
    inputGroup: { marginBottom: 16 },
    label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8, marginLeft: 4 },
    input: {
        backgroundColor: '#F9FBF9',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 15,
        color: '#333',
    },
    multiline: { minHeight: 80, textAlignVertical: 'top' },
    btn: {
        backgroundColor: TEAL,
        borderRadius: 16,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 16,
        shadowColor: TEAL,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    btnDisabled: { opacity: 0.7 },
    btnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
