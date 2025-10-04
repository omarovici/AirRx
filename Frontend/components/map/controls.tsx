"use client";

import { useCallback, useMemo } from "react";
import {
  useCurrentMapData,
  useLayerVisibility,
  useMapPlaybackControls,
  usePlaybackDriver,
  usePollutantSelection,
  sampleLegendColor,
} from "./store";
import {
  Play,
  Pause,
  Rewind,
  FastForward,
  Layers,
  Activity,
  Wind,
  Map as MapIcon,
  Gauge,
  CircleHelp,
} from "lucide-react";

/* -----------------------------------------------------------------------------
 * Shared UI primitives (lightweight to avoid pulling global UI framework)
 * ---------------------------------------------------------------------------*/

const buttonBase =
  "inline-flex items-center gap-1 rounded-md border border-stroke bg-bg-2 hover:bg-bg-3 text-xs px-2 py-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed";
const toggleButtonBase =
  "inline-flex items-center justify-center rounded-md border text-xs h-8 px-2 select-none transition-colors";
const panelBase =
  "rounded-lg border border-stroke bg-bg-1 backdrop-blur supports-[backdrop-filter]:bg-[color-mix(in_oklab,var(--color-bg-1)_85%,transparent)] shadow-sm";

/* -----------------------------------------------------------------------------
 * Pollutant Selector
 * ---------------------------------------------------------------------------*/

export function PollutantSelector() {
  const { pollutant, setPollutant, pollutants } = usePollutantSelection();

  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-medium tracking-wide text-text-med">
        Pollutant
      </span>
      <div className="flex flex-wrap gap-1.5">
        {pollutants.map((p) => {
          const active = p === pollutant;
          return (
            <button
              type="button"
              key={p}
              onClick={() => setPollutant(p)}
              className={[
                toggleButtonBase,
                active
                  ? "bg-primary-500/20 border-primary-500 text-primary-200"
                  : "bg-bg-2 border-stroke hover:bg-bg-3",
              ].join(" ")}
              aria-pressed={active}
            >
              <span className="font-mono">{shortPollutantLabel(p)}</span>
            </button>
          );
        })}
        {!pollutants.length && (
          <span className="text-[10px] text-text-dim">(No pollutants)</span>
        )}
      </div>
    </div>
  );
}

function shortPollutantLabel(key: string) {
  if (key.startsWith("pm25")) return "PM2.5";
  if (key.startsWith("o3")) return "O₃";
  if (key.startsWith("no2")) return "NO₂";
  if (key.startsWith("hcho")) return "HCHO";
  return key.replace(/_(ppb|ugm3)/, "");
}

/* -----------------------------------------------------------------------------
 * Time Slider + Playback
 * ---------------------------------------------------------------------------*/

export function PlaybackControls({ autoplay = false }: { autoplay?: boolean }) {
  const {
    timeIndex,
    setTimeIdx,
    currentTimeIdx,
    playing,
    setPlaying,
    playbackSpeed,
    setPlaybackSpeed,
  } = useMapPlaybackControls();
  const { currentTime } = useCurrentMapData();

  usePlaybackDriver(autoplay);

  const step = useCallback(
    (dir: 1 | -1) => {
      if (!timeIndex.length) return;
      const next = (currentTimeIdx + dir + timeIndex.length) % timeIndex.length;
      setTimeIdx(next);
    },
    [timeIndex, currentTimeIdx, setTimeIdx],
  );

  const speeds = [0.5, 1, 2, 4];

  return (
    <div className="flex flex-col gap-2">
      <span className="text-[11px] font-medium tracking-wide text-text-med">
        Time
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className={buttonBase}
          onClick={() => step(-1)}
          disabled={!timeIndex.length}
          aria-label="Previous frame"
        >
          <Rewind size={14} />
        </button>
        <button
          type="button"
          className={buttonBase}
          onClick={() => setPlaying(!playing)}
          disabled={!timeIndex.length}
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? <Pause size={14} /> : <Play size={14} />}
          <span className="hidden sm:inline">{playing ? "Pause" : "Play"}</span>
        </button>
        <button
          type="button"
          className={buttonBase}
          onClick={() => step(1)}
          disabled={!timeIndex.length}
          aria-label="Next frame"
        >
          <FastForward size={14} />
        </button>
        <div className="flex items-center gap-1 ml-2">
          {speeds.map((s) => {
            const active = s === playbackSpeed;
            return (
              <button
                type="button"
                key={s}
                onClick={() => setPlaybackSpeed(s)}
                className={[
                  "px-2 h-7 rounded text-[10px] border",
                  active
                    ? "bg-primary-500/20 border-primary-500 text-primary-100"
                    : "bg-bg-2 border-stroke hover:bg-bg-3",
                ].join(" ")}
                aria-pressed={active}
              >
                {s}x
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="range"
          min={0}
          max={Math.max(0, timeIndex.length - 1)}
          value={currentTimeIdx}
          onChange={(e) => setTimeIdx(Number(e.target.value))}
          className="w-full accent-primary-500"
          aria-valuenow={currentTimeIdx}
          aria-valuemin={0}
          aria-valuemax={timeIndex.length - 1}
          aria-label="Time index"
        />
      </div>
      <div className="text-[11px] text-text-med flex justify-between">
        <span>
          {timeIndex.length
            ? new Date(timeIndex[0]).toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "—"}
        </span>
        <span className="font-medium text-text-high">
          {currentTime
            ? new Date(currentTime).toLocaleString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
                day: "2-digit",
                month: "2-digit",
              })
            : "Loading…"}
        </span>
        <span>
          {timeIndex.length
            ? new Date(timeIndex[timeIndex.length - 1]).toLocaleTimeString(
                "en-GB",
                { hour: "2-digit", minute: "2-digit" },
              )
            : "—"}
        </span>
      </div>
    </div>
  );
}

/* -----------------------------------------------------------------------------
 * Layer Toggles
 * ---------------------------------------------------------------------------*/

const layerLabels: Record<
  keyof ReturnType<typeof useLayerVisibility>["layers"],
  { label: string; icon: React.ReactNode; help?: string }
> = {
  stations: {
    label: "Stations",
    icon: <MapIcon size={14} />,
    help: "Show ground station measurements.",
  },
  tempo: {
    label: "Satellite (TEMPO)",
    icon: <Activity size={14} />,
    help: "Satellite grid (mock).",
  },
  predictions: {
    label: "Forecast",
    icon: <Gauge size={14} />,
    help: "Forecast fields.",
  },
  meteorology: {
    label: "Weather",
    icon: <Wind size={14} />,
    help: "Meteorology layers (temp, humidity, ...).",
  },
  wind: {
    label: "Wind",
    icon: <Wind size={14} />,
    help: "Wind vectors / fields (future).",
  },
  validation: {
    label: "Validation",
    icon: <Layers size={14} />,
    help: "Station vs satellite bias.",
  },
  uncertainty: {
    label: "Uncertainty",
    icon: <CircleHelp size={14} />,
    help: "Forecast uncertainty range.",
  },
};

export function LayerToggles() {
  const { layers, toggleLayer } = useLayerVisibility();

  return (
    <div className="flex flex-col gap-2">
      <span className="text-[11px] font-medium tracking-wide text-text-med">
        Layers
      </span>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
        {(Object.keys(layers) as (keyof typeof layers)[]).map((k) => {
          const active = layers[k];
          const meta = layerLabels[k];
          return (
            <button
              type="button"
              key={k}
              onClick={() => toggleLayer(k)}
              aria-pressed={active}
              title={meta.help}
              className={[
                "group",
                "text-[11px] font-medium h-8 flex items-center gap-1.5 px-2 rounded border transition-colors",
                active
                  ? "bg-primary-500/20 border-primary-500 text-primary-100"
                  : "bg-bg-2 border-stroke hover:bg-bg-3 text-text-med",
              ].join(" ")}
            >
              {meta.icon}
              <span className="truncate">{meta.label}</span>
              <span
                className={[
                  "ml-auto h-2 w-2 rounded-full",
                  active
                    ? "bg-primary-400 shadow-[0_0_0_2px_rgba(0,0,0,0.15)]"
                    : "bg-stroke",
                ].join(" ")}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* -----------------------------------------------------------------------------
 * Legend (dynamic gradient + bands)
 * ---------------------------------------------------------------------------*/

export function LegendPanel() {
  const { legend, legendGradientCSS, pollutant } = useCurrentMapData();

  if (!legend || !pollutant) {
    return (
      <div
        className={[panelBase, "p-3 text-xs text-text-med w-full sm:w-64"].join(
          " ",
        )}
      >
        No legend available
      </div>
    );
  }

  return (
    <section
      className={[
        panelBase,
        "flex flex-col gap-2 p-3 text-xs w-full sm:w-64",
      ].join(" ")}
      aria-label="Legend"
    >
      <div className="flex items-center justify-between">
        <div className="font-medium text-text-high">
          Value Legend · {shortPollutantLabel(pollutant)}
        </div>
        {legend.unit && (
          <span className="text-[10px] text-text-med">({legend.unit})</span>
        )}
      </div>

      {legendGradientCSS && (
        <div className="flex flex-col gap-1">
          <div
            className="h-3 rounded"
            style={{
              background: legendGradientCSS,
            }}
            aria-hidden
          />
          <div className="flex justify-between text-[10px] text-text-med">
            <span>
              {legend.min ?? legend.gradient?.stops?.[0]?.value ?? "—"}
            </span>
            <span>
              {legend.max ??
                legend.gradient?.stops?.[legend.gradient.stops.length - 1]
                  ?.value ??
                "—"}
            </span>
          </div>
        </div>
      )}

      {legend.aqi_like_bands?.length ? (
        <div className="flex flex-col gap-1">
          <div className="text-[10px] font-medium text-text-med mt-1">
            Approximate AQI-like Bands
          </div>
          <ul className="flex flex-col gap-1">
            {legend.aqi_like_bands.map((b) => (
              <li
                key={`${b.range[0]}-${b.range[1]}`}
                className="flex items-center gap-2"
                aria-label={`${b.label} ${b.range[0]}–${b.range[1]}`}
              >
                <span
                  className="h-3 w-3 rounded-sm ring-1 ring-black/10 shrink-0"
                  style={{ background: b.color }}
                />
                <span className="text-[10px] text-text-high">{b.label}</span>
                <span className="ml-auto tabular-nums text-[10px] text-text-med">
                  {b.range[0]}–{b.range[1]}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <DynamicallySampleRow pollutant={pollutant} />
    </section>
  );
}

/**
 * Demonstrates dynamic color sampling from legend for a few token values
 */
function DynamicallySampleRow({ pollutant }: { pollutant: string }) {
  const { legend } = useCurrentMapData();
  const samples = useMemo(() => {
    if (!legend) return [];
    const values: number[] = [];
    if (legend.min != null && legend.max != null) {
      const steps = 5;
      const stepSize = (legend.max - legend.min) / (steps - 1);
      for (let i = 0; i < steps; i++) {
        values.push(legend.min + i * stepSize);
      }
    } else if (legend.gradient?.stops?.length) {
      values.push(...legend.gradient.stops.map((s) => s.value));
    }
    // Unique & sorted
    return Array.from(new Set(values))
      .sort((a, b) => a - b)
      .slice(0, 6);
  }, [legend]);

  if (!legend || samples.length < 2) return null;

  return (
    <div className="mt-1 flex flex-col gap-1">
      <div className="text-[10px] text-text-med">
        Color Samples ({shortPollutantLabel(pollutant)})
      </div>
      <div className="flex flex-wrap gap-1">
        {samples.map((v) => {
          const c = sampleLegendColor(legend, v);
          return (
            <div
              key={v}
              className="px-1.5 py-1 rounded border border-stroke flex items-center gap-1 text-[10px] bg-bg-2"
            >
              <span
                className="h-3 w-3 rounded-sm ring-1 ring-black/10"
                style={{ background: c ?? "transparent" }}
              />
              <span className="tabular-nums">{formatFloat(v)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatFloat(v: number, digits = 1) {
  return v % 1 === 0 ? v.toFixed(0) : v.toFixed(digits);
}

/* -----------------------------------------------------------------------------
 * Composite Dock / Panel
 * ---------------------------------------------------------------------------*/

export function MapControlsDock() {
  const { loading, error } = useCurrentMapData();

  return (
    <aside
      className={[
        "pointer-events-auto",
        "w-full sm:w-80",
        "flex flex-col gap-4",
      ].join(" ")}
    >
      <div className={[panelBase, "p-4 flex flex-col gap-5"].join(" ")}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Layers size={16} />
            Data (Mock)
          </h3>
          {loading && (
            <span className="text-[10px] animate-pulse text-text-med">
              Loading…
            </span>
          )}
        </div>

        {error && (
          <div className="text-[11px] rounded bg-red-500/10 border border-red-500/30 p-2 text-red-300">
            Data error: {error}
          </div>
        )}

        <PollutantSelector />
        <PlaybackControls />
        <LayerToggles />
      </div>

      <LegendPanel />
    </aside>
  );
}

/* -----------------------------------------------------------------------------
 * Minimal overlay bar (optional for mobile)
 * ---------------------------------------------------------------------------*/

export function MobileTopBar() {
  const { currentTime, pollutant } = useCurrentMapData();
  const { playing } = useMapPlaybackControls();

  return (
    <div
      className={[
        "fixed bottom-6 left-1/2 -translate-x-1/2 z-40",
        "px-3 py-1.5 flex items-center gap-3",
        "rounded-full border border-stroke bg-bg-2/80 backdrop-blur",
        "text-[11px]",
      ].join(" ")}
    >
      <span className="font-medium text-text-high">
        {pollutant ? shortPollutantLabel(pollutant) : "—"}
      </span>
      <span className="h-3 w-px bg-stroke" aria-hidden />
      <span className="tabular-nums">
        {currentTime
          ? new Date(currentTime).toLocaleTimeString("en-GB", {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "…"}
      </span>
      <span
        className={[
          "flex items-center gap-1 px-2 py-0.5 rounded-full",
          playing
            ? "bg-primary-500/20 text-primary-100"
            : "bg-bg-3 text-text-med",
        ].join(" ")}
      >
        {playing ? <Play size={10} /> : <Pause size={10} />}{" "}
        {playing ? "Playing" : "Paused"}
      </span>
    </div>
  );
}

/* -----------------------------------------------------------------------------
 * Placeholder map canvas overlay content (stub)
 * ---------------------------------------------------------------------------*/

export function DebugActiveValues() {
  const { predictionSlice, pollutant, currentTime } = useCurrentMapData();
  if (!predictionSlice || !predictionSlice.length || !pollutant) return null;
  const center = predictionSlice[Math.floor(predictionSlice.length / 2)];
  return (
    <div
      className="absolute bottom-2 right-2 text-[10px] bg-bg-2/80 backdrop-blur rounded px-2 py-1 border border-stroke"
      aria-live="polite"
    >
      <div className="uppercase tracking-wide font-semibold text-text-med mb-0.5">
        Debug
      </div>
      <div className="text-text-med">
        T:{" "}
        {currentTime
          ? new Date(currentTime).toLocaleTimeString("en-GB", {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "—"}
      </div>
      <div className="text-text-med">
        {shortPollutantLabel(pollutant)}:{" "}
        <span className="text-text-high font-medium">
          {center?.value ?? "—"}
        </span>
      </div>
      {center?.uncertainty && (
        <div className="text-text-med">
          ±:{" "}
          <span className="text-text-high font-medium">
            [{center.uncertainty[0]} – {center.uncertainty[1]}]
          </span>
        </div>
      )}
      {center?.confidence != null && (
        <div className="text-text-med">
          Confidence:{" "}
          <span className="text-text-high font-medium">
            {(center.confidence * 100).toFixed(0)}%
          </span>
        </div>
      )}
    </div>
  );
}

/* -----------------------------------------------------------------------------
 * Utility components exported in a single object (optional)
 * ---------------------------------------------------------------------------*/

export const MapUI = {
  PollutantSelector,
  PlaybackControls,
  LayerToggles,
  LegendPanel,
  MapControlsDock,
  MobileTopBar,
  DebugActiveValues,
};

/* -----------------------------------------------------------------------------
 * Optional inline docs for developers (can be removed later)
 * ---------------------------------------------------------------------------*/
/**
 * HOW TO INTEGRATE:
 * In /app/map/page.tsx (client component):
 *
 *   import { MapControlsDock, MobileTopBar, DebugActiveValues } from "@/components/map/controls";
 *   import { useEnsureMockDataLoaded } from "@/components/map/store";
 *
 *   export default function MapPage() {
 *     useEnsureMockDataLoaded();
 *     return (
 *       <main className="relative w-full h-[calc(100vh-64px)]">
 *         <MobileTopBar />
 *         <div className="flex h-full">
 *           <div className="absolute left-3 top-20 z-40">
 *             <MapControlsDock />
 *           </div>
 *           <div className="flex-1 relative bg-neutral-900/40">
 *             // TODO: Insert actual map canvas/Leaflet/Deck.gl component
 *             <DebugActiveValues />
 *           </div>
 *         </div>
 *       </main>
 *     );
 *   }
 */
