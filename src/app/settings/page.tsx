"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { sellerProfileSchema } from "@/lib/validation";
import { Badge, Card, Spinner, btnPrimary, inputCls, labelCls } from "@/components/ui";

const key = "decorreach:seller";

export default function SettingsPage() {
  const [health, setHealth] = useState<Record<string, string> | null>(null);
  const [saved, setSaved] = useState(false);
  const { register, handleSubmit, reset } = useForm({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(sellerProfileSchema) as any,
    defaultValues: { companyName: "", productDescription: "", website: "", contactName: "", contactEmail: "", phone: "", companyDescription: "" },
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) reset(JSON.parse(raw));
    } catch { /* ignore */ }
    fetch("/api/provider-health").then((r) => r.json()).then((j) => setHealth(j.services ?? null)).catch(() => {});
  }, [reset]);

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
      <p className="mt-1 text-sm text-slate-400">Seller profile, provider health, and environment guidance.</p>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-bold">Seller Profile</h2>
          <form
            onSubmit={handleSubmit((v) => {
              localStorage.setItem(key, JSON.stringify(v));
              setSaved(true);
              setTimeout(() => setSaved(false), 2500);
            })}
            className="space-y-3"
          >
            <div><label className={labelCls}>Company name</label><input {...register("companyName")} className={inputCls} /></div>
            <div><label className={labelCls}>Product description</label><textarea {...register("productDescription")} rows={3} className={inputCls} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className={labelCls}>Website</label><input {...register("website")} className={inputCls} /></div>
              <div><label className={labelCls}>Phone</label><input {...register("phone")} className={inputCls} /></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className={labelCls}>Contact name</label><input {...register("contactName")} className={inputCls} /></div>
              <div><label className={labelCls}>Contact email</label><input {...register("contactEmail")} className={inputCls} /></div>
            </div>
            <div><label className={labelCls}>Company description</label><textarea {...register("companyDescription")} rows={3} className={inputCls} /></div>
            <button className={btnPrimary}>{saved ? "Saved ✓" : "Save Profile"}</button>
          </form>
        </Card>

        <div className="space-y-4">
          <Card>
            <h2 className="mb-3 font-bold">API / Provider Health</h2>
            {!health ? (
              <Spinner label="Checking providers…" />
            ) : (
              <ul className="space-y-2 text-sm">
                {[
                  ["Buyer Discovery", health.buyers],
                  ["Geocoding", health.geocoding],
                  ["AI", health.ai],
                  ["Email", health.email],
                  ["Database", health.database],
                ].map(([k, v]) => (
                  <li key={k} className="flex items-center justify-between rounded-xl bg-white/[0.03] px-3 py-2">
                    <span>{k}</span>
                    <Badge tone={String(v).includes("Connect") ? "green" : String(v).includes("Demo") ? "amber" : "slate"}>{v}</Badge>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-[11px] text-slate-500">Keys are never displayed. Statuses show only Configured / Not Configured / Connected / Demo.</p>
          </Card>

          <Card>
            <h2 className="mb-2 font-bold">Environment variables</h2>
            <pre className="overflow-x-auto rounded-xl bg-black/40 p-3 font-mono text-[11px] leading-relaxed text-slate-300">
{`NEXT_PUBLIC_APP_URL=
SUPABASE_URL= / NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_ANON_KEY= / NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY= (server only)
AI_API_KEY= / OPENAI_API_KEY= (optional)
AI_MODEL= / AI_BASE_URL= (optional)
EMAIL_PROVIDER=resend
EMAIL_API_KEY= (server only)
EMAIL_FROM= / EMAIL_FROM_NAME=
DEMO_FALLBACK=off (production default: live-only; set DEMO_FALLBACK=on for local demo fallback)`}
            </pre>
            <p className="mt-2 text-[11px] text-slate-500">Copy <code>.env.example</code> to <code>.env.local</code>. Never commit real secrets.</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
