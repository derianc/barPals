import { supabase } from "@/supabase";
import { Venue } from "@/types/Venue";
import { generateVenueHash, sanitizeText } from "@/utilities";
import { matchReceiptToVenue } from "./sbEdgeFunctions";

export async function getVenuesForProfile(userId: string): Promise<Venue[]> {
  const { data, error } = await supabase
    .from("venue_users")
    .select(`
    venue_id (
      id,
      name,
      address_line1,
      venue_hash,
      latitude,
      longitude
    )
  `)
    .eq("profile_id", userId);

  if (error) {
    console.error("❌ Failed to fetch venues:", error.message);
    return [];
  }

  return (data ?? []).map((row: any) => ({
    id: row.venue_id.id,
    name: row.venue_id.name,
    address: row.venue_id.address_line1,
    venue_hash: row.venue_id.venue_hash,
    latitude: row.venue_id.latitude,
    longitude: row.venue_id.longitude,
  }));
}

type VenueJoinResult = {
  venue: { venue_hash: string } | { venue_hash: string }[]; // handles both array and object
};


export async function uploadVenueImage(file: File, path: string) {
  const { error } = await supabase.storage.from("venue-assets").upload(path, file, {
    upsert: true,
  });
  if (error) throw error;
  const { data } = supabase.storage.from("venue-assets").getPublicUrl(path);
  return data.publicUrl;
}

export async function createVenueWithOwner(venueData: any, ownerId: string) {
  console.log("🚀 Creating venue with data:", venueData);

  // Step 1: Insert into venues
  const { data, error } = await supabase.from("venues").insert([venueData]).select("id");
  if (error) {
    console.error("❌ Failed to insert venue:", error.message);
    throw error;
  }

  const venueId = data?.[0]?.id;
  console.log("✅ Venue inserted with ID:", venueId);

  // Step 2: Link owner to venue
  const vuRes = await supabase.from("venue_users").insert({
    profile_id: ownerId,
    venue_id: venueId,
    role: "owner",
  });

  if (vuRes.error) {
    console.error("❌ Failed to link owner to venue:", vuRes.error.message);
    throw vuRes.error;
  } else {
    console.log("✅ Owner linked to venue");
  }

  // 🔄 Call edge function via shared helper
  await matchReceiptToVenue({
    mode: "venue_to_receipts",
    venue_id: venueId,
    street_line: venueData.address_line1?.toLowerCase(),
    city: venueData.city?.toLowerCase(),
    state: venueData.state?.toUpperCase(),
    postal: venueData.postal_code,
  });

  return venueId;
}


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

export async function findVenueByHash(venueHash: string) {
  try {
    console.log("🔑 Searching venue by hash:", venueHash);

    const { data, error } = await supabase
      .from("venues")
      .select("id, name")
      .eq("venue_hash", venueHash)
      .limit(1);

    if (error) {
      console.error("Venue lookup by hash failed:", error);
      return null;
    }

    return data?.[0] || null;
  } catch (err) {
    console.error("Error generating venue hash:", err);
    return null;
  }
}

export async function isVenueDuplicate(venueHash: string): Promise<boolean> {
  const { data: existing, error } = await supabase
    .from("venues")
    .select("id")
    .eq("venue_hash", venueHash)
    .maybeSingle();

  if (error) {
    console.error("❌ Duplicate check failed:", error);
    return false; // fail open
  }

  return !!existing;
}