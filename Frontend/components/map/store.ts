"use client";

/**
 * Ultra-simple map data + state module.
 * - No network fetching
 * - No caching logic
 * - Pure static JSON imports
 * - Thin zustand store only for interactive UI state (time index, playback, layer toggles, pollutant choice)
 *
 * Existing components expect the following exports:
 *  - useMapStore
 *  - useEnsureMockDataLoaded (now a no-op)
 *  - useCurrentMapData
 *  - useMapPlaybackControls
 *  - usePlaybackDriver
 *  - useLayerVisibility
 *  - usePollutantSelection
 *  - sampleLegendColor
 */

import { create } from "zustand";
import { useEffect, useMemo } from "react";

// Static JSON imports (resolved at build time)
import tempoRaw from "@/public/mock/map/tempo.json";
import predictionsRaw from "@/public/mock/map/predictions.json";
import stationsRaw from "@/public/mock/map/stations.json";
import meteoRaw from "@/public/mock/map/meteo.json";

// ---- Types kept intentionally tiny (only what UI touches) ----
export interface LegendStop {
  value: number;
  color: string;
}
export interface LegendDefinition {
  unit?: string;
  min?: number;
  max?: number;
  gradient?: { stops: LegendStop[] };
  aqi_like_bands?: { range: [number, number]; color: string; label: string }[];
}

export interface ValueCellSlice {
  lat: number;
  lon: number;
  value?: number;
  uncertainty?: [number, number];
  confidence?: number;
}

interface MapStoreState {
  pollutant: string | null;
  timeIndex: string[];
  currentTimeIdx: number;
  playing: boolean;
  playbackSpeed: number;
  layers: {
    stations: boolean;
    tempo: boolean;
    predictions: boolean;
    meteorology: boolean;
    wind: boolean;
    validation: boolean;
    uncertainty: boolean;
  };
  setPollutant: (p: string) => void;
  setTimeIdx: (i: number) => void;
  toggleLayer: (k: keyof MapStoreState["layers"]) => void;
  setPlaying: (b: boolean) => void;
  setPlaybackSpeed: (fps: number) => void;
}

// ---- Static dataset references (typed as any for simplicity) ----
const TEMPO: any = tempoRaw;
const PRED: any = predictionsRaw;
const STATIONS: any = stationsRaw;
const METEO: any = meteoRaw;

// ---- Prepare unified timeline (sorted unique) ----
const unifiedTimeIndex: string[] = Array.from(
  new Set([
    ...(Array.isArray(TEMPO?.timeIndex) ? TEMPO.timeIndex : []),
    ...(Array.isArray(PRED?.timeIndex) ? PRED.timeIndex : []),
    ...(Array.isArray(METEO?.timeIndex) ? METEO.timeIndex : []),
  ]),
).sort();

// ---- Derive default pollutant once ----
function pickDefaultPollutant(): string | null {
  return (
    PRED?.ui_hints?.default_pollutant ||
    TEMPO?.uiHints?.default_pollutant ||
    firstPollutantFromCells() ||
    null
  );
}
function firstPollutantFromCells(): string | undefined {
  const cellCandidates = [
    PRED?.grid?.cells?.[0],
    TEMPO?.grid?.cells?.[0],
    STATIONS?.stations?.[0]?.latest?.values,
  ];
  for (const c of cellCandidates) {
    if (!c) continue;
    const keys = Object.keys(c).filter(
      (k) => /(_ppb|_ugm3)$/.test(k) || /pm25_ugm3/.test(k),
    );
    if (keys.length) return keys[0];
  }
  return undefined;
}
const defaultPollutant = pickDefaultPollutant();

// ---- Zustand store (only UI state) ----
export const useMapStore = create<MapStoreState>((set, get) => ({
  pollutant: defaultPollutant,
  timeIndex: unifiedTimeIndex,
  currentTimeIdx: unifiedTimeIndex.length ? unifiedTimeIndex.length - 1 : 0, // start at latest
  playing: false,
  playbackSpeed: 1,
  layers: {
    stations: true,
    tempo: true,
    predictions: true,
    meteorology: false,
    wind: false,
    validation: false,
    uncertainty: true,
  },

  setPollutant: (p) => set({ pollutant: p }),
  setTimeIdx: (i) =>
    set((s) => ({
      currentTimeIdx: Math.max(0, Math.min(s.timeIndex.length - 1, i)),
    })),
  toggleLayer: (k) =>
    set((s) => ({ layers: { ...s.layers, [k]: !s.layers[k] } })),
  setPlaying: (b) => set({ playing: b }),
  setPlaybackSpeed: (fps) =>
    set({ playbackSpeed: Math.max(0.25, Math.min(8, fps)) }),
}));

// ---- No-op (kept for API compatibility) ----
export function useEnsureMockDataLoaded() {
  // Intentionally empty: data already statically imported.
}

// ---- Helper: map unified idx to dataset-specific idx ----
function localIdx(dsTime: string[] | undefined, ts: string | undefined) {
  if (!dsTime || !ts) return null;
  const i = dsTime.indexOf(ts);
  return i === -1 ? null : i;
}

// ---- Slice helper ----
function sliceDataset(
  dataset: any,
  pollutant: string | null,
  unifiedIdx: number,
  unified: string[],
): ValueCellSlice[] | undefined {
  if (!pollutant) return;
  const ts = unified[unifiedIdx];
  if (!ts) return;
  const dsTime: string[] | undefined = dataset?.timeIndex;
  const idx = localIdx(dsTime, ts);
  if (idx == null) return;
  const cells: any[] | undefined = dataset?.grid?.cells;
  if (!cells?.length) return;
  return cells.map((c) => {
    const arr = Array.isArray(c[pollutant]) ? (c[pollutant] as number[]) : [];
    const value = arr[idx];
    const lowKey = pollutant.replace(/(_ppb|_ugm3)$/, "_unc_low");
    const highKey = pollutant.replace(/(_ppb|_ugm3)$/, "_unc_high");
    const lowArr = Array.isArray(c[lowKey]) ? (c[lowKey] as number[]) : [];
    const highArr = Array.isArray(c[highKey]) ? (c[highKey] as number[]) : [];
    const unc =
      lowArr[idx] != null && highArr[idx] != null
        ? ([lowArr[idx], highArr[idx]] as [number, number])
        : undefined;
    const confidence =
      typeof c.model_confidence === "number" ? c.model_confidence : undefined;
    return {
      lat: c.lat,
      lon: c.lon,
      value,
      uncertainty: unc,
      confidence,
    };
  });
}

// ---- Legend gradient CSS ----
function buildGradientCSS(legend?: LegendDefinition | null) {
  const stops = legend?.gradient?.stops;
  if (!stops || !stops.length) return null;
  const min = legend.min ?? stops[0].value;
  const max = legend.max ?? stops[stops.length - 1].value;
  const span = max - min || 1;
  return (
    "linear-gradient(to right," +
    stops
      .map((s) => {
        const pct = ((s.value - min) / span) * 100;
        return `${s.color} ${pct.toFixed(2)}%`;
      })
      .join(",") +
    ")"
  );
}

// ---- Public composite hook ----
export interface UseCurrentMapDataResult {
  loading: boolean; // always false (no async)
  error?: string; // never set (kept for compatibility)
  pollutant: string | null;
  timeIndex: string[];
  currentTime: string | null;
  currentTimeIdx: number;
  tempoSlice?: ValueCellSlice[];
  predictionSlice?: ValueCellSlice[];
  stationsLatest?: any[];
  legend?: LegendDefinition;
  legendGradientCSS?: string | null;
  hasUncertainty: boolean;
  hasConfidence: boolean;
  raw: {
    tempo: any;
    predictions: any;
    stations: any;
    meteo: any;
  };
}

export function useCurrentMapData(): UseCurrentMapDataResult {
  const { pollutant, timeIndex, currentTimeIdx } = useMapStore();

  const currentTime = timeIndex[currentTimeIdx] || null;

  const legend: LegendDefinition | undefined =
    (pollutant && (PRED?.legend?.[pollutant] || TEMPO?.legend?.[pollutant])) ||
    undefined;
  const legendGradientCSS = useMemo(() => buildGradientCSS(legend), [legend]);

  const tempoSlice = useMemo(
    () => sliceDataset(TEMPO, pollutant, currentTimeIdx, timeIndex),
    [pollutant, currentTimeIdx, timeIndex],
  );
  const predictionSlice = useMemo(
    () => sliceDataset(PRED, pollutant, currentTimeIdx, timeIndex),
    [pollutant, currentTimeIdx, timeIndex],
  );

  const hasUncertainty = !!predictionSlice?.some(
    (c) => c.uncertainty && c.uncertainty[0] != null,
  );
  const hasConfidence = !!predictionSlice?.some(
    (c) => typeof c.confidence === "number",
  );

  return {
    loading: false,
    error: undefined,
    pollutant,
    timeIndex,
    currentTime,
    currentTimeIdx,
    tempoSlice,
    predictionSlice,
    stationsLatest: STATIONS?.stations,
    legend,
    legendGradientCSS,
    hasUncertainty,
    hasConfidence,
    raw: {
      tempo: TEMPO,
      predictions: PRED,
      stations: STATIONS,
      meteo: METEO,
    },
  };
}

// ---- Playback related hooks ----
interface PlaybackSlice {
  playing: boolean;
  playbackSpeed: number;
  currentTimeIdx: number;
  timeIndex: string[];
  setTimeIdx: (i: number) => void;
  setPlaying: (b: boolean) => void;
  setPlaybackSpeed: (v: number) => void;
}

export function useMapPlaybackControls(): PlaybackSlice {
  const playing = useMapStore((s) => s.playing);
  const playbackSpeed = useMapStore((s) => s.playbackSpeed);
  const currentTimeIdx = useMapStore((s) => s.currentTimeIdx);
  const timeIndex = useMapStore((s) => s.timeIndex);
  const setTimeIdx = useMapStore((s) => s.setTimeIdx);
  const setPlaying = useMapStore((s) => s.setPlaying);
  const setPlaybackSpeed = useMapStore((s) => s.setPlaybackSpeed);

  // Return stable object via useMemo
  return useMemo(
    () => ({
      playing,
      playbackSpeed,
      currentTimeIdx,
      timeIndex,
      setTimeIdx,
      setPlaying,
      setPlaybackSpeed,
    }),
    [
      playing,
      playbackSpeed,
      currentTimeIdx,
      timeIndex,
      setTimeIdx,
      setPlaying,
      setPlaybackSpeed,
    ],
  );
}

export function usePlaybackDriver(autoplay = false) {
  const {
    playing,
    setPlaying,
    timeIndex,
    currentTimeIdx,
    setTimeIdx,
    playbackSpeed,
  } = useMapPlaybackControls();

  useEffect(() => {
    if (autoplay && !playing) setPlaying(true);
  }, [autoplay, playing, setPlaying]);

  useEffect(() => {
    if (!playing || !timeIndex.length) return;
    const id = setInterval(() => {
      setTimeIdx((currentTimeIdx + 1) % timeIndex.length);
    }, 1000 / playbackSpeed);
    return () => clearInterval(id);
  }, [playing, timeIndex, currentTimeIdx, setTimeIdx, playbackSpeed]);
}

// ---- Layer visibility ----
export function useLayerVisibility() {
  const layers = useMapStore((s) => s.layers);
  const toggleLayer = useMapStore((s) => s.toggleLayer);
  return { layers, toggleLayer };
}

// ---- Pollutant selection ----
export function usePollutantSelection() {
  const pollutant = useMapStore((s) => s.pollutant);
  const setPollutant = useMapStore((s) => s.setPollutant);

  const pollutants = useMemo(() => {
    const set = new Set<string>();
    const predCell = PRED?.grid?.cells?.[0];
    const tempoCell = TEMPO?.grid?.cells?.[0];
    for (const cell of [predCell, tempoCell]) {
      if (!cell) continue;
      Object.keys(cell)
        .filter((k) => /(_ppb|_ugm3)$/.test(k))
        .forEach((k) => {
          set.add(k);
        });
    }
    return Array.from(set).sort();
  }, []);

  return { pollutant, setPollutant, pollutants };
}

// ---- Legend color sampling ----
function parseHex(hex: string): [number, number, number] | null {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  return m
    ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)]
    : null;
}

export function sampleLegendColor(
  legend?: LegendDefinition,
  value?: number,
): string | null {
  // Basic guards
  if (!legend?.gradient?.stops?.length || value == null) {
    return legend?.gradient?.stops?.[0]?.color || null;
  }

  const stops = legend.gradient.stops.slice().sort((a, b) => a.value - b.value);

  // Clamp checks
  if (value <= stops[0].value) return stops[0].color;
  if (value >= stops[stops.length - 1].value)
    return stops[stops.length - 1].color;

  // DISTINCT MODE:
  // To make marker colors visually distinct (instead of smooth blending that
  // ends up looking very similar for nearby values), we snap to the nearest
  // stop when the total number of stops is modest (<= 12). This yields a
  // categorical style ramp that improves contrast between adjacent stations.
  if (stops.length <= 12) {
    // Find the bounding stops
    for (let i = 0; i < stops.length - 1; i++) {
      const a = stops[i];
      const b = stops[i + 1];
      if (value >= a.value && value <= b.value) {
        // Decide which stop is closer
        const mid = (a.value + b.value) / 2;
        return value < mid ? a.color : b.color;
      }
    }
    return stops[0].color; // Fallback (shouldn't normally hit)
  }

  // CONTINUOUS MODE (many stops): interpolate for a smooth gradient
  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i];
    const b = stops[i + 1];
    if (value >= a.value && value <= b.value) {
      const span = b.value - a.value || 1;
      const t = (value - a.value) / span;

      const ca = parseHex(a.color);
      const cb = parseHex(b.color);
      if (!ca || !cb) return a.color;

      const mix = (k: number) => Math.round(ca[k] + (cb[k] - ca[k]) * t);
      const r = mix(0);
      const g = mix(1);
      const bCh = mix(2);

      // Slight perceptual boost: increase saturation a bit for mid‑range values
      // to avoid everything looking washed out when plotted as small markers.
      const boosted = boostSaturation(
        r,
        g,
        bCh,
        1 + 0.15 * (1 - Math.abs(t * 2 - 1)),
      );

      return `rgb(${boosted[0]},${boosted[1]},${boosted[2]})`;
    }
  }

  return stops[0].color;
}

/**
 * Lightweight saturation boost in RGB space.
 * Converts to HSL, scales saturation, converts back.
 * (Kept compact; good enough for marker tint differentiation.)
 */
function boostSaturation(
  r: number,
  g: number,
  b: number,
  factor: number,
): [number, number, number] {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let s = 0;
  let h = 0;

  const d = max - min;
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn:
        h = (gn - bn) / d + (gn < bn ? 6 : 0);
        break;
      case gn:
        h = (bn - rn) / d + 2;
        break;
      case bn:
        h = (rn - gn) / d + 4;
        break;
    }
    h /= 6;
  }

  // Boost saturation
  s = Math.min(1, s * factor);

  // Convert back to RGB
  if (s === 0) {
    const gray = Math.round(l * 255);
    return [gray, gray, gray];
  }

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  const rr = Math.round(hue2rgb(p, q, h + 1 / 3) * 255);
  const gg = Math.round(hue2rgb(p, q, h) * 255);
  const bb = Math.round(hue2rgb(p, q, h - 1 / 3) * 255);
  return [rr, gg, bb];
}
