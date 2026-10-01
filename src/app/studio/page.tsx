"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { sellerProfileSchema } from "@/lib/validation";
import type { NormalizedLead, SellerProfile } from "@/lib/types";
import { Badge, Card, btnPrimary, btnSecondary, inputCls, labelCls } from "@/components/ui";

const profileKey = "decorreach:seller";

const formSchema = sellerProfileSchema;
type FormValues = z.infer<typeof formSchema>;

export default function StudioPage() {
  const [lead, setLead] = useState<NormalizedLead | null>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [label, setLabel] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [to, setTo] = useState("");

  const { register, getValues } = useForm<FormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(formSchema) as any,
    defaultValues: loadProfile(),
  });

  function loadProfile(): FormValues {
    if (typeof window === "undefined")
      return { companyName: "", productDescription: "", website: "", contactName: "", contactEmail: "", phone: "", companyDescription: "" };
    try {
      const raw = localStorage.getItem(profileKey);
      if (raw) return { ...loadProfileFallback(), ...JSON.parse(raw) };
    } catch { /* ignore */ }
    return loadProfileFallback();
  }
  function loadProfileFallback(): FormValues {
    return { companyName: "Maison Craft Studio", productDescription: "handcrafted ceramic vases and wall decor", website: "", contactName: "Ava Sharma", contactEmail: "hello@example.com", phone: "", companyDescription: "" };
  }

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("decorreach:studioLead");
      if (raw) {
        const l = JSON.parse(raw) as NormalizedLead;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLead(l);
        setTo(l.email ?? "");
      }
    } catch { /* ignore */ }
  }, []);

  function seller(): SellerProfile {
    try {
      return getValues() as SellerProfile;
    } catch {
      return loadProfileFallback() as SellerProfile;
    }
  }

  async function generate() {
    if (!lead) {
      setStatus("Select a lead first — run Find Buyers and click Generate Email.");
      return;
    }
    setGenerating(true);
    setStatus(null);
    try {
      const res = await fetch("/api/ai/generate-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead: { name: lead.name, category: lead.category, city: lead.city, state: lead.state, website: lead.website },
          seller: seller(),
        }),
      });
      const json = await res.json();
      if (json.ok) {
        setSubject(json.subject);
        setBody(json.body);
        setLabel(json.label);
      } else {
        setStatus(json.error ?? "Generation failed.");
      }
    } catch {
      setStatus("Network error during generation.");
    } finally {
      setGenerating(false);
    }
  }

  async function send() {
    if (!to || !subject || !body) {
      setStatus("Recipient, subject and body are all required before sending.");
      return;
    }
    if (!confirm(`Send this email to ${to}?`)) return;
    setSending(true);
    setStatus(null);
    try {
      const res = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, subject, body, leadId: lead?.id }),
      });
      const json = await res.json();
      if (json.ok) {
        setStatus(`Email sent successfully. Provider ID: ${json.providerMessageId ?? "n/a"}`);
      } else {
        setStatus(json.error ?? "Send failed. Email provider may not be configured.");
      }
    } catch {
      setStatus("Network error during send.");
    } finally {
      setSending(false);
    }
  }

  function saveProfile() {
    try {
      localStorage.setItem(profileKey, JSON.stringify(getValues()));
      setStatus("Seller profile saved locally.");
    } catch {
      setStatus("Could not save profile.");
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Email Studio</h1>
      <p className="mt-1 text-sm text-slate-400">Generate, review, edit, preview, then send — explicit action required.</p>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-bold">1 · Lead & Seller</h2>
          <div className="rounded-xl bg-white/[0.03] p-3 text-sm">
            {lead ? (
              <>
                <p className="font-semibold">{lead.name}</p>
                <p className="text-xs text-slate-400">{lead.category} · {[lead.city, lead.state].filter(Boolean).join(", ")}</p>
              </>
            ) : (
              <p className="text-sm text-slate-500">No lead selected. Go to Find Buyers → Generate Email.</p>
            )}
          </div>
          <div className="mt-3 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div><label className={labelCls}>Company</label><input {...register("companyName")} className={inputCls} /></div>
              <div><label className={labelCls}>Contact</label><input {...register("contactName")} className={inputCls} /></div>
            </div>
            <div><label className={labelCls}>Product description</label><input {...register("productDescription")} className={inputCls} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className={labelCls}>Contact email</label><input {...register("contactEmail")} className={inputCls} /></div>
              <div><label className={labelCls}>Website</label><input {...register("website")} className={inputCls} /></div>
            </div>
            <div className="flex gap-2">
              <button className={btnSecondary} onClick={saveProfile}>Save Profile</button>
              <button className={btnPrimary} onClick={generate} disabled={generating}>{generating ? "Generating…" : "Generate Email"}</button>
            </div>
          </div>
        </Card>

        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold">2 · Review & Send</h2>
            {label && <Badge tone={label.includes("AI") ? "cyan" : "slate"}>{label}</Badge>}
          </div>
          <label className={labelCls}>To (business email only)</label>
          <input value={to} onChange={(e) => setTo(e.target.value)} placeholder="buyer@business.com" className={inputCls} />
          {!to && <p className="mt-1 text-xs text-amber-300">This lead has no public email — sending is disabled until you add a verified business address.</p>}
          <label className={`${labelCls} mt-3`}>Subject</label>
          <input value={subject} onChange={(e) => setSubject(e.target.value)} className={inputCls} />
          <label className={`${labelCls} mt-3`}>Body</label>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={12} className={`${inputCls} font-[15px] leading-relaxed`} />
          {body && (
            <div className="mt-3 rounded-xl border border-white/10 bg-[#0b1322] p-4">
              <p className="text-xs uppercase tracking-wider text-slate-500">Preview</p>
              <p className="mt-1 font-semibold">{subject || "(no subject)"}</p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-300">{body}</p>
            </div>
          )}
          <div className="mt-3 flex gap-2">
            <button className={btnPrimary} disabled={sending || !to} onClick={send}>{sending ? "Sending…" : "Send Email"}</button>
          </div>
          {status && <p className="mt-2 text-sm text-slate-300">{status}</p>}
          <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
            Use only legitimate publicly available business contact information and comply with
            applicable email, privacy, anti-spam, and provider requirements. An opt-out footer is
            appended automatically.
          </p>
        </Card>
      </div>
    </div>
  );
}
