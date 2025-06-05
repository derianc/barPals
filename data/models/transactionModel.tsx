export interface TransactionItem {
  name: string;
  quantity: string;
  price: string;
}

export interface TransactionData {
  userId?: string;
  merchantName: string;
  merchantAddress: string;
  transactionDate: string;
  transactionTime?: string;
  total: number | null;
  createdAt: string;
  receiptUri: string;

  // Custom fields
  customerName: string;
  transaction: string;
  duplicateKey: string;

  Items: TransactionItem[];
}