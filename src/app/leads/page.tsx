"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { NormalizedLead } from "@/lib/types";
import { Badge, Card, Empty, Spinner, btnSecondary, inputCls } from "@/components/ui";
import { LeadDrawer } from "@/components/lead-drawer";
import { Mail, Trash2 } from "lucide-react";

export default function LeadsPage() {
  const router = useRouter();
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
    await fetch(`/api/leads?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    setLeads((prev) => prev.filter((l) => l.id !== id));
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
        <Spinner label="Loading leads…" />
      ) : !filtered.length ? (
        <div className="mt-4">
          <Empty title="No saved leads yet." hint="Go to Find Buyers, run a search, and save the businesses you want to reach." />
        </div>
      ) : (
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {filtered.map((l) => (
            <Card key={l.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <button className="text-left font-semibold hover:text-cyan-300" onClick={() => setDrawer(l)}>{l.name}</button>
                <Badge tone={l.sourceType === "live" ? "green" : "amber"}>{l.sourceType.toUpperCase()}</Badge>
              </div>
              <p className="text-xs text-slate-400">{l.category} · {[l.city, l.state].filter(Boolean).join(", ")}</p>
              <p className="mt-1 text-xs text-slate-500">{l.email ?? "No public email"} {l.website ? `· ${l.website}` : ""}</p>
              <div className="mt-3 flex gap-1.5">
                <button className={btnSecondary} onClick={() => goEmail(l)}><Mail size={13} /> Email</button>
                <button className={btnSecondary} onClick={() => setDrawer(l)}>View</button>
                <button className={btnSecondary} onClick={() => remove(l.id)}><Trash2 size={13} /> Remove</button>
              </div>
            </Card>
          ))}
        </div>
      )}
      <LeadDrawer lead={drawer} onClose={() => setDrawer(null)} onSave={() => {}} onEmail={goEmail} />
    </div>
  );
}
