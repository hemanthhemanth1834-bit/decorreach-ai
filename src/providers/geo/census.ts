import type { GeoProvider, GeoResult } from "./types";

/**
 * U.S. Census Geocoder — free, no key, US-only. Ideal fallback when Nominatim
 * rate-limits (HTTP 403/429). Benchmark Public_AR_Current.
 */
export const censusProvider: GeoProvider = {
  name: "census",
  async geocode(query: string): Promise<GeoResult | null> {
    const q = query.trim();
    if (!q) return null;
    const url =
      "https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?address=" +
      encodeURIComponent(q) +
      "&benchmark=Public_AR_Current&format=json";
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 9000);
    try {
      const res = await fetch(url, {
        signal: ctrl.signal,
        headers: { "User-Agent": "DecorReachAI/1.0 (buyer-discovery)", Accept: "application/json" },
      });
      if (!res.ok) return null;
      const data = (await res.json()) as {
        result?: {
          addressMatches?: Array<{
            matchedAddress?: string;
            coordinates?: { x: number; y: number };
            addressComponents?: { city?: string; state?: string; zip?: string };
          }>;
        };
      };
      const m = data.result?.addressMatches?.[0];
      if (!m?.coordinates) return null;
      return {
        displayName: m.matchedAddress ?? q,
        lat: m.coordinates.y,
        lon: m.coordinates.x,
        city: m.addressComponents?.city ?? null,
        state: m.addressComponents?.state ?? null,
        postcode: m.addressComponents?.zip ?? null,
        country: "United States",
      };
    } catch {
      return null;
    } finally {
      clearTimeout(t);
    }
  },
};
