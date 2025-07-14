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

export async function sendNotification(
  userId: string,
  title: string = "Test Push",
  body: string = "Hello from Supabase Edge!"
) {
  await fetch("https://pgswimjajpjupnafjosl.supabase.co/functions/v1/sendPushNotification", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId,
      title,
      body,
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

export async function processOffer(offerId: string) {
  const session = await supabase.auth.getSession();
  const token = session?.data?.session?.access_token;

  if (!token) {
    console.error("🚫 Cannot simulate users — no access token found");
    return;
  }

  try {
    const res = await fetch("https://pgswimjajpjupnafjosl.supabase.co/functions/v1/sendOfferNotification", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`, // ✅ required for JWT-enforced functions
      },
      body: JSON.stringify({ offerId })
    });

    const result = await res.json();
    if (!res.ok) {
      console.error("❌ Failed to process offer:", result);
    } else {
      console.log("✅ Offer processed:", result.message);
    }
  } catch (err) {
    console.error("❌ Error calling edge function:", err);
  }
}

export async function checkNearbyOffers(userId: string, latitude: number, longitude: number ) {
  const session = await supabase.auth.getSession();
  const token = session?.data?.session?.access_token;

  if (!token) {
    console.error("🚫 Cannot simulate users — no access token found");
    return;
  }

  try {
    const res = await fetch("https://pgswimjajpjupnafjosl.supabase.co/functions/v1/checkNearbyOffers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`, // ✅ required for JWT-enforced functions
      },
      body: JSON.stringify({ userId, latitude, longitude })
    });

    const result = await res.json();

    if (!res.ok) {
      console.error("❌ Edge function returned an error:", result);
      return;
    }

    console.log("✅ Offer processed:", result.message);
  } catch (error) {
    console.error("❌ Unexpected error calling checkNearbyOffers:", error);
  }
}

export async function getUserHomeMetrics(userId: string, start: Date | null, end: Date | null) {
  // console.log("📤 Calling getUserHomeMetrics with:", {
  //   userId,
  //   start: start?.toISOString?.() ?? null,
  //   end: end?.toISOString?.() ?? null,
  // });

  const session = await supabase.auth.getSession();
  const token = session?.data?.session?.access_token;

  if (!token) {
    console.error("🚫 Cannot get user home metrics — no access token found");
    return null;
  }

  const payload = {
    userId,
    start: start ? start.toISOString().split("T")[0] : null,
    end: end ? end.toISOString().split("T")[0] : null,
  };

  try {
    console.log("📡 Sending POST request to getUserHomeMetrics...");
    const res = await fetch(
      "https://pgswimjajpjupnafjosl.supabase.co/functions/v1/getUserHomeMetrics",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      }
    );

    const result = await res.json();
    // console.log("getUserHomeMetrics:", result)

    if (!res.ok) {
      console.error("❌ Edge function returned an error:", result);
      return null;
    }

    return result;
  } catch (error) {
    console.error("❌ Unexpected error calling getUserHomeMetrics:", error);
    return null;
  }
}

export async function getOwnerHomeMetrics(venueHash: string, start: Date | null, end: Date | null) {
  // console.log("📤 Calling getOwnerHomeMetrics with:", {
  //   venueHash,
  //   start: start?.toISOString?.() ?? null,
  //   end: end?.toISOString?.() ?? null,
  // });

  const session = await supabase.auth.getSession();
  const token = session?.data?.session?.access_token;

  if (!token) {
    console.error("🚫 Cannot get getOwnerHomeMetrics — no access token found");
    return null;
  }

  const payload = {
    venueHash,
    start: start ? start.toISOString().split("T")[0] : null,
    end: end ? end.toISOString().split("T")[0] : null,
  };

  try {
    console.log("📡 Sending POST request to getOwnerHomeMetrics...");
    const res = await fetch(
      "https://pgswimjajpjupnafjosl.supabase.co/functions/v1/getOwnerHomeMetrics",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      }
    );

    const result = await res.json();
    // console.log("getOwnerHomeMetrics:", result)

    if (!res.ok) {
      console.error("❌ Edge function returned an error:", result);
      return null;
    }

    return result;
  } catch (error) {
    console.error("❌ Unexpected error calling getOwnerHomeMetrics:", error);
    return null;
  }
}