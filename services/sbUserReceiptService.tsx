import { supabase } from "@/supabase";

// populate user feed
export async function getAllReceiptsForUser(
  userId: string,
  lastSeenDate: string | null = null,
  limit = 5
): Promise<any[]> {
  let query = supabase
    .from("user_receipts")
    .select(`*, user_receipt_items(count)`)
    .eq("user_id", userId)
    .order("transaction_date", { ascending: false })
    .order("transaction_time", { ascending: false })
    .limit(limit);

  if (lastSeenDate) {
    query = query.lt("transaction_date", lastSeenDate);
  }

  const { data, error } = await query;

  if (error) {
    console.error("❌ Failed to fetch receipts:", error);
    throw new Error("Failed to fetch user receipts");
  }

  return data.map((receipt: any) => ({
    ...receipt,
    item_count: receipt.user_receipt_items[0]?.count ?? 0,
    isVerified: !!receipt.venue_id,
  }));
}

export interface WeekdayVisit {
    day: string;
    visitCount: number;
}
