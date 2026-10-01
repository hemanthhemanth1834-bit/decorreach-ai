import type { Campaign, NormalizedLead } from "./types";

/**
 * Server-side ephemeral store.
 * When Supabase is configured, the API layer also persists there (see supabase-server.ts);
 * this in-memory store keeps the demo fully functional without credentials.
 */
interface StoreState {
  searches: Array<{
    id: string;
    category: string;
    location: string;
    results: number;
    mode: "live" | "demo";
    providers: string[];
    createdAt: string;
  }>;
  savedLeads: Map<string, NormalizedLead & { savedAt: string }>;
  campaigns: Map<string, Campaign>;
  emailLog: Array<{
    id: string;
    to: string;
    subject: string;
    status: string;
    providerId: string | null;
    createdAt: string;
  }>;
  counters: {
    emailsGenerated: number;
    emailsSent: number;
    failedEmails: number;
  };
}

const g = globalThis as unknown as { __decorreach?: StoreState };

export function getStore(): StoreState {
  if (!g.__decorreach) {
    g.__decorreach = {
      searches: [],
      savedLeads: new Map(),
      campaigns: new Map(),
      emailLog: [],
      counters: { emailsGenerated: 0, emailsSent: 0, failedEmails: 0 },
    };
  }
  return g.__decorreach;
}

export function uid(prefix = "id"): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}
