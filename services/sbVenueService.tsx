import { supabase } from "@/supabase";

export interface Venue {
  id: string;
  name: string;
  address: string;
}

export async function getVenuesForProfile(): Promise<Venue[]> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error("🔐 Failed to get authenticated user:", userError?.message);
    return [];
  }

  const { data, error } = await supabase
    .from("venue_users")
    .select("venue:venue_id(id, name, address_line1)")
    .eq("profile_id", user.id);

  if (error) {
    console.error("❌ Failed to fetch venues:", error.message);
    return [];
  }

  // ✅ Flatten the result so each item is a Venue
  return (data ?? []).map((row: any) => ({
    id: row.venue.id,
    name: row.venue.name,
    address: row.venue.address_line1,
  }));
}
