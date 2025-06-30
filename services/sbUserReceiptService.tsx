import { supabase } from "@/supabase";

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function safeDateRange(startDate: Date | null, endDate: Date | null) {
  return {
    start: startDate ? formatDate(startDate) : "1900-01-01",
    end: endDate ? formatDate(endDate) : "2100-01-01",
  };
}

function getPreviousRange(startDate: Date | null, endDate: Date | null) {
  const msInDay = 1000 * 60 * 60 * 24;
  const numDays = startDate && endDate ? Math.ceil((endDate.getTime() - startDate.getTime()) / msInDay) : 30;

  const prevEnd = startDate ? new Date(startDate) : null;
  const prevStart = prevEnd ? new Date(prevEnd.getTime() - numDays * msInDay) : null;
  return safeDateRange(prevStart, prevEnd);
}

// 1. Total User Spend
export async function getTotalUserSpend(
  startDate: Date | null,
  endDate: Date | null,
  userId: string
): Promise<{ current: number; previous: number; percentChange: number | null }> {
  const { start, end } = safeDateRange(startDate, endDate);
  const prev = getPreviousRange(startDate, endDate);

  const getTotal = async (range: { start: string; end: string }) => {
    const { data, error } = await supabase
      .from("user_receipts")
      .select("total")
      .eq("user_id", userId)
      .gte("transaction_date", range.start)
      .lt("transaction_date", range.end);
    if (error) throw error;
    return data?.reduce((sum, r) => sum + (r.total || 0), 0) ?? 0;
  };

  try {
    const current = await getTotal({ start, end });
    const previous = await getTotal(prev);
    const percentChange = previous === 0 ? (current > 0 ? 100 : 0) : parseFloat((((current - previous) / previous) * 100).toFixed(2));
    return { current, previous, percentChange };
  } catch (err) {
    console.error("❌ Error in getTotalUserSpend:", err);
    return { current: 0, previous: 0, percentChange: null };
  }
}

// 2. Average User Spend
export async function getAverageUserSpend(
  startDate: Date | null,
  endDate: Date | null,
  userId: string
): Promise<{ current: number; previous: number; percentChange: number | null }> {
  const { start, end } = safeDateRange(startDate, endDate);
  const prev = getPreviousRange(startDate, endDate);

  const getAverage = async (range: { start: string; end: string }) => {
    const { data, error } = await supabase
      .from("user_receipts")
      .select("total")
      .eq("user_id", userId)
      .gte("transaction_date", range.start)
      .lt("transaction_date", range.end);
    if (error) throw error;
    const totals = data?.map((r) => r.total || 0) ?? [];
    return totals.length > 0 ? totals.reduce((sum, t) => sum + t, 0) / totals.length : 0;
  };

  try {
    const current = await getAverage({ start, end });
    const previous = await getAverage(prev);
    const percentChange = previous === 0 ? (current > 0 ? 100 : 0) : parseFloat((((current - previous) / previous) * 100).toFixed(2));
    return { current: parseFloat(current.toFixed(2)), previous: parseFloat(previous.toFixed(2)), percentChange };
  } catch (err) {
    console.error("❌ Error in getAverageUserSpend:", err);
    return { current: 0, previous: 0, percentChange: null };
  }
}

// 3. Unique Merchants Visited
export async function getUniqueMerchantsVisited(
  startDate: Date | null,
  endDate: Date | null,
  userId: string
): Promise<{ current: number; previous: number; percentChange: number | null }> {
  const { start, end } = safeDateRange(startDate, endDate);
  const prev = getPreviousRange(startDate, endDate);

  const getCount = async (range: { start: string; end: string }) => {
    const { data, error } = await supabase
      .from("user_receipts")
      .select("merchant_name")
      .eq("user_id", userId)
      .gte("transaction_date", range.start)
      .lt("transaction_date", range.end);
    if (error) throw error;
    return new Set((data ?? []).map((r) => r.merchant_name?.trim()?.toLowerCase())).size;
  };

  try {
    const current = await getCount({ start, end });
    const previous = await getCount(prev);
    const percentChange = previous === 0 ? (current > 0 ? 100 : 0) : parseFloat((((current - previous) / previous) * 100).toFixed(2));
    return { current, previous, percentChange };
  } catch (err) {
    console.error("❌ Error in getUniqueMerchantsVisited:", err);
    return { current: 0, previous: 0, percentChange: null };
  }
}

// 4. Average Items Per Visit
export async function getAverageItemsPerVisit(
  startDate: Date | null,
  endDate: Date | null,
  userId: string
): Promise<{ current: number; previous: number; percentChange: number | null }> {
  const { start, end } = safeDateRange(startDate, endDate);
  const prev = getPreviousRange(startDate, endDate);

  const getAvg = async (range: { start: string; end: string }) => {
    const { data: receipts, error } = await supabase
      .from("user_receipts")
      .select("id")
      .eq("user_id", userId)
      .gte("transaction_date", range.start)
      .lt("transaction_date", range.end);

    if (error) throw error;
    if (!receipts?.length) return 0;

    const ids = receipts.map((r) => r.id);
    const { count, error: itemErr } = await supabase
      .from("user_receipt_items")
      .select("id", { count: "exact", head: true })
      .in("receipt_id", ids);

    if (itemErr) throw itemErr;
    return count && receipts.length > 0 ? count / receipts.length : 0;
  };

  try {
    const current = await getAvg({ start, end });
    const previous = await getAvg(prev);
    const percentChange = previous === 0 ? (current > 0 ? 100 : 0) : parseFloat((((current - previous) / previous) * 100).toFixed(2));
    return { current: parseFloat(current.toFixed(2)), previous: parseFloat(previous.toFixed(2)), percentChange };
  } catch (err) {
    console.error("❌ Error in getAverageItemsPerVisit:", err);
    return { current: 0, previous: 0, percentChange: null };
  }
}

// populate user feed
export async function getAllReceiptsForUser(userId: string): Promise<any[]> {

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


export type SpendBucket = {
    label: string; // "hh:mm AM/PM" for hourly; "YYYY-MM-DD" for daily
    total: number;
};

export interface WeekdayVisit {
    day: string;
    visitCount: number;
}

export async function getUserSpendTrend(
  startDate: Date | null,
  endDate: Date | null,
  userId: string
): Promise<{ data: { label: string; total: number }[]; error: Error | null }> {
  try {
    const { start, end } = safeDateRange(startDate, endDate);

    const { data, error } = await supabase
      .from("user_receipts")
      .select("transaction_date,total")
      .eq("user_id", userId)
      .gte("transaction_date", start)
      .lt("transaction_date", end);

    if (error) throw error;

    const transactionMap: Record<string, number> = {};
    for (const r of data ?? []) {
      const key = new Date(r.transaction_date).toISOString().split("T")[0];
      transactionMap[key] = (transactionMap[key] ?? 0) + (r.total ?? 0);
    }

    const output: { label: string; total: number }[] = [];
    if (startDate && endDate) {
      const date = new Date(startDate);
      while (date <= endDate) {
        const key = date.toISOString().split("T")[0];
        const label = `${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
        const total = parseFloat((transactionMap[key] ?? 0).toFixed(2));
        output.push({ label, total });
        date.setDate(date.getDate() + 1);
      }
    }

    return { data: output, error: null };
  } catch (err) {
    console.error("❌ Error in getSpendBucketsForUser:", err);
    return { data: [], error: err as Error };
  }
}

export async function getUserVisitsByDay(
  startDate: Date | null,
  endDate: Date | null,
  userId: string
): Promise<{ data: { day: string; visitCount: number }[]; error: Error | null }> {
  try {
    const { start, end } = safeDateRange(startDate, endDate);

    const { data, error } = await supabase
      .from("user_receipts")
      .select("transaction_date")
      .eq("user_id", userId)
      .gte("transaction_date", start)
      .lt("transaction_date", end);

    if (error) throw error;

    const weekdayMap: Record<string, number> = {
      Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0,
    };

    for (const r of data ?? []) {
      const date = new Date(r.transaction_date);
      const weekday = date.toLocaleDateString("en-US", { weekday: "short" });
      weekdayMap[weekday] += 1;
    }

    const result = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => ({
      day,
      visitCount: weekdayMap[day],
    }));

    return { data: result, error: null };
  } catch (err) {
    console.error("❌ Error in getUniqueVisitsByWeekdayForUser:", err);
    return { data: [], error: err as Error };
  }
}
