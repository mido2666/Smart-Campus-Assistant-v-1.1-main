import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, SafeAreaView, StatusBar, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { authService } from '../services/auth.service';
import { attendanceService } from '../services/attendance.service';

export default function HomeScreen({ navigation }: any) {
    const [pendingCount, setPendingCount] = useState(0);
    const [user, setUser] = useState<any>(null);

    const loadData = async () => {
        const count = await attendanceService.getPendingCount();
        setPendingCount(count);
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
    };

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    const handleSync = async () => {
        const result = await attendanceService.syncPendingAttempts();
        Alert.alert('Sync Complete', `Synced: ${result.synced}, Failed: ${result.errors}`);
        loadData();
    };

    const handleLogout = async () => {
        await authService.logout();
        navigation.replace('Login');
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#1D4ED8" />

            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.welcomeLabel}>Welcome back,</Text>
                    <Text style={styles.userName}>{user?.name?.split(' ')[0] || 'Student'}</Text>
                </View>
                <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Sync Alert */}
                {pendingCount > 0 && (
                    <View style={styles.alertCard}>
                        <View>
                            <Text style={styles.alertTitle}>Offline Records</Text>
                            <Text style={styles.alertDesc}>{pendingCount} attendance scans pending</Text>
                        </View>
                        <TouchableOpacity onPress={handleSync} style={styles.syncButton}>
                            <Text style={styles.syncButtonText}>Sync Now</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Quick Actions Title */}
                <Text style={styles.sectionTitle}>Quick Actions</Text>

                {/* Scan Card */}
                <TouchableOpacity
                    style={styles.actionCard}
                    onPress={() => navigation.navigate('QRScanner')}
                >
                    <View style={styles.iconCircle}>
                        <Text style={styles.iconText}>📷</Text>
                    </View>
                    <View style={styles.actionInfo}>
                        <Text style={styles.actionTitle}>Scan Attendance</Text>
                        <Text style={styles.actionDesc}>Scan QR code to mark your presence</Text>
                    </View>
                    <Text style={styles.arrow}>→</Text>
                </TouchableOpacity>

                {/* Placeholder for Schedule or Grades */}
                <View style={[styles.actionCard, styles.disabledCard]}>
                    <View style={[styles.iconCircle, styles.disabledIcon]}>
                        <Text style={styles.iconText}>📅</Text>
                    </View>
                    <View style={styles.actionInfo}>
                        <Text style={[styles.actionTitle, styles.disabledText]}>View Schedule</Text>
                        <Text style={styles.actionDesc}>Coming soon</Text>
                    </View>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
    },
    header: {
        backgroundColor: '#2563EB', // blue-600
        padding: 24,
        paddingTop: 40,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    welcomeLabel: {
        color: '#BFDBFE', // blue-200
        fontSize: 14,
        fontWeight: '500',
    },
    userName: {
        color: 'white',
        fontSize: 24,
        fontWeight: 'bold',
    },
    logoutButton: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    logoutText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 12,
    },
    content: {
        padding: 20,
    },
    alertCard: {
        backgroundColor: '#FEF3C7', // amber-100
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#F59E0B', // amber-500
    },
    alertTitle: {
        color: '#92400E', // amber-800
        fontWeight: 'bold',
        fontSize: 16,
    },
    alertDesc: {
        color: '#B45309', // amber-700
        fontSize: 12,
    },
    syncButton: {
        backgroundColor: '#F59E0B',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    syncButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 16,
    },
    actionCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
        marginBottom: 16,
    },
    iconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#EFF6FF', // blue-50
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    iconText: {
        fontSize: 24,
    },
    actionInfo: {
        flex: 1,
    },
    actionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
    },
    actionDesc: {
        fontSize: 13,
        color: '#6B7280',
        marginTop: 2,
    },
    arrow: {
        fontSize: 20,
        color: '#9CA3AF',
        fontWeight: 'bold',
    },
    disabledCard: {
        opacity: 0.6,
    },
    disabledIcon: {
        backgroundColor: '#F3F4F6',
    },
    disabledText: {
        color: '#6B7280',
    },
});
