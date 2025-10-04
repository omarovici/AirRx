"use client";

import { roundToHour } from "@/lib/time";

function fmtUTC(d: Date) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  const h = String(d.getUTCHours()).padStart(2, "0");
  return `${y}-${m}-${day} ${h}:00 UTC`;
}

export function DataBadges() {
  const last = roundToHour(new Date());
  const items = [
    { label: "Smoke", src: "NOAA model", tone: "teal" },
    { label: "NO2", src: "TEMPO context", tone: "indigo" },
    { label: "Fires", src: "NASA FIRMS", tone: "amber" },
  ];
  const toneCls: Record<string, string> = {
    teal: "border-teal-500/50 text-teal-400",
    indigo: "border-indigo-500/50 text-indigo-400",
    amber: "border-yellow-400/40 text-yellow-300",
  };

  return (
    <section className="mt-8">
      <div className="flex flex-wrap gap-2">
        {items.map((i) => (
          <span
            key={i.label}
            className={`text-xs px-2 py-1 rounded-full border ${toneCls[i.tone]} bg-[--color-bg-2]`}
            title={`${i.label} • ${i.src}`}
          >
            {i.label} • {i.src}
          </span>
        ))}
        <span className="text-xs px-2 py-1 rounded-full border border-[--color-stroke] text-[--color-text-med]">
          Last updated {fmtUTC(last)}
        </span>
      </div>
    </section>
  );
}
