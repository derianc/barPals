import { supabase } from "@/supabase";
import * as Crypto from "expo-crypto";
import { TransactionData } from "@/data/models/transactionModel";
import { startOfDay, subDays, isSameDay, parse, format } from "date-fns";
import { getLoggedInUserId } from "./sbUserService";


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

export async function getAllReceiptsForUser() {

  const userId = await getLoggedInUserId()
  // 2. Query receipts with embedded item count
  const { data, error } = await supabase
    .from("user_receipts")
    .select(`*, user_receipt_items(count)`)
    .eq("user_id", userId)
    .order("transaction_date", { ascending: false })
    .order("transaction_time", { ascending: false });

  if (error) {
    console.error("❌ Failed to fetch receipts:", error);
    throw new Error("Failed to fetch user receipts");
  }

  // 3. Map item_count into root object
  const receipts = data.map((receipt: any) => ({
    ...receipt,
    item_count: receipt.user_receipt_items[0]?.count ?? 0,
    isVerified: Math.random() < 0.5,
  }));

  return receipts;
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

export async function getTotalUserSpend(timeframe: "day" | "7days" | "30days" | "all" = "all"): Promise<number> {
  
  const now = new Date();
  let startDate: Date | null = null;

  switch (timeframe) {
    case "day":
      startDate = new Date(now.setHours(0, 0, 0, 0));
      break;
    case "7days":
      startDate = new Date(now.setDate(now.getDate() - 7));
      break;
    case "30days":
      startDate = new Date(now.setDate(now.getDate() - 30));
      break;
    case "all":
    default:
      startDate = null;
  }

  const userId = await getLoggedInUserId()
  let query = supabase
    .from("user_receipts")
    .select("total")
    .eq("user_id", userId);

  if (startDate) {
    query = query.gte("transaction_date", startDate.toISOString());
  }

  const { data, error } = await query;

  if (error) {
    console.error("❌ Error querying total spend:", error);
    throw new Error("Could not fetch total spend.");
  }

  const total = data?.reduce((sum, r) => sum + (r.total || 0), 0) ?? 0;

  return total;
}

export async function getAverageUserSpend(timeframe: "day" | "7days" | "30days" | "all" = "all"): Promise<number> {
  
  const now = new Date();
  let startDate: Date | null = null;

  switch (timeframe) {
    case "day":
      startDate = new Date(now.setHours(0, 0, 0, 0));
      break;
    case "7days":
      startDate = new Date(now.setDate(now.getDate() - 7));
      break;
    case "30days":
      startDate = new Date(now.setDate(now.getDate() - 30));
      break;
    case "all":
    default:
      startDate = null;
  }

  const userId = await getLoggedInUserId()
  let query = supabase
    .from("user_receipts")
    .select("total")
    .eq("user_id", userId);

  if (startDate) {
    query = query.gte("transaction_date", startDate.toISOString());
  }

  const { data, error } = await query;

  if (error) {
    console.error("❌ Error querying average spend:", error);
    throw new Error("Could not fetch average spend.");
  }

  const totals = data?.map((r) => r.total || 0) ?? [];
  const average = totals.length > 0 ? totals.reduce((sum, t) => sum + t, 0) / totals.length : 0;

  return average;
}

export async function getUniqueMerchantsVisited(timeframe: "day" | "7days" | "30days" | "all" = "all"): Promise<number> {
  
  const now = new Date();
  let startDate: Date | null = null;

  switch (timeframe) {
    case "day":
      startDate = new Date(now.setHours(0, 0, 0, 0));
      break;
    case "7days":
      startDate = new Date(now.setDate(now.getDate() - 7));
      break;
    case "30days":
      startDate = new Date(now.setDate(now.getDate() - 30));
      break;
    case "all":
    default:
      startDate = null;
  }

  const userId = await getLoggedInUserId()
  let query = supabase
    .from("user_receipts")
    .select("merchant_name", { count: "exact" }) // we’ll use JS for uniqueness
    .eq("user_id", userId);

  if (startDate) {
    query = query.gte("transaction_date", startDate.toISOString());
  }

  const { data, error } = await query;

  if (error) {
    console.error("❌ Error querying merchants visited:", error);
    throw new Error("Could not fetch merchant visits.");
  }

  const uniqueMerchants = new Set((data ?? []).map((r) => r.merchant_name?.trim()?.toLowerCase()));
  return uniqueMerchants.size;
}

export async function getAverageItemsPerVisit(timeframe: "day" | "7days" | "30days" | "all" = "all"): Promise<number> {
  
  const now = new Date();
  let startDate: Date | null = null;

  switch (timeframe) {
    case "day":
      startDate = new Date(now.setHours(0, 0, 0, 0));
      break;
    case "7days":
      startDate = new Date(now.setDate(now.getDate() - 7));
      break;
    case "30days":
      startDate = new Date(now.setDate(now.getDate() - 30));
      break;
    case "all":
    default:
      startDate = null;
  }

  const userId = await getLoggedInUserId()
  // 1. Fetch receipt IDs for user in timeframe
  let receiptsQuery = supabase
    .from("user_receipts")
    .select("id")
    .eq("user_id", userId);

  if (startDate) {
    receiptsQuery = receiptsQuery.gte("transaction_date", startDate.toISOString());
  }

  const { data: receipts, error: receiptsError } = await receiptsQuery;

  if (receiptsError || !receipts) {
    console.error("❌ Error fetching user receipts:", receiptsError);
    throw new Error("Could not fetch receipt data.");
  }

  if (receipts.length === 0) return 0;

  const receiptIds = receipts.map((r) => r.id);

  // 2. Count total items for these receipts
  const { count, error: itemsError } = await supabase
    .from("user_receipt_items")
    .select("id", { count: "exact", head: true })
    .in("receipt_id", receiptIds);

  if (itemsError || count === null) {
    console.error("❌ Error fetching receipt item count:", itemsError);
    throw new Error("Could not calculate average item count.");
  }

  const average = count / receiptIds.length;
  return parseFloat(average.toFixed(2));
}

export type SpendBucket = {
  label: string; // "hh:mm AM/PM" for hourly; "YYYY-MM-DD" for daily
  total: number;
};

export async function getSpendBuckets(
  timeframe: "7days" | "30days" | "all" = "all"
): Promise<{ data: SpendBucket[]; error: Error | null }> {
  // 1. Determine start date
  const now = new Date();
  const userId = await getLoggedInUserId()

  let start: Date;  

  if (timeframe === "all") {
    const { data: oldest, error: oldestError } = await supabase
      .from("user_receipts")
      .select("transaction_date")
      .eq("user_id", userId)
      .order("transaction_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (oldestError || !oldest?.transaction_date) {
      console.error("❌ Failed to get oldest transaction:", oldestError);
      return { data: [], error: oldestError ?? new Error("No transaction found") };
    }

    start = new Date(oldest.transaction_date);
    start.setHours(0, 0, 0, 0);
  } else {
    start = new Date(now);
    start.setHours(0, 0, 0, 0);

    if (timeframe === "7days") {
      start.setDate(start.getDate() - 6);
    } else if (timeframe === "30days") {
      start.setDate(start.getDate() - 29);
    }
  }

  // 3. Fetch receipts in the date range for this user
  
  let query = supabase
    .from("user_receipts")
    .select("transaction_date, total")
    .eq("user_id", userId);

  if (timeframe !== "all") {
    query = query.gte("transaction_date", start.toISOString());
  }

  query = query.order("transaction_date", { ascending: true });

  const { data: receipts, error } = await query;

  if (error) {
    console.error("❌ Error fetching receipts for spend buckets:", error);
    return { data: [], error };
  }

  // 4. Initialize bucket map
  type BucketMap = Record<string, number>;
  const bucketMap: BucketMap = {};

  const end = new Date();
  end.setHours(0, 0, 0, 0);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const yyyy = d.getFullYear();
    const mm = (d.getMonth() + 1).toString().padStart(2, "0");
    const dd = d.getDate().toString().padStart(2, "0");
    const label = `${yyyy}-${mm}-${dd}`;
    bucketMap[label] = 0;
  }

  // 5. Sum each receipt into the correct bucket
  (receipts ?? []).forEach((r) => {
    const created = new Date(r.transaction_date);

    const yyyy = created.getFullYear();
    const mm = (created.getMonth() + 1).toString().padStart(2, "0");
    const dd = created.getDate().toString().padStart(2, "0");
    const label = `${yyyy}-${mm}-${dd}`;
    if (bucketMap[label] !== undefined) {
      bucketMap[label] += r.total || 0;
    }
  });

  // 6. Convert bucketMap to sorted array of SpendBucket
  const sortedKeys = Object.keys(bucketMap).sort((a, b) => {
    return a.localeCompare(b);
  });

  const result: SpendBucket[] = sortedKeys.map((key) => ({
    label: key,
    total: bucketMap[key],
  }));

  return { data: result, error: null };
}

export interface WeekdayVisit {
  day: string;
  visitCount: number;
}

export async function getUniqueVisitsByWeekday(timeframe: "day" | "7days" | "30days" | "all" = "all"): Promise<WeekdayVisit[]> {
  const userId = await getLoggedInUserId()
  const now = new Date();
  let startDate: Date | null = null;

  switch (timeframe) {
    case "day":
      startDate = new Date(now.setHours(0, 0, 0, 0));
      break;
    case "7days":
      startDate = new Date(now.setDate(now.getDate() - 7));
      break;
    case "30days":
      startDate = new Date(now.setDate(now.getDate() - 30));
      break;
    case "all":
    default:
      startDate = null;
  }

  // Build query
  let query = supabase.from("user_receipts")
    .select("transaction_date")
    .eq("user_id", userId);

  // Only filter by date if not "all"
  if (startDate) {
    query = query.gte("transaction_date", startDate.toISOString().split("T")[0]);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching user_receipts:", error);
    return [];
  }

  // Count visits by weekday
  const weekdayCounts: Record<number, number> = {
    0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0,
  };

  (data ?? []).forEach((r) => {
    const date = new Date(r.transaction_date);
    const weekday = date.getDay();
    weekdayCounts[weekday] += 1;
  });

  const labelMap: Record<number, string> = {
    0: "S", 1: "M", 2: "T", 3: "W", 4: "T", 5: "F", 6: "S",
  };

  return Object.entries(weekdayCounts).map(([key, count]) => ({
    day: labelMap[parseInt(key)],
    visitCount: count,
  }));
}

function _formatHourBucket(hour24: number): string {
  const ampm = hour24 >= 12 ? "PM" : "AM";
  const hour12Raw = hour24 % 12 === 0 ? 12 : hour24 % 12;
  const hourStr = hour12Raw.toString().padStart(2, "0");
  return `${hourStr}:00 ${ampm}`;
}

function _hourLabelToNumber(label: string): number {
  const [timePart, ampm] = label.split(" ");
  const [hStr] = timePart.split(":");
  let h = parseInt(hStr, 10);
  if (ampm === "AM") {
    if (h === 12) h = 0;
  } else {
    // PM
    if (h !== 12) h += 12;
  }
  return h;
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