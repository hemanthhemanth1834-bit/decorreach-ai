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

/** Normalize a business name for dedupe: lowercase, strip punctuation/extra spaces. */
export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/['’`]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Remove duplicates by normalized name+city+address (live entries win ties). */
export function dedupeLeads(leads: NormalizedLead[]): NormalizedLead[] {
  const seen = new Map<string, NormalizedLead>();
  const key = (l: NormalizedLead) =>
    `${normalizeName(l.name)}|${(l.city ?? "").toLowerCase().trim()}|${(l.address ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().slice(0, 60)}`;
  for (const lead of leads) {
    const k = key(lead);
    if (!k.split("|")[0]) continue; // skip nameless entries — never emit junk rows
    if (!seen.has(k)) {
      seen.set(k, lead);
    } else {
      const existing = seen.get(k)!;
      // Prefer live over demo, prefer entries with email/website/coords
      const score = (l: NormalizedLead) =>
        (l.sourceType === "live" ? 2 : 0) +
        (l.email ? 1 : 0) +
        (l.website ? 1 : 0) +
        (l.latitude != null ? 1 : 0);
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
