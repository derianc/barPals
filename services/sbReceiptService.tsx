import { supabase } from "@/supabase";
import { TransactionData } from "@/data/models/transactionModel";

export async function insertReceiptDetails(receiptData: TransactionData): Promise<void> {
  // 0. Get current authenticated user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error("🔐 Failed to get authenticated user:", userError);
    throw new Error("User not authenticated");
  }

  // 1. Check for duplicates
  const { data: existing, error: findError } = await supabase
    .from("user_receipts")
    .select("id")
    .eq("merchant_name", receiptData.merchantName)
    .eq("transaction_date", receiptData.transactionDate)
    .eq("transaction_time", receiptData.transactionTime)
    .eq("total", receiptData.total)
    .limit(1);

  if (findError) {
    console.error("🔍 Error checking for duplicates:", findError);
    throw new Error("Error checking for duplicate receipt");
  }

  if (existing && existing.length > 0) {
    console.warn("⚠️ Duplicate receipt detected. Skipping insertion.");
    throw new Error("Duplicate Receipt");
  }

  // 2. Insert into user_receipts
  const { data: receiptInsert, error: receiptError } = await supabase
    .from("user_receipts")
    .insert({
      user_id: user.id,
      receipt_url: sanitizeText(receiptData.receiptUri),
      merchant_name: sanitizeText(receiptData.merchantName),
      merchant_address: sanitizeText(receiptData.merchantAddress),
      transaction_date: parseDate(receiptData.transactionDate),
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

    throw new Error("Failed to insert receipt items");
  }

  console.log("✅ Receipt and items successfully inserted");
}

export async function getAllReceiptsForUser() {
  // 1. Get current authenticated user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error("🔐 Failed to get authenticated user:", userError);
    throw new Error("User not authenticated");
  }

  // 2. Query receipts with embedded item count
  const { data, error } = await supabase
    .from("user_receipts")
    .select(`*, user_receipt_items(count)`)
    .eq("user_id", user.id)
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

export async function deleteReceiptById(receiptId: number): Promise<{ success: boolean; error?: Error }> {
  const { error } = await supabase
    .from("user_receipts")
    .delete()
    .eq("id", receiptId);

  if (error) {
    console.error("❌ Supabase delete error:", error.message);
    return { success: false, error };
  }

  return { success: true };
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

  if (timeframe === "all") {
    const { data: oldest, error: oldestError } = await supabase
      .from("user_receipts")
      .select("transaction_date")
      .eq("user_id", user.id)
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
    .eq("user_id", user.id);

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

  if (timeframe === "day") {
    for (let hour = 0; hour < 24; hour++) {
      const label = _formatHourBucket(hour);
      bucketMap[label] = 0;
    }
  } else {
    const end = new Date();
    end.setHours(0, 0, 0, 0);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
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
      const hour = created.getHours();
      const label = _formatHourBucket(hour);
      bucketMap[label] = (bucketMap[label] || 0) + (r.total || 0);
    } else {
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
  day: string;
  visitCount: number;
}

export async function getUniqueVisitsByWeekday(timeframe: "day" | "7days" | "30days" | "all" = "all"): Promise<WeekdayVisit[]> {
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

  // Build query
  let query = supabase.from("user_receipts")
    .select("transaction_date")
    .eq("user_id", user.id);

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
