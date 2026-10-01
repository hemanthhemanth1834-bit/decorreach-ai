import { NextResponse } from "next/server";
import { generateEmailSchema } from "@/lib/validation";
import { openAICompatibleProvider } from "@/providers/ai/openai";
import { templateEmail } from "@/providers/ai/types";
import { getStore } from "@/lib/store";
import { clientKeyFromHeaders, rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const rl = rateLimit(`ai:${clientKeyFromHeaders(req.headers)}`, 30, 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ ok: false, error: "Rate limit exceeded. Try again shortly." }, { status: 429 });
  }
  const body = await req.json().catch(() => null);
  const parsed = generateEmailSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
  }
  const { lead, seller } = parsed.data;
  try {
    const result = openAICompatibleProvider.configured
      ? await openAICompatibleProvider.generate({ lead, seller })
      : templateEmail({ lead, seller });
    getStore().counters.emailsGenerated += 1;
    return NextResponse.json({
      ok: true,
      subject: result.subject,
      body: result.body,
      generatedBy: result.generatedBy,
      model: result.model ?? null,
      label: result.generatedBy === "ai" ? "AI Generated" : "Template Generated",
    });
  } catch {
    const fallback = templateEmail({ lead, seller });
    getStore().counters.emailsGenerated += 1;
    return NextResponse.json({
      ok: true,
      subject: fallback.subject,
      body: fallback.body,
      generatedBy: "template",
      model: null,
      label: "Template Generated",
      notice: "AI provider failed; used deterministic template instead.",
    });
  }
}
