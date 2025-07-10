import * as Crypto from "expo-crypto";

export async function generateVenueHash(address: string): Promise<string> {
  const noSpaces = address.replace(/\s+/g, "");
  const addressHash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    noSpaces
  );

  return addressHash;
}

export function sanitizeText(input?: string | null): string | null {
  if (!input) return null;
  return input
    .replace(/\n/g, ' ')                             // Replace newline with space
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')    // Remove control characters
    .trim();
}

export function sanitizeAddress(input?: string | null): string | null {
  if (!input) return null;
  return input
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
    .replace(/[^a-zA-Z0-9]/g, '')                // Keep only letters and numbers
    .toLocaleLowerCase();
}