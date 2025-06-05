import { supabase } from "@/supabase"; // adjust path if needed
import type { AuthError, User } from "@supabase/supabase-js";
import type { PostgrestError } from "@supabase/supabase-js";

export interface RegisterResult {
  user?: Pick<User, "id" | "email">;
  signUpError?: AuthError | null;
  profileError?: PostgrestError | null;
}

/**
 * 1) Registers a new Auth user via Supabase.
 * 2) If successful, inserts a matching row into "profiles" (id = Auth user ID).
 * Returns either { user } on full success, or signUpError / profileError if something failed.
 */
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


/**
 * Fetch a profile by its user ID.
 */
export async function getProfile(userId: string) {
    const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
    return { data, error };
}
