import type { NormalizedLead } from "@/lib/types";
import type { BuyerProvider, BuyerSearchParams } from "./types";

const DEMO_CITIES: Record<string, Array<Partial<NormalizedLead>>> = {
  default: [
    { name: "Hudson Home & Living", category: "Home Decor", address: "214 W 24th St", city: "New York", state: "NY", postalCode: "10011", website: "https://example.com/hudson-home", phone: "+1 (212) 555-0148" },
    { name: "Borough Furnishing Co.", category: "Furniture", address: "88 Grand St", city: "New York", state: "NY", postalCode: "10013", website: "https://example.com/borough-furnishing", phone: "+1 (212) 555-0119" },
    { name: "Atelier Interiors Studio", category: "Interior Design", address: "410 Park Ave", city: "New York", state: "NY", postalCode: "10022", website: "https://example.com/atelier-interiors", phone: "+1 (212) 555-0173" },
    { name: "Beacon Lighting Gallery", category: "Lighting", address: "152 Bowery", city: "New York", state: "NY", postalCode: "10013", website: "https://example.com/beacon-lighting", phone: "+1 (212) 555-0162" },
    { name: "Loam & Loom Rugs", category: "Rugs", address: "77 Greene St", city: "New York", state: "NY", postalCode: "10012", website: "https://example.com/loam-loom", phone: "+1 (212) 555-0191" },
    { name: "Parlor Wall Decor", category: "Wall Decor", address: "305 E 9th St", city: "New York", state: "NY", postalCode: "10003", website: "https://example.com/parlor-wall", phone: "+1 (212) 555-0137" },
    { name: "Hearth Kitchen & Table", category: "Kitchen Decor", address: "520 Columbus Ave", city: "New York", state: "NY", postalCode: "10024", website: null, phone: "+1 (212) 555-0126" },
    { name: "Terrace Outdoor Living", category: "Outdoor Decor", address: "71 W 23rd St", city: "New York", state: "NY", postalCode: "10010", website: "https://example.com/terrace-outdoor", phone: null },
  ],
};

/**
 * Clearly-labeled demo provider. Used ONLY when live providers are
 * unreachable/unconfigured. Never presented as live data.
 * All emails are null (never invented) and websites are example.com placeholders.
 */
export const demoProvider: BuyerProvider = {
  name: "demo",
  async search(params: BuyerSearchParams): Promise<NormalizedLead[]> {
    const now = new Date().toISOString();
    const loc = params.location;
    const cityGuess = extractCity(loc);
    const base = DEMO_CITIES.default;
    const product = params.product.trim() || "Home Decor";
    // Slight deterministic variation by query hash
    const seed = hash(`${product}|${loc}|${params.keyword}`.toLowerCase());
    const rotated = [...base.slice(seed % base.length), ...base.slice(0, seed % base.length)];
    return rotated.slice(0, 8).map((d, i) => ({
      id: `demo-${seed.toString(36)}-${i}`,
      name: d.name!,
      category: matchCategory(product, d.category!),
      address: d.address ?? null,
      city: cityGuess ?? d.city ?? null,
      state: d.state ?? null,
      country: "United States",
      postalCode: d.postalCode ?? null,
      website: null,
      phone: null,
      email: null,
      latitude: null,
      longitude: null,
      source: "Demo dataset",
      sourceUrl: null,
      sourceType: "demo" as const,
      emailAvailability: false,
      websiteAvailability: false,
      discoveredAt: now,
    }));
  },
};

function extractCity(loc: string): string | null {
  const m = loc.split(",")[0]?.trim();
  if (!m || m.length < 2) return null;
  return m.replace(/\b\w/g, (c) => c.toUpperCase()).slice(0, 80);
}

function matchCategory(product: string, fallback: string): string {
  return product.trim().slice(0, 60) || fallback;
}

function hash(s: string): number {
  let h = 7;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % 997;
}
