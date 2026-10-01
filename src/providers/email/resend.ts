import type { EmailProvider, SendEmailInput, SendEmailResult } from "./types";

/**
 * Resend-compatible transactional provider (also works with any HTTP email API
 * that accepts a similar JSON payload by overriding EMAIL_API_URL).
 * Free tier: Resend offers a limited free quota — see README. Never required.
 * Env: EMAIL_PROVIDER=resend, EMAIL_API_KEY, EMAIL_FROM, EMAIL_FROM_NAME, EMAIL_API_URL (optional override)
 */
export const resendProvider: EmailProvider = {
  name: "resend",
  get configured() {
    return Boolean(process.env.EMAIL_API_KEY && process.env.EMAIL_FROM);
  },
  async send(input: SendEmailInput): Promise<SendEmailResult> {
    const key = process.env.EMAIL_API_KEY;
    const from = process.env.EMAIL_FROM;
    const fromName = process.env.EMAIL_FROM_NAME || "DecorReach AI";
    const apiUrl = process.env.EMAIL_API_URL || "https://api.resend.com/emails";
    if (!key || !from) {
      return { success: false, providerMessageId: null, status: "not_configured", error: "Email provider is not configured. Set EMAIL_API_KEY and EMAIL_FROM." };
    }
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 20000);
    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        signal: ctrl.signal,
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: `${fromName} <${from}>`,
          to: [input.to],
          subject: input.subject,
          text: input.body,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { id?: string; message?: string; error?: string };
      if (!res.ok) {
        return { success: false, providerMessageId: null, status: "failed", error: json.message || json.error || `Email API HTTP ${res.status}` };
      }
      return { success: true, providerMessageId: json.id ?? null, status: "sent", error: null };
    } catch (e) {
      return { success: false, providerMessageId: null, status: "failed", error: e instanceof Error ? e.message : "Email request failed" };
    } finally {
      clearTimeout(t);
    }
  },
};

/** Resolves the configured email provider (currently resend-compatible or none). */
export function getEmailProvider(): EmailProvider {
  return resendProvider;
}
