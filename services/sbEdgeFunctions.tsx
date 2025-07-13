import { supabase } from "@/supabase";

export async function matchReceiptToVenue(payload: {
  mode: "receipt_to_venue" | "venue_to_receipts";
  receipt_id?: string;
  venue_id?: string;
  street_line: string | null;
  city: string | null;
  state: string | null;
  postal: string | null;
}) {
  try {
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;

    if (!token) {
      console.warn("⚠️ No access token found. Skipping edge function call.");
      return;
    }

    const url = `https://pgswimjajpjupnafjosl.supabase.co/functions/v1/match_receipts_to_venue`;

    console.log("📤 Calling match_receipts_to_venue with:", payload);

    const matchResp = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!matchResp.ok) {
      const errorText = await matchResp.text();
      console.warn("⚠️ Match call failed:", matchResp.status, errorText);
    } else {
      const result = await matchResp.text();
      console.log("✅ Match function success:", result);
    }
  } catch (e) {
    console.error("❌ Error during match_receipts_to_venue call:", e);
  }
}

export async function sendNotification(userId: string) {
  await fetch("https://pgswimjajpjupnafjosl.supabase.co/functions/v1/sendPushNotification", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: userId,
      title: "Test Push",
      body: "Hello from Supabase Edge!",
    }),
  });
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

export async function geocodeAddress(address: string) {
  const session = await supabase.auth.getSession();
  const token = session.data.session?.access_token;

  const response = await fetch("https://pgswimjajpjupnafjosl.supabase.co/functions/v1/geocode-address", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({ address }),
  });

  console.log("response", response);

  if (!response.ok) {
    const error = await response.json();
    console.error("Geocoding failed:", error);
    return null;
  }

  const data = await response.json();
  return data;
}