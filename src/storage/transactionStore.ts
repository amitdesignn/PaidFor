// Transaction storage using MMKV

import { MMKV as MMKVStorage } from 'react-native-mmkv';
import { Transaction } from '../types';
import { STORAGE_KEYS, MERCHANT_DEBOUNCE_MS } from '../constants';

// Initialize MMKV storage - using type assertion for constructor
// @ts-ignore - MMKV types may not match runtime correctly
export const storage = new MMKVStorage();

/**
 * Get all transactions
 */
export function getTransactions(): Transaction[] {
    const data = storage.getString(STORAGE_KEYS.TRANSACTIONS);
    if (!data) return [];
    try {
        return JSON.parse(data) as Transaction[];
    } catch {
        return [];
    }
}

/**
 * Save a new transaction
 */
export function saveTransaction(transaction: Transaction): void {
    const transactions = getTransactions();
    transactions.unshift(transaction); // Add to beginning (newest first)
    storage.set(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
}

/**
 * Update an existing transaction (e.g., to add a note)
 */
export function updateTransaction(
    id: string,
    updates: Partial<Transaction>
): boolean {
    const transactions = getTransactions();
    const index = transactions.findIndex(t => t.id === id);
    if (index === -1) return false;

    transactions[index] = { ...transactions[index], ...updates };
    storage.set(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    return true;
}

/**
 * Get a transaction by ID
 */
export function getTransactionById(id: string): Transaction | undefined {
    const transactions = getTransactions();
    return transactions.find(t => t.id === id);
}

/**
 * Search transactions by text (merchant or note) and optionally by amount
 */
export function searchTransactions(
    query: string,
    amountQuery?: number
): Transaction[] {
    const transactions = getTransactions();
    const lowerQuery = query.toLowerCase();

    return transactions.filter(t => {
        const matchesText =
            !query ||
            t.merchant.toLowerCase().includes(lowerQuery) ||
            (t.note && t.note.toLowerCase().includes(lowerQuery)) ||
            (t.category && t.category.toLowerCase().includes(lowerQuery));

        const matchesAmount = !amountQuery || t.amount === amountQuery;

        return matchesText && matchesAmount;
    });
}

/**
 * Check if we should notify for this merchant (debounce logic)
 */
export function shouldNotifyForMerchant(merchant: string): boolean {
    const data = storage.getString(STORAGE_KEYS.LAST_MERCHANT_TIMES);
    const lastTimes: Record<string, number> = data ? JSON.parse(data) : {};

    const now = Date.now();
    const lastTime = lastTimes[merchant.toLowerCase()];

    if (lastTime && now - lastTime < MERCHANT_DEBOUNCE_MS) {
        return false; // Too soon, skip notification
    }

    // Update last time for this merchant
    lastTimes[merchant.toLowerCase()] = now;
    storage.set(STORAGE_KEYS.LAST_MERCHANT_TIMES, JSON.stringify(lastTimes));
    return true;
}

/**
 * Generate a unique ID for transactions
 */
export function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Delete a transaction
 */
export function deleteTransaction(id: string): boolean {
    const transactions = getTransactions();
    const filtered = transactions.filter(t => t.id !== id);
    if (filtered.length === transactions.length) return false;
    storage.set(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(filtered));
    return true;
}

/**
 * Clear all data (for testing)
 */
export function clearAllData(): void {
    storage.delete(STORAGE_KEYS.TRANSACTIONS);
    storage.delete(STORAGE_KEYS.LAST_MERCHANT_TIMES);
}
