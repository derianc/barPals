export interface Venue {
  id: string;
  name: string;
  address?: string;
  venue_hash: string;
  latitude: number;
  longitude: number;
}

export type AdminVenueViewRow = {
  id: string;
  name: string;
  address_line1: string | null;
  city: string | null;
  state: string | null;
  is_active: boolean;
  venue_hash: string;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  owner_id: string | null;
  owner_email: string | null;
  receipt_scan_count: number;
};