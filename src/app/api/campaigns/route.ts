import { NextResponse } from "next/server";
import { campaignSchema } from "@/lib/validation";
import { getStore, uid } from "@/lib/store";
import type { Campaign } from "@/lib/types";

export async function GET() {
  const store = getStore();
  const campaigns = [...store.campaigns.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return NextResponse.json({ ok: true, count: campaigns.length, campaigns });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = campaignSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid campaign." }, { status: 400 });
  }
  const store = getStore();
  const now = new Date().toISOString();
  const leads = parsed.data.leadIds.map((leadId) => {
    const saved = store.savedLeads.get(leadId);
    return {
      leadId,
      leadName: saved?.name ?? leadId,
      email: saved?.email ?? null,
      status: "pending" as const,
      providerId: null,
      error: null,
      sentAt: null,
    };
  });
  const campaign: Campaign = {
    id: uid("cmp"),
    name: parsed.data.name,
    product: parsed.data.product ?? "",
    location: parsed.data.location ?? "",
    subject: parsed.data.subject,
    body: parsed.data.body,
    status: "Ready",
    leads,
    createdAt: now,
    updatedAt: now,
  };
  store.campaigns.set(campaign.id, campaign);
  return NextResponse.json({ ok: true, campaign }, { status: 201 });
}
