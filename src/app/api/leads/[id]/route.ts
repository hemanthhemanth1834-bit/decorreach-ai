import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const lead = getStore().savedLeads.get(id);
  if (!lead) return NextResponse.json({ ok: false, error: "Lead not found." }, { status: 404 });
  return NextResponse.json({ ok: true, lead });
}
