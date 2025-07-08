// supabase/functions/processOffer/index.ts
// @ts-nocheck
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL"),
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
);

const PUSH_FUNCTION_URL = "https://pgswimjajpjupnafjosl.supabase.co/functions/v1/sendPushNotification";

serve(async (req) => {
  console.log("📥 Request received");
  if (req.method !== "POST") {
    console.warn("⚠️ Invalid method:", req.method);
    return new Response("Method not allowed", { status: 405 });
  }

  let payload;
  try {
    payload = await req.json();
    console.log("🔍 Payload:", payload);
  } catch (err) {
    console.error("❌ Failed to parse JSON:", err);
    return new Response("Invalid JSON", { status: 400 });
  }

  const { offerId } = payload;
  console.log("🔑 Processing offerId:", offerId);

  // 1. Fetch the offer and venue
  const { data: offer, error: offerError } = await supabase
    .from("offers")
    .select("*, venues(*)")
    .eq("id", offerId)
    .single();

  if (offerError || !offer) {
    console.error("❌ Offer fetch error:", offerError);
    return new Response("Offer not found", { status: 404 });
  }

  console.log("✅ Offer loaded:", offer.title);

  const { title, description, target_criteria, venues } = offer;
  const { minSpend, lastVisited, maxDistance } = target_criteria ?? {};
  const venueLat = venues?.latitude;
  const venueLng = venues?.longitude;
  const venueHash = venues?.venue_hash;

  if (!venueLat || !venueLng) {
    console.warn("⚠️ Venue is missing coordinates:", venues);
    return new Response("Venue is missing coordinates", { status: 400 });
  }

  console.log("📍 Venue name:", venues.name);
  console.log("📍 Venue location:", { lat: venueLat, lng: venueLng });

  // 2. Query eligible users
  console.log("📡 Querying users with:", {
    venueLat,
    venueLng,
    maxDistance,
    minSpend,
    lastVisited,
    venueHash
  });

  const { data: matchingUsers, error: matchError } = await supabase.rpc("get_users_matching_offer", {
    venue_lat: venueLat,
    venue_lng: venueLng,
    max_distance_km: maxDistance,
    min_spend: minSpend,
    last_visited_window: lastVisited?.[0] || null,
    venue_hash: venueHash
  });

  if (matchError) {
    console.error("❌ Matching user error:", matchError);
    return new Response("Error finding matching users", { status: 500 });
  }

  console.log(`🎯 Found ${matchingUsers.length} matching users`);

  // 3. Send push notification to each user
  for (const user of matchingUsers) {
    console.log("📨 Sending push to:", user.id);

    const pushRes = await fetch(PUSH_FUNCTION_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.id,
        title: title,
        body: description,
        iconUrl: venues.logo_url ?? null
      })
    });

    const result = await pushRes.json();

    if (!pushRes.ok) {
      console.error(`❌ Push failed for user ${user.id}:`, result);
    } else {
      console.log(`✅ Push sent to ${user.id}`);
    }
  }

  // 4. Mark offer as sent
  const { error: updateError } = await supabase
    .from("offers")
    .update({ sent: true })
    .eq("id", offerId);

  if (updateError) {
    console.error("❌ Failed to mark offer as sent:", updateError);
    return new Response("Offer sent but update failed", { status: 500 });
  }

  console.log(`✅ Offer ${offerId} marked as sent`);

  return new Response(
    JSON.stringify({ message: `Sent to ${matchingUsers.length} users.` }),
    { headers: { "Content-Type": "application/json" }, status: 200 }
  );
});
