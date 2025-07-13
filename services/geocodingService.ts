import Constants from "expo-constants";

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