"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { campaignSchema } from "@/lib/validation";
import type { Campaign, NormalizedLead } from "@/lib/types";
import { Badge, Card, Empty, Spinner, btnPrimary, inputCls, labelCls } from "@/components/ui";

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [leads, setLeads] = useState<NormalizedLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(campaignSchema) as any,
    defaultValues: { name: "", product: "", location: "", subject: "", body: "", leadIds: [] as string[] },
  });
  const [picked, setPicked] = useState<string[]>([]);

  async function load() {
    setLoading(true);
    try {
      const [c, l] = await Promise.all([fetch("/api/campaigns").then((r) => r.json()), fetch("/api/leads").then((r) => r.json())]);
      setCampaigns(c.campaigns ?? []);
      setLeads(l.leads ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  async function onSubmit(values: { name: string; product?: string; location?: string; subject: string; body: string }) {
    if (!picked.length) {
      setError("Select at least one lead.");
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, leadIds: picked }),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error ?? "Could not create campaign.");
        return;
      }
      reset();
      setPicked([]);
      load();
    } finally {
      setCreating(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Campaigns</h1>
      <p className="mt-1 text-sm text-slate-400">Group leads, track per-lead send status truthfully.</p>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-bold">New Campaign</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div>
              <label className={labelCls}>Campaign name</label>
              <input {...register("name")} className={inputCls} placeholder="Fall Lighting Outreach" />
              {errors.name && <p className="mt-1 text-xs text-red-300">{errors.name.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input {...register("product")} className={inputCls} placeholder="Product" />
              <input {...register("location")} className={inputCls} placeholder="Location" />
            </div>
            <div>
              <label className={labelCls}>Subject</label>
              <input {...register("subject")} className={inputCls} placeholder="Wholesale collection for…" />
              {errors.subject && <p className="mt-1 text-xs text-red-300">{errors.subject.message}</p>}
            </div>
            <div>
              <label className={labelCls}>Body</label>
              <textarea {...register("body")} rows={5} className={inputCls} placeholder="Hi …" />
              {errors.body && <p className="mt-1 text-xs text-red-300">{errors.body.message}</p>}
            </div>
            <div>
              <label className={labelCls}>Leads ({picked.length} selected)</label>
              <div className="max-h-44 space-y-1 overflow-y-auto rounded-xl border border-white/10 p-2">
                {!leads.length && <p className="p-2 text-xs text-slate-500">Save leads first from Find Buyers.</p>}
                {leads.map((l) => (
                  <label key={l.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-white/5">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-cyan-400"
                      checked={picked.includes(l.id)}
                      onChange={() =>
                        setPicked((p) => (p.includes(l.id) ? p.filter((x) => x !== l.id) : [...p, l.id]))
                      }
                    />
                    <span className="truncate">{l.name}</span>
                    <span className="ml-auto text-xs text-slate-500">{l.email ?? "no email"}</span>
                  </label>
                ))}
              </div>
            </div>
            {error && <p className="text-xs text-red-300">{error}</p>}
            <button className={btnPrimary} disabled={creating}>{creating ? "Creating…" : "Create Campaign"}</button>
          </form>
        </Card>

        <Card>
          <h2 className="mb-3 font-bold">All Campaigns</h2>
          {loading ? (
            <Spinner />
          ) : !campaigns.length ? (
            <Empty title="No campaigns yet." hint="Create one from your saved leads." />
          ) : (
            <ul className="space-y-2">
              {campaigns.map((c) => (
                <li key={c.id} className="rounded-xl bg-white/[0.03] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <Link href={`/campaigns/${c.id}`} className="font-semibold hover:text-cyan-300">{c.name}</Link>
                    <Badge tone={c.status === "Completed" ? "green" : c.status === "Failed" ? "red" : "blue"}>{c.status}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {c.leads.length} leads · {c.leads.filter((l) => l.status === "sent").length} sent ·{" "}
                    {c.leads.filter((l) => l.status === "pending").length} pending ·{" "}
                    {c.leads.filter((l) => l.status === "failed").length} failed
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
