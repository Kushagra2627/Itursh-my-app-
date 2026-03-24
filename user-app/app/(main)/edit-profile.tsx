import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../../src/lib/axios';

const GREEN = '#4CAF50';

export default function EditProfileScreen() {
    const router = useRouter();

    const [form, setForm] = useState({
        name: '',
        email: '',
        phone: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await apiClient.get('/api/user/profile');
            const user = res.data.user;
            setForm({
                name: user.name || '',
                email: user.email || '',
                phone: user.phone || ''
            });
        } catch (error: any) {
            console.error('Fetch profile error:', error);
            if (error.response?.status === 401 || error.response?.status === 404) {
                await AsyncStorage.removeItem('userToken');
                router.replace('/login' as any);
                return;
            }
            Alert.alert('Error', 'Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!form.name) {
            Alert.alert('Error', 'Name is required');
            return;
        }

        try {
            setSaving(true);
            await apiClient.patch('/api/user/profile', form);
            Alert.alert('Success', 'Profile updated successfully', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error) {
            console.error('Update profile error:', error);
            Alert.alert('Error', 'Could not update profile');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={GREEN} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.title}>Edit Profile</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.formContainer}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                    style={styles.input}
                    value={form.name}
                    onChangeText={(text) => setForm(f => ({ ...f, name: text }))}
                    placeholder="Enter your name"
                />

                <Text style={styles.label}>Email Address (Optional)</Text>
                <TextInput
                    style={styles.input}
                    value={form.email}
                    onChangeText={(text) => setForm(f => ({ ...f, email: text }))}
                    placeholder="Enter your email"
                    keyboardType="email-address"
                    autoCapitalize="none"
                />

                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                    style={styles.input}
                    value={form.phone}
                    onChangeText={(text) => setForm(f => ({ ...f, phone: text }))}
                    placeholder="Enter your phone number"
                    keyboardType="phone-pad"
                />

                <TouchableOpacity 
                    style={[styles.saveBtn, saving && { opacity: 0.7 }]} 
                    onPress={handleSave}
                    disabled={saving}
                >
                    <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save Profile'}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111',
    },
    backBtn: {
        padding: 4,
    },
    formContainer: {
        padding: 24,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#555',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#F9FBF9',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        marginBottom: 20,
        color: '#111',
    },
    saveBtn: {
        backgroundColor: GREEN,
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 10,
    },
    saveBtnText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFF',
    }
});
