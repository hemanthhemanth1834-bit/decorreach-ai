import { NextResponse } from "next/server";
import { openAICompatibleProvider } from "@/providers/ai/openai";
import { getEmailProvider } from "@/providers/email/resend";
import { supabaseConfigured } from "@/lib/supabase";

async function checkUrl(url: string, timeoutMs = 7000): Promise<boolean> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch(url, { method: "GET", signal: ctrl.signal, headers: { "User-Agent": "DecorReachAI/1.0 health" } });
    clearTimeout(t);
    return res.ok;
  } catch {
    return false;
  }
}

export async function GET() {
  const [overpassOk, nominatimOk] = await Promise.all([
    checkUrl("https://overpass-api.de/api/status", 7000).catch(() => false),
    (async () => {
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 7000);
        const res = await fetch("https://nominatim.openstreetmap.org/search?format=json&q=New%20York&limit=1", {
          signal: ctrl.signal,
          headers: { "User-Agent": "DecorReachAI/1.0 health" },
        });
        clearTimeout(t);
        return res.ok;
      } catch {
        return false;
      }
    })(),
  ]);

  const emailConfigured = getEmailProvider().configured;
  const aiConfigured = openAICompatibleProvider.configured;

  return NextResponse.json({
    ok: true,
    services: {
      buyers: overpassOk ? "Connected" : "Demo",
      geocoding: nominatimOk ? "Connected" : "Demo",
      ai: aiConfigured ? "Connected" : "Not Configured",
      email: emailConfigured ? "Connected" : "Not Configured",
      database: supabaseConfigured() ? "Connected" : "Demo (in-memory)",
    },
    detail: {
      buyerProviders: ["overpass", "demo"],
      geocoder: "nominatim",
      aiProviders: aiConfigured ? ["openai-compatible"] : ["template-fallback"],
      emailProviders: emailConfigured ? ["resend-compatible"] : [],
    },
  });
}
