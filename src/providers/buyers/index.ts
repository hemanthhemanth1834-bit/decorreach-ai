import type { NormalizedLead } from "@/lib/types";
import { dedupeLeads, type BuyerSearchParams } from "./types";
import { overpassProvider } from "./overpass";
import { demoProvider } from "./demo";
import { nominatimProvider } from "../geo/nominatim";
import { censusProvider } from "../geo/census";
import { gazetteerProvider } from "../geo/gazetteer";
import { enrichLeadsWithPublicEmails } from "../enrich/website-email";

export interface OrchestratedResult {
  mode: "live" | "demo";
  leads: NormalizedLead[];
  providers: string[];
  enriched?: number;
  geo: { displayName: string | null; lat: number | null; lon: number | null } | null;
  notice?: string;
}

/**
 * LIVE-ONLY buyer discovery.
 *
 * Production behavior (NODE_ENV=production or DEMO_FALLBACK=off): only genuine
 * live results from free sources (Overpass + Nominatim/Census/gazetteer) are
 * ever returned. Failures surface as truthful errors — demo/sample data is
 * NEVER substituted. The bundled demo provider remains in the codebase solely
 * for local-development compatibility and is unreachable in production.
 *
 * Set DEMO_FALLBACK=on explicitly to re-enable the labeled demo fallback
 * (local development only).
 */
function demoAllowed(): boolean {
  const flag = (process.env.DEMO_FALLBACK ?? "").trim().toLowerCase();
  if (flag === "on" || flag === "true" || flag === "1") return true;
  if (flag === "off" || flag === "false" || flag === "0") return false;
  return process.env.NODE_ENV !== "production";
}

export async function discoverBuyers(params: BuyerSearchParams): Promise<OrchestratedResult> {
  const allowDemo = demoAllowed();
  let geo: OrchestratedResult["geo"] = params.geo
    ? { displayName: params.geo.displayName ?? null, lat: params.geo.lat, lon: params.geo.lon }
    : null;

  // Geocode when coordinates not supplied — race nominatim + census in parallel
  // (sequential waits exceed serverless limits), gazetteer as instant fallback.
  let geocoder = "nominatim";
  if (!geo) {
    const attempts = await Promise.allSettled([
      nominatimProvider.geocode(params.location),
      censusProvider.geocode(params.location),
    ]);
    for (const [i, a] of attempts.entries()) {
      if (a.status === "fulfilled" && a.value) {
        geo = { displayName: a.value.displayName, lat: a.value.lat, lon: a.value.lon };
        geocoder = i === 0 ? "nominatim" : "census";
        break;
      }
    }
    if (!geo) {
      const g = await gazetteerProvider.geocode(params.location).catch(() => null);
      if (g) {
        geo = { displayName: g.displayName, lat: g.lat, lon: g.lon };
        geocoder = "gazetteer";
      }
    }
  }

  if (geo?.lat == null || geo?.lon == null) {
    if (!allowDemo) {
      throw new Error(
        `Could not geocode "${params.location}". Try "City, ST" (e.g. New York, NY) or a ZIP code like 10001.`
      );
    }
    return demoResult(params, geo, "geocoding unavailable");
  }

  try {
    const live = await overpassProvider.search({ ...params, geo: { lat: geo.lat, lon: geo.lon } });
    const clean = dedupeLeads(live).slice(0, 60);
    if (clean.length > 0) {
      // Bounded enrichment: public emails from the businesses' own websites only.
      let enriched = 0;
      try {
        const r = await enrichLeadsWithPublicEmails(clean, { maxLeads: 6, timeoutMs: 8000 });
        enriched = r.enriched;
      } catch {
        enriched = 0; // enrichment is best-effort; live results stand on their own
      }
      return { mode: "live", leads: clean, providers: ["overpass", geocoder], enriched, geo };
    }
    if (!allowDemo) {
      throw new Error(
        "Live directory search returned no matching businesses for this area. Try a larger city, a different category, or widen the radius."
      );
    }
    return demoResult(params, geo, "no live results");
  } catch (e) {
    if (!allowDemo) {
      const msg = e instanceof Error ? e.message : "Buyer discovery failed.";
      if (/^Live directory|^Could not geocode/.test(msg)) throw e;
      throw new Error(
        `Live buyer sources are temporarily unreachable (${msg}). Please wait a minute and retry — demo data is disabled in production, so no substitute results were returned.`
      );
    }
    if (e instanceof Error && allowDemo) {
      return demoResult(params, geo, e.message);
    }
    throw e;
  }
}

/** Local-development compatibility path only. Never reached when demo is off. */
async function demoResult(
  params: BuyerSearchParams,
  geo: OrchestratedResult["geo"],
  reason: string
): Promise<OrchestratedResult> {
  const demo = await demoProvider.search(params);
  return {
    mode: "demo",
    leads: demo,
    providers: ["demo"],
    geo,
    notice:
      `DEMO MODE — live providers unavailable (${reason}). These are illustrative placeholders ` +
      `(no emails/websites). Set DEMO_FALLBACK=off to surface live errors instead of demo data.`,
  };
}
