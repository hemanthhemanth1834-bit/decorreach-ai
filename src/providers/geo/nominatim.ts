import type { GeoProvider, GeoResult } from "./types";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

/**
 * Free Nominatim geocoder (OpenStreetMap).
 * Usage policy: max ~1 req/sec, identify with User-Agent, requires attribution.
 * See README provider table.
 */
export const nominatimProvider: GeoProvider = {
  name: "nominatim",
  async geocode(query: string): Promise<GeoResult | null> {
    const q = query.trim();
    if (!q) return null;
    // Bias to USA
    const url =
      `${NOMINATIM_URL}?format=jsonv2&limit=1&addressdetails=1&countrycodes=us&q=` +
      encodeURIComponent(q);
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 9000);
    try {
      const res = await fetch(url, {
        signal: ctrl.signal,
        headers: {
          "User-Agent": "DecorReachAI/1.0 (buyer-discovery; contact: support@example.com)",
          Accept: "application/json",
        },
      });
      if (!res.ok) return null;
      const data = (await res.json()) as Array<{
        display_name: string;
        lat: string;
        lon: string;
        address?: Record<string, string>;
      }>;
      if (!data.length) return null;
      const first = data[0];
      const addr = first.address ?? {};
      return {
        displayName: first.display_name,
        lat: parseFloat(first.lat),
        lon: parseFloat(first.lon),
        city:
          addr.city ?? addr.town ?? addr.village ?? addr.hamlet ?? addr.county ?? null,
        state: addr.state ?? null,
        postcode: addr.postcode ?? null,
        country: addr.country ?? "United States",
      };
    } catch {
      return null;
    } finally {
      clearTimeout(t);
    }
  },
};
