import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { authService } from '../services/auth.service';

export default function LoginScreen({ navigation }: any) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }
        setIsLoading(true);
        try {
            await authService.login(email, password);
            // Reset state if needed
            navigation.replace('Home');
        } catch (error) {
            Alert.alert('Login Failed', 'Invalid credentials or server error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <View style={styles.headerContainer}>
                    <Text style={styles.appName}>Smart Campus</Text>
                    <Text style={styles.tagline}>Assistant</Text>
                </View>

                <View style={styles.formContainer}>
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Welcome Back</Text>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Email</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="student@university.edu"
                                placeholderTextColor="#9CA3AF"
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Password</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your password"
                                placeholderTextColor="#9CA3AF"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.button, isLoading && styles.buttonDisabled]}
                            onPress={handleLogin}
                            disabled={isLoading}
                        >
                            <Text style={styles.buttonText}>{isLoading ? 'Logging in...' : 'Login'}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6', // gray-100
    },
    keyboardView: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
    },
    headerContainer: {
        marginBottom: 40,
        alignItems: 'center',
    },
    appName: {
        fontSize: 32,
        fontWeight: '800',
        color: '#111827', // gray-900
        marginBottom: 4,
    },
    tagline: {
        fontSize: 18,
        color: '#4B5563', // gray-600
        fontWeight: '500',
    },
    formContainer: {
        width: '100%',
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    cardTitle: {
        fontSize: 24,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 24,
        textAlign: 'center',
    },
    inputContainer: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151', // gray-700
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#F9FAFB', // gray-50
        borderWidth: 1,
        borderColor: '#D1D5DB', // gray-300
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: '#111827',
    },
    button: {
        backgroundColor: '#2563EB', // blue-600
        borderRadius: 8,
        paddingVertical: 14,
        marginTop: 8,
        alignItems: 'center',
    },
    buttonDisabled: {
        backgroundColor: '#93C5FD', // blue-300
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});
