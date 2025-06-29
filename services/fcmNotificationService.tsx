import { supabase } from "@/supabase";
import messaging from '@react-native-firebase/messaging';
import * as Notifications from 'expo-notifications';

export async function registerForFcmPushNotificationsAsync(userId: string) {
  const { status } = await Notifications.requestPermissionsAsync();
  console.log("🔐 Permission status:", status);

  const enabled = status === 'granted';

  if (!enabled) {
    console.warn('🚫 Notification permissions not granted');
    return null;
  }

  const fcmToken = await messaging().getToken();
  console.log('✅ FCM Token:', fcmToken);
  // return fcmToken;

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ device_token: fcmToken })
    .eq("id", userId);

  if (updateError) {
    console.error("❌ Failed to update device_token:", updateError);
  } else {
    console.log("✅ device_token updated successfully");
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

