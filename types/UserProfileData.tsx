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
  has_seen_tooltips: boolean;
}