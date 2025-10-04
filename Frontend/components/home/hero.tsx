"use client";
import dynamic from "next/dynamic";
import { Galaxy } from "@/components/ui";

const EarthCanvas = dynamic<{ className?: string }>(
  () => import("@/components/earth").then((m) => m.InteractiveEarth),
  { ssr: false },
);

export function Hero({
  title,
  subtitle,
  primaryHref = "/map",
  primaryText = "Open Map",
  secondaryHref = "#method",
  secondaryText = "How it works",
}: {
  title: string;
  subtitle: string;
  primaryHref?: string;
  primaryText?: string;
  secondaryHref?: string;
  secondaryText?: string;
}) {
  return (
    <section className="px-24 w-full max-w-[1680px] rounded-b-4xl pt-30 h-[70vh] flex justify-start items-center pb-6 relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Galaxy
          mouseRepulsion={true}
          mouseInteraction={true}
          density={0.7}
          glowIntensity={0.3}
          saturation={0.5}
        />
      </div>

      <div className="z-10 relative flex flex-col justify-center items-start gap-4">
        <div className="flex flex-col justify-center items-start gap-2 w-fit rounded-full backdrop-blur-lg">
          <h1
            className="text-7xl max-w-2xl font-semibold tracking-tight bg-gradient-to-b text-transparent from-text-high via-text-med to-text-dim bg-clip-text inline-block"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {title}
          </h1>
          <p className="text-text-med text-lg max-w-lg mt-4">{subtitle}</p>
        </div>

        <div className="mt-8 flex items-center justify-center gap-3">
          <a
            href={primaryHref}
            className="btn btn-primary text-sm md:text-base"
          >
            {" "}
            {primaryText}{" "}
          </a>
          <a
            href={secondaryHref}
            className="btn btn-ghost text-sm md:text-base"
          >
            {" "}
            {secondaryText}{" "}
          </a>
        </div>
      </div>

      {/* Right: 3D Earth */}
      <div className="z-0 absolute w-[700px] aspect-square rounded-full right-0 top-24 translate-x-64 translate-y-64">
        {/* Subtle glow backdrop */}
        <EarthCanvas className="w-full h-full" />
      </div>
    </section>
  );
}
