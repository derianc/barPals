import { supabase } from "@/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
    // console.log("checking storage for selectedVenueId");
    const storedVenueId = await AsyncStorage.getItem("selectedVenueId");
    // console.log("storedVenueId: ", storedVenueId)

    if (storedVenueId) {
      const { data, error } = await supabase
        .from("venues")
        .select("venue_hash")
        .eq("id", storedVenueId)
        .single();

      if (error) {
        console.error("❌ Failed to fetch venue_hash from venues:", error.message);
      }

      // console.log("venueHash: ", data?.venue_hash)
      if (data?.venue_hash) return data.venue_hash;
    }

    console.log("storedVenueId not found in localStorage, checking venue_users")

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("❌ Failed to get current user:", userError?.message);
      return "";
    }

    const { data: joinedData, error: joinError } = await supabase
      .from("venue_users")
      .select("venue:venue_id(venue_hash)")
      .eq("profile_id", user.id)
      .limit(1)
      .single();

    if (joinError || !joinedData) {
      console.error("❌ Failed to fetch joined venue_users:", joinError?.message);
      return "";
    }

    // 👇 Add explicit type here to help TS understand the structure
    const { venue } = joinedData as VenueJoinResult;

    const venueHash = Array.isArray(venue)
      ? venue[0]?.venue_hash
      : venue?.venue_hash;

    console.log("venueHash: ", venueHash);
    return venueHash ?? null;

  } catch (err) {
    console.error("❌ Unexpected error in getSelectedVenueHash:", err);
    return "";
  }
}
