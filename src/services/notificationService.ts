// Notification service using Notifee

import notifee, {
    AndroidImportance,
    AndroidVisibility,
    EventType,
} from '@notifee/react-native';
import { NOTIFICATION_CHANNEL_ID, MIN_AMOUNT_THRESHOLD } from '../constants';
import { ParsedSms } from '../types';
import { formatAmount } from '../utils/smsParser';
import { shouldNotifyForMerchant, saveTransaction, generateId } from '../storage/transactionStore';

/**
 * Initialize notification channel (call on app start)
 */
export async function initializeNotifications(): Promise<void> {
    await notifee.createChannel({
        id: NOTIFICATION_CHANNEL_ID,
        name: 'Payment Notes',
        description: 'Notifications for payment note reminders',
        importance: AndroidImportance.HIGH,
        visibility: AndroidVisibility.PUBLIC,
    });
}

/**
 * Handle a parsed SMS and trigger notification if needed
 */
export async function handleParsedSms(parsed: ParsedSms): Promise<string | null> {
    const { amount, merchant, timestamp, rawSms } = parsed;

    // Rule: Don't notify for amounts < 200
    if (amount < MIN_AMOUNT_THRESHOLD) {
        // Still save the transaction, just don't notify
        const id = generateId();
        saveTransaction({
            id,
            amount,
            merchant,
            timestamp,
            rawSms,
        });
        return null;
    }

    // Rule: Don't spam for same merchant
    if (!shouldNotifyForMerchant(merchant)) {
        const id = generateId();
        saveTransaction({
            id,
            amount,
            merchant,
            timestamp,
            rawSms,
        });
        return null;
    }

    // Save transaction
    const id = generateId();
    saveTransaction({
        id,
        amount,
        merchant,
        timestamp,
        rawSms,
    });

    // Trigger notification
    await notifee.displayNotification({
        id,
        title: `Paid ${formatAmount(amount)}`,
        body: `Want to note what this was for?${merchant !== 'Unknown' ? ` (${merchant})` : ''}`,
        android: {
            channelId: NOTIFICATION_CHANNEL_ID,
            importance: AndroidImportance.HIGH,
            pressAction: {
                id: 'default',
                launchActivity: 'default',
            },
            // Pass transaction ID in data
            actions: [
                {
                    title: '📝 Add Note',
                    pressAction: {
                        id: 'add-note',
                    },
                },
                {
                    title: '✕ Skip',
                    pressAction: {
                        id: 'skip',
                    },
                },
            ],
        },
        data: {
            transactionId: id,
        },
    });

    return id;
}

/**
 * Cancel a notification
 */
export async function cancelNotification(id: string): Promise<void> {
    await notifee.cancelNotification(id);
}

/**
 * Set up notification event handlers
 */
export function setupNotificationHandlers(
    onAddNote: (transactionId: string) => void
): () => void {
    return notifee.onForegroundEvent(({ type, detail }) => {
        const { notification, pressAction } = detail;
        const transactionId = notification?.data?.transactionId as string | undefined;

        if (!transactionId) return;

        switch (type) {
            case EventType.PRESS:
                // Notification body pressed
                onAddNote(transactionId);
                break;
            case EventType.ACTION_PRESS:
                if (pressAction?.id === 'add-note') {
                    onAddNote(transactionId);
                }
                // 'skip' action just dismisses
                break;
        }
    });
}

/**
 * Set up background event handler (for when app is killed)
 */
export function setupBackgroundHandler(): void {
    notifee.onBackgroundEvent(async ({ type, detail }) => {
        const { notification, pressAction } = detail;
        const transactionId = notification?.data?.transactionId as string | undefined;

        if (type === EventType.ACTION_PRESS && pressAction?.id === 'skip') {
            // Just dismiss, no action needed
            if (notification?.id) {
                await notifee.cancelNotification(notification.id);
            }
        }
        // 'add-note' or body press will open the app
    });
}
