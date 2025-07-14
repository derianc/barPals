import { supabase } from "@/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { AuthError, User } from "@supabase/supabase-js";
import type { PostgrestError } from "@supabase/supabase-js";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { router } from "expo-router";
import { UserProfileData } from "@/types/UserProfileData";

export interface RegisterResult {
  user?: Pick<User, "id" | "email">;
  signUpError?: AuthError | null;
  profileError?: PostgrestError | null;
}

export async function login(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  return { authData: data, error };
}

export async function logout() {
  try {
    const { data } = await supabase.auth.getSession();

    if (!data?.session) {
      console.warn("⚠️ No active session — skipping Supabase signOut");
    } else {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Logout failed:", error.message);
        return { error };
      }
    }

    await AsyncStorage.removeItem("currentUserId");
    router.replace("/login");
    return { error: null };

  } catch (err: any) {
    console.error("❌ Logout threw unexpected error:", err.message || err);
    return { error: err };
  }
}

export async function getProfile(): Promise<{ data: UserProfileData | null; error: PostgrestError | null } | null> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.user?.id) {
    // console.error("❌ No active session:", sessionError?.message);
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", session.user.id)
    .single();

  return { data, error };
}

export async function getProfileById(userId: string): Promise<{ data: UserProfileData | null; error: PostgrestError | null } | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !data) {
    console.error("❌ Failed to get user profile:", error?.message);
    return null;
  }

  return { data, error };
}

export async function registerUser(email: string, password: string): Promise<RegisterResult> {
  // 1) Create the user in Supabase Auth
  const { data: signUpData, error: signUpError, } = await supabase.auth.signUp({ email: email.trim(), password });

  if (signUpError || !signUpData.user) {
    // If signUp fails, return immediately
    return { signUpError };
  }

  const newUser = signUpData.user;
  const userId = newUser.id;

  // 2) Insert into "profiles" with id = newUser.id, email = newUser.email
  const { error: profileError } = await supabase
    .from("profiles")
    .insert({ id: userId, email: newUser.email });

  if (profileError) {
    return {
      signUpError: undefined,
      profileError,
    };
  }

  // 3) Everything succeeded
  return { user: { id: userId, email: newUser.email } };
}

export async function updateUserProfile(
  userId: string,
  updates: Partial<{
    full_name: string;
    username: string;
    allow_notifications: boolean;
    avatar_url: string | null;
  }>
) {
  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId)
    .select("*")
    .single();

  return { data, error };
}

export async function registerForExpoPushNotificationsAsync(userId: string) {
  try {
    let token;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("Failed to get push token for push notifications!");
      return "";
    }

    token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log("Expo Push Token:", token);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ device_token: token })
      .eq("id", userId);

    if (updateError) {
      console.error("❌ Failed to update device_token:", updateError);
    } else {
      console.log("✅ device_token updated successfully");
    }

  } catch (error: any) {
    alert(error);
    return "";
  }
};

