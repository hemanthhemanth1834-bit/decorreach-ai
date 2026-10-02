"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Search, Save, Mail, ExternalLink, Eye } from "lucide-react";
import { CATEGORIES, type NormalizedLead } from "@/lib/types";
import { Badge, Card, Empty, btnPrimary, btnSecondary, inputCls, labelCls } from "@/components/ui";
import { LeadDrawer } from "@/components/lead-drawer";
import { CardSkeleton } from "@/components/vfx/skeletons";
import { useToast } from "@/components/vfx/toasts";
import { cn } from "@/lib/utils";

interface SearchResult {
  ok: boolean;
  mode?: "live" | "demo";
  count?: number;
  leads?: NormalizedLead[];
  providers?: string[];
  enriched?: number;
  notice?: string;
  error?: string;
  hint?: string;
  location?: { displayName: string | null };
  category?: string;
}

const storeKey = "decorreach:lastSearch";

export default function FindPage() {
  const router = useRouter();
  const [product, setProduct] = useState("Home Decor");
  const [custom, setCustom] = useState("");
  const [location, setLocation] = useState("New York, NY");
  const [keyword, setKeyword] = useState("");
  const [buyerType, setBuyerType] = useState("Business");
  const [radius, setRadius] = useState(25);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(() => {
    try {
      const raw = sessionStorage.getItem(storeKey);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [drawer, setDrawer] = useState<NormalizedLead | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const toast = useToast();
  const reduce = useReducedMotion();

  // Filters
  const [q, setQ] = useState("");
  const [fCity, setFCity] = useState("");
  const [fHasEmail, setFHasEmail] = useState("all");
  const [fHasWeb, setFHasWeb] = useState("all");
  const [fMode, setFMode] = useState("all");
  const [sort, setSort] = useState("recent");

  const leads = useMemo(() => {
    let list = result?.leads ?? [];
    if (q) list = list.filter((l) => `${l.name} ${l.category} ${l.city ?? ""}`.toLowerCase().includes(q.toLowerCase()));
    if (fCity) list = list.filter((l) => (l.city ?? "").toLowerCase().includes(fCity.toLowerCase()));
    if (fHasEmail === "yes") list = list.filter((l) => l.email);
    if (fHasEmail === "no") list = list.filter((l) => !l.email);
    if (fHasWeb === "yes") list = list.filter((l) => l.website);
    if (fHasWeb === "no") list = list.filter((l) => !l.website);
    if (fMode !== "all") list = list.filter((l) => l.sourceType === fMode);
    const sorted = [...list];
    if (sort === "name") sorted.sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === "email") sorted.sort((a, b) => Number(b.emailAvailability) - Number(a.emailAvailability));
    else sorted.sort((a, b) => b.discoveredAt.localeCompare(a.discoveredAt));
    return sorted;
  }, [result, q, fCity, fHasEmail, fHasWeb, fMode, sort]);

  async function runSearch() {
    const category = product === "Other" || product === "__custom" ? custom.trim() || "Home Decor" : product;
    if (!location.trim()) return;
    setLoading(true);
    setSelected(new Set());
    try {
      const res = await fetch("/api/buyers/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product: category, location: location.trim(), keyword, buyerType, radius }),
      });
      const json = (await res.json()) as SearchResult;
      setResult(json.ok ? json : { ok: false, error: json.error ?? "Search failed." });
      if (json.ok) {
        try {
          sessionStorage.setItem(storeKey, JSON.stringify(json));
        } catch { /* ignore */ }
      }
    } catch {
      setResult({ ok: false, error: "Network error. Check your connection and try again." });
    } finally {
      setLoading(false);
    }
  }

  async function saveLead(lead: NormalizedLead, quiet = false) {
    setSaving(lead.id);
    try {
      const res = await fetch("/api/leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(lead) });
      if (!quiet) {
        if (res.ok) toast("success", `Saved ${lead.name}`);
        else toast("error", `Could not save ${lead.name}`);
      }
      return res.ok;
    } catch {
      if (!quiet) toast("error", `Could not save ${lead.name}`);
      return false;
    } finally {
      setSaving(null);
    }
  }

  async function saveSelected() {
    const targets = leads.filter((x) => selected.has(x.id));
    let ok = 0;
    for (const l of targets) {
      if (await saveLead(l, true)) ok += 1;
    }
    if (targets.length) toast("info", `${ok}/${targets.length} lead${targets.length === 1 ? "" : "s"} saved`);
  }

  function goEmail(lead: NormalizedLead) {
    try {
      sessionStorage.setItem("decorreach:studioLead", JSON.stringify(lead));
    } catch { /* ignore */ }
    router.push("/studio");
  }

  const toggle = (id: string) => {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Find Buyers</h1>
      <p className="mt-1 text-sm text-slate-400">Live API-powered U.S. buyer discovery. No CSV uploads needed.</p>

      <Card className="relative mt-5 overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" aria-hidden />
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className={labelCls}>Product / Category</label>
            <select value={product} onChange={(e) => setProduct(e.target.value)} className={inputCls}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
              <option value="__custom">Custom…</option>
            </select>
            {product === "__custom" && (
              <input value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="e.g. Ceramic Vases" className={`${inputCls} mt-2`} />
            )}
          </div>
          <div>
            <label className={labelCls}>U.S. Location</label>
            <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="New York, NY / 10001" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Keyword</label>
            <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Interior Design (optional)" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Buyer Type</label>
            <select value={buyerType} onChange={(e) => setBuyerType(e.target.value)} className={inputCls}>
              <option>Business</option>
              <option>All</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Radius (miles)</label>
            <input type="number" min={1} max={100} value={radius} onChange={(e) => setRadius(Number(e.target.value))} className={inputCls} />
          </div>
          <div className="flex items-end">
            <button onClick={runSearch} disabled={loading} className={cn(btnPrimary, "btn-shine w-full")}>
              <Search size={16} className={loading ? "animate-spin" : undefined} /> {loading ? "Searching U.S. buyers…" : "FIND BUYERS"}
            </button>
          </div>
        </div>
      </Card>

      {loading && (
        <div className="mt-4">
          <div className="mb-3 flex items-center gap-3 text-sm text-slate-300">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-cyan-400/30 border-t-cyan-300" aria-hidden />
            Searching U.S. buyers across live providers…
          </div>
          <CardSkeleton rows={4} />
        </div>
      )}

      {result && !result.ok && (
        <div className="mt-4 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">
          <p className="font-semibold">Live search unavailable</p>
          <p className="mt-1">{result.error}</p>
          {result.hint && <p className="mt-1 text-red-300/80">{result.hint}</p>}
          <p className="mt-2 text-xs text-red-300/70">
            Production returns live results only — no sample data is substituted. Please retry shortly.
          </p>
        </div>
      )}

      {result?.ok && (
        <>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Badge tone={result.mode === "live" ? "green" : "amber"}>
              {result.mode === "live" ? (
                <span className="inline-flex items-center gap-1.5">
                  <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" /> LIVE
                </span>
              ) : (
                "◆ DEMO MODE"
              )}
            </Badge>
            <span className="text-sm text-slate-300">
              <strong>{result.count}</strong> live buyers found · {result.category} · {location}
            </span>
            <span className="text-xs text-slate-500">Sources: {(result.providers ?? []).join(", ")}</span>
            {(result.enriched ?? 0) > 0 && (
              <span className="text-xs text-cyan-300/80">
                · {result.enriched} contact emails found on public business websites
              </span>
            )}
          </div>
          {result.notice && (
            <div className="mt-2 rounded-xl border border-amber-400/30 bg-amber-500/10 p-3 text-xs text-amber-200">
              {result.notice}
            </div>
          )}

          <Card className="mt-4">
            <div className="grid gap-3 md:grid-cols-6">
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name…" className={inputCls} />
              <input value={fCity} onChange={(e) => setFCity(e.target.value)} placeholder="City…" className={inputCls} />
              <select value={fHasEmail} onChange={(e) => setFHasEmail(e.target.value)} className={inputCls}>
                <option value="all">Email: All</option>
                <option value="yes">Has Email</option>
                <option value="no">No Email</option>
              </select>
              <select value={fHasWeb} onChange={(e) => setFHasWeb(e.target.value)} className={inputCls}>
                <option value="all">Website: All</option>
                <option value="yes">Has Website</option>
                <option value="no">No Website</option>
              </select>
              <select value={fMode} onChange={(e) => setFMode(e.target.value)} className={inputCls}>
                <option value="all">LIVE/DEMO: All</option>
                <option value="live">Live only</option>
                <option value="demo">Demo only</option>
              </select>
              <select value={sort} onChange={(e) => setSort(e.target.value)} className={inputCls}>
                <option value="recent">Sort: Recent</option>
                <option value="name">Sort: Name</option>
                <option value="email">Sort: Email availability</option>
              </select>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
              <button className={btnSecondary} onClick={() => setSelected(new Set(leads.map((l) => l.id)))}>Select All</button>
              <button className={btnSecondary} onClick={() => setSelected(new Set())}>Clear Selection</button>
              <span className="text-slate-400">{selected.size} selected</span>
              <span className="flex-1" />
              <button className={btnSecondary} disabled={!selected.size} onClick={saveSelected}>
                <Save size={14} /> Save Selected
              </button>
            </div>
          </Card>

          {!leads.length ? (
            <div className="mt-4">
              <Empty title="No matching buyers found." hint="Try another location or category." />
            </div>
          ) : (
            <motion.div layout className="mt-4 grid gap-3 lg:grid-cols-2">
              <AnimatePresence initial={false}>
              {leads.map((l) => (
                <motion.div
                  key={l.id}
                  layout={!reduce}
                  initial={reduce ? false : { opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? undefined : { opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                >
                <Card className="card-lift h-full p-4">
                  <div className="flex items-start gap-3">
                    <input type="checkbox" checked={selected.has(l.id)} onChange={() => toggle(l.id)} className="mt-1 h-4 w-4 accent-cyan-400" aria-label={`Select ${l.name}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-semibold">{l.name}</p>
                        <Badge tone={l.sourceType === "live" ? "green" : "amber"}>{l.sourceType.toUpperCase()}</Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-400">{l.category} · {[l.city, l.state].filter(Boolean).join(", ") || "USA"}</p>
                      <div className="mt-1 space-y-0.5 text-xs text-slate-400">
                        {l.website && <p className="truncate">🌐 {l.website}</p>}
                        <p>{l.email ? `✉️ ${l.email}` : "✉️ No public email"}</p>
                        {l.phone && <p>📞 {l.phone}</p>}
                        <p>Source: {l.source}</p>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        <button className={btnSecondary} onClick={() => setDrawer(l)}><Eye size={13} /> View</button>
                        <button className={btnSecondary} disabled={saving === l.id} onClick={() => saveLead(l)}>
                          <Save size={13} /> {saving === l.id ? "Saving…" : "Save"}
                        </button>
                        <button className={btnSecondary} onClick={() => goEmail(l)}><Mail size={13} /> Generate Email</button>
                        {l.website && (
                          <a className={btnSecondary} href={l.website} target="_blank" rel="noreferrer"><ExternalLink size={13} /> Site</a>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
                </motion.div>
              ))}
              </AnimatePresence>
            </motion.div>
          )}
        </>
      )}

      <LeadDrawer lead={drawer} onClose={() => setDrawer(null)} onSave={saveLead} onEmail={goEmail} />
    </div>
  );
}
