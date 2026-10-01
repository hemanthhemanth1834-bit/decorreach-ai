import { NextResponse } from "next/server";
import { buyerSearchSchema } from "@/lib/validation";
import { discoverBuyers } from "@/providers/buyers";
import { getStore, uid } from "@/lib/store";
import { clientKeyFromHeaders, rateLimit } from "@/lib/rate-limit";

// Live discovery fans out to free geo/business APIs; allow headroom on hosts
// that support longer serverless durations (Vercel Hobby caps at 60s).
export const maxDuration = 60;

export async function POST(req: Request) {
  const rl = rateLimit(`buyers:${clientKeyFromHeaders(req.headers)}`, 20, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { ok: false, error: "Rate limit exceeded. Please wait a minute and try again." },
      { status: 429 }
    );
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }
  const parsed = buyerSearchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 }
    );
  }
  const { product, location, keyword, buyerType, radius } = parsed.data;
  try {
    const result = await discoverBuyers({
      product,
      location,
      keyword: keyword ?? "",
      buyerType: buyerType ?? "Business",
      radiusMiles: radius ?? 25,
    });
    const store = getStore();
    store.searches.unshift({
      id: uid("search"),
      category: product,
      location,
      results: result.leads.length,
      mode: result.mode,
      providers: result.providers,
      createdAt: new Date().toISOString(),
    });
    store.searches = store.searches.slice(0, 50);

    return NextResponse.json({
      ok: true,
      mode: result.mode,
      location: {
        query: location,
        displayName: result.geo?.displayName ?? null,
        lat: result.geo?.lat ?? null,
        lon: result.geo?.lon ?? null,
      },
      category: product,
      count: result.leads.length,
      leads: result.leads,
      providers: result.providers,
      notice: result.notice,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Buyer discovery failed.";
    const isGeo = /geocode/i.test(msg);
    return NextResponse.json(
      { ok: false, error: msg, hint: isGeo ? "Try 'New York, NY' or a ZIP like '10001'." : undefined },
      { status: 502 }
    );
  }
}
