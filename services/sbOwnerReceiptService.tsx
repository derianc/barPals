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

export async function getCurrentAndPreviousTotalVenueSpend(
    startDate: Date | null,
    endDate: Date | null,
    venueHash: string
): Promise<{ current: number; previous: number; percentChange: number | null }> {
    try {
        const { start, end } = safeDateRange(startDate, endDate);

        const msInDay = 1000 * 60 * 60 * 24;
        const numDays = startDate && endDate
            ? Math.ceil((endDate.getTime() - startDate.getTime()) / msInDay)
            : 30;

        const prevEnd = startDate ? new Date(startDate) : null;
        const prevStart = prevEnd ? new Date(prevEnd.getTime() - numDays * msInDay) : null;
        const prevRange = safeDateRange(prevStart, prevEnd);

        const { data: currentData, error: currentError } = await supabase
            .from("user_receipts")
            .select("total")
            .eq("venue_hash", venueHash)
            .gte("transaction_date", start)
            .lt("transaction_date", end);

        if (currentError) throw currentError;
        const current = currentData?.reduce((sum, r) => sum + (r.total ?? 0), 0) ?? 0;

        const { data: previousData, error: previousError } = await supabase
            .from("user_receipts")
            .select("total")
            .eq("venue_hash", venueHash)
            .gte("transaction_date", prevRange.start)
            .lt("transaction_date", prevRange.end);

        if (previousError) throw previousError;
        const previous = previousData?.reduce((sum, r) => sum + (r.total ?? 0), 0) ?? 0;

        const percentChange = previous === 0
            ? current > 0 ? 100 : 0
            : parseFloat((((current - previous) / previous) * 100).toFixed(2));

        return { current, previous, percentChange };
    } catch (err) {
        console.error("❌ Error in getCurrentAndPreviousTotalVenueSpend:", err);
        return { current: 0, previous: 0, percentChange: null };
    }
}

export async function getAverageSpendPerCustomer(
    startDate: Date | null,
    endDate: Date | null,
    venueHash: string
): Promise<{ current: number; previous: number; percentChange: number | null }> {
    try {
        const { start, end } = safeDateRange(startDate, endDate);
        const msInDay = 1000 * 60 * 60 * 24;
        const numDays = startDate && endDate
            ? Math.ceil((endDate.getTime() - startDate.getTime()) / msInDay)
            : 30;

        const prevEnd = startDate ? new Date(startDate) : null;
        const prevStart = prevEnd ? new Date(prevEnd.getTime() - numDays * msInDay) : null;
        const prevRange = safeDateRange(prevStart, prevEnd);

        const { data: currentData, error: currentError } = await supabase
            .from("user_receipts")
            .select("total, user_id")
            .eq("venue_hash", venueHash)
            .gte("transaction_date", start)
            .lt("transaction_date", end);

        if (currentError) throw currentError;

        const currentTotal = currentData?.reduce((sum, r) => sum + (r.total ?? 0), 0) ?? 0;
        const currentUsers = new Set(currentData?.map(r => r.user_id)).size;
        const currentAvg = currentUsers > 0 ? currentTotal / currentUsers : 0;

        const { data: prevData, error: prevError } = await supabase
            .from("user_receipts")
            .select("total, user_id")
            .eq("venue_hash", venueHash)
            .gte("transaction_date", prevRange.start)
            .lt("transaction_date", prevRange.end);

        if (prevError) throw prevError;

        const prevTotal = prevData?.reduce((sum, r) => sum + (r.total ?? 0), 0) ?? 0;
        const prevUsers = new Set(prevData?.map(r => r.user_id)).size;
        const prevAvg = prevUsers > 0 ? prevTotal / prevUsers : 0;

        const percentChange = prevAvg === 0
            ? currentAvg > 0 ? 100 : 0
            : parseFloat((((currentAvg - prevAvg) / prevAvg) * 100).toFixed(2));

        return { current: parseFloat(currentAvg.toFixed(2)), previous: parseFloat(prevAvg.toFixed(2)), percentChange };
    } catch (err) {
        console.error("❌ Error in getAverageSpendPerCustomer:", err);
        return { current: 0, previous: 0, percentChange: null };
    }
}

export async function getUniqueVisitorsToVenue(
    startDate: Date | null,
    endDate: Date | null,
    venueHash: string
): Promise<{ current: number; previous: number; percentChange: number | null }> {
    try {
        const { start, end } = safeDateRange(startDate, endDate);
        const msInDay = 1000 * 60 * 60 * 24;
        const numDays = startDate && endDate
            ? Math.ceil((endDate.getTime() - startDate.getTime()) / msInDay)
            : 30;

        const prevEnd = startDate ? new Date(startDate) : null;
        const prevStart = prevEnd ? new Date(prevEnd.getTime() - numDays * msInDay) : null;
        const prevRange = safeDateRange(prevStart, prevEnd);

        const { data: currentData, error: currentError } = await supabase
            .from("user_receipts")
            .select("user_id")
            .eq("venue_hash", venueHash)
            .gte("transaction_date", start)
            .lt("transaction_date", end);

        if (currentError) throw currentError;
        const current = new Set(currentData?.map(r => r.user_id)).size;

        const { data: prevData, error: prevError } = await supabase
            .from("user_receipts")
            .select("user_id")
            .eq("venue_hash", venueHash)
            .gte("transaction_date", prevRange.start)
            .lt("transaction_date", prevRange.end);

        if (prevError) throw prevError;
        const previous = new Set(prevData?.map(r => r.user_id)).size;

        const percentChange = previous === 0
            ? current > 0 ? 100 : 0
            : parseFloat((((current - previous) / previous) * 100).toFixed(2));

        return { current, previous, percentChange };
    } catch (err) {
        console.error("❌ Error in getUniqueVisitorsToVenue:", err);
        return { current: 0, previous: 0, percentChange: null };
    }
}

export async function getAverageItemsPerCustomer(
    startDate: Date | null,
    endDate: Date | null,
    venueHash: string
): Promise<{ current: number; previous: number; percentChange: number | null }> {
    try {
        const { start, end } = safeDateRange(startDate, endDate);
        const msInDay = 1000 * 60 * 60 * 24;
        const numDays = startDate && endDate
            ? Math.ceil((endDate.getTime() - startDate.getTime()) / msInDay)
            : 30;

        const prevEnd = startDate ? new Date(startDate) : null;
        const prevStart = prevEnd ? new Date(prevEnd.getTime() - numDays * msInDay) : null;
        const prevRange = safeDateRange(prevStart, prevEnd);

        const { data: currentReceipts, error: currentError } = await supabase
            .from("user_receipts")
            .select("id, user_id")
            .eq("venue_hash", venueHash)
            .gte("transaction_date", start)
            .lt("transaction_date", end);

        if (currentError) throw currentError;

        const currentIds = currentReceipts?.map(r => r.id) ?? [];
        const currentUsers = new Set(currentReceipts?.map(r => r.user_id));

        const { count: currentItems, error: itemError } = await supabase
            .from("user_receipt_items")
            .select("id", { head: true, count: "exact" })
            .in("receipt_id", currentIds);

        if (itemError) throw itemError;
        const currentAvg = currentUsers.size > 0 ? (currentItems ?? 0) / currentUsers.size : 0;

        const { data: prevReceipts, error: prevError } = await supabase
            .from("user_receipts")
            .select("id, user_id")
            .eq("venue_hash", venueHash)
            .gte("transaction_date", prevRange.start)
            .lt("transaction_date", prevRange.end);

        if (prevError) throw prevError;

        const prevIds = prevReceipts?.map(r => r.id) ?? [];
        const prevUsers = new Set(prevReceipts?.map(r => r.user_id));

        const { count: prevItems, error: itemPrevError } = await supabase
            .from("user_receipt_items")
            .select("id", { head: true, count: "exact" })
            .in("receipt_id", prevIds);

        if (itemPrevError) throw itemPrevError;

        const prevAvg = prevUsers.size > 0 ? (prevItems ?? 0) / prevUsers.size : 0;

        const percentChange = prevAvg === 0
            ? currentAvg > 0 ? 100 : 0
            : parseFloat((((currentAvg - prevAvg) / prevAvg) * 100).toFixed(2));

        return {
            current: parseFloat(currentAvg.toFixed(2)),
            previous: parseFloat(prevAvg.toFixed(2)),
            percentChange,
        };
    } catch (err) {
        console.error("❌ Error in getAverageItemsPerCustomer:", err);
        return { current: 0, previous: 0, percentChange: null };
    }
}

export async function getVenueSpendTrend(
  startDate: Date | null,
  endDate: Date | null,
  venueHash: string
): Promise<{ data: { label: string; total: number }[]; error: Error | null }> {
  try {
    const formatDate = (d: Date) => d.toISOString().split("T")[0];
    const start = startDate ? formatDate(startDate) : "1900-01-01";
    const end = endDate ? formatDate(endDate) : "2100-01-01";

    // console.log("📊 Fetching venue spend trend", { venueHash, start, end });

    const { data, error } = await supabase
      .from("user_receipts")
      .select("transaction_date,total")
      .eq("venue_hash", venueHash)
      .gte("transaction_date", start)
      .lt("transaction_date", end);

    if (error) {
      console.error("❌ Supabase error while fetching receipts:", error.message);
      throw error;
    }

    // console.log(`📥 Received ${data?.length ?? 0} transactions from Supabase`);

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

        date.setDate(date.getDate() + 1); // next day
      }
    }

    // console.log("📊 Final spend trend buckets:", output);
    return { data: output, error: null };
  } catch (err) {
    console.error("❌ Error in getVenueSpendTrend:", err);
    return { data: [], error: err as Error };
  }
}

export async function getVenueVisitsByDay(
  startDate: Date | null,
  endDate: Date | null,
  venueHash: string
): Promise<{ data: { day: string; visitCount: number }[]; error: Error | null }> {
  try {
    const formatDate = (d: Date) => d.toISOString().split("T")[0];
    const start = startDate ? formatDate(startDate) : "1900-01-01";
    const end = endDate ? formatDate(endDate) : "2100-01-01";

    console.log("📊 getVenueVisitsByDay() input", {
      venueHash,
      start,
      end,
    });

    const { data, error } = await supabase
      .from("user_receipts")
      .select("transaction_date")
      .eq("venue_hash", venueHash)
      .gte("transaction_date", start)
      .lt("transaction_date", end);

    if (error) {
      console.error("❌ Supabase error in getVenueVisitsByDay:", error.message);
      throw error;
    }

    console.log(`📥 ${data?.length ?? 0} receipts fetched for visit tally`);

    const weekdayMap: Record<string, number> = {
      Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0,
    };

    for (const r of data ?? []) {
      const date = new Date(r.transaction_date);
      const weekday = date.toLocaleDateString("en-US", { weekday: "short" }); // "Sun", etc.
      weekdayMap[weekday] += 1;
    }

    // console.log("📆 Aggregated weekday counts:", weekdayMap);

    const result = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => ({
      day,
      visitCount: weekdayMap[day],
    }));

    // console.log("✅ Final visit trend result:", JSON.stringify(result, null, 2));

    return { data: result, error: null };
  } catch (err) {
    console.error("❌ Error in getVenueVisitsByDay:", err);
    return { data: [], error: err as Error };
  }
}




export async function getAllReceiptsForVenue(venueHash: string): Promise<{ data: any[]; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from("user_receipts")
      .select("*")
      .eq("venue_hash", venueHash)
      .order("transaction_date", { ascending: false });

    if (error) {
      console.error("❌ Error in getAllReceipts:", error.message);
      return { data: [], error };
    }

    return { data: data ?? [], error: null };
  } catch (err) {
    console.error("❌ Unexpected error in getAllReceipts:", err);
    return { data: [], error: err as Error };
  }
}
