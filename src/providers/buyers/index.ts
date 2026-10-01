import type { NormalizedLead } from "@/lib/types";
import { dedupeLeads, type BuyerSearchParams } from "./types";
import { overpassProvider } from "./overpass";
import { demoProvider } from "./demo";
import { nominatimProvider } from "../geo/nominatim";
import { censusProvider } from "../geo/census";
import { gazetteerProvider } from "../geo/gazetteer";

export interface OrchestratedResult {
  mode: "live" | "demo";
  leads: NormalizedLead[];
  providers: string[];
  geo: { displayName: string | null; lat: number | null; lon: number | null } | null;
  notice?: string;
}

/**
 * Tries live discovery (Nominatim + Overpass). Falls back to demo ONLY
 * when live fails or yields nothing — always labeled truthfully.
 */
export async function discoverBuyers(params: BuyerSearchParams): Promise<OrchestratedResult> {
  const allowDemo = process.env.DEMO_FALLBACK !== "off";
  let geo: OrchestratedResult["geo"] = params.geo
    ? { displayName: params.geo.displayName ?? null, lat: params.geo.lat, lon: params.geo.lon }
    : null;

  // Geocode when coordinates not supplied — chain: nominatim → census → gazetteer
  let geocoder = "nominatim";
  if (!geo) {
    for (const p of [nominatimProvider, censusProvider, gazetteerProvider]) {
      try {
        const g = await p.geocode(params.location);
        if (g) {
          geo = { displayName: g.displayName, lat: g.lat, lon: g.lon };
          geocoder = p.name;
          break;
        }
      } catch {
        continue;
      }
    }
  }

  if (geo?.lat != null && geo?.lon != null) {
    try {
      const live = await overpassProvider.search({ ...params, geo: { lat: geo.lat, lon: geo.lon } });
      const clean = dedupeLeads(live).slice(0, 60);
      if (clean.length > 0) {
        return { mode: "live", leads: clean, providers: ["overpass", geocoder], geo };
      }
    } catch (e) {
      if (!allowDemo) throw e;
    }
  }

  if (!allowDemo) {
    throw new Error(
      geo ? "Live provider returned no results for this area." : "Could not geocode that U.S. location."
    );
  }

  const demo = await demoProvider.search(params);
  return {
    mode: "demo",
    leads: demo,
    providers: ["demo"],
    geo,
    notice:
      "DEMO MODE — External buyer provider is not configured or returned no results. These are illustrative placeholders (no emails/websites). Add connectivity and retry for live data.",
  };
}
