"use client";

import { cn } from "@/lib/utils";

/** Lightweight CSS-only atmosphere: animated grid + glow orbs (no WebGL). */
export function AmbientBg({ variant = "page" }: { variant?: "page" | "hero" }) {
  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", variant === "hero" && "opacity-100")} aria-hidden>
      <div className="ambient-grid" />
      <div className="ambient-orb ambient-orb-a" />
      <div className="ambient-orb ambient-orb-b" />
      {variant === "hero" && <div className="ambient-orb ambient-orb-c" />}
    </div>
  );
}
