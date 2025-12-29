// Web-specific App Component (for UI preview)
// Native features (SMS, notifications) are mocked

import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TextInput, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { CATEGORY_COLORS, CATEGORY_ICONS, CATEGORIES } from './constants';
import { Category, Transaction } from './types';

// Mock test data for web preview
const MOCK_TRANSACTIONS: Transaction[] = [
    {
        id: '1',
        amount: 2500,
        merchant: 'Swiggy',
        timestamp: Date.now() - 1000 * 60 * 30, // 30 min ago
        rawSms: 'Your a/c XX1234 debited by Rs.2500.00 at Swiggy on 29-Dec-24',
        category: 'Food',
        note: 'Food',
    },
    {
        id: '2',
        amount: 15000,
        merchant: 'Amazon',
        timestamp: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
        rawSms: 'Your a/c XX1234 debited by Rs.15000.00 at Amazon on 29-Dec-24',
        category: 'Office',
        note: 'Office supplies',
    },
    {
        id: '3',
        amount: 850,
        merchant: 'Uber',
        timestamp: Date.now() - 1000 * 60 * 60 * 24, // 1 day ago
        rawSms: 'Your a/c XX1234 debited by Rs.850.00 at Uber on 28-Dec-24',
        category: 'Travel',
        note: 'Travel',
    },
    {
        id: '4',
        amount: 25000,
        merchant: 'Landlord UPI',
        timestamp: Date.now() - 1000 * 60 * 60 * 24 * 3, // 3 days ago
        rawSms: 'Your a/c XX1234 debited by Rs.25000.00 transfer to UPI ID landlord@upi',
        category: 'Rent',
        note: 'Rent',
    },
    {
        id: '5',
        amount: 5000,
        merchant: 'Friend UPI',
        timestamp: Date.now() - 1000 * 60 * 60 * 24 * 5, // 5 days ago
        rawSms: 'Your a/c XX1234 debited by Rs.5000.00 transfer to UPI ID friend@upi',
        category: 'Loan',
        note: 'Loan repayment',
    },
    {
        id: '6',
        amount: 450,
        merchant: 'Zomato',
        timestamp: Date.now() - 1000 * 60 * 60 * 24 * 7, // 7 days ago
        rawSms: 'Your a/c XX1234 debited by Rs.450.00 at Zomato on 22-Dec-24',
        note: undefined,
        category: undefined,
    },
];

function formatAmount(amount: number): string {
    return `₹${amount.toLocaleString('en-IN')}`;
}

function formatDate(timestamp: number): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
        return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
        return 'Yesterday';
    } else if (diffDays < 7) {
        return date.toLocaleDateString('en-IN', { weekday: 'long' });
    } else {
        return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    }
}

// History Screen Component
function HistoryScreen({ onSelectTransaction }: { onSelectTransaction: (id: string) => void }) {
    const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredTransactions = searchQuery
        ? transactions.filter(t =>
            t.merchant.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (t.note && t.note.toLowerCase().includes(searchQuery.toLowerCase())) ||
            t.amount.toString().includes(searchQuery)
        )
        : transactions;

    const renderItem = ({ item }: { item: Transaction }) => (
        <TouchableOpacity
            style={styles.transactionItem}
            onPress={() => onSelectTransaction(item.id)}
            activeOpacity={0.7}
        >
            <View style={styles.transactionLeft}>
                <View
                    style={[
                        styles.categoryBadge,
                        { backgroundColor: item.category ? CATEGORY_COLORS[item.category] : '#475569' },
                    ]}
                >
                    <Text style={styles.categoryBadgeIcon}>
                        {item.category ? CATEGORY_ICONS[item.category] : '❓'}
                    </Text>
                </View>
                <View style={styles.transactionDetails}>
                    <Text style={styles.merchantText}>{item.merchant}</Text>
                    <Text style={styles.noteText}>{item.note || 'No note'}</Text>
                </View>
            </View>
            <View style={styles.transactionRight}>
                <Text style={styles.amountText}>{formatAmount(item.amount)}</Text>
                <Text style={styles.dateText}>{formatDate(item.timestamp)}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Payment Notes</Text>
                <Text style={styles.subtitle}>📱 Web Preview Mode</Text>
            </View>

            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search by merchant, note, or amount..."
                    placeholderTextColor="#64748B"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            <FlatList
                data={filteredTransactions}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
}

// Note Capture Screen Component
function NoteCaptureScreen({
    transaction,
    onSave,
    onClose
}: {
    transaction: Transaction;
    onSave: (id: string, category: Category, note: string) => void;
    onClose: () => void;
}) {
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [customNote, setCustomNote] = useState('');
    const [showCustomInput, setShowCustomInput] = useState(false);

    const handleCategorySelect = (category: Category) => {
        if (category === 'Other') {
            setSelectedCategory(category);
            setShowCustomInput(true);
        } else {
            onSave(transaction.id, category, category);
        }
    };

    const handleSaveCustomNote = () => {
        onSave(transaction.id, 'Other', customNote.trim() || 'Other');
    };

    return (
        <View style={styles.container}>
            <View style={styles.captureHeader}>
                <Text style={styles.amount}>{formatAmount(transaction.amount)}</Text>
                <Text style={styles.merchant}>{transaction.merchant}</Text>
            </View>

            <Text style={styles.prompt}>What was this for?</Text>

            <View style={styles.categoriesGrid}>
                {CATEGORIES.map((category) => (
                    <TouchableOpacity
                        key={category}
                        style={[
                            styles.categoryButton,
                            { backgroundColor: CATEGORY_COLORS[category] },
                            selectedCategory === category && styles.categoryButtonSelected,
                        ]}
                        onPress={() => handleCategorySelect(category)}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.categoryIcon}>{CATEGORY_ICONS[category]}</Text>
                        <Text style={styles.categoryText}>{category}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {showCustomInput && (
                <View style={styles.customInputContainer}>
                    <TextInput
                        style={styles.customInput}
                        placeholder="Enter a note..."
                        placeholderTextColor="#999"
                        value={customNote}
                        onChangeText={setCustomNote}
                        autoFocus
                    />
                    <TouchableOpacity style={styles.saveButton} onPress={handleSaveCustomNote}>
                        <Text style={styles.saveButtonText}>Save</Text>
                    </TouchableOpacity>
                </View>
            )}

            <TouchableOpacity style={styles.skipButton} onPress={onClose}>
                <Text style={styles.skipButtonText}>← Back to History</Text>
            </TouchableOpacity>
        </View>
    );
}

// Main App Component
export default function App() {
    const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);
    const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);

    const selectedTransaction = selectedTransactionId
        ? transactions.find(t => t.id === selectedTransactionId)
        : null;

    const handleSave = useCallback((id: string, category: Category, note: string) => {
        setTransactions(prev =>
            prev.map(t => (t.id === id ? { ...t, category, note } : t))
        );
        setSelectedTransactionId(null);
    }, []);

    return (
        <>
            <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
            {selectedTransaction ? (
                <NoteCaptureScreen
                    transaction={selectedTransaction}
                    onSave={handleSave}
                    onClose={() => setSelectedTransactionId(null)}
                />
            ) : (
                <HistoryScreen onSelectTransaction={setSelectedTransactionId} />
            )}
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F172A',
    },
    header: {
        paddingTop: 48,
        paddingHorizontal: 24,
        paddingBottom: 16,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    subtitle: {
        fontSize: 12,
        color: '#6366F1',
        marginTop: 4,
    },
    searchContainer: {
        paddingHorizontal: 24,
        marginBottom: 16,
    },
    searchInput: {
        backgroundColor: '#1E293B',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#334155',
    },
    list: {
        paddingHorizontal: 24,
        paddingBottom: 24,
    },
    transactionItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#1E293B',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
    },
    transactionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    categoryBadge: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    categoryBadgeIcon: {
        fontSize: 20,
    },
    transactionDetails: {
        flex: 1,
    },
    merchantText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    noteText: {
        fontSize: 14,
        color: '#94A3B8',
    },
    transactionRight: {
        alignItems: 'flex-end',
        marginLeft: 12,
    },
    amountText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    dateText: {
        fontSize: 12,
        color: '#64748B',
    },
    captureHeader: {
        alignItems: 'center',
        marginTop: 60,
        marginBottom: 32,
    },
    amount: {
        fontSize: 48,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    merchant: {
        fontSize: 18,
        color: '#94A3B8',
        marginTop: 8,
    },
    prompt: {
        fontSize: 20,
        color: '#E2E8F0',
        textAlign: 'center',
        marginBottom: 24,
    },
    categoriesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        paddingHorizontal: 24,
        gap: 12,
    },
    categoryButton: {
        width: 100,
        height: 100,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    categoryButtonSelected: {
        borderWidth: 3,
        borderColor: '#FFFFFF',
    },
    categoryIcon: {
        fontSize: 32,
        marginBottom: 8,
    },
    categoryText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    customInputContainer: {
        flexDirection: 'row',
        marginTop: 24,
        paddingHorizontal: 24,
        gap: 12,
    },
    customInput: {
        flex: 1,
        backgroundColor: '#1E293B',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#334155',
    },
    saveButton: {
        backgroundColor: '#6366F1',
        borderRadius: 12,
        paddingHorizontal: 24,
        justifyContent: 'center',
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    skipButton: {
        marginTop: 24,
        padding: 16,
        alignItems: 'center',
    },
    skipButtonText: {
        color: '#6366F1',
        fontSize: 16,
    },
});
