"use client";

import type { DotLottie } from "@lottiefiles/dotlottie-react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { useEffect, useRef, useState } from "react";

// Respect prefers-reduced-motion
function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(mq.matches);
    onChange();
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);
  return reduced;
}

export function DotLottieIcon({
  src,
  className = "w-12 h-12",
  loop = true,
  autoplay = true,
  speed = 0.9,
  ariaLabel,
}: {
  src: string; // e.g., "/lottie/data.lottie"
  className?: string; // size via Tailwind, e.g., "w-10 h-10"
  loop?: boolean;
  autoplay?: boolean;
  speed?: number; // 1.0 = normal
  ariaLabel?: string; // omit or set meaningful text
}) {
  const reduced = usePrefersReducedMotion();
  const ref = useRef<DotLottie | null>(null);

  return (
    <div
      className={className}
      role={ariaLabel ? "img" : "presentation"}
      {...(ariaLabel ? { "aria-label": ariaLabel } : {})}
    >
      <DotLottieReact
        src={src}
        loop={loop}
        autoplay={!reduced && autoplay}
        dotLottieRefCallback={(instance) => {
          ref.current = instance;
          // You can control playback speed via the player API when the instance is ready
          try {
            instance?.setSpeed?.(speed);
          } catch {}
        }}
      />
    </div>
  );
}
