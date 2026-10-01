import type { NormalizedLead } from "@/lib/types";

export interface BuyerSearchParams {
  product: string;
  location: string;
  keyword: string;
  buyerType: string;
  radiusMiles: number;
  geo?: { lat: number; lon: number; displayName?: string } | null;
}

export interface BuyerProvider {
  name: string;
  search(params: BuyerSearchParams): Promise<NormalizedLead[]>;
}

/** Remove duplicates by normalized name+city+address, keep first (live priority). */
export function dedupeLeads(leads: NormalizedLead[]): NormalizedLead[] {
  const seen = new Map<string, NormalizedLead>();
  const key = (l: NormalizedLead) =>
    `${l.name.trim().toLowerCase()}|${(l.city ?? "").toLowerCase()}|${(l.address ?? "").toLowerCase().slice(0, 60)}`;
  for (const lead of leads) {
    const k = key(lead);
    if (!seen.has(k)) {
      seen.set(k, lead);
    } else {
      const existing = seen.get(k)!;
      // Prefer live over demo, prefer entries with email/website
      const score = (l: NormalizedLead) =>
        (l.sourceType === "live" ? 2 : 0) + (l.email ? 1 : 0) + (l.website ? 1 : 0);
      if (score(lead) > score(existing)) seen.set(k, lead);
    }
  }
  return [...seen.values()];
}

/** Normalize OSM tags into a lead email=null unless explicitly public. */
export function hasPublicEmail(tags: Record<string, string | undefined>): string | null {
  const raw = tags.email ?? tags["contact:email"] ?? null;
  if (!raw) return null;
  const v = raw.trim();
  if (!v || !v.includes("@") || v.includes("example.")) return null;
  return v;
}
