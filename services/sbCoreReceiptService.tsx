import { supabase } from "@/supabase";
import * as Crypto from "expo-crypto";
import { TransactionData } from "@/data/models/transactionModel";
import { startOfDay, subDays, isSameDay, parse, format } from "date-fns";
import { getLoggedInUserId } from "./sbUserService";

export * from './sbUserReceiptService'
export * from './sbOwnerReceiptService'

export async function isReceiptDuplicate(receiptData: TransactionData): Promise<boolean> {
  
  // 🔍 Check for duplicates
  const { data: existing, error: findError } = await supabase
    .from("user_receipts")
    .select("id")
    .eq("merchant_name", receiptData.merchantName)
    .eq("transaction_date", receiptData.transactionDate)
    .eq("transaction_time", receiptData.transactionTime)
    .eq("total", receiptData.total)
    .limit(1);

  if (findError) {
    console.error("❌ Error checking for duplicate receipt:", findError);
    return false;
  }

  return !!(existing && existing.length > 0);
}

export async function insertReceiptDetails(receiptData: TransactionData): Promise<boolean> {
  
  // 1. Insert into user_receipts
  const venueHash = await generateVenueHash(sanitizeText(receiptData.merchantAddress) ?? "");

  const userId = await getLoggedInUserId()
  const { data: receiptInsert, error: receiptError } = await supabase
    .from("user_receipts")
    .insert({
      user_id: userId,
      receipt_url: sanitizeText(receiptData.receiptUri),
      merchant_name: sanitizeText(receiptData.merchantName),
      merchant_address: sanitizeText(receiptData.merchantAddress),
      transaction_date: parseDate(receiptData.transactionDate),
      transaction_time: receiptData.transactionTime,
      total: receiptData.total,
      venue_hash: venueHash
    })
    .select()
    .single();

  if (receiptError || !receiptInsert) {
    console.error("❌ Failed to insert receipt:", receiptError);
    return false;
  }

  // 3. Insert line items
  const itemInserts = receiptData.Items.map((item) => ({
    receipt_id: receiptInsert.id,
    item_name: sanitizeText(item.item_name),
    quantity: parseInt(item.quantity || "1"),
    price: item.price,
  }));

  const { error: itemsError } = await supabase
    .from("user_receipt_items")
    .insert(itemInserts);

  if (itemsError) {
    console.error("❌ Failed to insert receipt items:", itemsError);

    // 🔥 Rollback: delete the inserted receipt
    const { error: deleteError } = await supabase
      .from("user_receipts")
      .delete()
      .eq("id", receiptInsert.id);

    if (deleteError) {
      console.error("⚠️ Failed to rollback receipt after items insert failed:", deleteError);
    } else {
      console.log("♻️ Rolled back receipt insert due to item insert failure");
    }

    return false;
  }

  console.log("✅ Receipt and items successfully inserted");
  return true;
}

export async function getConsecutiveReceiptDays(): Promise<number> {
  const userId = await getLoggedInUserId()

  // 2. Fetch distinct transaction dates (deduped per day)
  const { data, error } = await supabase
    .from("user_receipts")
    .select("transaction_date")
    .eq("user_id", userId)
    .order("transaction_date", { ascending: false });

  if (error || !data) {
    console.error("❌ Failed to fetch receipts:", error);
    return 0;
  }

  const uniqueDates = Array.from(
    new Set(
      data.map((r) => startOfDay(new Date(r.transaction_date)).toISOString())
    )
  ).map((d) => new Date(d));

  // 3. Count consecutive days starting from today
  let count = 0;
  let currentDay = startOfDay(new Date());

  while (
    uniqueDates.some((date) => isSameDay(date, currentDay))
  ) {
    count++;
    currentDay = subDays(currentDay, 1);
  }

  return count;
}

export async function deleteReceiptById(
  receiptId: number
): Promise<{ success: boolean; error?: Error }> {
  // Step 1: Get the receipt_url
  const { data: receipt, error: fetchError } = await supabase
    .from("user_receipts")
    .select("receipt_url")
    .eq("id", receiptId)
    .single();

  if (fetchError || !receipt) {
    console.error("❌ Failed to fetch receipt for deletion:", fetchError?.message);
    return { success: false, error: fetchError ?? new Error("Receipt not found") };
  }

  // Step 2: Extract the file name from the URL
  // Example URL: https://xyz.supabase.co/storage/v1/object/public/user-receipts/abc123.pdf
  const urlParts = receipt.receipt_url.split("/");
  const fileName = urlParts[urlParts.length - 1]; // abc123.pdf

  // Step 3: Delete the file from Supabase Storage
  const { error: storageError } = await supabase.storage
    .from("user-receipts")
    .remove([fileName]); // must match the path used when uploading

  if (storageError) {
    console.error("❌ Failed to delete file from storage:", storageError.message);
    return { success: false, error: storageError };
  }

  // Step 3: Delete the receipt record from the table
  const { error: deleteError } = await supabase
    .from("user_receipts")
    .delete()
    .eq("id", receiptId);

  if (deleteError) {
    console.error("❌ Supabase delete error:", deleteError.message);
    return { success: false, error: deleteError };
  }

  return { success: true };
}

export async function archiveReceiptById(receiptId: number): Promise<{ success: boolean; error?: Error }> {
  const { error } = await supabase
    .from("user_receipts")
    .update({ isArchived: true })
    .eq("id", receiptId);

  if (error) {
    console.error("❌ Supabase archive error:", error.message);
    return { success: false, error };
  }

  return { success: true };
}

function sanitizeText(input?: string | null): string | null {
  if (!input) return null;
  return input.replace(/[\u0000-\u001F\u007F-\u009F]/g, '').trim();
}

function parseDate(raw: string | null | undefined): string | null {
  if (!raw) return null;

  // Match MM/DD/YY, M/D/YY, MM-DD-YYYY, etc.
  const match = raw.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);

  if (!match) {
    console.warn("⚠️ Could not parse date from string:", raw);
    return null;
  }

  let [_, month, day, year] = match;

  // Pad month/day to 2 digits
  if (month.length === 1) month = "0" + month;
  if (day.length === 1) day = "0" + day;

  // Convert 2-digit years (e.g. 25 → 2025)
  if (year.length === 2) {
    const intYear = parseInt(year, 10);
    year = intYear < 50 ? `20${year}` : `19${year}`;
  }

  return `${year}-${month}-${day}`; // YYYY-MM-DD
}

export async function generateVenueHash(address: string): Promise<string> {
  const noSpaces = address.replace(/\s+/g, "");
  const addressHash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    noSpaces
  );

  return addressHash;
}