import { getCityCoverUrl } from "@/lib/city-covers";

// Wide cover photo banner of the user's city, shown at the top of
// /plan and /sample. Falls back to a generic skyline if the city
// isn't in the curated map (see lib/city-covers.ts).
export function CityBanner({ city }: { city: string | null }) {
  const src = getCityCoverUrl(city);
  const displayCity = city || "your new city";

  return (
    <div className="w-full h-32 sm:h-40 lg:h-48 rounded-2xl overflow-hidden mb-8 relative ring-1 ring-black/5 shadow-sm">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={`${displayCity} skyline`}
        loading="lazy"
        className="w-full h-full object-cover"
      />
      {/* Subtle gradient overlay so the page header reads cleanly
          against any photo, and so the photo grounds the page
          without competing for attention. */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none"
        aria-hidden
      />
    </div>
  );
}
