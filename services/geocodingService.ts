import { supabase } from "@/supabase";

export async function geocodeAddress(address: string) {
  const session = await supabase.auth.getSession();
  const token = session.data.session?.access_token;

  const response = await fetch("https://pgswimjajpjupnafjosl.supabase.co/functions/v1/geocode-address", {
    method: "POST",
    headers: { 
      "Content-Type": "application/json", 
      "Authorization": `Bearer ${token}`,
  },
    body: JSON.stringify({ address }),
  });

  console.log("response", response);

  if (!response.ok) {
    const error = await response.json();
    console.error("Geocoding failed:", error);
    return null;
  }

  const data = await response.json();
  return data;
}