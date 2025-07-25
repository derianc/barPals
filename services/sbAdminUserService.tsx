import { supabase } from "@/supabase";

export async function fetchAdminUsers({ search = "", role = "", page = 1, pageSize = 20 }) {
    const query = supabase
        .from("profiles")
        .select("id, email, full_name, avatar_url, role, is_active")
        .order("created_at", { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

    if (search) query.ilike("email", `%${search}%`);
    if (role && role !== "all") query.eq("role", role);

    const { data, error } = await query;

    if (error) {
        console.error("❌ Supabase error:", error);
        return [];
    }

    // console.log("Fetched users:", data);
    return data || [];
}

export async function updateUser(id: string, updates: Partial<{
  full_name: string;
  role: "user" | "owner" | "admin";
  is_active: boolean;
}>) {
  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", id);

  if (error) throw error;
}