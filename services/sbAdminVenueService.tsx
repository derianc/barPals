import { supabase } from "@/supabase";
import { AdminVenueViewRow } from "@/types/Venue";

export async function fetchAdminVenues(): Promise<AdminVenueViewRow[]> {
  const { data, error } = await supabase
    .from("admin_venues_with_owners")
    .select("*")
    .order("name");
  if (error) {
    console.error("❌ Failed to fetch admin venues view:", error.message);
    return [];
  }

  return data as AdminVenueViewRow[];
}

export async function saveVenueChanges(
  venueId: string,
  updates: {
    name?: string;
    ownerId?: string | null;
  }
) {
  const { name, ownerId } = updates;

  // 1. Update venue name (if changed)
  const { error: venueError } = await supabase
    .from("venues")
    .update({ name })
    .eq("id", venueId);

  if (venueError) {
    console.error("❌ Failed to update venue:", venueError.message);
    return { success: false };
  }

  // 2. Upsert venue_users row to assign owner
  if (ownerId) {
    const { error: ownerError } = await supabase
      .from("venue_users")
      .upsert({ profile_id: ownerId, venue_id: venueId, role: "owner" }, { onConflict: "profile_id,venue_id" });

    if (ownerError) {
      console.error("❌ Failed to assign owner:", ownerError.message);
      return { success: false };
    }
  }

  return { success: true };
}
