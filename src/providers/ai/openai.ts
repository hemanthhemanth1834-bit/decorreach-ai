import { templateEmail, type AIGenerateInput, type AIProvider } from "./types";
import type { EmailGenerationResult } from "@/lib/types";

/**
 * OpenAI-compatible provider (works with OpenAI, Groq, Together, OpenRouter, Ollama, etc.)
 * Env: AI_API_KEY (or OPENAI_API_KEY), AI_MODEL, AI_BASE_URL (default OpenAI chat completions).
 * Free-tier note: each vendor has its own limits — see README. Never required; falls back to template.
 */
export const openAICompatibleProvider: AIProvider = {
  name: "openai-compatible",
  get configured() {
    return Boolean(process.env.AI_API_KEY || process.env.OPENAI_API_KEY);
  },
  async generate(input: AIGenerateInput): Promise<EmailGenerationResult> {
    const key = process.env.AI_API_KEY || process.env.OPENAI_API_KEY;
    const model = process.env.AI_MODEL || "gpt-4o-mini";
    const base = (process.env.AI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
    if (!key) return templateEmail(input);

    const system = [
      "You write short, professional B2B wholesale outreach emails for home-decor sellers.",
      "Rules: never invent prior contact, partnerships, prices, or facts about the recipient.",
      "Use only the business info provided. Keep body under 160 words with a single clear call to action.",
      'Reply ONLY as JSON: {"subject": "...", "body": "..."}.',
    ].join(" ");
    const user = [
      `Recipient business: ${input.lead.name}`,
      `Category: ${input.lead.category ?? "home decor"}`,
      `Location: ${[input.lead.city, input.lead.state].filter(Boolean).join(", ") || "USA"}`,
      input.lead.website ? `Website: ${input.lead.website}` : "",
      `Seller company: ${input.seller.companyName || "N/A"}`,
      `Seller product: ${input.seller.productDescription || "home-decor products"}`,
      `Seller contact: ${input.seller.contactName || "N/A"} <${input.seller.contactEmail || ""}>`,
      input.seller.website ? `Seller site: ${input.seller.website}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 20000);
    try {
      const res = await fetch(`${base}/chat/completions`, {
        method: "POST",
        signal: ctrl.signal,
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          temperature: 0.6,
          max_tokens: 500,
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
        }),
      });
      if (!res.ok) return { ...templateEmail(input), model };
      const json = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const raw = json.choices?.[0]?.message?.content ?? "";
      const parsed = extractJson(raw);
      if (!parsed?.subject || !parsed?.body) return { ...templateEmail(input), model };
      return {
        subject: String(parsed.subject).slice(0, 200),
        body: String(parsed.body).slice(0, 4000),
        generatedBy: "ai",
        model,
      };
    } catch {
      return { ...templateEmail(input), model };
    } finally {
      clearTimeout(t);
    }
  },
};

function extractJson(raw: string): { subject?: string; body?: string } | null {
  try {
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start === -1 || end === -1) return null;
    return JSON.parse(raw.slice(start, end + 1));
  } catch {
    return null;
  }
}
