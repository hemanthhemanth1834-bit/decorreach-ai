export interface GeoResult {
  displayName: string;
  lat: number;
  lon: number;
  city: string | null;
  state: string | null;
  postcode: string | null;
  country: string | null;
}

export interface GeoProvider {
  name: string;
  geocode(query: string): Promise<GeoResult | null>;
}
