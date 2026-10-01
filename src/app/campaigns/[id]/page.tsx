"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Campaign } from "@/lib/types";
import { Badge, Card, Spinner, btnSecondary } from "@/components/ui";
import { timeAgo } from "@/lib/utils";

export default function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState<string | null>(null);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/campaigns/${id}`)
      .then((r) => r.json())
      .then((j) => setCampaign(j.campaign ?? null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Spinner label="Loading campaign…" />;
  if (!campaign) return <p className="text-sm text-slate-400">Campaign not found. <Link className="text-cyan-300" href="/campaigns">Back</Link></p>;

  return (
    <div>
      <Link href="/campaigns" className="text-xs text-slate-400 hover:text-white">← All campaigns</Link>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold">{campaign.name}</h1>
        <Badge tone={campaign.status === "Completed" ? "green" : "blue"}>{campaign.status}</Badge>
      </div>
      <p className="mt-1 text-sm text-slate-400">{campaign.product} · {campaign.location} · updated {timeAgo(campaign.updatedAt)}</p>

      <Card className="mt-4">
        <p className="text-xs uppercase tracking-wider text-slate-500">Subject</p>
        <p className="font-semibold">{campaign.subject}</p>
        <p className="mt-3 whitespace-pre-wrap text-sm text-slate-300">{campaign.body}</p>
      </Card>

      <Card className="mt-4">
        <h2 className="mb-3 font-bold">Leads ({campaign.leads.length})</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wider text-slate-500">
                <th className="py-2 pr-3">Lead</th>
                <th className="py-2 pr-3">Email</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Timestamp</th>
                <th className="py-2">Provider ID</th>
              </tr>
            </thead>
            <tbody>
              {campaign.leads.map((l) => (
                <tr key={l.leadId} className="border-t border-white/5">
                  <td className="py-2 pr-3 font-medium">{l.leadName}</td>
                  <td className="py-2 pr-3 text-slate-400">{l.email ?? "—"}</td>
                  <td className="py-2 pr-3">
                    <Badge tone={l.status === "sent" ? "green" : l.status === "failed" ? "red" : "slate"}>{l.status}</Badge>
                    {l.error && <span className="block max-w-[220px] truncate text-[11px] text-red-300">{l.error}</span>}
                  </td>
                  <td className="py-2 pr-3 text-slate-400">{l.sentAt ? timeAgo(l.sentAt) : "—"}</td>
                  <td className="py-2 font-mono text-[11px] text-slate-500">{l.providerId ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Link href="/studio" className={`${btnSecondary} mt-4`}>Open in Email Studio →</Link>
      </Card>
    </div>
  );
}
