// @ts-nocheck
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { JWT } from "npm:google-auth-library@9.0.0";
const FCM_URL = "https://fcm.googleapis.com/v1/projects/barpals-a2c46/messages:send";
serve(async (req)=>{
  if (req.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405
    });
  }
  const { userId, title, body } = await req.json();
  // Get device token from Supabase
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const { token } = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}`, {
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`
    }
  }).then((res)=>res.json()).then((arr)=>({
      token: arr?.[0]?.device_token
    }));
  if (!token) {
    return new Response("No device token found", {
      status: 404
    });
  }
  // Auth with Google
  const keyJson = JSON.parse(Deno.env.get("FIREBASE_SERVICE_ACCOUNT"));
  keyJson.private_key = keyJson.private_key.replace(/\\n/g, "\n");
  const client = new JWT({
    email: keyJson.client_email,
    key: keyJson.private_key,
    scopes: [
      "https://www.googleapis.com/auth/firebase.messaging"
    ]
  });
  const accessToken = await client.getAccessToken();
  // Construct FCM message with Android channel
  const message = {
    message: {
      token,
      notification: {
        title: title || "Test Push",
        body: body || "Hello from Supabase Edge!"
      },
      data: {
        userId,
        screen: "home"
      },
      android: {
        notification: {
          icon: "notification_icon",
          channel_id: "default",
          sound: "default"
        }
      },
      apns: {
        payload: {
          aps: {
            sound: "default"
          }
        }
      }
    }
  };
  console.log("🚀 Outgoing FCM Payload:", JSON.stringify(message, null, 2));
  const pushRes = await fetch(FCM_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken.token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(message)
  });
  const pushResult = await pushRes.json();
  console.log("📬 FCM Response", pushRes.status, pushResult);
  return new Response(JSON.stringify({
    success: true,
    pushResult
  }), {
    headers: {
      "Content-Type": "application/json"
    }
  });
});
