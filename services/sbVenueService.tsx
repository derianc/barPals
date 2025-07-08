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
  const { data, error } = await supabase
    .from("venue_users")
    .select("venue_id")
    .eq("profile_id", profileId)
    .limit(1);

  if (error || !data || data.length === 0) {
    console.error("❌ Failed to fetch venue_id", error);
    throw new Error("No venue found for this user.");
  }

  return data[0].venue_id;
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

export async function findVenueByAddress(fullAddress: string) {
  const { address_line1, city, state, postal_code } = parseAddress(fullAddress);

  const { data, error } = await supabase
    .from("venues")
    .select("id, name")
    .ilike("address_line1", `%${address_line1.split(" ")[0]}%`) // fuzzy street number/street match
    .ilike("city", `%${city}%`)
    .eq("state", state)
    .eq("postal_code", postal_code)
    .limit(1);

  if (error) {
    console.error("Venue lookup failed:", error);
    return null;
  }

  return data?.[0] || null;
}

function parseAddress(address: string) {
  const regex = /^(.*)\s+([A-Za-z\s]+),?\s*([A-Z]{2})\s+(\d{5})$/;
  const match = address.match(regex);

  if (!match) {
    console.warn("Failed to parse address:", address);
    return { address_line1: address, city: "", state: "", postal_code: "" };
  }

  const [, address_line1, city, state, postal_code] = match;
  return { address_line1: address_line1.trim(), city: city.trim(), state, postal_code };
}