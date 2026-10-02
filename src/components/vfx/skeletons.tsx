"use client";

import { cn } from "@/lib/utils";

function Bar({ className }: { className?: string }) {
  return <div className={cn("skeleton-shimmer rounded-lg bg-white/[0.06]", className)} aria-hidden />;
}

/** Accessible loading placeholders (role=status) that mirror real layouts. */
export function StatSkeleton() {
  return (
    <div role="status" aria-label="Loading statistics" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-white/10 bg-[#121b30]/90 p-4">
          <Bar className="h-3 w-20" />
          <Bar className="mt-2 h-8 w-16" />
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Loading results" className="grid gap-3 lg:grid-cols-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-white/10 bg-[#121b30]/90 p-4">
          <Bar className="h-5 w-2/3" />
          <Bar className="mt-2 h-3 w-1/3" />
          <Bar className="mt-2 h-3 w-1/2" />
          <div className="mt-3 flex gap-2">
            <Bar className="h-8 w-20" />
            <Bar className="h-8 w-20" />
            <Bar className="h-8 w-28" />
          </div>
        </div>
      ))}
    </div>
  );
}
