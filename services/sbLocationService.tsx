import { supabase } from "@/supabase";
import * as Location from "expo-location";

export async function saveUserLocation(userId: string, location: Location.LocationObject) {
  try {
    // ⏳ Prevent saving if last entry was within 30 minutes
    const thirtyMinsAgo = new Date(Date.now() - 1 * 60 * 1000).toISOString();

    const { data: recent, error: checkError } = await supabase
      .from("user_location")
      .select("id")
      .eq("user_id", userId)
      .gte("recorded_at", thirtyMinsAgo)
      .limit(1);

    if (checkError) {
      console.error("❌ Error checking last location:", checkError);
      return;
    }

    if (recent && recent.length > 0) {
      console.log("⏱️ Skipping save — already updated within last 15 minutes");
      return;
    }

    // ✅ Continue with location request
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      console.warn("🚫 Location permission not granted");
      return;
    }

    const loc = location;
    const geo = await Location.reverseGeocodeAsync({
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
    });

    const city = geo?.[0]?.city ?? null;
    const state = geo?.[0]?.region ?? null;

    const { error: insertError } = await supabase.from("user_location").insert([
      {
        user_id: userId,
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        city,
        state,
      },
    ]);

    if (insertError) {
      console.error("❌ Error inserting location:", insertError);
    } else {
      console.log("📍 User location saved");
    }
  } catch (err) {
    console.error("❌ Unexpected error saving location:", err);
  }
}
