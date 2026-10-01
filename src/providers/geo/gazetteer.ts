import type { GeoProvider, GeoResult } from "./types";

/**
 * Minimal built-in U.S. gazetteer (major metros + states) used as a last-resort
 * geocoder so live Overpass discovery still works when external geocoders
 * rate-limit. Coordinates are public factual data (city centroids from
 * open sources). The BUYER data remains 100% live from Overpass.
 */
const CITIES: Array<{ match: RegExp; displayName: string; lat: number; lon: number; city: string; state: string }> = [
  { match: /new york|nyc|manhattan|brooklyn|queens|bronx|100\d\d/i, displayName: "New York, NY, USA", lat: 40.7128, lon: -74.006, city: "New York", state: "NY" },
  { match: /los angeles|\bLA\b|900\d\d/i, displayName: "Los Angeles, CA, USA", lat: 34.0522, lon: -118.2437, city: "Los Angeles", state: "CA" },
  { match: /chicago|606\d\d/i, displayName: "Chicago, IL, USA", lat: 41.8781, lon: -87.6298, city: "Chicago", state: "IL" },
  { match: /houston|770\d\d/i, displayName: "Houston, TX, USA", lat: 29.7604, lon: -95.3698, city: "Houston", state: "TX" },
  { match: /phoenix|850\d\d/i, displayName: "Phoenix, AZ, USA", lat: 33.4484, lon: -112.074, city: "Phoenix", state: "AZ" },
  { match: /philadelphia|191\d\d/i, displayName: "Philadelphia, PA, USA", lat: 39.9526, lon: -75.1652, city: "Philadelphia", state: "PA" },
  { match: /san antonio|782\d\d/i, displayName: "San Antonio, TX, USA", lat: 29.4241, lon: -98.4936, city: "San Antonio", state: "TX" },
  { match: /san diego|921\d\d/i, displayName: "San Diego, CA, USA", lat: 32.7157, lon: -117.1611, city: "San Diego", state: "CA" },
  { match: /dallas|752\d\d/i, displayName: "Dallas, TX, USA", lat: 32.7767, lon: -96.797, city: "Dallas", state: "TX" },
  { match: /san francisco|\bSF\b|941\d\d/i, displayName: "San Francisco, CA, USA", lat: 37.7749, lon: -122.4194, city: "San Francisco", state: "CA" },
  { match: /austin|787\d\d/i, displayName: "Austin, TX, USA", lat: 30.2672, lon: -97.7431, city: "Austin", state: "TX" },
  { match: /seattle|981\d\d/i, displayName: "Seattle, WA, USA", lat: 47.6062, lon: -122.3321, city: "Seattle", state: "WA" },
  { match: /denver|802\d\d/i, displayName: "Denver, CO, USA", lat: 39.7392, lon: -104.9903, city: "Denver", state: "CO" },
  { match: /boston|021\d\d/i, displayName: "Boston, MA, USA", lat: 42.3601, lon: -71.0589, city: "Boston", state: "MA" },
  { match: /atlanta|303\d\d/i, displayName: "Atlanta, GA, USA", lat: 33.749, lon: -84.388, city: "Atlanta", state: "GA" },
  { match: /miami|331\d\d/i, displayName: "Miami, FL, USA", lat: 25.7617, lon: -80.1918, city: "Miami", state: "FL" },
  { match: /portland|972\d\d/i, displayName: "Portland, OR, USA", lat: 45.5152, lon: -122.6784, city: "Portland", state: "OR" },
  { match: /las vegas|891\d\d/i, displayName: "Las Vegas, NV, USA", lat: 36.1699, lon: -115.1398, city: "Las Vegas", state: "NV" },
  { match: /minneapolis|554\d\d/i, displayName: "Minneapolis, MN, USA", lat: 44.9778, lon: -93.265, city: "Minneapolis", state: "MN" },
  { match: /nashville|372\d\d/i, displayName: "Nashville, TN, USA", lat: 36.1627, lon: -86.7816, city: "Nashville", state: "TN" },
];

export const gazetteerProvider: GeoProvider = {
  name: "gazetteer",
  async geocode(query: string): Promise<GeoResult | null> {
    const q = query.trim();
    if (!q) return null;
    for (const c of CITIES) {
      if (c.match.test(q)) {
        return { displayName: c.displayName, lat: c.lat, lon: c.lon, city: c.city, state: c.state, postcode: null, country: "United States" };
      }
    }
    return null;
  },
};
