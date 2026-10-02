import { NextResponse } from "next/server";
import { leadSchema } from "@/lib/validation";
import { getStore, uid } from "@/lib/store";

export async function GET() {
  const store = getStore();
  const leads = [...store.savedLeads.values()].sort((a, b) => b.savedAt.localeCompare(a.savedAt));
  return NextResponse.json({ ok: true, count: leads.length, leads });
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }
  const parsed = leadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid lead." },
      { status: 400 }
    );
  }
  const d = parsed.data;
  const now = new Date().toISOString();
  const store = getStore();
  const id = d.id ?? uid("lead");
  const saved = {
    id,
    name: d.name,
    category: d.category,
    address: d.address ?? null,
    city: d.city ?? null,
    state: d.state ?? null,
    country: d.country ?? "United States",
    postalCode: d.postalCode ?? null,
    website: d.website ?? null,
    phone: d.phone ?? null,
    email: d.email ?? null,
    latitude: d.latitude ?? null,
    longitude: d.longitude ?? null,
    source: d.source ?? "DecorReach",
    sourceUrl: d.sourceUrl ?? null,
    sourceType: d.sourceType ?? "live",
    emailAvailability: Boolean(d.email),
    websiteAvailability: Boolean(d.website),
    discoveredAt: now,
    savedAt: now,
  };
  store.savedLeads.set(id, saved);
  return NextResponse.json({ ok: true, lead: saved }, { status: 201 });
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const store = getStore();
  if (id) {
    store.savedLeads.delete(id);
    return NextResponse.json({ ok: true });
  }
  const body = (await req.json().catch(() => null)) as { ids?: string[] } | null;
  if (body?.ids?.length) {
    for (const x of body.ids) store.savedLeads.delete(x);
    return NextResponse.json({ ok: true, deleted: body.ids.length });
  }
  return NextResponse.json({ ok: false, error: "Provide ?id= or {ids: []}." }, { status: 400 });
}
