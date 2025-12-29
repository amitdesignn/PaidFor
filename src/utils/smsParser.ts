// SMS Parser utility
// Parses bank debit SMS to extract amount, merchant, and timestamp

import { ParsedSms, SmsMessage } from '../types';

// Bank sender patterns (common Indian bank SMS codes)
const BANK_SENDER_PATTERNS = [
    /^[A-Z]{2}-[A-Z]{6}$/i, // XX-XXXXXX format
    /^[A-Z]{2}[A-Z]{6}$/i,  // XXXXXXXX format
    /HDFC|ICICI|SBI|AXIS|KOTAK|BOB|PNB|IDBI|YES|INDUS|UNION|CANARA|IDFC|RBL|FEDERAL/i,
];

// OTP patterns to ignore
const OTP_PATTERNS = [
    /\bOTP\b/i,
    /\bone[- ]?time[- ]?password\b/i,
    /\bverification code\b/i,
    /\b\d{4,6}\s*is\s*(your|the)\s*(OTP|code|password)\b/i,
];

// Credit patterns to ignore
const CREDIT_PATTERNS = [
    /\bcredited\b/i,
    /\breceived\b/i,
    /\bdeposit(ed)?\b/i,
    /\brefund(ed)?\b/i,
    /\bcashback\b/i,
];

// Debit patterns to match
const DEBIT_PATTERNS = [
    /debited\s*(by\s*)?(Rs\.?|INR|₹)\s*([\d,]+\.?\d*)/i,
    /(Rs\.?|INR|₹)\s*([\d,]+\.?\d*)\s*debited/i,
    /spent\s*(Rs\.?|INR|₹)\s*([\d,]+\.?\d*)/i,
    /(Rs\.?|INR|₹)\s*([\d,]+\.?\d*)\s*spent/i,
    /withdrawn\s*(Rs\.?|INR|₹)\s*([\d,]+\.?\d*)/i,
    /payment\s*of\s*(Rs\.?|INR|₹)\s*([\d,]+\.?\d*)/i,
    /txn\s*of\s*(Rs\.?|INR|₹)\s*([\d,]+\.?\d*)/i,
    /purchase\s*of\s*(Rs\.?|INR|₹)\s*([\d,]+\.?\d*)/i,
    /(Rs\.?|INR|₹)\s*([\d,]+\.?\d*)\s*(has been|was)\s*(debited|deducted)/i,
];

// Merchant extraction patterns
const MERCHANT_PATTERNS = [
    /(?:at|to|@|for)\s+([A-Za-z0-9\s&'.,-]+?)(?:\s+on|\s+ref|\s+txn|\.|\s*$)/i,
    /transferred\s+to\s+([A-Za-z0-9\s&'.,-]+?)(?:\s+on|\s+ref|\s*$)/i,
    /paid\s+to\s+([A-Za-z0-9\s&'.,-]+?)(?:\s+on|\s+ref|\s*$)/i,
    /VPA\s+([a-z0-9@.-]+)/i,
];

/**
 * Check if sender is a bank
 */
function isBankSender(sender: string): boolean {
    return BANK_SENDER_PATTERNS.some(pattern => pattern.test(sender));
}

/**
 * Check if SMS is an OTP message
 */
function isOtpMessage(body: string): boolean {
    return OTP_PATTERNS.some(pattern => pattern.test(body));
}

/**
 * Check if SMS is a credit message
 */
function isCreditMessage(body: string): boolean {
    return CREDIT_PATTERNS.some(pattern => pattern.test(body));
}

/**
 * Extract amount from SMS body
 */
function extractAmount(body: string): number | null {
    for (const pattern of DEBIT_PATTERNS) {
        const match = body.match(pattern);
        if (match) {
            // Find the numeric group (varies by pattern)
            const numericGroups = match.filter(g => g && /^[\d,]+\.?\d*$/.test(g.replace(/,/g, '')));
            if (numericGroups.length > 0) {
                const amountStr = numericGroups[0].replace(/,/g, '');
                const amount = parseFloat(amountStr);
                if (!isNaN(amount) && amount > 0) {
                    return amount;
                }
            }
        }
    }

    // Fallback: look for any Rs/INR/₹ pattern
    const fallbackPattern = /(Rs\.?|INR|₹)\s*([\d,]+\.?\d*)/gi;
    const matches = [...body.matchAll(fallbackPattern)];
    for (const match of matches) {
        const amountStr = match[2].replace(/,/g, '');
        const amount = parseFloat(amountStr);
        if (!isNaN(amount) && amount > 0) {
            return amount;
        }
    }

    return null;
}

/**
 * Extract merchant name from SMS body
 */
function extractMerchant(body: string): string {
    for (const pattern of MERCHANT_PATTERNS) {
        const match = body.match(pattern);
        if (match && match[1]) {
            const merchant = match[1].trim();
            // Clean up and limit length
            if (merchant.length > 2 && merchant.length < 50) {
                return merchant.replace(/\s+/g, ' ');
            }
        }
    }
    return 'Unknown';
}

/**
 * Check if SMS is a debit transaction
 */
function isDebitTransaction(body: string): boolean {
    return DEBIT_PATTERNS.some(pattern => pattern.test(body));
}

/**
 * Main SMS parser function
 * Returns parsed data if it's a valid bank debit SMS, null otherwise
 */
export function parseBankSms(sms: SmsMessage): ParsedSms | null {
    const { address, body, date } = sms;

    // Check if from a bank
    if (!isBankSender(address)) {
        return null;
    }

    // Ignore OTP messages
    if (isOtpMessage(body)) {
        return null;
    }

    // Ignore credit messages
    if (isCreditMessage(body)) {
        return null;
    }

    // Check if it's a debit transaction
    if (!isDebitTransaction(body)) {
        return null;
    }

    // Extract amount
    const amount = extractAmount(body);
    if (amount === null) {
        return null;
    }

    // Extract merchant
    const merchant = extractMerchant(body);

    return {
        amount,
        merchant,
        timestamp: date,
        rawSms: body,
    };
}

/**
 * Format amount with currency symbol
 */
export function formatAmount(amount: number): string {
    return `₹${amount.toLocaleString('en-IN')}`;
}
