import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import apiClient from '../../lib/axios';

const VIOLET = '#6A0DAD';
const VIOLET_DARK = '#4B0082';
const VIOLET_LIGHT = '#EDE7F6';

type FormData = {
    title: string;
    description: string;
    price: string;
    location: string;
    bedrooms: string;
    bathrooms: string;
};

const INITIAL: FormData = {
    title: '',
    description: '',
    price: '',
    location: '',
    bedrooms: '',
    bathrooms: '',
};

export default function AddProperty() {
    const router = useRouter();
    const [form, setForm] = useState<FormData>(INITIAL);
    const [mediaAssets, setMediaAssets] = useState<ImagePicker.ImagePickerAsset[]>([]);
    const [loading, setLoading] = useState(false);

    const update = (field: keyof FormData, value: string) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handlePickMedia = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permissionResult.granted === false) {
            Alert.alert("Permission Required", "Permission to access camera roll is required!");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images', 'videos'],
            allowsMultipleSelection: true,
            quality: 1,
        });

        if (!result.canceled && result.assets) {
            setMediaAssets(prev => [...prev, ...result.assets]);
        }
    };

    const removeMedia = (index: number) => {
        setMediaAssets(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        const { title, description, price, location, bedrooms, bathrooms } = form;
        if (!title || !description || !price || !location || !bedrooms || !bathrooms) {
            Alert.alert('Missing Fields', 'Please fill in all fields before submitting.');
            return;
        }
        if (isNaN(Number(price)) || isNaN(Number(bedrooms)) || isNaN(Number(bathrooms))) {
            Alert.alert('Invalid Input', 'Price, bedrooms, and bathrooms must be valid numbers.');
            return;
        }

        setLoading(true);
        try {
            // First create the property
            const res = await apiClient.post('/api/admin/properties', {
                title,
                description,
                price: parseFloat(price),
                location,
                bedrooms: parseInt(bedrooms),
                bathrooms: parseInt(bathrooms),
            });

            const newPropertyId = res.data.property.id;

            // If there's media, upload it to the new property
            if (mediaAssets.length > 0) {
                const formData = new FormData();
                mediaAssets.forEach((asset, index) => {
                    const fileUri = Platform.OS === 'ios' ? asset.uri.replace('file://', '') : asset.uri;

                    let type = asset.mimeType;
                    if (!type) {
                        const extension = fileUri.split('.').pop()?.toLowerCase();
                        if (asset.type === 'video') {
                            type = 'video/mp4';
                        } else if (extension === 'png') {
                            type = 'image/png';
                        } else if (extension === 'gif') {
                            type = 'image/gif';
                        } else {
                            type = 'image/jpeg';
                        }
                    }

                    formData.append('media', {
                        uri: fileUri,
                        name: asset.fileName || `media-${index}-${Date.now()}.jpg`,
                        type: type,
                    } as any);
                });

                await apiClient.post(`/api/admin/properties/${newPropertyId}/media`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
            }

            Alert.alert('Success', 'Property added successfully!', [
                { text: 'OK', onPress: () => router.back() },
            ]);
        } catch (err: any) {
            console.error(err);
            Alert.alert('Error', err.message || 'Failed to add property.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Property Details</Text>

                    <InputField label="Title" value={form.title} onChangeText={(v) => update('title', v)} placeholder="e.g. Cozy Studio in Downtown" />
                    <InputField label="Description" value={form.description} onChangeText={(v) => update('description', v)} placeholder="Describe the property..." multiline />
                    <InputField label="Price (₹/month)" value={form.price} onChangeText={(v) => update('price', v)} placeholder="e.g. 25000" keyboardType="numeric" />
                    <InputField label="Location" value={form.location} onChangeText={(v) => update('location', v)} placeholder="e.g. Sector 62, Noida" />

                    <View style={styles.row}>
                        <View style={styles.halfField}>
                            <InputField label="Bedrooms" value={form.bedrooms} onChangeText={(v) => update('bedrooms', v)} placeholder="e.g. 2" keyboardType="numeric" />
                        </View>
                        <View style={styles.halfField}>
                            <InputField label="Bathrooms" value={form.bathrooms} onChangeText={(v) => update('bathrooms', v)} placeholder="e.g. 1" keyboardType="numeric" />
                        </View>
                    </View>

                    {/* Media Upload Section */}
                    <View style={styles.mediaSection}>
                        <Text style={styles.label}>Photos & Videos (Optional)</Text>

                        {mediaAssets.length > 0 && (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mediaPreviewContainer}>
                                {mediaAssets.map((asset, index) => (
                                    <View key={index} style={styles.mediaWrapper}>
                                        {asset.type === 'video' ? (
                                            <View style={[styles.mediaPreview, styles.videoPlaceholder]}>
                                                <Text style={styles.videoText}>🎬 Video</Text>
                                            </View>
                                        ) : (
                                            <Image source={{ uri: asset.uri }} style={styles.mediaPreview} />
                                        )}
                                        <TouchableOpacity style={styles.removeMediaBtn} onPress={() => removeMedia(index)}>
                                            <Text style={styles.removeMediaText}>✕</Text>
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </ScrollView>
                        )}

                        <TouchableOpacity style={styles.addMediaBtn} onPress={handlePickMedia}>
                            <Text style={styles.addMediaBtnText}>📸 Select Photos & Videos</Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
                        onPress={handleSubmit}
                        disabled={loading}
                        activeOpacity={0.85}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.submitBtnText}>➕  Add Property</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

function InputField({
    label,
    value,
    onChangeText,
    placeholder,
    multiline = false,
    keyboardType = 'default',
}: {
    label: string;
    value: string;
    onChangeText: (v: string) => void;
    placeholder?: string;
    multiline?: boolean;
    keyboardType?: 'default' | 'numeric' | 'email-address';
}) {
    return (
        <View style={styles.inputGroup}>
            <Text style={styles.label}>{label}</Text>
            <TextInput
                style={[styles.input, multiline && styles.multilineInput]}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor="#B0A0CC"
                multiline={multiline}
                numberOfLines={multiline ? 4 : 1}
                keyboardType={keyboardType}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1, backgroundColor: '#F5F0FF' },
    scroll: { padding: 20, paddingBottom: 40 },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#6A0DAD',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: VIOLET_DARK, marginBottom: 20 },
    inputGroup: { marginBottom: 16 },
    label: { fontSize: 13, fontWeight: '600', color: VIOLET_DARK, marginBottom: 6 },
    input: {
        borderWidth: 1.5,
        borderColor: '#DDD5EE',
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 11,
        fontSize: 15,
        color: '#333',
        backgroundColor: VIOLET_LIGHT,
    },
    multilineInput: { textAlignVertical: 'top', minHeight: 90, paddingTop: 12 },
    row: { flexDirection: 'row', gap: 12 },
    halfField: { flex: 1 },
    submitBtn: {
        backgroundColor: VIOLET,
        borderRadius: 12,
        paddingVertical: 15,
        alignItems: 'center',
        marginTop: 10,
        shadowColor: VIOLET,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
        elevation: 6,
    },
    submitBtnDisabled: { opacity: 0.6 },
    submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    mediaSection: { marginBottom: 20 },
    mediaPreviewContainer: { flexDirection: 'row', marginBottom: 12 },
    mediaWrapper: { position: 'relative', marginRight: 12 },
    mediaPreview: { width: 80, height: 80, borderRadius: 8, backgroundColor: '#EEE' },
    videoPlaceholder: { justifyContent: 'center', alignItems: 'center', backgroundColor: '#DDD5EE' },
    videoText: { fontSize: 12, color: VIOLET_DARK, fontWeight: '600' },
    removeMediaBtn: {
        position: 'absolute',
        top: -6,
        right: -6,
        backgroundColor: '#FF3B30',
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FFF',
    },
    removeMediaText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
    addMediaBtn: {
        borderWidth: 1.5,
        borderColor: VIOLET,
        borderRadius: 10,
        paddingVertical: 12,
        alignItems: 'center',
        borderStyle: 'dashed',
    },
    addMediaBtnText: { color: VIOLET, fontSize: 14, fontWeight: '600' },
});
