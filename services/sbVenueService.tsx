import { supabase } from "@/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getLoggedInUserId } from "./sbUserService";

export interface Venue {
  id: string;
  name: string;
  address: string;
  venueHash: string;
}

export async function getVenuesForProfile(): Promise<Venue[]> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error("🔐 Failed to get authenticated user:", userError?.message);
    return [];
  }

  const { data, error } = await supabase
    .from("venue_users")
    .select("venue:venue_id(id, name, address_line1)")
    .eq("profile_id", user.id);

  if (error) {
    console.error("❌ Failed to fetch venues:", error.message);
    return [];
  }

  // ✅ Flatten the result so each item is a Venue
  return (data ?? []).map((row: any) => ({
    id: row.venue.id,
    name: row.venue.name,
    address: row.venue.address_line1,
    venueHash: row.venue.venue_hash
  }));
}

type VenueJoinResult = {
  venue: { venue_hash: string } | { venue_hash: string }[]; // handles both array and object
};

export async function getSelectedVenueHash(): Promise<string> {
  try {
    console.log("🔍 Attempting to retrieve venue hash...");

    // 1. Check local storage for selectedVenueId
    const storedVenueId = await AsyncStorage.getItem("selectedVenueId");
    console.log("📦 Retrieved from AsyncStorage - selectedVenueId:", storedVenueId);

    if (storedVenueId) {
      console.log("🔄 Querying venues table for venue_hash using selectedVenueId...");

      const { data, error } = await supabase
        .from("venues")
        .select("venue_hash")
        .eq("id", storedVenueId)
        .single();

      if (error) {
        console.error("❌ Error querying venues table:", error.message);
      } else {
        console.log("✅ venues query result:", data);
      }

      if (data?.venue_hash) {
        console.log("🏁 Venue hash found from venues table:", data.venue_hash);
        return data.venue_hash;
      } else {
        console.warn("⚠️ venue_hash not found for selectedVenueId in venues table.");
      }
    }

    console.log("🌀 No valid selectedVenueId found. Falling back to venue_users join...");

    // 2. Get current user from Supabase session
    const userId = await getLoggedInUserId()

    console.log("👤 Authenticated user ID:", userId);

    // 3. Join venue_users to get venue_hash
    console.log("🔗 Querying venue_users join for user's venue_hash...");

    const { data: joinedData, error: joinError } = await supabase
      .from("venue_users")
      .select("venue:venue_id(venue_hash)")
      .eq("profile_id", userId)
      .limit(1)
      .maybeSingle();

    if (joinError) {
      console.error("❌ Supabase query error on venue_users join:", joinError.message);
      return "";
    }

    if (!joinedData) {
      console.warn("⚠️ No matching venue_users record found for this user.");
      return "";
    }

    console.log("✅ venue_users join result:", joinedData);

    const { venue } = joinedData as VenueJoinResult;

    // Avoid unnecessary array check
    const venueHash = Array.isArray(venue) ? venue[0]?.venue_hash : venue?.venue_hash;
    console.log("🏁 Retrieved venue_hash from join:", venueHash);

    return venueHash ?? "";

  } catch (err) {
    console.error("❌ Unexpected exception in getSelectedVenueHash:", err);
    return "";
  }
}

