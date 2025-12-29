// App constants

import { Category } from './types';

// Minimum amount to trigger notification
export const MIN_AMOUNT_THRESHOLD = 200;

// Debounce window for same merchant (5 minutes)
export const MERCHANT_DEBOUNCE_MS = 5 * 60 * 1000;

// Categories for quick note selection
export const CATEGORIES: Category[] = [
    'Rent',
    'Food',
    'Travel',
    'Loan',
    'Office',
    'Other',
];

// Storage keys
export const STORAGE_KEYS = {
    TRANSACTIONS: 'transactions',
    LAST_MERCHANT_TIMES: 'lastMerchantTimes',
} as const;

// Notification channel
export const NOTIFICATION_CHANNEL_ID = 'payment-notes';

// Category colors for UI
export const CATEGORY_COLORS: Record<Category, string> = {
    Rent: '#6366F1',
    Food: '#F59E0B',
    Travel: '#10B981',
    Loan: '#EF4444',
    Office: '#8B5CF6',
    Other: '#6B7280',
};

// Category icons (emoji)
export const CATEGORY_ICONS: Record<Category, string> = {
    Rent: '🏠',
    Food: '🍔',
    Travel: '✈️',
    Loan: '💰',
    Office: '💼',
    Other: '📝',
};
