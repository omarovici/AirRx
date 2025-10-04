export function roundToHour(date = new Date()) {
  const d = new Date(date);
  d.setUTCMinutes(0, 0, 0);
  return d;
}

export function shiftHour(base: Date, shift: -1 | 0 | 1) {
  const d = new Date(base);
  d.setUTCHours(d.getUTCHours() + shift);
  return d;
}

// Formats commonly used by tile servers (adjust to your provider)
export function toYYYYMMDD(base: Date) {
  const y = base.getUTCFullYear();
  const m = String(base.getUTCMonth() + 1).padStart(2, "0");
  const d = String(base.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function toYYYYMMDDTHH(base: Date) {
  const ymd = toYYYYMMDD(base);
  const h = String(base.getUTCHours()).padStart(2, "0");
  return `${ymd}T${h}:00:00Z`;
}
