"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { LayoutDashboard, Search, Users, Megaphone, MailPen, Settings, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { ToastProvider } from "./vfx/toasts";
import { AmbientBg } from "./vfx/ambient-bg";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/find", label: "Find Buyers", icon: Search },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/studio", label: "Email Studio", icon: MailPen },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const reduce = useReducedMotion();
  return (
    <ToastProvider>
    <div className="relative min-h-screen bg-[#0b0f1a] text-slate-100">
      <AmbientBg />
      <div className="relative mx-auto flex min-h-screen max-w-[1400px]">
        <aside className="hidden w-64 shrink-0 flex-col border-r border-white/10 bg-[#0f1626]/80 p-5 md:flex">
          <Link href="/" className="mb-8 flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 font-bold text-white">
              <Sparkles size={20} />
            </span>
            <span>
              <span className="block text-[17px] font-bold tracking-tight">DecorReach AI</span>
              <span className="block text-[11px] uppercase tracking-[0.18em] text-cyan-300/80">
                Discover · Qualify · Reach
              </span>
            </span>
          </Link>
          <nav className="flex flex-col gap-1" aria-label="Primary">
            {NAV.map((n) => {
              const active = n.href === "/" ? path === "/" : path.startsWith(n.href);
              const Icon = n.icon;
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    active ? "text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"
                  )}
                >
                  {active && (
                    reduce ? (
                      <span className="absolute inset-0 rounded-lg bg-blue-500/15 ring-1 ring-blue-400/30" aria-hidden />
                    ) : (
                      <motion.span
                        layoutId="nav-active-pill"
                        className="absolute inset-0 rounded-lg bg-blue-500/15 ring-1 ring-blue-400/30"
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        aria-hidden
                      />
                    )
                  )}
                  <Icon size={17} className="relative" />
                  <span className="relative">{n.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto rounded-xl border border-white/10 bg-white/[0.03] p-4 text-xs leading-relaxed text-slate-400">
            <p className="mb-1 font-semibold text-slate-200">API-powered discovery</p>
            Live data via OpenStreetMap. Production is live-only — no sample data, ever.
          </div>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0b0f1a]/90 backdrop-blur">
            <div className="flex items-center gap-2 px-4 py-3 md:hidden">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400">
                <Sparkles size={16} />
              </span>
              <span className="font-bold">DecorReach AI</span>
            </div>
            <nav className="flex gap-1 overflow-x-auto px-4 pb-3 md:hidden">
              {NAV.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className={cn(
                    "whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium",
                    (n.href === "/" ? path === "/" : path.startsWith(n.href))
                      ? "bg-blue-500/20 text-white"
                      : "text-slate-400"
                  )}
                >
                  {n.label}
                </Link>
              ))}
            </nav>
          </header>
          <main className="min-w-0 flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
          <footer className="border-t border-white/10 px-6 py-4 text-center text-xs text-slate-500">
            Use only legitimate publicly available business contact information and comply with applicable
            email, privacy, anti-spam, and provider requirements.
          </footer>
        </div>
      </div>
    </div>
    </ToastProvider>
  );
}
