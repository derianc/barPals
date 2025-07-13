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

