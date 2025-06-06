import { supabase } from "@/supabase";
import { TransactionData } from "@/data/models/transactionModel";
import type { PostgrestError } from "@supabase/supabase-js";

export async function insertReceiptDetails(receiptData: TransactionData): Promise<void> {
  // 1. Get current authenticated user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error("🔐 Failed to get authenticated user:", userError);
    throw new Error("User not authenticated");
  }

  // 2. Insert into user_receipts
  const { data: receiptInsert, error: receiptError } = await supabase
    .from("user_receipts")
    .insert({
      user_id: user.id,
      receipt_url: receiptData.receiptUri,
      merchant_name: receiptData.merchantName,
      merchant_address: receiptData.merchantAddress,
      transaction_date: receiptData.transactionDate,
      transaction_time: receiptData.transactionTime,
      total: receiptData.total,
    })
    .select()
    .single();

  if (receiptError || !receiptInsert) {
    console.error("❌ Failed to insert receipt:", receiptError);
    throw new Error("Failed to insert receipt");
  }

  // 3. Insert line items
  const itemInserts = receiptData.Items.map((item) => ({
    receipt_id: receiptInsert.id,
    item_name: item.name,
    quantity: parseInt(item.quantity || "1"),
    price: item.price,
  }));

  const { error: itemsError } = await supabase
    .from("user_receipt_items")
    .insert(itemInserts);

  if (itemsError) {
    console.error("❌ Failed to insert receipt items:", itemsError);
    throw new Error("Failed to insert receipt items");
  }

  console.log("✅ Receipt and items successfully inserted");
}

export async function getTotalUserSpend(timeframe: "day" | "7days" | "30days" | "all" = "all"): Promise<number> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error("🔐 Failed to get authenticated user:", userError);
    throw new Error("User not authenticated");
  }

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

  let query = supabase
    .from("user_receipts")
    .select("total")
    .eq("user_id", user.id);

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
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error("🔐 Failed to get authenticated user:", userError);
    throw new Error("User not authenticated");
  }

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

  let query = supabase
    .from("user_receipts")
    .select("total")
    .eq("user_id", user.id);

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
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error("🔐 Failed to get authenticated user:", userError);
    throw new Error("User not authenticated");
  }

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

  let query = supabase
    .from("user_receipts")
    .select("merchant_name", { count: "exact" }) // we’ll use JS for uniqueness
    .eq("user_id", user.id);

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
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error("🔐 Failed to get authenticated user:", userError);
    throw new Error("User not authenticated");
  }

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

  // 1. Fetch receipt IDs for user in timeframe
  let receiptsQuery = supabase
    .from("user_receipts")
    .select("id")
    .eq("user_id", user.id);

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
  timeframe: "day" | "7days" | "30days" | "all" = "all"
): Promise<{ data: SpendBucket[]; error: Error | null }> {
  // 1. Get authenticated user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error("🔐 Failed to get authenticated user:", userError);
    return { data: [], error: userError ?? new Error("User not authenticated") };
  }

  // 2. Determine start date
  const now = new Date();
  let start: Date;
  switch (timeframe) {
    case "day":
      start = new Date(now);
      start.setHours(0, 0, 0, 0);
      break;
    case "7days":
      start = new Date(now);
      start.setHours(0, 0, 0, 0);
      start.setDate(start.getDate() - 6);
      break;
    case "30days":
      start = new Date(now);
      start.setHours(0, 0, 0, 0);
      start.setDate(start.getDate() - 29);
      break;
    case "all":
    default:
      start = new Date(now);
      start.setHours(0, 0, 0, 0);
  }

  // 3. Fetch receipts in the date range for this user
  const { data: receipts, error } = await supabase
    .from("user_receipts")
    .select("transaction_date, total")
    .eq("user_id", user.id)
    .gte("transaction_date", start.toISOString())
    .order("transaction_date", { ascending: true });

  if (error) {
    console.error("❌ Error fetching receipts for spend buckets:", error);
    return { data: [], error };
  }

  // 4. Initialize bucket map
  type BucketMap = Record<string, number>;
  const bucketMap: BucketMap = {};

  if (timeframe === "day") {
    // Create 24 hourly buckets: "12:00 AM", "01:00 AM", ..., "11:00 PM"
    for (let hour = 0; hour < 24; hour++) {
      const label = _formatHourBucket(hour);
      bucketMap[label] = 0;
    }
  } else {
    // Create daily buckets for each day from `start` to today
    const totalDays = timeframe === "7days" ? 7 : 30;
    for (let i = 0; i < totalDays; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const yyyy = d.getFullYear();
      const mm = (d.getMonth() + 1).toString().padStart(2, "0");
      const dd = d.getDate().toString().padStart(2, "0");
      const label = `${yyyy}-${mm}-${dd}`;
      bucketMap[label] = 0;
    }
  }

  // 5. Sum each receipt into the correct bucket
  (receipts ?? []).forEach((r) => {
    const created = new Date(r.transaction_date);
    if (timeframe === "day") {
      const hour = created.getHours(); // 0–23
      const label = _formatHourBucket(hour);
      bucketMap[label] = (bucketMap[label] || 0) + (r.total || 0);
    } else {
      // Daily bucket: "YYYY-MM-DD"
      const yyyy = created.getFullYear();
      const mm = (created.getMonth() + 1).toString().padStart(2, "0");
      const dd = created.getDate().toString().padStart(2, "0");
      const label = `${yyyy}-${mm}-${dd}`;
      if (bucketMap[label] !== undefined) {
        bucketMap[label] += r.total || 0;
      }
    }
  });

  // 6. Convert bucketMap to sorted array of SpendBucket
  const sortedKeys = Object.keys(bucketMap).sort((a, b) => {
    if (timeframe === "day") {
      return _hourLabelToNumber(a) - _hourLabelToNumber(b);
    } else {
      return a.localeCompare(b);
    }
  });

  const result: SpendBucket[] = sortedKeys.map((key) => ({
    label: key,
    total: bucketMap[key],
  }));

  return { data: result, error: null };
}

export interface WeekdayVisit {
  day: string; // "S", "M", "T", etc.
  visitCount: number;
}

export async function getUniqueVisitsByWeekday(): Promise<WeekdayVisit[]> {
  const { data, error } = await supabase
    .from("user_receipts")
    .select("transaction_date");

  if (error) {
    console.error("Error fetching user_receipts:", error);
    return [];
  }

  const weekdayCounts: Record<number, number> = {
    0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0,
  };

  (data ?? []).forEach((r) => {
    const date = new Date(r.transaction_date);
    const weekday = date.getDay(); // 0 = Sunday ... 6 = Saturday
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


//
// ─── PRIVATE HELPERS ────────────────────────────────────────────────────────────
//

/**
 * Convert a 24-hour integer (0–23) into a label string "hh:00 AM/PM".
 * e.g. 0 → "12:00 AM", 13 → "01:00 PM"
 */
function _formatHourBucket(hour24: number): string {
  const ampm = hour24 >= 12 ? "PM" : "AM";
  const hour12Raw = hour24 % 12 === 0 ? 12 : hour24 % 12;
  const hourStr = hour12Raw.toString().padStart(2, "0");
  return `${hourStr}:00 ${ampm}`;
}

/**
 * Given a label "hh:00 AM/PM", return the numeric hour (0–23).
 * e.g. "12:00 AM" → 0, "01:00 PM" → 13
 */
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