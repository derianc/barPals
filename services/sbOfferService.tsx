import { supabase } from "@/supabase";

export const getOffersForVenue = async (profileId: string, venueId: string) => {
  // Step 1: Confirm this profile is linked to this venue
  const { data: venueLink, error: linkError } = await supabase
    .from("venue_users")
    .select("venue_id")
    .eq("profile_id", profileId)
    .eq("venue_id", venueId)
    .maybeSingle();

  if (linkError || !venueLink) {
    console.warn(`⚠️ User ${profileId} is not linked to venue ${venueId}`, linkError);
    return [];
  }

  // Step 2: Fetch offers for this venue
  const { data: offers, error: offerError } = await supabase
    .from("offers")
    .select("*")
    .eq("venue_id", venueId)
    .order("created_at", { ascending: false });

  if (offerError) {
    console.error("❌ Failed to fetch offers for venue", offerError);
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
