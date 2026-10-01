import { NextResponse } from "next/server";
import { sendEmailSchema } from "@/lib/validation";
import { getEmailProvider } from "@/providers/email/resend";
import { getStore, uid } from "@/lib/store";
import { clientKeyFromHeaders, rateLimit } from "@/lib/rate-limit";

const COMPLIANCE_FOOTER =
  "\n\n—\nYou are receiving this because your business contact information is publicly listed. Reply STOP to opt out of further messages. We comply with applicable email, privacy, anti-spam, and provider requirements.";

export async function POST(req: Request) {
  const rl = rateLimit(`email:${clientKeyFromHeaders(req.headers)}`, 15, 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ ok: false, error: "Email rate limit exceeded. Please slow down — anti-spam protection." }, { status: 429 });
  }
  const body = await req.json().catch(() => null);
  const parsed = sendEmailSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
  }
  const store = getStore();
  const provider = getEmailProvider();
  if (!provider.configured) {
    store.counters.failedEmails += 1;
    return NextResponse.json(
      {
        ok: false,
        status: "not_configured",
        error: "Email provider is not configured. Set EMAIL_PROVIDER, EMAIL_API_KEY and EMAIL_FROM to send.",
      },
      { status: 503 }
    );
  }
  const withFooter = parsed.data.body.includes("opt out")
    ? parsed.data.body
    : parsed.data.body + COMPLIANCE_FOOTER;
  const result = await provider.send({ to: parsed.data.to, subject: parsed.data.subject, body: withFooter });

  const entry = {
    id: uid("email"),
    to: parsed.data.to,
    subject: parsed.data.subject,
    status: result.status,
    providerId: result.providerMessageId,
    createdAt: new Date().toISOString(),
  };
  store.emailLog.unshift(entry);
  store.emailLog = store.emailLog.slice(0, 100);

  // Update campaign lead status if linked
  if (parsed.data.campaignId && parsed.data.leadId) {
    const c = store.campaigns.get(parsed.data.campaignId);
    if (c) {
      const le = c.leads.find((l) => l.leadId === parsed.data.leadId);
      if (le) {
        le.status = result.success ? "sent" : "failed";
        le.providerId = result.providerMessageId;
        le.error = result.error;
        le.sentAt = result.success ? new Date().toISOString() : null;
      }
      const sent = c.leads.filter((l) => l.status === "sent").length;
      const failed = c.leads.filter((l) => l.status === "failed").length;
      c.status = sent === c.leads.length ? "Completed" : failed > 0 && sent > 0 ? "Partially Sent" : failed === c.leads.length ? "Failed" : sent > 0 ? "Sending" : c.status;
      c.updatedAt = new Date().toISOString();
    }
  }

  if (result.success) {
    store.counters.emailsSent += 1;
    return NextResponse.json({ ok: true, status: "sent", providerMessageId: result.providerMessageId });
  }
  store.counters.failedEmails += 1;
  return NextResponse.json({ ok: false, status: result.status, error: result.error ?? "Send failed." }, { status: 502 });
}
