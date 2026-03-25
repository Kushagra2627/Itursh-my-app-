import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../../../src/lib/axios';

export default function BookScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();

    const [form, setForm] = useState({
        peopleCount: '1',
        notes: ''
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!form.peopleCount) {
            Alert.alert("Error", "Please enter the number of people.");
            return;
        }

        try {
            setLoading(true);
            const token = await AsyncStorage.getItem('userToken');

            const payload = {
                propertyId: id,
                peopleCount: parseInt(form.peopleCount) || 1,
                notes: form.notes
            };

            const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

            await apiClient.post(`/api/user/bookings`, payload, config);

            Alert.alert("Success!", "Your booking has been created.", [
                { text: "OK", onPress: () => router.back() }
            ]);
        } catch (error) {
            console.error(error);
            Alert.alert("Failed", "Could not submit booking request.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.title}>Book Property</Text>
            </View>

            <View style={styles.form}>
                <Text style={styles.label}>Number of People</Text>
                <TextInput
                    style={styles.input}
                    placeholder="E.g. 2"
                    keyboardType="numeric"
                    value={form.peopleCount}
                    onChangeText={(val) => setForm(f => ({ ...f, peopleCount: val }))}
                />

                <Text style={styles.label}>Additional Notes</Text>
                <TextInput
                    style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
                    placeholder="Any specific requests or info?"
                    multiline
                    value={form.notes}
                    onChangeText={(val) => setForm(f => ({ ...f, notes: val }))}
                />

                <TouchableOpacity
                    style={[styles.btn, loading && { opacity: 0.7 }]}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    <Text style={styles.btnText}>{loading ? "Submitting..." : "Submit Booking"}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FBF9' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
        backgroundColor: '#FFF',
    },
    backBtn: { marginRight: 15 },
    title: { fontSize: 24, fontWeight: '700', color: '#111' },
    form: { padding: 20 },
    label: { fontSize: 14, fontWeight: '600', color: '#555', marginBottom: 8 },
    input: {
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 12,
        padding: 14,
        marginBottom: 20,
        fontSize: 16,
    },
    btn: {
        backgroundColor: '#4CAF50',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
    },
    btnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});
