// History Screen
// Simple list of saved transactions with search

import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Transaction } from '../types';
import { getTransactions, searchTransactions } from '../storage/transactionStore';
import { formatAmount } from '../utils/smsParser';
import { CATEGORY_COLORS, CATEGORY_ICONS } from '../constants';

type Props = NativeStackScreenProps<RootStackParamList, 'History'>;

export default function HistoryScreen({ navigation }: Props) {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    const loadTransactions = useCallback(() => {
        if (searchQuery.trim()) {
            // Check if search is a number (amount search)
            const amountSearch = parseFloat(searchQuery.replace(/[₹,]/g, ''));
            if (!isNaN(amountSearch)) {
                setTransactions(searchTransactions('', amountSearch));
            } else {
                setTransactions(searchTransactions(searchQuery));
            }
        } else {
            setTransactions(getTransactions());
        }
    }, [searchQuery]);

    useFocusEffect(
        useCallback(() => {
            loadTransactions();
        }, [loadTransactions])
    );

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadTransactions();
        setRefreshing(false);
    }, [loadTransactions]);

    const handleSearch = (text: string) => {
        setSearchQuery(text);
    };

    const formatDate = (timestamp: number): string => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffDays = Math.floor(
            (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (diffDays === 0) {
            return date.toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
            });
        } else if (diffDays === 1) {
            return 'Yesterday';
        } else if (diffDays < 7) {
            return date.toLocaleDateString('en-IN', { weekday: 'long' });
        } else {
            return date.toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
            });
        }
    };

    const renderItem = ({ item }: { item: Transaction }) => (
        <TouchableOpacity
            style={styles.transactionItem}
            onPress={() => navigation.navigate('NoteCapture', { transactionId: item.id })}
            activeOpacity={0.7}
        >
            <View style={styles.transactionLeft}>
                <View
                    style={[
                        styles.categoryBadge,
                        {
                            backgroundColor: item.category
                                ? CATEGORY_COLORS[item.category]
                                : '#475569',
                        },
                    ]}
                >
                    <Text style={styles.categoryBadgeIcon}>
                        {item.category ? CATEGORY_ICONS[item.category] : '❓'}
                    </Text>
                </View>
                <View style={styles.transactionDetails}>
                    <Text style={styles.merchantText} numberOfLines={1}>
                        {item.merchant}
                    </Text>
                    <Text style={styles.noteText} numberOfLines={1}>
                        {item.note || 'No note'}
                    </Text>
                </View>
            </View>
            <View style={styles.transactionRight}>
                <Text style={styles.amountText}>{formatAmount(item.amount)}</Text>
                <Text style={styles.dateText}>{formatDate(item.timestamp)}</Text>
            </View>
        </TouchableOpacity>
    );

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyTitle}>No transactions yet</Text>
            <Text style={styles.emptySubtitle}>
                Payment notes will appear here when you receive bank debit SMS
            </Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Payment Notes</Text>
            </View>

            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search by merchant, note, or amount..."
                    placeholderTextColor="#64748B"
                    value={searchQuery}
                    onChangeText={handleSearch}
                />
            </View>

            <FlatList
                data={transactions}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={
                    transactions.length === 0 ? styles.emptyList : styles.list
                }
                ListEmptyComponent={renderEmpty}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor="#6366F1"
                    />
                }
                showsVerticalScrollIndicator={false}
            />
        </View>
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
    emptyList: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
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
    emptyContainer: {
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#FFFFFF',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#94A3B8',
        textAlign: 'center',
        lineHeight: 20,
    },
});
