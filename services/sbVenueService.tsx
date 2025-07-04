import { supabase } from "@/supabase";

export interface Venue {
  id: string;
  name: string;
  address: string;
  venueHash: string;
}

export async function getVenuesForProfile(userId: string): Promise<Venue[]> {
  const { data, error } = await supabase
    .from("venue_users")
    .select("venue:venue_id(id, name, address_line1, venue_hash)")
    .eq("profile_id", userId);

  if (error) {
    console.error("❌ Failed to fetch venues:", error.message);
    return [];
  }

  return (data ?? []).map((row: any) => ({
    id: row.venue.id,
    name: row.venue.name,
    address: row.venue.address_line1,
    venueHash: row.venue.venue_hash,
  }));
}

type VenueJoinResult = {
  venue: { venue_hash: string } | { venue_hash: string }[]; // handles both array and object
};

export async function getSelectedVenueHash({
  userId,
  venueId,
}: {
  userId: string;
  venueId?: string;
}): Promise<string> {
  try {
    if (venueId) {
      const { data, error } = await supabase
        .from("venues")
        .select("venue_hash")
        .eq("id", venueId)
        .single();

      if (error) {
        console.error("❌ Error querying venues table:", error.message);
        return "";
      }

      return data?.venue_hash ?? "";
    }

    const { data: joinedData, error: joinError } = await supabase
      .from("venue_users")
      .select("venue:venue_id(venue_hash)")
      .eq("profile_id", userId)
      .limit(1)
      .maybeSingle();

    if (joinError) {
      console.error("❌ Supabase join error:", joinError.message);
      return "";
    }

    const { venue } = joinedData as VenueJoinResult;
    return Array.isArray(venue) ? venue[0]?.venue_hash : venue?.venue_hash ?? "";
  } catch (err) {
    console.error("❌ Unexpected exception in getSelectedVenueHash:", err);
    return "";
  }
}

export async function getVenueForUser(profileId: string) {
  const { data: venueLink, error: linkError } = await supabase
    .from("venue_users")
    .select("venue_id")
    .eq("profile_id", profileId)
    .single();

  if (linkError || !venueLink) throw new Error("Failed to get venue_id");
  return venueLink.venue_id;
}

export async function getVenueDetails(venueId: string) {
  const { data, error } = await supabase
    .from("venues")
    .select("*")
    .eq("id", venueId)
    .single();

  if (error || !data) throw new Error("Failed to get venue details");
  return data;
}