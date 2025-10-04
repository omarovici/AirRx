import type { LayerId, TimeIndex } from "./store";
import { roundToHour, shiftHour, toYYYYMMDD, toYYYYMMDDTHH } from "./time";

export type LayerKind = "raster" | "points";

export type LayerMeta = {
  id: LayerId;
  label: string;
  kind: LayerKind;

  // Time capabilities
  supportsPastHour: boolean; // can we reliably show -1h?
  supportsForecast: boolean; // if false, +1h uses "persistence" (reuse Now tiles)

  // Legend ramp (for raster layers). Points may omit this.
  ramp?: { from: string; to: string; min: string; max: string; unit?: string };

  // Build tile/data URL for a given time index (-1, 0, +1)
  urlForTime: (t: TimeIndex) => string;

  // Attribution and info link
  attribution?: string;
  infoLink?: string;
};

// Round to the current hour as our base "Now"
const baseNow = () => roundToHour(new Date());

export const layers: LayerMeta[] = [
  {
    id: "smoke",
    label: "Smoke (Aerosol)",
    kind: "raster",
    supportsPastHour: true,
    supportsForecast: true, // true forecast product available from smoke models
    ramp: { from: "#0ea5e9", to: "#ef4444", min: "Low", max: "High", unit: "" },
    urlForTime: (t) => {
      const dt = shiftHour(baseNow(), t);
      const dateStr = toYYYYMMDD(dt);
      const hourStr = toYYYYMMDDTHH(dt);
      // TODO: Replace with a real smoke/aerosol tile endpoint supporting time.
      // Example pattern (not real): https://<tiles>/smoke/{z}/{x}/{y}.png?time=YYYY-MM-DDTHH:00:00Z
      return `https://tiles.stadiamaps.com/tiler/colors/{z}/{x}/{y}.png?date=${dateStr}&time=${encodeURIComponent(
        hourStr,
      )}`;
    },
    attribution: "NOAA/NASA (placeholder)",
    infoLink: "https://www.ospo.noaa.gov/Products/land/hms.html",
  },
  {
    id: "no2",
    label: "NO2",
    kind: "raster",
    supportsPastHour: true,
    supportsForecast: false, // +1h will be "persistence" of Now tiles
    ramp: {
      from: "#10b981",
      to: "#a855f7",
      min: "Low",
      max: "High",
      unit: "mol/m²",
    },
    urlForTime: (t) => {
      // Persistence for +1h (t === 1 → reuse Now)
      const dt = shiftHour(baseNow(), t === 1 ? 0 : t);
      const hourStr = toYYYYMMDDTHH(dt);
      // TODO: Replace with a real NO2 tile endpoint (e.g., TEMPO/OMI proxy or WMTS).
      return `https://tile.openstreetmap.org/{z}/{x}/{y}.png?no2=${encodeURIComponent(hourStr)}`;
    },
    attribution: "TEMPO/OMI (placeholder)",
    infoLink: "https://tempo.si.edu/",
  },
  {
    id: "fires",
    label: "Active Fires",
    kind: "points",
    supportsPastHour: true,
    supportsForecast: false, // +1h uses persistence (latest detections)
    // Points layer: legend may show a simple dot key; no ramp needed
    urlForTime: (t) => {
      const dt = shiftHour(baseNow(), t === 1 ? 0 : t); // persistence for +1h
      const d = toYYYYMMDD(dt);
      // TODO: Replace with a real FIRMS GeoJSON endpoint filtered to last ~hour.
      // Example (not real): https://firms.example/lastHour.geojson?date=YYYY-MM-DD
      return `https://example.com/firms.geojson?date=${d}`;
    },
    attribution: "NASA FIRMS",
    infoLink: "https://firms.modaps.eosdis.nasa.gov/",
  },
];

// Legend subtitle based on time selection and layer capability
export function legendSubtitleFor(layer: LayerMeta, timeIndex: TimeIndex) {
  if (timeIndex === 1 && !layer.supportsForecast) return "Persistence +1h";
  if (timeIndex === 1 && layer.supportsForecast) return "Forecast +1h";
  if (timeIndex === -1) return "Past −1h";
  return "Now";
}

// Convenience getter
export function getLayer(id: LayerMeta["id"]) {
  return layers.find((l) => l.id === id)!;
}
