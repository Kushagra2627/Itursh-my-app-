import React, { useState, useEffect } from 'react';
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
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import apiClient from '../../../lib/axios';

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

export default function EditProperty() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();

    const [form, setForm] = useState<FormData>({
        title: '',
        description: '',
        price: '',
        location: '',
        bedrooms: '',
        bathrooms: '',
    });
    const [existingImages, setExistingImages] = useState<string[]>([]);
    const [existingVideos, setExistingVideos] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [uploadingMedia, setUploadingMedia] = useState(false);

    useEffect(() => {
        // Pre-fill from query params if passed (from manage-properties via router.push params)
        fetchProperty();
    }, [id]);

    const fetchProperty = async () => {
        setFetching(true);
        try {
            const res = await apiClient.get('/api/admin/properties');
            const properties: any[] = res.data.properties || [];
            const prop = properties.find((p: any) => p.id === id);
            if (prop) {
                setForm({
                    title: prop.title ?? '',
                    description: prop.description ?? '',
                    price: String(prop.price ?? ''),
                    location: prop.location ?? '',
                    bedrooms: String(prop.bedrooms ?? ''),
                    bathrooms: String(prop.bathrooms ?? ''),
                });
                setExistingImages(prop.images || []);
                setExistingVideos(prop.videos || []);
            } else {
                Alert.alert('Error', 'Property not found.');
                router.back();
            }
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to fetch property.');
            router.back();
        } finally {
            setFetching(false);
        }
    };

    const update = (field: keyof FormData, value: string) =>
        setForm((prev) => ({ ...prev, [field]: value }));

    const handleUpdate = async () => {
        const { title, description, price, location, bedrooms, bathrooms } = form;
        if (!title || !description || !price || !location || !bedrooms || !bathrooms) {
            Alert.alert('Missing Fields', 'Please fill in all fields.');
            return;
        }

        setLoading(true);
        try {
            await apiClient.patch(`/api/admin/properties/${id}`, {
                title,
                description,
                price: parseFloat(price),
                location,
                bedrooms: parseInt(bedrooms),
                bathrooms: parseInt(bathrooms),
            });
            Alert.alert('Success', 'Property updated successfully!', [
                { text: 'OK', onPress: () => router.back() },
            ]);
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to update property.');
        } finally {
            setLoading(false);
        }
    };

    const handleAddMedia = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permissionResult.granted === false) {
            Alert.alert("Permission to access camera roll is required!");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images', 'videos'],
            allowsMultipleSelection: true,
            quality: 1,
        });

        if (!result.canceled && result.assets) {
            setUploadingMedia(true);
            try {
                const formData = new FormData();
                result.assets.forEach((asset, index) => {
                    const fileUri = Platform.OS === 'ios' ? asset.uri.replace('file://', '') : asset.uri;

                    // Fallback to determine mimeType correctly if missing
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

                await apiClient.post(`/api/admin/properties/${id}/media`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });

                Alert.alert('Success', 'Media uploaded successfully!');
                fetchProperty(); // Refresh to show new media
            } catch (err: any) {
                console.error(err);
                Alert.alert('Error', err.message || 'Failed to upload media.');
            } finally {
                setUploadingMedia(false);
            }
        }
    };

    if (fetching) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={VIOLET} />
                <Text style={styles.loadingText}>Loading property...</Text>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Edit Property</Text>

                    <FieldInput label="Title" value={form.title} onChange={(v) => update('title', v)} />
                    <FieldInput label="Description" value={form.description} onChange={(v) => update('description', v)} multiline />
                    <FieldInput label="Price (₹/month)" value={form.price} onChange={(v) => update('price', v)} keyboardType="numeric" />
                    <FieldInput label="Location" value={form.location} onChange={(v) => update('location', v)} />

                    <View style={styles.row}>
                        <View style={styles.half}>
                            <FieldInput label="Bedrooms" value={form.bedrooms} onChange={(v) => update('bedrooms', v)} keyboardType="numeric" />
                        </View>
                        <View style={styles.half}>
                            <FieldInput label="Bathrooms" value={form.bathrooms} onChange={(v) => update('bathrooms', v)} keyboardType="numeric" />
                        </View>
                    </View>

                    {/* Media Section */}
                    <View style={styles.mediaSection}>
                        <Text style={styles.sectionTitle}>Property Media</Text>

                        {existingImages.length > 0 && (
                            <View style={styles.mediaContainer}>
                                <Text style={styles.mediaLabel}>Images ({existingImages.length}):</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                    {existingImages.map((img, index) => (
                                        <Image key={index} source={{ uri: `${apiClient.defaults.baseURL}${img}` }} style={styles.mediaPreview} />
                                    ))}
                                </ScrollView>
                            </View>
                        )}

                        {existingVideos.length > 0 && (
                            <View style={styles.mediaContainer}>
                                <Text style={styles.mediaLabel}>Videos ({existingVideos.length})</Text>
                                {/* Rendering a placeholder for videos for now, can be replaced with expo-av Video later */}
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                    {existingVideos.map((vid, index) => (
                                        <View key={index} style={[styles.mediaPreview, styles.videoPlaceholder]}>
                                            <Text style={styles.videoText}>🎬 Video {index + 1}</Text>
                                        </View>
                                    ))}
                                </ScrollView>
                            </View>
                        )}

                        <TouchableOpacity
                            style={[styles.btnOutline, uploadingMedia && styles.btnDisabled]}
                            onPress={handleAddMedia}
                            disabled={uploadingMedia}
                        >
                            {uploadingMedia ? (
                                <ActivityIndicator color={VIOLET} />
                            ) : (
                                <Text style={styles.btnOutlineText}>📸  Add Photos & Videos</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={[styles.btn, loading && styles.btnDisabled]}
                        onPress={handleUpdate}
                        disabled={loading}
                        activeOpacity={0.85}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.btnText}>✅  Save Changes</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

function FieldInput({
    label,
    value,
    onChange,
    multiline = false,
    keyboardType = 'default',
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    multiline?: boolean;
    keyboardType?: 'default' | 'numeric';
}) {
    return (
        <View style={styles.inputGroup}>
            <Text style={styles.label}>{label}</Text>
            <TextInput
                style={[styles.input, multiline && styles.multiline]}
                value={value}
                onChangeText={onChange}
                multiline={multiline}
                numberOfLines={multiline ? 4 : 1}
                keyboardType={keyboardType}
                placeholderTextColor="#B0A0CC"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1, backgroundColor: '#F5F0FF' },
    scroll: { padding: 20, paddingBottom: 40 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F0FF' },
    loadingText: { marginTop: 12, color: VIOLET, fontSize: 14 },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        shadowColor: VIOLET,
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
    multiline: { textAlignVertical: 'top', minHeight: 90, paddingTop: 12 },
    row: { flexDirection: 'row', gap: 12 },
    half: { flex: 1 },
    btn: {
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
    btnDisabled: { opacity: 0.6 },
    btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    mediaSection: { marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: '#DDD5EE' },
    mediaContainer: { marginBottom: 15 },
    mediaLabel: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 8 },
    mediaPreview: { width: 100, height: 100, borderRadius: 8, marginRight: 10, backgroundColor: '#EEE' },
    videoPlaceholder: { justifyContent: 'center', alignItems: 'center', backgroundColor: '#DDD5EE' },
    videoText: { fontSize: 12, color: VIOLET_DARK, fontWeight: '600' },
    btnOutline: {
        borderWidth: 1.5,
        borderColor: VIOLET,
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 5,
        marginBottom: 20,
    },
    btnOutlineText: { color: VIOLET, fontSize: 15, fontWeight: '700' },
});
