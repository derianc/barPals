import { supabase } from "@/supabase";
import * as Location from "expo-location";
import * as Crypto from 'expo-crypto';

let refreshTimeout: NodeJS.Timeout | null = null;

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

export const subscribeToLocationInserts = (callback: (location: any) => void) => {
  return supabase
    .channel("location-updates")
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "user_location" }, payload => {
      if (refreshTimeout) return;
      refreshTimeout = setTimeout(() => {
        callback(payload.new);
        refreshTimeout = null;
      }, 3000); // refresh at most every 30s
    })
    .on(
      "postgres_changes",
      { event: "DELETE", schema: "public", table: "user_location" },
      payload => {
        if (refreshTimeout) return;
        refreshTimeout = setTimeout(() => {
          callback(payload.old); // delete event → payload.old is the deleted row
          refreshTimeout = null;
        }, 3000);
      }
    )
    .subscribe();
};

export function unsubscribeFromLocationUpdates(subscription: any) {
  return supabase.removeChannel(subscription);
}

export async function getNearbyUserLocations(
  lat: number,
  lng: number,
  radiusMeters: number,
  timeWindowMinutes: number = 60 // default to last 60 minutes
): Promise<any[]> {
  const { data, error } = await supabase.rpc("get_nearby_user_locations", {
    lat,
    lng,
    radius_meters: radiusMeters,
    time_window_minutes: timeWindowMinutes,
  });

  if (error) {
    console.error("❌ Failed to fetch nearby locations:", error.message);
    return [];
  }

  return data ?? [];
}

export async function simulateUserMovementNearVenue(venue: { latitude: number; longitude: number }, count = 10) {
  const session = await supabase.auth.getSession();
  const token = session?.data?.session?.access_token;

  if (!token) {
    console.error("🚫 Cannot simulate users — no access token found");
    return;
  }

  const response = await fetch("https://pgswimjajpjupnafjosl.supabase.co/functions/v1/simulateUsers", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`, // ✅ required for JWT-enforced functions
    },
    body: JSON.stringify({
      lat: venue.latitude,
      lng: venue.longitude,
      count,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("❌ simulateUsers failed:", response.status, text);
  } else {
    console.log("✅ Simulated users near venue");
  }
}

export async function deleteTestLocations() {
  const session = await supabase.auth.getSession();
  const token = session?.data?.session?.access_token;

  if (!token) {
    console.error("🚫 Cannot simulate users — no access token found");
    return;
  }

  const response = await fetch("https://pgswimjajpjupnafjosl.supabase.co/functions/v1/simulateUsers", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`, // ✅ required for JWT-enforced functions
    },
    body: JSON.stringify({ mode: 'cleanup' }),

  });

  if (!response.ok) {
    const text = await response.text();
    console.error("❌ cleanup test users failed:", response.status, text);
  } else {
    console.log("✅ test data cleaned up");
  }
}