"use client";

import { useEffect, useRef, useState } from "react";

// Autocomplete for city + neighborhood, powered by Mapbox Search Box
// via a server-side proxy (/api/mapbox/*). The Mapbox token lives only
// on the server — the browser never sees it.
//
// Falls back to plain text inputs if the server reports the token
// isn't configured (so dev environments without it still function).

const SUGGEST_PROXY = "/api/mapbox/suggest";
const RETRIEVE_PROXY = "/api/mapbox/retrieve";

type Suggestion = {
  name: string;
  mapbox_id: string;
  feature_type: string;
  place_formatted?: string;
  context?: {
    region?: { name: string; region_code?: string };
    country?: { name: string };
  };
};

type Props = {
  defaultCity?: string | null;
  defaultNeighborhood?: string | null;
  // Set server-side from process.env.MAPBOX_TOKEN — controls whether
  // the autocomplete renders or we degrade to plain inputs.
  mapboxEnabled: boolean;
};

export function LocationFields({
  defaultCity,
  defaultNeighborhood,
  mapboxEnabled,
}: Props) {
  if (!mapboxEnabled) {
    return <PlainFallback {...{ defaultCity, defaultNeighborhood }} />;
  }
  return (
    <MapboxLocationFields
      defaultCity={defaultCity}
      defaultNeighborhood={defaultNeighborhood}
    />
  );
}

function MapboxLocationFields({
  defaultCity,
  defaultNeighborhood,
}: Omit<Props, "mapboxEnabled">) {
  // Mapbox bills per "session" — many suggest calls + one retrieve
  // count as one billable session. Rotate after each city pick.
  const sessionToken = useRef<string>(crypto.randomUUID());

  const initialCity = defaultCity ?? "";
  const initialNeighborhood = defaultNeighborhood ?? "";

  // `display` is what's in the text box. `committed` is what gets
  // submitted (only set when user picks from dropdown, or matches the
  // prefilled default verbatim).
  const [cityDisplay, setCityDisplay] = useState(initialCity);
  const [cityCommitted, setCityCommitted] = useState(initialCity);
  const [citySuggestions, setCitySuggestions] = useState<Suggestion[]>([]);
  const [cityListOpen, setCityListOpen] = useState(false);
  const [cityCoords, setCityCoords] = useState<{
    lng: number;
    lat: number;
  } | null>(null);

  const [hoodDisplay, setHoodDisplay] = useState(initialNeighborhood);
  const [hoodCommitted, setHoodCommitted] = useState(initialNeighborhood);
  const [hoodSuggestions, setHoodSuggestions] = useState<Suggestion[]>([]);
  const [hoodListOpen, setHoodListOpen] = useState(false);

  useEffect(() => {
    if (!cityDisplay.trim() || cityDisplay === cityCommitted) {
      setCitySuggestions([]);
      return;
    }
    const t = setTimeout(async () => {
      const url = new URL(SUGGEST_PROXY, window.location.origin);
      url.searchParams.set("q", cityDisplay);
      url.searchParams.set("session_token", sessionToken.current);
      url.searchParams.set("types", "city");
      url.searchParams.set("limit", "5");
      try {
        const res = await fetch(url.toString());
        if (!res.ok) return;
        const data = (await res.json()) as { suggestions?: Suggestion[] };
        setCitySuggestions(data.suggestions ?? []);
        setCityListOpen(true);
      } catch {
        // silent — user can still type freely
      }
    }, 200);
    return () => clearTimeout(t);
  }, [cityDisplay, cityCommitted]);

  useEffect(() => {
    if (!hoodDisplay.trim() || hoodDisplay === hoodCommitted) {
      setHoodSuggestions([]);
      return;
    }
    const t = setTimeout(async () => {
      const url = new URL(SUGGEST_PROXY, window.location.origin);
      url.searchParams.set("q", hoodDisplay);
      url.searchParams.set("session_token", sessionToken.current);
      url.searchParams.set("types", "neighborhood,locality,postcode");
      url.searchParams.set("limit", "5");
      if (cityCoords) {
        url.searchParams.set(
          "proximity",
          `${cityCoords.lng},${cityCoords.lat}`,
        );
      }
      try {
        const res = await fetch(url.toString());
        if (!res.ok) return;
        const data = (await res.json()) as { suggestions?: Suggestion[] };
        setHoodSuggestions(data.suggestions ?? []);
        setHoodListOpen(true);
      } catch {
        // silent
      }
    }, 200);
    return () => clearTimeout(t);
  }, [hoodDisplay, hoodCommitted, cityCoords]);

  const handleCityPick = async (s: Suggestion) => {
    const regionName = s.context?.region?.name;
    const canonical = regionName ? `${s.name}, ${regionName}` : s.name;
    setCityDisplay(canonical);
    setCityCommitted(canonical);
    setCityListOpen(false);
    setCitySuggestions([]);
    setHoodDisplay("");
    setHoodCommitted("");
    setCityCoords(null);

    try {
      const url = new URL(
        `${RETRIEVE_PROXY}/${encodeURIComponent(s.mapbox_id)}`,
        window.location.origin,
      );
      url.searchParams.set("session_token", sessionToken.current);
      const res = await fetch(url.toString());
      if (res.ok) {
        const data = (await res.json()) as {
          features?: {
            geometry?: { coordinates?: [number, number] };
          }[];
        };
        const coords = data.features?.[0]?.geometry?.coordinates;
        if (coords && coords.length === 2) {
          setCityCoords({ lng: coords[0], lat: coords[1] });
        }
      }
    } catch {
      // silent — neighborhood will just lack proximity bias
    }

    // Mapbox session = one or more suggests + one retrieve. Fresh
    // token for the next interaction.
    sessionToken.current = crypto.randomUUID();
  };

  const handleHoodPick = (s: Suggestion) => {
    setHoodDisplay(s.name);
    setHoodCommitted(s.name);
    setHoodListOpen(false);
    setHoodSuggestions([]);
  };

  const handleCityChange = (v: string) => {
    setCityDisplay(v);
    if (v === initialCity) {
      // Reverted to original prefilled value — restore committed so
      // existing users don't have to re-pick after stray edits.
      setCityCommitted(initialCity);
    } else if (v !== cityCommitted) {
      setCityCommitted("");
    }
  };

  const handleHoodChange = (v: string) => {
    setHoodDisplay(v);
    if (v === initialNeighborhood) {
      setHoodCommitted(initialNeighborhood);
    } else if (v !== hoodCommitted) {
      setHoodCommitted("");
    }
  };

  return (
    <>
      <FieldWrapper label="City you're moving to" required>
        <div className="relative">
          <input
            type="text"
            value={cityDisplay}
            onChange={(e) => handleCityChange(e.target.value)}
            onFocus={() => citySuggestions.length > 0 && setCityListOpen(true)}
            onBlur={() => setTimeout(() => setCityListOpen(false), 150)}
            required
            placeholder="Start typing — e.g. Austin"
            autoComplete="off"
            className="w-full h-11 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 outline-none focus:border-[var(--accent)]"
          />
          <input type="hidden" name="city" value={cityCommitted} />
          {cityListOpen && citySuggestions.length > 0 && (
            <SuggestionList
              suggestions={citySuggestions}
              onPick={handleCityPick}
            />
          )}
        </div>
      </FieldWrapper>

      <FieldWrapper
        label="Neighborhood"
        hint="Optional — helps tailor super-local picks like which grocery store, coffee shop, or transit stop is closest to you."
      >
        <div className="relative">
          <input
            type="text"
            value={hoodDisplay}
            onChange={(e) => handleHoodChange(e.target.value)}
            onFocus={() => hoodSuggestions.length > 0 && setHoodListOpen(true)}
            onBlur={() => setTimeout(() => setHoodListOpen(false), 150)}
            placeholder="e.g. East Austin"
            autoComplete="off"
            maxLength={80}
            className="w-full h-11 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 outline-none focus:border-[var(--accent)]"
          />
          <input type="hidden" name="neighborhood" value={hoodCommitted} />
          {hoodListOpen && hoodSuggestions.length > 0 && (
            <SuggestionList
              suggestions={hoodSuggestions}
              onPick={handleHoodPick}
            />
          )}
        </div>
      </FieldWrapper>
    </>
  );
}

function SuggestionList({
  suggestions,
  onPick,
}: {
  suggestions: Suggestion[];
  onPick: (s: Suggestion) => void;
}) {
  return (
    <ul
      role="listbox"
      className="absolute z-20 mt-1 w-full bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg max-h-64 overflow-auto"
    >
      {suggestions.map((s) => (
        <li key={s.mapbox_id}>
          <button
            type="button"
            // onMouseDown prevents input.onBlur from closing the list
            // before onClick has a chance to fire.
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onPick(s)}
            className="w-full text-left px-3 py-2 hover:bg-[var(--background)] transition"
          >
            <div className="font-medium text-sm leading-snug">{s.name}</div>
            {s.place_formatted && (
              <div className="text-xs text-[var(--muted-foreground)] mt-0.5">
                {s.place_formatted}
              </div>
            )}
          </button>
        </li>
      ))}
    </ul>
  );
}

function FieldWrapper({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="block">
      <div className="mb-2 font-medium">
        {label}
        {required && <span className="text-[var(--accent)] ml-1">*</span>}
      </div>
      {hint && (
        <p className="mb-2 -mt-1 text-xs text-[var(--muted-foreground)]">
          {hint}
        </p>
      )}
      {children}
    </div>
  );
}

function PlainFallback({
  defaultCity,
  defaultNeighborhood,
}: Pick<Props, "defaultCity" | "defaultNeighborhood">) {
  return (
    <>
      <FieldWrapper label="City you're moving to" required>
        <input
          type="text"
          name="city"
          required
          defaultValue={defaultCity ?? ""}
          placeholder="Austin, TX"
          className="w-full h-11 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 outline-none focus:border-[var(--accent)]"
        />
      </FieldWrapper>

      <FieldWrapper
        label="Neighborhood"
        hint="Optional — helps tailor super-local picks like which grocery store, coffee shop, or transit stop is closest to you."
      >
        <input
          type="text"
          name="neighborhood"
          maxLength={80}
          defaultValue={defaultNeighborhood ?? ""}
          placeholder="e.g. Mission District, East Austin, Williamsburg"
          className="w-full h-11 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 outline-none focus:border-[var(--accent)]"
        />
      </FieldWrapper>
    </>
  );
}
