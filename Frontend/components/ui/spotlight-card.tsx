"use client";

import { useRef, useState } from "react";

interface Position {
  x: number;
  y: number;
}

interface SpotlightCardProps extends React.PropsWithChildren {
  className?: string;
  spotlightColor?: `rgba(${number}, ${number}, ${number}, ${number})`;
}

export function SpotlightCard({
  children,
  className = "",
  spotlightColor = "rgba(255, 255, 255, 0.25)",
}: SpotlightCardProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState<number>(0);

  // Mouse move spotlight
  const handleMouseMove: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  // Hover
  const handleMouseEnter = () => {
    setOpacity(0.6);
  };
  const handleMouseLeave = () => {
    setOpacity(0);
  };

  // Keyboard / focus accessibility
  const handleFocus = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({ x: rect.width / 2, y: rect.height / 2 });
    }
    setOpacity(0.6);
  };

  const handleBlur = () => {
    setOpacity(0);
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLButtonElement> = (e) => {
    const step = 24;
    // Ensure spotlight visible when interacting
    if (opacity === 0) setOpacity(0.6);
    setPosition((prev) => {
      switch (e.key) {
        case "ArrowUp":
          return { ...prev, y: Math.max(0, prev.y - step) };
        case "ArrowDown":
          return { ...prev, y: prev.y + step };
        case "ArrowLeft":
          return { ...prev, x: Math.max(0, prev.x - step) };
        case "ArrowRight":
          return { ...prev, x: prev.x + step };
        case "Enter":
        case " ":
          setOpacity((o) => (o ? 0 : 0.6));
          return prev;
        case "Escape":
          setOpacity(0);
          return prev;
        default:
          return prev;
      }
    });
  };

  return (
    <button
      ref={buttonRef}
      type="button"
      aria-label="Spotlight highlight card"
      aria-pressed={opacity > 0}
      onKeyDown={handleKeyDown}
      onClick={() => setOpacity((o) => (o ? 0 : 0.6))}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative rounded-3xl border border-neutral-800 bg-neutral-900 overflow-hidden p-8 focus:outline-none focus:ring-2 focus:ring-primary-500/60 ${className}`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 ease-in-out"
        style={{
          opacity,
          background: `radial-gradient(circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 80%)`,
        }}
      />
      {children}
    </button>
  );
}
