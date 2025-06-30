// @ts-nocheck
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts";

function generateUUIDv4() {
  return crypto.randomUUID();
}

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { mode = "simulate", lat, lng, count = 10 } = await req.json();

  if (mode === "cleanup") {
    // ✅ Delete all test users from auth (cascades down)
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("is_test", true);

    if (error) {
      console.error("❌ Failed to fetch test users:", error.message);
      return new Response("Failed to fetch test users", { status: 500 });
    }

    const ids = profiles.map((p) => p.id);
    for (const id of ids) {
      const { error: deleteError } = await supabase.auth.admin.deleteUser(id);
      if (deleteError) {
        console.error(`⚠️ Failed to delete user ${id}:`, deleteError.message);
      }
    }

    return new Response(JSON.stringify({ deleted: ids.length }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // 🧪 SIMULATE mode
  if (!lat || !lng) {
    return new Response("Missing lat/lng", { status: 400 });
  }

  const users = [];
  const locations = [];

  for (let i = 0; i < count; i++) {
    const email = `testuser-${Date.now()}-${i}@fake.dev`;
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password: "Password123!",
    });

    if (error || !data?.user?.id) {
      console.error(`❌ Failed to create user ${email}:`, error?.message);
      continue;
    }

    const userId = data.user.id;

    users.push({
      id: userId,
      email: email,
      username: `Test User ${i + 1}`,
      is_test: true,
    });

    const offsetLat = (Math.random() - 0.5) * 0.01;
    const offsetLng = (Math.random() - 0.5) * 0.01;

    locations.push({
      id: generateUUIDv4(),
      user_id: userId,
      latitude: lat + offsetLat,
      longitude: lng + offsetLng,
      recorded_at: new Date().toISOString(),
      is_test: true,
    });
  }

  const { error: profileErr } = await supabase.from("profiles").insert(users);
  if (profileErr) console.error("❌ Profile insert failed:", profileErr.message);

  const { error: locationErr } = await supabase.from("user_location").insert(locations);
  if (locationErr) console.error("❌ Location insert failed:", locationErr.message);

  return new Response(
    JSON.stringify({ created: users.length }),
    { headers: { "Content-Type": "application/json" } }
  );
});
