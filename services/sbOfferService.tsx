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

export const submitOffer = async ({
  venueId,
  title,
  description,
  imageUrl,
  validFrom,
  validUntil,
  targetCriteria,
  scheduledAt,
}: {
  venueId: string;
  title: string;
  description: string;
  imageUrl?: string;
  validFrom: Date;
  validUntil: Date;
  targetCriteria?: any; // could be typed more strictly if known
  scheduledAt?: Date;
}) => {
  const { data, error } = await supabase.from("offers").insert([
    {
      venue_id: venueId,
      title,
      description,
      image_url: imageUrl || null,
      valid_from: validFrom.toISOString(),
      valid_until: validUntil.toISOString(),
      target_criteria: targetCriteria ?? null,
      scheduled_at: scheduledAt?.toISOString() ?? null,
      sent: false,
    },
  ]);

  if (error) {
    console.error("❌ Failed to submit offer:", error);
    throw new Error("Failed to submit offer");
  }

  return data?.[0];
};
