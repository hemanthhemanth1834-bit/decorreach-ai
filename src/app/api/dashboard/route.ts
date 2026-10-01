import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";

export async function GET() {
  const store = getStore();
  const saved = [...store.savedLeads.values()];
  const stats = {
    totalSearches: store.searches.length,
    buyersDiscovered: store.searches.reduce((n, s) => n + s.results, 0),
    savedLeads: saved.length,
    leadsWithEmail: saved.filter((l) => l.email).length,
    emailsGenerated: store.counters.emailsGenerated,
    emailsSent: store.counters.emailsSent,
    failedEmails: store.counters.failedEmails,
  };
  const campaigns = [...store.campaigns.values()]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5)
    .map((c) => ({
      id: c.id,
      name: c.name,
      leads: c.leads.length,
      sent: c.leads.filter((l) => l.status === "sent").length,
      pending: c.leads.filter((l) => l.status === "pending").length,
      failed: c.leads.filter((l) => l.status === "failed").length,
      status: c.status,
      createdAt: c.createdAt,
    }));
  return NextResponse.json({
    ok: true,
    stats,
    recentSearches: store.searches.slice(0, 6),
    recentCampaigns: campaigns,
    recentEmails: store.emailLog.slice(0, 6),
  });
}
