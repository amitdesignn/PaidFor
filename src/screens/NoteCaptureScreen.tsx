// Note Capture Screen
// Minimal screen for quick note capture after payment

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
    StyleSheet,
    BackHandler,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { CATEGORIES, CATEGORY_COLORS, CATEGORY_ICONS } from '../constants';
import { Category } from '../types';
import { updateTransaction, getTransactionById } from '../storage/transactionStore';
import { formatAmount } from '../utils/smsParser';

type Props = NativeStackScreenProps<RootStackParamList, 'NoteCapture'>;

export default function NoteCaptureScreen({ route, navigation }: Props) {
    const { transactionId } = route.params;
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [customNote, setCustomNote] = useState('');
    const [showCustomInput, setShowCustomInput] = useState(false);
    const [transaction, setTransaction] = useState<{
        amount: number;
        merchant: string;
    } | null>(null);

    useEffect(() => {
        const tx = getTransactionById(transactionId);
        if (tx) {
            setTransaction({ amount: tx.amount, merchant: tx.merchant });
        }
    }, [transactionId]);

    // Handle back button to go to history
    useEffect(() => {
        const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            navigation.replace('History');
            return true;
        });
        return () => backHandler.remove();
    }, [navigation]);

    const handleCategorySelect = (category: Category) => {
        if (category === 'Other') {
            setSelectedCategory(category);
            setShowCustomInput(true);
        } else {
            // Save and close immediately
            updateTransaction(transactionId, {
                category,
                note: category,
            });
            navigation.replace('History');
        }
    };

    const handleSaveCustomNote = () => {
        updateTransaction(transactionId, {
            category: 'Other',
            note: customNote.trim() || 'Other',
        });
        navigation.replace('History');
    };

    const handleSkip = () => {
        navigation.replace('History');
    };

    if (!transaction) {
        return (
            <View style={styles.container}>
                <Text style={styles.loadingText}>Loading...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.amount}>{formatAmount(transaction.amount)}</Text>
                {transaction.merchant !== 'Unknown' && (
                    <Text style={styles.merchant}>{transaction.merchant}</Text>
                )}
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
                        returnKeyType="done"
                        onSubmitEditing={handleSaveCustomNote}
                    />
                    <TouchableOpacity
                        style={styles.saveButton}
                        onPress={handleSaveCustomNote}
                    >
                        <Text style={styles.saveButtonText}>Save</Text>
                    </TouchableOpacity>
                </View>
            )}

            <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
                <Text style={styles.skipButtonText}>Skip</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F172A',
        padding: 24,
    },
    loadingText: {
        color: '#94A3B8',
        fontSize: 16,
        textAlign: 'center',
        marginTop: 100,
    },
    header: {
        alignItems: 'center',
        marginTop: 40,
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
        gap: 12,
    },
    categoryButton: {
        width: '30%',
        aspectRatio: 1,
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
        color: '#64748B',
        fontSize: 16,
    },
});
