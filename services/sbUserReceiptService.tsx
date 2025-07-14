import { supabase } from "@/supabase";

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

export interface WeekdayVisit {
    day: string;
    visitCount: number;
}
