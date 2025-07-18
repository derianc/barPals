import { supabase } from "@/supabase";

export async function fetchUserOffers(userId: string) {
  console.log("🚀 fetchUserOffers → called with userId:", userId);

  const { data, error } = await supabase
    .from("user_offer_candidates")
    .select(`
      is_notified,
      created_at,
      offer:offer_id (
        id,
        title,
        description,
        image_url,
        valid_from,
        valid_until,
        created_at,
        venue:venue_id (
          name
        )
      )
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("❌ Error fetching user offers from Supabase:", error.message, error);
    return [];
  }

  console.log("📦 Raw user_offer_candidates data:", JSON.stringify(data, null, 2));

    const now = new Date();
    const nowUtc = new Date(now.toISOString());
    console.log("🕒 Current UTC timestamp for validity filter:", nowUtc.toISOString());

    const filteredOffers = (data ?? []).filter((entry: any) => {
        const offer = entry.offer;

        if (!offer) {
            console.warn("⚠️ Skipping entry — missing offer:", entry);
            return false;
        }

        if (!offer.valid_until) {
            console.warn(`⚠️ Skipping offer (id: ${offer.id}) — missing valid_until`);
            return false;
        }

        const validUntil = new Date(offer.valid_until);
        const isValid = validUntil >= nowUtc;

        console.log(
            `🔍 Checking offer validity (id: ${offer.id}): validUntil = ${validUntil.toISOString()}, nowUtc = ${nowUtc.toISOString()}, isValid = ${isValid}`
        );

        return isValid;
    });

  console.log(`✅ Found ${filteredOffers.length} valid offers`);

  const transformedOffers = filteredOffers.map((entry: any) => {
    const offer = entry.offer;
    const venueObj = Array.isArray(offer.venue) ? offer.venue[0] : offer.venue;

    const transformed = {
      ...offer,
      venue_name: venueObj?.name ?? "Unknown Venue",
      is_notified: entry.is_notified,
      candidate_created_at: entry.created_at,
    };

    console.log("🎯 Transformed offer object:", transformed);
    return transformed;
  });

  console.log("🏁 Returning transformed offers:", transformedOffers.length);
  return transformedOffers;
}


