import { supabase } from "@/supabase";
import Constants from "expo-constants";

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

export async function getAddressSuggestions(query: string) {
  const OpenCageApiKey = Constants.expoConfig?.extra?.openCageApiKey;
  console.log("apiKey", OpenCageApiKey)

  try {
    const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(
      query
    )}&key=${OpenCageApiKey}&limit=5&countrycode=us&no_annotations=1`;

    const response = await fetch(url);
    const json = await response.json();

    if (!response.ok) {
      throw new Error(json?.status?.message || "Failed to fetch suggestions");
    }

    return json.results;
  } catch (err) {
    console.error("❌ OpenCage fetch error:", err);
    return [];
  }
}