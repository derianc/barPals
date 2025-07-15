import { supabase } from "@/supabase";

export async function getAllReceiptsForVenue(
  venueHash: string,
  lastSeenDate: string | null = null,
  limit: number = 5
): Promise<{ data: any[]; error: Error | null }> {
  try {
    let query = supabase
      .from("user_receipts")
      .select("*")
      .eq("venue_hash", venueHash)
      .order("transaction_date", { ascending: false })
      .order("transaction_time", { ascending: false })
      .limit(limit);

    if (lastSeenDate) {
      query = query.lt("transaction_date", lastSeenDate);
    }

    const { data, error } = await query;

    if (error) {
      console.error("❌ Error in getAllReceiptsForVenue:", error.message);
      return { data: [], error };
    }

    return { data: data ?? [], error: null };
  } catch (err) {
    console.error("❌ Unexpected error in getAllReceiptsForVenue:", err);
    return { data: [], error: err as Error };
  }
}
