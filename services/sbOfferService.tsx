import { supabase } from "@/supabase";

export const getOffersForVenue = async (profileId: string) => {
  // Step 1: Get venue IDs linked to this profile
  const { data: venueLinks, error: linkError } = await supabase
    .from("venue_users")
    .select("venue_id")
    .eq("profile_id", profileId);

  if (linkError || !venueLinks?.length) {
    console.error("Failed to fetch linked venues", linkError);
    return [];
  }

  const venueIds = venueLinks.map((v) => v.venue_id);

  // Step 2: Fetch offers for those venue IDs
  const { data: offers, error: offerError } = await supabase
    .from("offers")
    .select("*")
    .in("venue_id", venueIds)
    .order("created_at", { ascending: false });

  if (offerError) {
    console.error("Failed to fetch offers", offerError);
    return [];
  }

  return offers;
};
