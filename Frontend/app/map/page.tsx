"use client";

import { useEffect, useMemo, useState } from "react";
import {
  MapControlsDock,
  MobileTopBar,
  DebugActiveValues,
} from "@/components/map/controls";
import {
  useEnsureMockDataLoaded,
  useCurrentMapData,
  sampleLegendColor,
} from "@/components/map/store";
import dynamic from "next/dynamic";

// Dynamically import react-leaflet pieces (avoid SSR issues)
const LeafletMapContainer = dynamic(
  () => import("react-leaflet").then((m) => m.MapContainer),
  { ssr: false },
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((m) => m.TileLayer),
  { ssr: false },
);
const Marker = dynamic(() => import("react-leaflet").then((m) => m.Marker), {
  ssr: false,
});
const Popup = dynamic(() => import("react-leaflet").then((m) => m.Popup), {
  ssr: false,
});

export default function MapPage() {
  useEnsureMockDataLoaded();
  const { stationsLatest, legend, pollutant, currentTime } =
    useCurrentMapData();
  const [leaflet, setLeaflet] = useState<typeof import("leaflet") | null>(null);
  const [mounted, setMounted] = useState(false);

  // Mark after first client render to stabilize hydration (server renders placeholder)
  useEffect(() => {
    setMounted(true);
  }, []);

  // Dynamically load Leaflet only on client (avoid window is not defined)
  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;
    (async () => {
      const mod = await import("leaflet");
      if (cancelled) return;
      setLeaflet(mod);
      mod.Icon.Default.mergeOptions({
        iconRetinaUrl: "/leaflet/marker-icon-2x.png",
        iconUrl: "/leaflet/marker-icon.png",
        shadowUrl: "/leaflet/marker-shadow.png",
      });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Compute map center (fallback to first station or a default over Riyadh)
  const center = useMemo<[number, number]>(() => {
    if (stationsLatest?.length) {
      // Average first few stations
      const slice = stationsLatest.slice(0, 3);
      const lat =
        slice.reduce((s, st) => s + st.lat, 0) / Math.max(1, slice.length);
      const lon =
        slice.reduce((s, st) => s + st.lon, 0) / Math.max(1, slice.length);
      return [lat, lon];
    }
    return [24.95, 46.62];
  }, [stationsLatest]);

  return (
    <main className="relative w-full h-[calc(100vh-64px)] overflow-hidden">
      <MobileTopBar />

      <div className="absolute inset-0 flex">
        {/* Side Dock */}
        <div className="absolute top-24 left-4 z-40 w-[min(92vw,320px)] sm:w-auto">
          <MapControlsDock />
        </div>

        {/* Map Canvas */}
        <div className="flex-1 w-full h-full z-0">
          {mounted ? (
            <LeafletMapContainer
              center={center}
              zoom={10}
              className="w-full h-full"
              zoomControl={false}
              preferCanvas
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {stationsLatest?.map((s) => {
                const liveVal = pollutant
                  ? s.latest?.values?.[pollutant]
                  : undefined;
                const color = sampleLegendColor(legend, liveVal) || "#3388ff";
                const icon =
                  leaflet &&
                  leaflet.divIcon({
                    className:
                      "rounded-full flex items-center justify-center text-[8px] font-medium shadow",
                    html: `<div style="
                      width:26px;height:26px;border-radius:50%;
                      background:${color};
                      color:#fff;
                      display:flex;align-items:center;justify-content:center;
                      border:2px solid rgba(0,0,0,0.25);
                      font-family:system-ui,Arial;
                    ">${liveVal != null ? Math.round(liveVal) : "—"}</div>`,
                    iconSize: [26, 26],
                    iconAnchor: [13, 13],
                  });

                return (
                  <Marker
                    key={s.id}
                    position={[s.lat, s.lon] as [number, number]}
                    icon={icon || undefined}
                  >
                    <Popup>
                      <div className="text-xs space-y-1">
                        <div className="font-semibold">{s.name}</div>
                        <div className="text-[10px] text-[--color-text-med]">
                          ID: {s.id}
                        </div>
                        {pollutant && (
                          <div className="mt-1">
                            <span className="font-medium">
                              {pollutantDisplayLabel(pollutant)}:
                            </span>{" "}
                            {liveVal != null ? (
                              <span>
                                {liveVal} {legend?.unit || ""}
                              </span>
                            ) : (
                              <span className="text-[--color-text-dim]">
                                N/A
                              </span>
                            )}
                          </div>
                        )}
                        {currentTime && (
                          <div className="text-[10px] text-[--color-text-med]">
                            {new Date(currentTime).toLocaleString("en-GB", {
                              hour: "2-digit",
                              minute: "2-digit",
                              day: "2-digit",
                              month: "2-digit",
                            })}
                          </div>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </LeafletMapContainer>
          ) : (
            <div className="w-full h-full" />
          )}

          <DebugActiveValues />
          {/* Subtle gradient overlay for top readability */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[--color-bg-1]/70 to-transparent" />
        </div>
      </div>
    </main>
  );
}

function pollutantDisplayLabel(key: string) {
  if (key.startsWith("pm25")) return "PM2.5";
  if (key.startsWith("o3")) return "O₃";
  if (key.startsWith("no2")) return "NO₂";
  if (key.startsWith("hcho")) return "HCHO";
  return key;
}
