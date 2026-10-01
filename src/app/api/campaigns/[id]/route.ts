import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const c = getStore().campaigns.get(id);
  if (!c) return NextResponse.json({ ok: false, error: "Campaign not found." }, { status: 404 });
  return NextResponse.json({ ok: true, campaign: c });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  getStore().campaigns.delete(id);
  return NextResponse.json({ ok: true });
}
