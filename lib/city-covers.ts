// Curated Unsplash URLs used as the banner cover photo on /plan and
// /sample. Keyed by the lowercased city name (first comma-chunk only,
// so "Austin, TX" and "Austin, Texas" both map to "austin").
//
// To add a city: find a wide-aspect photo on unsplash.com, right-click
// the image and copy its CDN URL, drop it in below. The query string
// is normalized to a 1600×400 banner crop.

const COVERS: Record<string, string> = {
  austin:
    "https://images.unsplash.com/photo-1531218150217-54595bc2b934?w=1600&h=400&fit=crop&auto=format&q=80",
  "new york":
    "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1600&h=400&fit=crop&auto=format&q=80",
  brooklyn:
    "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1600&h=400&fit=crop&auto=format&q=80",
  "san francisco":
    "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=1600&h=400&fit=crop&auto=format&q=80",
  "los angeles":
    "https://images.unsplash.com/photo-1444723121867-7a241cacace9?w=1600&h=400&fit=crop&auto=format&q=80",
  chicago:
    "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1600&h=400&fit=crop&auto=format&q=80",
  // Seattle, Boston, Portland — fall through to DEFAULT_COVER until
  // we have verified URLs (the IDs I tried 404'd).
  denver:
    "https://images.unsplash.com/photo-1546156929-a4c0ac411f47?w=1600&h=400&fit=crop&auto=format&q=80",
  miami:
    "https://images.unsplash.com/photo-1535498730771-e735b998cd64?w=1600&h=400&fit=crop&auto=format&q=80",
  nashville:
    "https://images.unsplash.com/photo-1545419913-775e3e82c7db?w=1600&h=400&fit=crop&auto=format&q=80",
};

// Generic city-skyline fallback used when the user's city isn't in
// the curated map. Wide-aspect crop of a downtown skyline at dusk.
const DEFAULT_COVER =
  "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=1600&h=400&fit=crop&auto=format&q=80";

export function getCityCoverUrl(city: string | null | undefined): string {
  if (!city) return DEFAULT_COVER;
  // "Austin, Texas" / "Austin, TX" / "austin" all collapse to "austin".
  const key = city.split(",")[0]?.trim().toLowerCase() ?? "";
  return COVERS[key] ?? DEFAULT_COVER;
}
