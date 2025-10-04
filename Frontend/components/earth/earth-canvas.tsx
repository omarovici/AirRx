"use client";
import { Environment, Html } from "@react-three/drei";
import type { ThreeElements } from "@react-three/fiber";
import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useState } from "react";
import { EarthModel } from "./earth-model";

// Force inclusion of react-three-fiber JSX intrinsic element typings (ambientLight, directionalLight, etc.)
type _R3FElements = ThreeElements;

// Respect reduced motion
function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = () => setReduced(mq.matches);
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, []);
  return reduced;
}

export function EarthCanvas({ className }: { className?: string }) {
  const reduced = useReducedMotion();

  return (
    <div
      className={className ?? "w-full h-[260px] md:h-[380px] lg:h-[440px]"}
      aria-hidden
    >
      <Canvas
        gl={{ antialias: true }}
        dpr={[1, 1.75]}
        camera={{ position: [0, 0, 3.2], fov: 58 }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.7} />
        <directionalLight position={[3, 2, 2]} intensity={1.2} />
        <directionalLight position={[-4, -1, -2]} intensity={0.4} />

        <Suspense
          fallback={
            <Html center>
              <div className="text-xs text-text-med">Loading Earth…</div>
            </Html>
          }
        >
          <EarthModel rotationSpeed={reduced ? 0 : 0.15} scale={1} />
          {/* Soft ambient env; you can remove if you want fewer dependencies */}
          <Environment preset="city" />
        </Suspense>
      </Canvas>
    </div>
  );
}
