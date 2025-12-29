// SMS Service - React Native bridge for SMS listening

import { NativeModules, NativeEventEmitter, Platform, EmitterSubscription } from 'react-native';
import { SmsMessage } from '../types';

const { SmsModule } = NativeModules;

// Event emitter for SMS events
let smsEventEmitter: NativeEventEmitter | null = null;

/**
 * Check if SMS permissions are granted
 */
export async function checkSmsPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') {
        return false;
    }
    try {
        return await SmsModule.checkPermission();
    } catch {
        return false;
    }
}

/**
 * Request SMS permissions
 */
export async function requestSmsPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') {
        return false;
    }
    try {
        return await SmsModule.requestPermission();
    } catch {
        return false;
    }
}

/**
 * Start listening for SMS messages
 */
export function startSmsListener(
    onSmsReceived: (sms: SmsMessage) => void
): () => void {
    if (Platform.OS !== 'android') {
        return () => { };
    }

    if (!smsEventEmitter) {
        // Create event emitter - NativeEventEmitter on newer RN versions doesn't require module
        // @ts-ignore - NativeEventEmitter constructor has changed across RN versions
        smsEventEmitter = new NativeEventEmitter(SmsModule);
    }

    const subscription: EmitterSubscription = smsEventEmitter.addListener('onSmsReceived', (event) => {
        const sms: SmsMessage = {
            address: event.address || '',
            body: event.body || '',
            date: event.date || Date.now(),
        };
        onSmsReceived(sms);
    });

    return () => {
        subscription.remove();
    };
}
