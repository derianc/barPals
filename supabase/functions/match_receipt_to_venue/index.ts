// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js";

serve(async (req) => {
  const body = await req.json();

  const {
    venue_id,
    street_line,
    city,
    state,
    postal
  } = body;

  if (!venue_id || !street_line || !city || !state) {
    return new Response("Missing required fields", { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { error } = await supabase
    .from("user_receipts")
    .update({
      venue_id,
      match_method: "component",
      match_confidence: 0.95
    })
    .match({
      street_line: street_line.toLowerCase(),
      city: city.toLowerCase(),
      state: state.toUpperCase()
    })
    .is("venue_id", null);

  if (error) {
    console.error("❌ Failed to update receipts:", error);
    return new Response("Error updating receipts", { status: 500 });
  }

  return new Response("Receipts updated successfully", { status: 200 });
});
