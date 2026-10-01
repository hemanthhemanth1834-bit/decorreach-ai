export type SourceType = "live" | "demo";
export type BuyerTypeFilter = "Business" | "All";

export interface NormalizedLead {
  id: string;
  name: string;
  category: string;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  latitude: number | null;
  longitude: number | null;
  source: string;
  sourceUrl: string | null;
  sourceType: SourceType;
  emailAvailability: boolean;
  websiteAvailability: boolean;
  discoveredAt: string;
}

export interface BuyerSearchRequest {
  product: string;
  location: string;
  keyword?: string;
  buyerType?: string;
  radius?: number;
}

export interface BuyerSearchResponse {
  ok: boolean;
  mode: SourceType;
  location: {
    query: string;
    displayName: string | null;
    lat: number | null;
    lon: number | null;
  };
  category: string;
  count: number;
  leads: NormalizedLead[];
  providers: string[];
  notice?: string;
  error?: string;
}

export interface SavedLead extends NormalizedLead {
  savedAt: string;
  notes?: string;
}

export type CampaignStatus =
  | "Draft"
  | "Ready"
  | "Sending"
  | "Completed"
  | "Partially Sent"
  | "Failed";

export interface CampaignLeadEntry {
  leadId: string;
  leadName: string;
  email: string | null;
  status: "pending" | "sent" | "failed" | "skipped";
  providerId: string | null;
  error: string | null;
  sentAt: string | null;
}

export interface Campaign {
  id: string;
  name: string;
  product: string;
  location: string;
  subject: string;
  body: string;
  status: CampaignStatus;
  leads: CampaignLeadEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface EmailGenerationResult {
  subject: string;
  body: string;
  generatedBy: "ai" | "template";
  model?: string;
}

export interface SellerProfile {
  companyName: string;
  productDescription: string;
  website: string;
  contactName: string;
  contactEmail: string;
  phone: string;
  companyDescription: string;
}

export interface DashboardStats {
  totalSearches: number;
  buyersDiscovered: number;
  savedLeads: number;
  leadsWithEmail: number;
  emailsGenerated: number;
  emailsSent: number;
  failedEmails: number;
}

export const CATEGORIES = [
  "Home Decor",
  "Furniture",
  "Interior Design",
  "Home Furnishing",
  "Lighting",
  "Rugs",
  "Wall Decor",
  "Kitchen Decor",
  "Outdoor Decor",
  "Other",
] as const;
