// Transaction and category types for PaidFor app

export type Category = 'Rent' | 'Food' | 'Travel' | 'Loan' | 'Office' | 'Other';

export interface Transaction {
  id: string;
  amount: number;
  merchant: string;
  timestamp: number;
  rawSms: string;
  note?: string;
  category?: Category;
}

export interface ParsedSms {
  amount: number;
  merchant: string;
  timestamp: number;
  rawSms: string;
}

export interface SmsMessage {
  address: string;
  body: string;
  date: number;
}
