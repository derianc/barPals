import { supabase } from "@/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { AuthError, User } from "@supabase/supabase-js";
import type { PostgrestError } from "@supabase/supabase-js";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

export interface RegisterResult {
  user?: Pick<User, "id" | "email">;
  signUpError?: AuthError | null;
  profileError?: PostgrestError | null;
}

export interface UserProfileData {
  id: string;
  email: string;
  deviceToken?: string;
  username?: string | null | undefined;
  full_name?: string;
  avatar_url?: string;
  role: "user" | "owner" | "admin" | string;
  is_active: boolean;
  allow_notifications: boolean;
  created_at: string;
  updated_at: string;
}

const STORAGE_KEY = "loggedInUser";


export async function login(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  // ✅ Save profile to local storage
  try {
    const profile = await getProfile()
    console.log('saving profile to storage', JSON.stringify(profile, null, 2))
    await AsyncStorage.setItem("STORAGE_KEY", JSON.stringify(profile));

  } catch (storageError) {
    console.warn("⚠️ Failed to save profile to storage:", storageError);
  }

  return { authData: data, error };
}

export async function logout() {
  const { error } = await supabase.auth.signOut();
  await AsyncStorage.multiRemove([STORAGE_KEY, "selectedVenueId"]);

  if (error) {
    console.error("Logout failed:", error.message);
    return { error };
  }

  return { error: null };
}

export async function getLoggedInUser(): Promise<UserProfileData | null> {
  // 1. Try reading from local storage first
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as UserProfileData;
      return parsed;
    }
  } catch (e) {
    console.warn("⚠️ Failed to read user from local storage:", e);
  }

  // 2. Fallback: Check Supabase session + fetch from DB
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    console.warn("⚠️ Failed to get session:", sessionError.message);
  }

  if (!session?.user?.id) {
    console.warn("⚠️ Supabase session missing or expired.");
    return null;
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", session.user.id)
    .single();

  if (error) {
    console.warn("⚠️ Failed to load profile from Supabase:", error.message);
  } else if (profile) {
    // Optional: Cache in localStorage
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch (e) {
      console.warn("⚠️ Failed to save profile to local storage:", e);
    }

    return profile as UserProfileData;
  }

  return null;
}

export async function getLoggedInUserId(): Promise<string | null> {
  // First try local storage (global context should already be hydrated)
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed?.id) {
        return parsed.id;
      }
    }
  } catch (e) {
    console.warn("⚠️ Failed to parse user from AsyncStorage:", e);
  }

  // Fallback to Supabase session
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    console.error("❌ Failed to get user from Supabase session:", error?.message);
    return null;
  }

  return user.id;
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

