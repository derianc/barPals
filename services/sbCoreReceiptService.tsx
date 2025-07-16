import { supabase } from "@/supabase";
import { TransactionData } from "@/data/models/transactionModel";
import { startOfDay, subDays, isSameDay, parse, format } from "date-fns";
import { sanitizeText } from "@/utilities";
import { geocodeAddress, matchReceiptToVenue } from "./sbEdgeFunctions";

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

export async function insertReceiptDetails(userId: string, receiptData: TransactionData): Promise<boolean> {
  console.log("📥 Starting receipt insert for user:", userId);
  console.log("🧾 Raw receipt data:", receiptData);

  // Step 1: Geocode merchant address
  console.log("📍 Geocoding address:", receiptData.merchantAddress);
  const geo = await geocodeAddress(receiptData.merchantAddress);
  console.log("📍 Geocoded result:", geo);

  // Step 2: Prepare sanitized data
  const sanitizedReceiptUrl = sanitizeText(receiptData.receiptUri);

  // Step 3: Insert receipt
  console.log("📝 Inserting into user_receipts...");
  const { data: receiptInsert, error: receiptError } = await supabase
    .from("user_receipts")
    .insert({
      user_id: userId,
      receipt_url: sanitizedReceiptUrl,
      merchant_name: receiptData.merchantName,
      merchant_address: geo.formatted,
      street_line: geo.components.address1,
      city: geo.components.city,
      state: geo.components.state,
      postal: geo.components.postal,
      transaction_date: receiptData.transactionDate,
      transaction_time: receiptData.transactionTime,
      total: receiptData.total,
      venue_hash: geo.venueHash
    })
    .select()
    .single();

  if (receiptError || !receiptInsert) {
    console.error("❌ Failed to insert receipt:", receiptError);
    return false;
  }

  console.log("✅ Receipt inserted:", receiptInsert.id);

  // Step 4: Insert line items
  const itemInserts = receiptData.Items.map((item) => ({
    receipt_id: receiptInsert.id,
    item_name: sanitizeText(item.item_name),
    quantity: parseInt(item.quantity || "1"),
    price: item.price,
  }));

  console.log("🧾 Line items to insert:", itemInserts);

  const { error: itemsError } = await supabase
    .from("user_receipt_items")
    .insert(itemInserts);

  if (itemsError) {
    console.error("❌ Failed to insert receipt items:", itemsError);

    const { error: deleteError } = await supabase
      .from("user_receipts")
      .delete()
      .eq("id", receiptInsert.id);

    if (!deleteError) {
      console.log("♻️ Rolled back receipt insert:", receiptInsert.id);
    } else {
      console.warn("⚠️ Rollback failed:", deleteError);
    }

    return false;
  }

  // Step 5: Trigger receipt-to-venue matcher
  const matchPayload = {
    mode: "receipt_to_venue" as const,
    receipt_id: receiptInsert.id,
    street_line: geo.components.address1,
    city: geo.components.city,
    state: geo.components.state,
    postal: geo.components.postal
  };

  console.log("🔁 Triggering matchReceiptToVenue with:", matchPayload);
  await matchReceiptToVenue(matchPayload);

  console.log("✅ Receipt and items successfully inserted and matched");
  return true;
}

export async function getConsecutiveReceiptDays(userId: string): Promise<number> {
  const { data, error } = await supabase
    .from("user_receipts")
    .select("transaction_date")
    .eq("user_id", userId)
    .order("transaction_date", { ascending: false });

  if (error || !data) {
    console.error("❌ Failed to fetch receipts:", error);
    return 0;
  }

  console.log("📅 data", data);

  // Use a Set of local date strings, adjusted to avoid time zone offset issues
  const localDateStrings = new Set(
    data.map((r) => new Date(`${r.transaction_date}T12:00:00`).toDateString())
  );

  let count = 0;
  let currentDay = subDays(new Date(), 1); // exclude today

  while (localDateStrings.has(currentDay.toDateString())) {
    count++;
    currentDay = subDays(currentDay, 1);
  }

  console.log("🔥 Active Streak (excluding today):", count);
  return count;
}

export async function deleteReceiptById(
  receiptId: number
): Promise<{ success: boolean; error?: Error }> {
  console.log(`🔄 Deleting receipt with ID: ${receiptId}`);

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

  console.log("✅ Retrieved receipt:", receipt);

  // Step 2: Extract the full storage path from the URL
  const pathParts = receipt.receipt_url?.split("/storage/v1/object/public/user-receipts/");
  let filePath = pathParts?.[1];

  console.log("📂 Raw path extracted from URL:", filePath);

  if (!filePath) {
    console.error("❌ Invalid file path extracted from URL:", receipt.receipt_url);
    return { success: false, error: new Error("Invalid file URL format") };
  }

  // Normalize path
  filePath = filePath.replace(/^\/+/, "");
  console.log("📁 Normalized storage path to delete:", filePath);

  // Step 3: Delete the file from Supabase Storage
  const { error: storageError } = await supabase.storage
    .from("user-receipts")
    .remove([filePath]);

  if (storageError) {
    console.error("❌ Failed to delete file from storage:", storageError.message);
    console.error("🧾 Tried deleting path:", filePath);
    return { success: false, error: storageError };
  }

  console.log("✅ Successfully deleted file from storage:", filePath);

  // Step 4: Delete the receipt record from the table
  const { error: deleteError } = await supabase
    .from("user_receipts")
    .delete()
    .eq("id", receiptId);

  if (deleteError) {
    console.error("❌ Supabase delete error:", deleteError.message);
    return { success: false, error: deleteError };
  }

  console.log(`✅ Receipt ${receiptId} successfully deleted from DB and storage`);

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