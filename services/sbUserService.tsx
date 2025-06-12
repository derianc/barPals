import { supabase } from "@/supabase"; // adjust path if needed
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { AuthError, User } from "@supabase/supabase-js";
import type { PostgrestError } from "@supabase/supabase-js";

export interface RegisterResult {
  user?: Pick<User, "id" | "email">;
  signUpError?: AuthError | null;
  profileError?: PostgrestError | null;
}

const STORAGE_KEY = "loggedInUser";


export async function login(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  // ✅ Save profile to local storage
  try {
    await AsyncStorage.setItem("STORAGE_KEY", JSON.stringify(data));
  } catch (storageError) {
    console.warn("⚠️ Failed to save profile to storage:", storageError);
  }

  return { authData: data, error };
}

export async function logout(){
  const {error} = await supabase.auth.signOut();

  if (error) {
    console.error("Logout failed:", error.message);
    return { error };
  }

  try {
    await AsyncStorage.removeItem("STORAGE_KEY");
    console.log("✅ User profile removed from local storage.");
  } catch (storageError) {
    console.warn("⚠️ Failed to remove user profile from storage:", storageError);
  }

  return { error: null };
}

export async function getLoggedInUser(): Promise<any | null> {
  try {
    // Step 1: Check local storage
    const cachedProfileStr = await AsyncStorage.getItem(STORAGE_KEY);
    if (cachedProfileStr) {
      const cachedProfile = JSON.parse(cachedProfileStr);
      return cachedProfile;
    }

    // Step 2: Get Supabase session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user?.id) {
      console.error("❌ No active session or user ID found:", sessionError?.message);
      return null;
    }

    const userId = session.user.id;

    // Step 3: Fetch profile from database
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      console.error("❌ Failed to fetch profile:", profileError?.message);
      return null;
    }

    // Step 4: Cache profile for future use
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(profile));

    return profile;
  } catch (err) {
    console.error("❌ Unexpected error in getLoggedInUser:", err);
    return null;
  }
}

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
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