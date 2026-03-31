import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const TEAL = '#1DADA8';

export default function FeedbackScreen() {
    const router = useRouter();
    const [feedback, setFeedback] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = () => {
        if (!feedback.trim()) {
            Alert.alert('Error', 'Please enter your feedback before submitting.');
            return;
        }

        setSubmitting(true);

        // Mock API call to submit feedback
        setTimeout(() => {
            setSubmitting(false);
            Alert.alert('Thank You!', 'Your feedback has been submitted successfully.', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        }, 1000);
    };

    return (
        <KeyboardAvoidingView 
            style={styles.container} 
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={styles.inner}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                            <Ionicons name="arrow-back" size={24} color="#333" />
                        </TouchableOpacity>
                        <Text style={styles.title}>Feedback</Text>
                        <View style={{ width: 24 }} />
                    </View>

                    <View style={styles.content}>
                        <Text style={styles.heading}>We&apos;d love to hear from you!</Text>
                        <Text style={styles.subtitle}>
                            Please share your thoughts, suggestions, or any issues you are facing with our app.
                        </Text>

                        <TextInput
                            style={styles.textInput}
                            placeholder="Write your feedback here..."
                            multiline
                            numberOfLines={6}
                            value={feedback}
                            onChangeText={setFeedback}
                            textAlignVertical="top"
                        />

                        <TouchableOpacity 
                            style={[styles.submitBtn, submitting && { opacity: 0.7 }]} 
                            onPress={handleSubmit}
                            disabled={submitting}
                        >
                            <Text style={styles.submitBtnText}>{submitting ? 'Submitting...' : 'Submit Feedback'}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF',
    },
    inner: {
        flex: 1,
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
    content: {
        padding: 24,
        flex: 1,
    },
    heading: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#111',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 15,
        color: '#666',
        marginBottom: 24,
        lineHeight: 22,
    },
    textInput: {
        backgroundColor: '#F5FAFA',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: '#111',
        minHeight: 150,
        marginBottom: 24,
    },
    submitBtn: {
        backgroundColor: TEAL,
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
    },
    submitBtnText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFF',
    }
});
