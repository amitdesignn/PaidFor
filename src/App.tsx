// Main App Component

import React, { useEffect, useRef, useState } from 'react';
import { StatusBar, AppState, AppStateStatus, Alert, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import AppNavigator from './navigation/AppNavigator';
import {
    initializeNotifications,
    setupNotificationHandlers,
    setupBackgroundHandler,
    handleParsedSms,
} from './services/notificationService';
import { requestSmsPermission, checkSmsPermission, startSmsListener } from './services/smsService';
import { parseBankSms } from './utils/smsParser';
import { NavigationContainerRef } from '@react-navigation/native';
import { RootStackParamList } from './navigation/AppNavigator';

// Setup background handler (must be outside component)
setupBackgroundHandler();

export default function App() {
    const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);

    // Check and request SMS permission
    useEffect(() => {
        const checkAndRequestPermission = async () => {
            const granted = await checkSmsPermission();
            if (granted) {
                setHasPermission(true);
            } else {
                // Request permission
                const result = await requestSmsPermission();
                setHasPermission(result);
                if (!result) {
                    Alert.alert(
                        'SMS Permission Required',
                        'This app needs SMS permission to detect bank transactions and remind you to add notes.',
                        [{ text: 'OK' }]
                    );
                }
            }
        };

        checkAndRequestPermission();
    }, []);

    // Start SMS listener when permission is granted
    useEffect(() => {
        if (!hasPermission) return;

        const unsubscribe = startSmsListener(async (sms) => {
            // Parse the SMS
            const parsed = parseBankSms(sms);
            if (parsed) {
                // Handle the parsed SMS (save + maybe notify)
                await handleParsedSms(parsed);
            }
        });

        return unsubscribe;
    }, [hasPermission]);

    useEffect(() => {
        // Initialize notifications on app start
        initializeNotifications();

        // Setup foreground notification handlers
        const unsubscribe = setupNotificationHandlers((transactionId) => {
            // Navigate to note capture screen
            if (navigationRef.current?.isReady()) {
                navigationRef.current.navigate('NoteCapture', { transactionId });
            }
        });

        return unsubscribe;
    }, []);

    // Handle app state changes for notification refreshes
    useEffect(() => {
        const subscription = AppState.addEventListener(
            'change',
            (nextAppState: AppStateStatus) => {
                if (nextAppState === 'active') {
                    // App came to foreground - could refresh data here if needed
                }
            }
        );

        return () => subscription.remove();
    }, []);

    // Show permission request screen if permission is denied
    if (hasPermission === false) {
        return (
            <View style={styles.permissionContainer}>
                <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
                <Text style={styles.permissionIcon}>📱</Text>
                <Text style={styles.permissionTitle}>SMS Permission Needed</Text>
                <Text style={styles.permissionText}>
                    PaidFor needs to read your SMS messages to detect bank transactions and remind you to add notes.
                </Text>
                <TouchableOpacity
                    style={styles.permissionButton}
                    onPress={async () => {
                        const result = await requestSmsPermission();
                        setHasPermission(result);
                    }}
                >
                    <Text style={styles.permissionButtonText}>Grant Permission</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <>
            <StatusBar
                barStyle="light-content"
                backgroundColor="#0F172A"
                translucent={false}
            />
            <AppNavigator />
        </>
    );
}

const styles = StyleSheet.create({
    permissionContainer: {
        flex: 1,
        backgroundColor: '#0F172A',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    permissionIcon: {
        fontSize: 64,
        marginBottom: 24,
    },
    permissionTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 16,
        textAlign: 'center',
    },
    permissionText: {
        fontSize: 16,
        color: '#94A3B8',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
    },
    permissionButton: {
        backgroundColor: '#6366F1',
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 12,
    },
    permissionButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});
