"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, ArrowRight } from "lucide-react";
import { Card, StatCard, Badge, Spinner, Empty, btnPrimary } from "@/components/ui";
import { timeAgo } from "@/lib/utils";

interface DashboardData {
  stats: Record<string, number>;
  recentSearches: Array<{ id: string; category: string; location: string; results: number; mode: string; providers: string[]; createdAt: string }>;
  recentCampaigns: Array<{ id: string; name: string; leads: number; sent: number; pending: number; failed: number; status: string; createdAt: string }>;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const s = data?.stats;
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Discover U.S. Buyers Faster</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-400">
            Find relevant home-decor businesses through live API-powered discovery, qualify your
            leads, and reach them with personalized outreach.
          </p>
        </div>
        <Link href="/find" className={btnPrimary}>
          <Search size={16} /> Find Buyers <ArrowRight size={15} />
        </Link>
      </div>

      {loading ? (
        <Spinner label="Loading dashboard…" />
      ) : !s ? (
        <Empty title="Dashboard unavailable" hint="Could not load statistics. The API may be starting — try refreshing." />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="Total Searches" value={s.totalSearches ?? 0} />
            <StatCard label="Buyers Discovered" value={s.buyersDiscovered ?? 0} />
            <StatCard label="Saved Leads" value={s.savedLeads ?? 0} />
            <StatCard label="Leads With Email" value={s.leadsWithEmail ?? 0} />
            <StatCard label="Emails Generated" value={s.emailsGenerated ?? 0} />
            <StatCard label="Emails Sent" value={s.emailsSent ?? 0} />
            <StatCard label="Failed Emails" value={s.failedEmails ?? 0} />
            <Card className="flex flex-col justify-center p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Quick action</p>
              <Link href="/find" className="mt-2 text-sm font-semibold text-cyan-300 hover:underline">
                New buyer search →
              </Link>
              <Link href="/studio" className="mt-1 text-sm text-slate-400 hover:text-white">
                Open Email Studio →
              </Link>
            </Card>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <Card>
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-300">Recent Searches</h2>
              {!data?.recentSearches?.length ? (
                <p className="text-sm text-slate-500">No searches yet. Run your first search to see history here.</p>
              ) : (
                <ul className="space-y-2">
                  {data.recentSearches.map((r) => (
                    <li key={r.id} className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.03] px-3 py-2.5 text-sm">
                      <span>
                        <span className="font-semibold">{r.category}</span>
                        <span className="text-slate-400"> · {r.location}</span>
                        <span className="block text-xs text-slate-500">{r.results} results · {timeAgo(r.createdAt)}</span>
                      </span>
                      <Badge tone={r.mode === "live" ? "green" : "amber"}>{r.mode.toUpperCase()}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
            <Card>
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-300">Recent Campaigns</h2>
              {!data?.recentCampaigns?.length ? (
                <p className="text-sm text-slate-500">No campaigns yet. Save leads, then create a campaign.</p>
              ) : (
                <ul className="space-y-2">
                  {data.recentCampaigns.map((c) => (
                    <li key={c.id} className="rounded-xl bg-white/[0.03] px-3 py-2.5 text-sm">
                      <Link href={`/campaigns/${c.id}`} className="font-semibold hover:text-cyan-300">{c.name}</Link>
                      <span className="block text-xs text-slate-500">
                        {c.leads} leads · {c.sent} sent · {c.pending} pending · {c.failed} failed
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
