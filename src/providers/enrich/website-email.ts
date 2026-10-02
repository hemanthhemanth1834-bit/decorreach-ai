import type { NormalizedLead } from "@/lib/types";

const MAX_HTML_BYTES = 600_000;

/**
 * Bounded public-website email enrichment.
 * Uses ONLY addresses literally published in a business's own public homepage
 * HTML (mailto: links first, then visible text). Never invents addresses:
 * returns [] when nothing suitable is found and callers keep email=null.
 */
export function extractPublicEmails(html: string): string[] {
  const found = new Map<string, number>();
  const norm = (raw: string): string | null => {
    const v = raw.trim().toLowerCase();
    if (!v || v.length > 254 || !/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/.test(v)) return null;
    if (v.includes("example.")) return null;
    if (/\.(png|jpe?g|gif|svg|webp|css|js|ico)$/.test(v)) return null;
    if (v.startsWith("@") || v.endsWith("@")) return null;
    return v;
  };
  const score = (email: string, host: string | null): number => {
    let s = 0;
    const [local, domain] = email.split("@");
    if (/^(contact|info|hello|sales|support|team|inquiries|enquiries|trade|wholesale|business)$/.test(local)) s += 5;
    else if (/contact|info|hello|sales|support|inquir|trade|wholesale/.test(local)) s += 2;
    if (host && domain === host) s += 3;
    if (/^(noreply|no-reply|donotreply|do-not-reply|mailer-daemon|postmaster|abuse)/.test(local)) s -= 6;
    return s;
  };

  // mailto: links carry the highest signal
  const mailtos = html.match(/mailto:([^\s"'<>?&#]+@[^\s"'<>?&#]+)/gi) ?? [];
  let host: string | null = null;
  try {
    const m = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)/i);
    if (m) host = new URL(m[1]).hostname.replace(/^www\./, "");
  } catch {
    host = null;
  }
  for (const m of mailtos) {
    const e = norm(m.replace(/^mailto:/i, ""));
    if (e && !found.has(e)) found.set(e, 10 + score(e, host));
  }
  // bare addresses in visible text / JSON-LD
  const bare = html.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) ?? [];
  for (const b of bare) {
    const e = norm(b);
    if (e && !found.has(e)) found.set(e, score(e, host));
  }
  return [...found.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([e]) => e)
    .slice(0, 5);
}

function hostOf(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

/** Fetch a homepage with hard bounds; return ranked public emails (may be []). */
export async function fetchHomepageEmails(website: string, timeoutMs = 8000): Promise<string[]> {
  let url: string;
  try {
    url = website.startsWith("http") ? website : `https://${website}`;
    const u = new URL(url);
    if (u.protocol !== "http:" && u.protocol !== "https:") return [];
  } catch {
    return [];
  }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "DecorReachAI/1.0 (buyer-discovery; contact research)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    if (!res.ok) return [];
    const ct = res.headers.get("content-type") ?? "";
    if (ct && !/html/i.test(ct)) return [];
    // Stream with a hard size cap so huge pages can't blow the time budget.
    const reader = res.body?.getReader();
    if (!reader) {
      const text = await res.text().catch(() => "");
      return extractPublicEmails(text.slice(0, MAX_HTML_BYTES));
    }
    const chunks: Uint8Array[] = [];
    let bytes = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        bytes += value.byteLength;
        if (bytes > MAX_HTML_BYTES) break;
        chunks.push(value);
      }
    }
    try {
      await reader.cancel();
    } catch {
      /* ignore */
    }
    const total = chunks.reduce((n, c) => n + c.byteLength, 0);
    const buf = new Uint8Array(total);
    let off = 0;
    for (const c of chunks) {
      buf.set(c, off);
      off += c.byteLength;
    }
    const html = new TextDecoder("utf-8", { fatal: false }).decode(buf);
    const host = hostOf(url);
    void host;
    return extractPublicEmails(html);
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

export interface EnrichOptions {
  maxLeads?: number;
  timeoutMs?: number;
}

/**
 * Fill in email ONLY from the business's own public website.
 * Bounded: at most `maxLeads` homepage fetches, all in parallel.
 * Leads without a discoverable address keep email=null (never invented).
 */
export async function enrichLeadsWithPublicEmails(
  leads: NormalizedLead[],
  opts: EnrichOptions = {}
): Promise<{ enriched: number; checked: number }> {
  const maxLeads = Math.min(Math.max(opts.maxLeads ?? 6, 0), 10);
  const timeoutMs = opts.timeoutMs ?? 8000;
  const targets = leads.filter((l) => !l.email && l.website).slice(0, maxLeads);
  if (!targets.length) return { enriched: 0, checked: 0 };
  const settled = await Promise.allSettled(
    targets.map(async (lead) => {
      const emails = await fetchHomepageEmails(lead.website!, timeoutMs);
      return { lead, emails };
    })
  );
  let enriched = 0;
  for (const s of settled) {
    if (s.status === "fulfilled" && s.value.emails.length > 0) {
      s.value.lead.email = s.value.emails[0];
      s.value.lead.emailAvailability = true;
      enriched += 1;
    }
  }
  return { enriched, checked: targets.length };
}
