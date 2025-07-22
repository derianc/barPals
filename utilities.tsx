export function sanitizeText(input?: string | null): string | null {
  if (!input) return null;
  const sanitizedText = input
    .replace(/,/g, '')                               // ⬅️ Remove commas
    .replace(/\n/g, ' ')                             // Replace newline with space
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')    // Remove control characters
    .trim();

  return normalizeAddressAbbreviations(sanitizedText);
}

function sanitizeAddress(input?: string | null): string | null {
  if (!input) return null;
  return input
    .replace(/[^a-zA-Z0-9]/g, '')                // Keep only letters and numbers
    .toLocaleLowerCase();                        // All lowercase
}

export function sanitizeTextForDisplay(input?: string | null): string | null {
  if (!input) return null;
  return input
    .replace(/\n/g, ' ')
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
    .trim();
}

export function parseAddressComponents(addressRaw: string): { street_line: string | null; city: string | null; state: string | null; postal: string | null; } {
  if (!addressRaw) {
    return { street_line: null, city: null, state: null, postal: null };
  }

  const sanitized = sanitizeText(addressRaw);
  if (!sanitized) {
    return { street_line: null, city: null, state: null, postal: null };
  }

  // Match pattern like: "155 E Broad St Columbus OH 43215"
  const match = sanitized.match(/^(.*)\s+([A-Z]{2})\s+(\d{5})$/);
  if (!match) {
    console.warn("⚠️ Failed to parse components from:", sanitized);
    return { street_line: null, city: null, state: null, postal: null };
  }

  const [, beforeStateZip, state, postal] = match;

  const parts = beforeStateZip.trim().split(/\s+/);
  const city = parts.pop(); // assume last word before state is city
  const street = parts.join(" ");

  return {
    street_line: street.toLowerCase(),
    city: city?.toLowerCase() || null,
    state,
    postal,
  };
}

function normalizeAddressAbbreviations(address: string): string {
  const directions: { [key: string]: string } = {
    "northeast": "NE",
    "northwest": "NW",
    "southeast": "SE",
    "southwest": "SW",
    "north": "N",
    "south": "S",
    "east": "E",
    "west": "W",
  };

  const suffixes: { [key: string]: string } = {
    "street": "St",
    "avenue": "Ave",
    "boulevard": "Blvd",
    "place": "Pl",
    "road": "Rd",
    "drive": "Dr",
    "court": "Ct",
    "lane": "Ln",
    "terrace": "Ter",
    "trail": "Trl",
    "parkway": "Pkwy",
    "commons": "Cmns",
  };

  const states: { [key: string]: string } = {
    "Alabama": "AL", "Alaska": "AK", "Arizona": "AZ", "Arkansas": "AR",
    "California": "CA", "Colorado": "CO", "Connecticut": "CT", "Delaware": "DE",
    "Florida": "FL", "Georgia": "GA", "Hawaii": "HI", "Idaho": "ID", "Illinois": "IL",
    "Indiana": "IN", "Iowa": "IA", "Kansas": "KS", "Kentucky": "KY", "Louisiana": "LA",
    "Maine": "ME", "Maryland": "MD", "Massachusetts": "MA", "Michigan": "MI",
    "Minnesota": "MN", "Mississippi": "MS", "Missouri": "MO", "Montana": "MT",
    "Nebraska": "NE", "Nevada": "NV", "New Hampshire": "NH", "New Jersey": "NJ",
    "New Mexico": "NM", "New York": "NY", "North Carolina": "NC",
    "North Dakota": "ND", "Ohio": "OH", "Oklahoma": "OK", "Oregon": "OR",
    "Pennsylvania": "PA", "Rhode Island": "RI", "South Carolina": "SC",
    "South Dakota": "SD", "Tennessee": "TN", "Texas": "TX", "Utah": "UT",
    "Vermont": "VT", "Virginia": "VA", "Washington": "WA", "West Virginia": "WV",
    "Wisconsin": "WI", "Wyoming": "WY",
  };

  let normalized = address;

  // Normalize directions (case-insensitive)
  for (const [full, abbr] of Object.entries(directions)) {
    const regex = new RegExp(`\\b${full}\\b`, 'gi');
    normalized = normalized.replace(regex, abbr);
  }

  // Normalize suffixes
  for (const [full, abbr] of Object.entries(suffixes)) {
    const regex = new RegExp(`\\b${full}\\b`, 'gi');
    normalized = normalized.replace(regex, abbr);
  }

  // Normalize state names to abbreviations
  for (const [full, abbr] of Object.entries(states)) {
    const regex = new RegExp(`\\b${full}\\b`, 'gi');
    normalized = normalized.replace(regex, abbr);
  }

  // Final cleanup: collapse multiple spaces
  normalized = normalized.replace(/\s{2,}/g, ' ').trim();

  return normalized;
}