import { supabase } from "@/supabase";
import { TransactionData } from "@/data/models/transactionModel";

// sbReceiptService.ts
export async function getReceiptItems(receiptId: number) {
  const { data, error } = await supabase
    .from("user_receipt_items")
    .select("*")
    .eq("receipt_id", receiptId);

  if (error) {
    console.error("❌ Failed to fetch receipt items:", error);
    throw new Error("Failed to fetch receipt items");
  }

  return data;
}
