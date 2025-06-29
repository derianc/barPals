// @ts-nocheck
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { GoogleAuth } from "npm:google-auth-library@9.0.0";

const SERVICE_ACCOUNT_PATH = "./firebase-key.json";
const FCM_URL = "https://fcm.googleapis.com/v1/projects/barpals-a2c46/messages:send";

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const { userId, title, body } = await req.json();

  // You could look up the FCM token from Supabase if needed:
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const { token } = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}`, {
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    },
  }).then((res) => res.json()).then((arr) => ({ token: arr?.[0]?.device_token }));

  if (!token) {
    return new Response("No device token found", { status: 404 });
  }

  // Auth with Google
  const auth = new GoogleAuth({
    keyFile: SERVICE_ACCOUNT_PATH,
    scopes: ["https://www.googleapis.com/auth/firebase.messaging"],
  });

  const client = await auth.getClient();
  const accessToken = await client.getAccessToken();

  // Send the push
  const message = {
    message: {
      token,
      notification: { title, body },
    },
  };

  const pushRes = await fetch(FCM_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(message),
  });

  const pushResult = await pushRes.json();

  return new Response(JSON.stringify({ success: true, pushResult }), {
    headers: { "Content-Type": "application/json" },
  });
});
