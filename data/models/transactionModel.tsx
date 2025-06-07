export interface TransactionItem {
  item_name: string;
  quantity: string;
  price: number | null;
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