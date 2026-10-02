"use client";

import { useState } from "react";
import type { NormalizedLead } from "@/lib/types";
import { Badge, btnSecondary } from "./ui";
import { ExternalLink, MapPin, Globe, Phone, Mail, Save } from "lucide-react";

export function LeadDrawer({
  lead,
  onClose,
  onSave,
  onEmail,
}: {
  lead: NormalizedLead | null;
  onClose: () => void;
  onSave?: (lead: NormalizedLead) => void;
  onEmail: (lead: NormalizedLead) => void;
}) {
  const [saved, setSaved] = useState(false);
  if (!lead) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-white/10 bg-[#0f1626] p-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">{lead.name}</h2>
            <p className="mt-1 text-sm text-slate-400">{lead.category}</p>
          </div>
          <button onClick={onClose} className="rounded-lg border border-white/10 px-2.5 py-1 text-slate-300 hover:bg-white/10">
            ✕
          </button>
        </div>
        <div className="mb-4 flex flex-wrap gap-2">
          <Badge tone={lead.sourceType === "live" ? "green" : "amber"}>
            {lead.sourceType === "live" ? "● LIVE" : "◆ DEMO"}
          </Badge>
          <Badge tone="blue">{lead.source}</Badge>
          {lead.email ? <Badge tone="cyan">Has email</Badge> : <Badge> No email</Badge>}
        </div>
        <dl className="space-y-3 text-sm">
          <Row icon={<MapPin size={15} />} label="Address" value={[lead.address, lead.city, lead.state, lead.postalCode].filter(Boolean).join(", ") || "—"} />
          <Row icon={<Globe size={15} />} label="Website" value={lead.website ?? "—"} link={lead.website} />
          <Row icon={<Mail size={15} />} label="Email" value={lead.email ?? "Not publicly listed"} />
          <Row icon={<Phone size={15} />} label="Phone" value={lead.phone ?? "—"} />
          <Row label="Coordinates" value={lead.latitude != null ? `${lead.latitude.toFixed(4)}, ${lead.longitude?.toFixed(4)}` : "—"} />
          <Row label="Source URL" value={lead.sourceUrl ?? "—"} link={lead.sourceUrl} />
          <Row label="Discovered" value={new Date(lead.discoveredAt).toLocaleString()} />
        </dl>
        {lead.latitude != null && lead.longitude != null && (
          <a
            className="mt-4 block overflow-hidden rounded-xl border border-white/10"
            target="_blank"
            rel="noreferrer"
            href={`https://www.openstreetmap.org/?mlat=${lead.latitude}&mlon=${lead.longitude}#map=15/${lead.latitude}/${lead.longitude}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt="Map preview (OpenStreetMap)"
              src={`https://staticmap.openstreetmap.de/staticmap.php?center=${lead.latitude},${lead.longitude}&zoom=14&size=600x220&markers=${lead.latitude},${lead.longitude},red`}
              className="h-44 w-full object-cover"
              loading="lazy"
            />
            <span className="block bg-white/5 px-3 py-2 text-xs text-cyan-300">Open in OpenStreetMap →</span>
          </a>
        )}
        <div className="mt-6 grid grid-cols-2 gap-2">
          {onSave && (
            <button
              className={btnSecondary}
              onClick={() => {
                onSave(lead);
                setSaved(true);
              }}
            >
              <Save size={15} /> {saved ? "Saved ✓" : "Save Lead"}
            </button>
          )}
          <button
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-2.5 text-sm font-semibold text-white hover:brightness-110"
            onClick={() => onEmail(lead)}
          >
            <Mail size={15} /> Generate Email
          </button>
          {lead.website && (
            <a href={lead.website} target="_blank" rel="noreferrer" className={`${btnSecondary} col-span-2`}>
              <ExternalLink size={15} /> Open Website
            </a>
          )}
        </div>
        <p className="mt-4 text-[11px] leading-relaxed text-slate-500">
          Contact details shown only when publicly listed by the business (OpenStreetMap). Emails are
          never invented.
        </p>
      </div>
    </div>
  );
}

function Row({ label, value, link, icon }: { label: string; value: string; link?: string | null; icon?: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-white/[0.03] p-3">
      <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-slate-500">
        {icon} {label}
      </p>
      {link ? (
        <a href={link} target="_blank" rel="noreferrer" className="mt-0.5 block break-all text-sm text-cyan-300 hover:underline">
          {value}
        </a>
      ) : (
        <p className="mt-0.5 text-sm text-slate-100">{value}</p>
      )}
    </div>
  );
}
