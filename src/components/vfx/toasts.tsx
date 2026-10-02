"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CheckCircle2, AlertTriangle, Info } from "lucide-react";

interface Toast {
  id: number;
  kind: "success" | "error" | "info";
  message: string;
}

const ToastCtx = createContext<(kind: Toast["kind"], message: string) => void>(() => {});

export const useToast = () => useContext(ToastCtx);

let nextId = 1;

/** Minimal animated toast layer; inline status messages remain the source of truth. */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const reduce = useReducedMotion();

  const push = useCallback((kind: Toast["kind"], message: string) => {
    const id = nextId++;
    setToasts((prev) => [...prev.slice(-2), { id, kind, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4200);
  }, []);

  const Icon = { success: CheckCircle2, error: AlertTriangle, info: Info };

  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[60] flex w-[min(92vw,360px)] flex-col gap-2" aria-live="polite">
        <AnimatePresence>
          {toasts.map((t) => {
            const I = Icon[t.kind];
            return (
              <motion.div
                key={t.id}
                initial={reduce ? { opacity: 0 } : { opacity: 0, x: 48, scale: 0.97 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 24 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className="pointer-events-auto flex items-start gap-2.5 rounded-xl border border-white/10 bg-[#141d33]/95 px-4 py-3 text-sm text-slate-100 shadow-2xl shadow-black/50 backdrop-blur"
              >
                <I
                  size={17}
                  className={
                    t.kind === "success" ? "mt-0.5 text-emerald-300" : t.kind === "error" ? "mt-0.5 text-red-300" : "mt-0.5 text-cyan-300"
                  }
                />
                <span>{t.message}</span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}
