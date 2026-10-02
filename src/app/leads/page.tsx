"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useReducedMotion } from "framer-motion";
import type { NormalizedLead } from "@/lib/types";
import { Badge, Card, Empty, btnSecondary, inputCls } from "@/components/ui";
import { LeadDrawer } from "@/components/lead-drawer";
import { CardSkeleton } from "@/components/vfx/skeletons";
import { Reveal } from "@/components/vfx/reveal";
import { useToast } from "@/components/vfx/toasts";
import { Mail, Trash2 } from "lucide-react";

export default function LeadsPage() {
  const router = useRouter();
  const toast = useToast();
  const reduce = useReducedMotion();
  const [leads, setLeads] = useState<NormalizedLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [fMode, setFMode] = useState("all");
  const [drawer, setDrawer] = useState<NormalizedLead | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/leads");
      const json = await res.json();
      setLeads(json.leads ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  const filtered = useMemo(() => {
    let list = leads;
    if (q) list = list.filter((l) => `${l.name} ${l.category} ${l.city ?? ""}`.toLowerCase().includes(q.toLowerCase()));
    if (fMode !== "all") list = list.filter((l) => l.sourceType === fMode);
    return list;
  }, [leads, q, fMode]);

  async function remove(id: string) {
    const prev = leads;
    setLeads((p) => p.filter((l) => l.id !== id));
    try {
      const res = await fetch(`/api/leads?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (res.ok) toast("info", "Lead removed");
      else {
        setLeads(prev);
        toast("error", "Could not remove lead");
      }
    } catch {
      setLeads(prev);
      toast("error", "Could not remove lead");
    }
  }

  function goEmail(lead: NormalizedLead) {
    try {
      sessionStorage.setItem("decorreach:studioLead", JSON.stringify(lead));
    } catch { /* ignore */ }
    router.push("/studio");
  }

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Saved Leads</h1>
      <p className="mt-1 text-sm text-slate-400">{leads.length} leads saved locally{process.env.NEXT_PUBLIC_SUPABASE_URL ? " + Supabase" : ""}.</p>
      <Card className="mt-4">
        <div className="flex flex-wrap gap-2">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search saved leads…" className={`${inputCls} max-w-xs`} />
          <select value={fMode} onChange={(e) => setFMode(e.target.value)} className={`${inputCls} max-w-[200px]`}>
            <option value="all">All sources</option>
            <option value="live">Live only</option>
            <option value="demo">Demo only</option>
          </select>
        </div>
      </Card>
      {loading ? (
        <div className="mt-4">
          <CardSkeleton rows={4} />
        </div>
      ) : !filtered.length ? (
        <div className="mt-4">
          <Empty title="No saved leads yet." hint="Go to Find Buyers, run a search, and save the businesses you want to reach." />
        </div>
      ) : (
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {filtered.map((l, i) => (
            <Reveal key={l.id} delay={reduce ? 0 : Math.min(i * 0.04, 0.25)}>
            <Card className="card-lift h-full p-4">
              <div className="flex items-start justify-between gap-2">
                <button className="rounded text-left font-semibold transition hover:text-cyan-300" onClick={() => setDrawer(l)}>{l.name}</button>
                <Badge tone={l.sourceType === "live" ? "green" : "amber"}>
                  {l.sourceType === "live" ? (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" /> LIVE
                    </span>
                  ) : (
                    "DEMO"
                  )}
                </Badge>
              </div>
              <p className="text-xs text-slate-400">{l.category} · {[l.city, l.state].filter(Boolean).join(", ")}</p>
              <p className="mt-1 text-xs text-slate-500">{l.email ?? "No public email"} {l.website ? `· ${l.website}` : ""}</p>
              <p className="mt-1 text-[11px] text-slate-600">Source: {l.source}</p>
              <div className="mt-3 flex gap-1.5">
                <button className={btnSecondary} onClick={() => goEmail(l)}><Mail size={13} /> Email</button>
                <button className={btnSecondary} onClick={() => setDrawer(l)}>View</button>
                <button className={btnSecondary} onClick={() => remove(l.id)}><Trash2 size={13} /> Remove</button>
              </div>
            </Card>
            </Reveal>
          ))}
        </div>
      )}
      <LeadDrawer lead={drawer} onClose={() => setDrawer(null)} onEmail={goEmail} />
    </div>
  );
}
