import type { NormalizedLead } from "@/lib/types";
import type { BuyerProvider } from "./types";
import { hasPublicEmail } from "./types";

const OVERPASS_URLS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

const CATEGORY_TAGS: Record<string, string[]> = {
  "home decor": ['"shop"="interior_decoration"', '"shop"="homeware"', '"shop"="furniture"', '"shop"="gift"'],
  furniture: ['"shop"="furniture"', '"shop"="interior_decoration"'],
  "interior design": ['"shop"="interior_decoration"', '"office"="interior_design"', '"craft"="interior_design"'],
  "home furnishing": ['"shop"="homeware"', '"shop"="furniture"', '"shop"="bed"'],
  lighting: ['"shop"="lighting"', '"shop"="electronics"'],
  rugs: ['"shop"="carpet"', '"shop"="homeware"'],
  "wall decor": ['"shop"="art"', '"shop"="interior_decoration"', '"shop"="gift"'],
  "kitchen decor": ['"shop"="kitchen"', '"shop"="homeware"'],
  "outdoor decor": ['"shop"="garden_centre"', '"shop"="outdoor"'],
  default: ['"shop"="interior_decoration"', '"shop"="homeware"', '"shop"="furniture"', '"shop"="gift"', '"shop"="art"'],
};

function tagsFor(product: string, keyword: string): string[] {
  const p = `${product} ${keyword}`.toLowerCase();
  for (const [k, tags] of Object.entries(CATEGORY_TAGS)) {
    if (k !== "default" && p.includes(k)) return tags;
  }
  if (keyword) {
    const safe = keyword.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim().slice(0, 40);
    if (safe) return [`"name"~"${safe}",i`];
  }
  return CATEGORY_TAGS.default;
}

function milesToMeters(m: number): number {
  return Math.min(Math.max(m, 1), 100) * 1609.34;
}

interface OverpassElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

/**
 * Live buyer discovery via Overpass API (OpenStreetMap data, free, no key).
 * Strategy: small per-tag queries fired IN PARALLEL (union queries time out in
 * dense metros; sequential queries exceed serverless function limits).
 * Effective radius is capped at ~10 km to respect the free endpoints'
 * fair-use policy; the requested radius is still stored on the search record.
 * Tries two public endpoints and fails gracefully (caller falls back to demo).
 */
export const overpassProvider: BuyerProvider = {
  name: "overpass",
  async search(params): Promise<NormalizedLead[]> {
    if (!params.geo) return [];
    // Cap Overpass scan radius to protect the free shared endpoints.
    const radius = Math.min(milesToMeters(params.radiusMiles || 25), 10000);
    const { lat, lon } = params.geo;
    const tagFilters = tagsFor(params.product, params.keyword).slice(0, 4);
    const now = new Date().toISOString();
    const r = Math.round(radius);

    async function queryTag(endpoint: string, t: string): Promise<OverpassElement[]> {
      const query = `[out:json][timeout:10];(node[${t}](around:${r},${lat},${lon}););out 15;`;
      let lastErr: unknown = null;
      for (let attempt = 0; attempt < 2; attempt++) {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 12000);
        try {
          const res = await fetch(endpoint, {
            method: "POST",
            signal: ctrl.signal,
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              "User-Agent": "DecorReachAI/1.0 (buyer-discovery)",
            },
            body: "data=" + encodeURIComponent(query),
          });
          clearTimeout(timer);
          if (res.status === 429) throw new Error("Overpass rate limit (429)");
          if (!res.ok) {
            lastErr = new Error(`Overpass HTTP ${res.status}`);
            if (attempt === 0) continue; // one fast retry on HTTP errors
            throw lastErr;
          }
          const json = (await res.json()) as { elements?: OverpassElement[] };
          return (json.elements ?? []).filter((el) => el.tags?.name);
        } catch (e) {
          clearTimeout(timer);
          lastErr = e;
          // Retry only fast HTTP failures, never slow aborts (saves the time budget).
          if (e instanceof DOMException && e.name === "AbortError") throw e;
          if (e instanceof Error && /abort/i.test(e.message)) throw e;
        }
      }
      throw lastErr instanceof Error ? lastErr : new Error("Overpass tag query failed");
    }

    let lastErr: unknown = null;
    for (const endpoint of OVERPASS_URLS) {
      const settled = await Promise.allSettled(tagFilters.map((t) => queryTag(endpoint, t)));
      const collected: OverpassElement[] = [];
      let rateLimited = false;
      for (const s of settled) {
        if (s.status === "fulfilled") {
          for (const el of s.value) {
            if (collected.length < 80) collected.push(el);
          }
        } else if (s.reason instanceof Error && /429/.test(s.reason.message)) {
          rateLimited = true;
          lastErr = s.reason;
        } else {
          lastErr = s.reason;
        }
      }
      if (rateLimited && collected.length === 0) continue; // try next endpoint
      if (collected.length > 0) {
        const category = params.product.trim() || "Home Decor";
        return collected.slice(0, 60).map((el) => {
          const tags = el.tags ?? {};
          const elLat = el.lat ?? el.center?.lat ?? null;
          const elLon = el.lon ?? el.center?.lon ?? null;
          const street = [tags["addr:housenumber"], tags["addr:street"]].filter(Boolean).join(" ") || null;
          const website = tags.website ?? tags["contact:website"] ?? null;
          const phone = tags.phone ?? tags["contact:phone"] ?? null;
          const email = hasPublicEmail(tags);
          const osmUrl = `https://www.openstreetmap.org/${el.type}/${el.id}`;
          const lead: NormalizedLead = {
            id: `osm-${el.type}-${el.id}`,
            name: tags.name!.trim(),
            category: tags.shop ? prettify(tags.shop) : category,
            address: street,
            city: tags["addr:city"] ?? null,
            state: tags["addr:state"] ?? null,
            country: "United States",
            postalCode: tags["addr:postcode"] ?? null,
            website: website?.startsWith("http") ? website : website ? `https://${website}` : null,
            phone,
            email,
            latitude: elLat,
            longitude: elLon,
            source: "OpenStreetMap / Overpass",
            sourceUrl: osmUrl,
            sourceType: "live" as const,
            emailAvailability: Boolean(email),
            websiteAvailability: Boolean(website),
            discoveredAt: now,
          };
          return lead;
        });
      }
      // No named results on this endpoint — try the next one.
    }
    throw lastErr instanceof Error ? lastErr : new Error("Overpass unavailable");
  },
};

function prettify(s: string): string {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
