import { cn } from "@/lib/utils";

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("rounded-2xl border border-white/10 bg-[#121b30]/90 p-5 shadow-sm", className)}>
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <Card className="p-4">
      <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 text-3xl font-bold tracking-tight text-white">{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
    </Card>
  );
}

export function Badge({
  tone = "slate",
  children,
}: {
  tone?: "slate" | "green" | "amber" | "blue" | "cyan" | "red";
  children: React.ReactNode;
}) {
  const tones: Record<string, string> = {
    slate: "bg-white/10 text-slate-200 ring-white/15",
    green: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
    amber: "bg-amber-500/15 text-amber-300 ring-amber-400/30",
    blue: "bg-blue-500/15 text-blue-300 ring-blue-400/30",
    cyan: "bg-cyan-500/15 text-cyan-300 ring-cyan-400/30",
    red: "bg-red-500/15 text-red-300 ring-red-400/30",
  };
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1", tones[tone])}>
      {children}
    </span>
  );
}

export function Empty({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-12 text-center">
      <p className="text-sm font-semibold text-slate-200">{title}</p>
      {hint && <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">{hint}</p>}
    </div>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-10 text-sm text-slate-300">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-cyan-400/30 border-t-cyan-300" />
      {label ?? "Loading…"}
    </div>
  );
}

export const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-900/30 transition hover:brightness-110 disabled:opacity-50 disabled:pointer-events-none";
export const btnSecondary =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-100 transition hover:bg-white/10 disabled:opacity-50 disabled:pointer-events-none";
export const inputCls =
  "w-full rounded-xl border border-white/10 bg-[#0b1322] px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20";
export const labelCls = "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400";
