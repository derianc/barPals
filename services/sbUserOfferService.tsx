import { supabase } from "@/supabase";

export async function fetchUserOffers(userId: string) {
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
    console.error("❌ Error fetching user offers:", error.message);
    return [];
  }

  const now = new Date();

  console.log("📦 Raw user offer candidates:", data);

  return (data ?? [])
    .filter((entry: any) => {
      const offer = entry.offer;
      if (!offer || !offer.valid_until) return false;

      const validUntil = new Date(offer.valid_until);
      return validUntil >= now;
    })
    .map((entry: any) => {
      const offer = entry.offer;
      const venueObj = Array.isArray(offer.venue)
        ? offer.venue[0]
        : offer.venue;

      return {
        ...offer,
        venue_name: venueObj?.name ?? "Unknown Venue",
        is_notified: entry.is_notified,
        candidate_created_at: entry.created_at,
      };
    });
}


