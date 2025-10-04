"use client";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import dynamic from "next/dynamic";
import { useEffect } from "react";

// Dynamically import react-leaflet components to avoid SSR issues
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false },
);

const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false },
);

const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false },
);

const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), {
  ssr: false,
});

export function MapPreview() {
  // Fix for Leaflet marker icons in Next.js
  useEffect(() => {
    // Only run this code on the client side
    // This fixes the issue with Leaflet's default icon paths
    if (typeof window !== "undefined") {
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "/leaflet/marker-icon-2x.png",
        iconUrl: "/leaflet/marker-icon.png",
        shadowUrl: "/leaflet/marker-shadow.png",
      });
    }
  }, []);

  return (
    <section className="mt-12">
      <div className="card overflow-hidden">
        <div className="p-4 sm:p-5 flex flex-col md:flex-row items-center gap-4">
          <div className="rounded-md border border-[--color-stroke] w-[320px] h-[180px] md:w-[480px] md:h-[270px] overflow-hidden">
            {typeof window !== "undefined" && (
              <MapContainer
                center={[51.505, -0.09] as [number, number]}
                zoom={13}
                style={{ width: "100%", height: "100%" }}
                zoomControl={false}
                attributionControl={false}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[51.505, -0.09] as [number, number]}>
                  <Popup>
                    A sample location. <br /> Click for more info.
                  </Popup>
                </Marker>
              </MapContainer>
            )}
          </div>
          <div className="text-sm text-[--color-text-med] max-w-sm">
            Explore the interactive map to see overlays, legend, tooltips, and
            time control.
            <div className="mt-3">
              <a href="/map" className="btn btn-primary text-sm">
                Open Map
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
