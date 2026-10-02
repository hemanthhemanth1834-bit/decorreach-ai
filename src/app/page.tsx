"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion, useReducedMotion } from "framer-motion";
import { Search, ArrowRight, Activity, MailPen } from "lucide-react";
import { Card, Badge, Empty, btnPrimary } from "@/components/ui";
import { Reveal, CountUp } from "@/components/vfx/reveal";
import { StatSkeleton } from "@/components/vfx/skeletons";
import { timeAgo } from "@/lib/utils";
import { cn } from "@/lib/utils";

const HeroScene = dynamic(() => import("@/components/vfx/hero-scene"), {
  ssr: false,
  loading: () => <div className="hero-scene-fallback" aria-hidden />,
});

interface DashboardData {
  stats: Record<string, number>;
  recentSearches: Array<{ id: string; category: string; location: string; results: number; mode: string; providers: string[]; createdAt: string }>;
  recentCampaigns: Array<{ id: string; name: string; leads: number; sent: number; pending: number; failed: number; status: string; createdAt: string }>;
}

const STATS: Array<{ key: string; label: string; sub: string }> = [
  { key: "totalSearches", label: "Total Searches", sub: "buyer discovery runs" },
  { key: "buyersDiscovered", label: "Buyers Discovered", sub: "live businesses found" },
  { key: "savedLeads", label: "Saved Leads", sub: "qualified for outreach" },
  { key: "leadsWithEmail", label: "Leads With Email", sub: "public addresses only" },
  { key: "emailsGenerated", label: "Emails Generated", sub: "AI + template" },
  { key: "emailsSent", label: "Emails Sent", sub: "provider confirmed" },
  { key: "failedEmails", label: "Failed Emails", sub: "truthfully reported" },
];

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [health, setHealth] = useState<Record<string, string> | null>(null);
  const [loading, setLoading] = useState(true);
  const reduce = useReducedMotion();

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
    fetch("/api/provider-health")
      .then((r) => r.json())
      .then((j) => setHealth(j.services ?? null))
      .catch(() => {});
  }, []);

  const s = data?.stats;

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0d1425]/90">
        <HeroScene />
        <div className="relative px-6 py-10 md:px-10 md:py-14">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-2xl"
          >
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-200">
              <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Live API-powered discovery
            </p>
            <h1 className="text-3xl font-extrabold leading-tight tracking-tight md:text-5xl">
              Discover U.S. Buyers{" "}
              <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-400 bg-clip-text text-transparent">
                Faster
              </span>
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-300 md:text-base">
              Find relevant home-decor businesses through live API-powered discovery,
              qualify your leads, and reach them with personalized outreach.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/find" className={cn(btnPrimary, "btn-shine")}>
                <Search size={16} /> Find Buyers <ArrowRight size={15} />
              </Link>
              <Link
                href="/studio"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-medium text-slate-100 transition hover:bg-white/10"
              >
                <MailPen size={15} /> Open Email Studio
              </Link>
            </div>
            {health && (
              <div className="mt-6 flex flex-wrap items-center gap-2 text-[11px]" aria-label="Provider status">
                <Activity size={13} className="text-slate-500" />
                {[
                  ["Buyers", health.buyers],
                  ["Geocoding", health.geocoding],
                  ["AI", health.ai],
                  ["Email", health.email],
                ].map(([k, v]) => (
                  <span
                    key={k}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/30 px-2.5 py-1 text-slate-300"
                  >
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        String(v).includes("Connect") ? "bg-emerald-400" : String(v).includes("Fallback") ? "bg-amber-300" : "bg-slate-500"
                      )}
                    />
                    {k}: {v}
                  </span>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="mt-6" aria-label="Statistics">
        {loading ? (
          <StatSkeleton />
        ) : !s ? (
          <Empty title="Dashboard unavailable" hint="Could not load statistics. The API may be starting — try refreshing." />
        ) : (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {STATS.map((st, i) => (
              <Reveal key={st.key} delay={Math.min(i * 0.05, 0.3)}>
                <div className="card-lift h-full rounded-2xl border border-white/10 bg-[#121b30]/90 p-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{st.label}</p>
                  <p className="mt-1 text-3xl font-bold tracking-tight text-white">
                    <CountUp value={s[st.key] ?? 0} />
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{st.sub}</p>
                </div>
              </Reveal>
            ))}
            <Reveal delay={0.3}>
              <Card className="card-lift flex h-full flex-col justify-center p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Quick action</p>
                <Link href="/find" className="mt-2 text-sm font-semibold text-cyan-300 hover:underline">
                  New buyer search →
                </Link>
                <Link href="/studio" className="mt-1 text-sm text-slate-400 hover:text-white">
                  Open Email Studio →
                </Link>
              </Card>
            </Reveal>
          </div>
        )}
      </section>

      {/* Recent activity */}
      {!loading && s && (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <Reveal>
            <Card className="h-full">
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-300">Recent Searches</h2>
              {!data?.recentSearches?.length ? (
                <p className="text-sm text-slate-500">No searches yet. Run your first search to see history here.</p>
              ) : (
                <ul className="space-y-2">
                  {data.recentSearches.map((r) => (
                    <li key={r.id} className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.03] px-3 py-2.5 text-sm transition hover:bg-white/[0.06]">
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
          </Reveal>
          <Reveal delay={0.08}>
            <Card className="h-full">
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-300">Recent Campaigns</h2>
              {!data?.recentCampaigns?.length ? (
                <p className="text-sm text-slate-500">No campaigns yet. Save leads, then create a campaign.</p>
              ) : (
                <ul className="space-y-2">
                  {data.recentCampaigns.map((c) => (
                    <li key={c.id} className="rounded-xl bg-white/[0.03] px-3 py-2.5 text-sm transition hover:bg-white/[0.06]">
                      <Link href={`/campaigns/${c.id}`} className="font-semibold hover:text-cyan-300">{c.name}</Link>
                      <span className="block text-xs text-slate-500">
                        {c.leads} leads · {c.sent} sent · {c.pending} pending · {c.failed} failed
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </Reveal>
        </div>
      )}
    </div>
  );
}
