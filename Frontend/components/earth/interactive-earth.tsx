"use client";

import { Environment, Html } from "@react-three/drei";
import {
  Canvas,
  type ThreeEvent,
  useFrame,
  useThree,
} from "@react-three/fiber";
import React, { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { EarthModel } from "./earth-model";

type InteractionMode = "rotate" | "translate";

interface InteractiveEarthProps {
  className?: string;
  rotationSpeed?: number; // idle auto-rotation (radians/sec)
  inertia?: boolean;
  friction?: number; // 0..1 (fraction of velocity retained each (approx) frame batch)
  onSelect?(selected: boolean): void;
  onChangeRotation?(rotation: { x: number; y: number }): void;
  onChangePosition?(position: { x: number; y: number; z: number }): void;
  interactionMode?: InteractionMode;
  initialRotation?: { x?: number; y?: number };
  initialPosition?: { x?: number; y?: number; z?: number };
  scale?: number;
  reducedMotion?: boolean;
}

function useReducedMotion(): boolean {
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

interface GestureState {
  dragging: boolean;
  startX: number;
  startY: number;
  lastX: number;
  lastY: number;
  moved: boolean;
  velocityX: number;
  velocityY: number;
}

const DRAG_THRESHOLD_PX = 5;

const InteractiveEarthInner: React.FC<
  Omit<InteractiveEarthProps, "className" | "reducedMotion"> & {
    reducedMotionFlag: boolean;
  }
> = ({
  rotationSpeed = 0.15,
  inertia = true,
  friction = 0.92,
  onSelect,
  onChangeRotation,
  onChangePosition,
  interactionMode = "rotate",
  initialRotation,
  initialPosition,
  scale = 1.0,
  reducedMotionFlag,
}) => {
  const groupRef = useRef<THREE.Group | null>(null);
  const gesture = useRef<GestureState>({
    dragging: false,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
    moved: false,
    velocityX: 0,
    velocityY: 0,
  });
  const selectedRef = useRef(false);
  const { size, camera } = useThree();

  // Cursor management (grab / grabbing)
  const setCursor = useCallback((c: string) => {
    if (typeof document !== "undefined") {
      document.body.style.cursor = c;
    }
  }, []);

  // Restore cursor on unmount
  useEffect(() => {
    return () => {
      setCursor("auto");
    };
  }, [setCursor]);

  useEffect(() => {
    if (groupRef.current) {
      if (initialRotation?.x != null)
        groupRef.current.rotation.x = initialRotation.x;
      if (initialRotation?.y != null)
        groupRef.current.rotation.y = initialRotation.y;
      if (initialPosition) {
        groupRef.current.position.set(
          initialPosition.x ?? 0,
          initialPosition.y ?? 0,
          initialPosition.z ?? 0,
        );
      }
    }
  }, [initialRotation, initialPosition]);

  const handlePointerDown = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      const target = e.target as EventTarget & {
        setPointerCapture?: (id: number) => void;
      };
      target.setPointerCapture?.(e.pointerId);
      const g = gesture.current;
      g.dragging = true;
      setCursor("grabbing");
      // Use native event for stable client coordinates
      const ne = e.nativeEvent as PointerEvent;
      g.startX = g.lastX = ne.clientX;
      g.startY = g.lastY = ne.clientY;
      g.moved = false;
      g.velocityX = 0;
      g.velocityY = 0;
    },
    [setCursor],
  );

  const handlePointerMove = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      const g = gesture.current;
      if (!g.dragging || !groupRef.current) return;
      const ne = e.nativeEvent as PointerEvent;
      const clientX = ne.clientX;
      const clientY = ne.clientY;
      const dx = clientX - g.lastX;
      const dy = clientY - g.lastY;
      g.lastX = clientX;
      g.lastY = clientY;
      if (
        !g.moved &&
        Math.hypot(clientX - g.startX, clientY - g.startY) > DRAG_THRESHOLD_PX
      ) {
        g.moved = true;
      }
      g.velocityX = dx;
      g.velocityY = dy;

      if (interactionMode === "rotate") {
        const ROTATE_FACTOR = 0.01; // radians per pixel
        groupRef.current.rotation.y += dx * ROTATE_FACTOR;
        groupRef.current.rotation.x += dy * ROTATE_FACTOR;

        // Clamp X tilt
        groupRef.current.rotation.x = Math.max(
          -Math.PI / 2,
          Math.min(Math.PI / 2, groupRef.current.rotation.x),
        );

        onChangeRotation?.({
          x: groupRef.current.rotation.x,
          y: groupRef.current.rotation.y,
        });
      } else {
        // Translate in screen plane approximation
        const distance = camera.position.z - groupRef.current.position.z;
        const perspective = (camera as THREE.PerspectiveCamera)
          .isPerspectiveCamera;
        const fovRadians = perspective
          ? ((camera as THREE.PerspectiveCamera).fov * Math.PI) / 180
          : Math.PI / 4;
        const worldHeight = 2 * Math.tan(fovRadians / 2) * distance;
        const worldPerPixel = worldHeight / size.height;
        const factor = worldPerPixel;
        groupRef.current.position.x += dx * factor;
        groupRef.current.position.y -= dy * factor;

        onChangePosition?.({
          x: groupRef.current.position.x,
          y: groupRef.current.position.y,
          z: groupRef.current.position.z,
        });
      }
    },
    [interactionMode, size.height, camera, onChangeRotation, onChangePosition],
  );

  const handlePointerUp = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      const g = gesture.current;
      if (g.dragging) {
        g.dragging = false;
        if (!g.moved) {
          // Toggle selection
          selectedRef.current = !selectedRef.current;
          onSelect?.(selectedRef.current);
        }
      }
      // After releasing: if still over object keep grab, else reset later via leave
      setCursor(selectedRef.current ? "grab" : "grab");
    },
    [onSelect, setCursor],
  );

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const g = gesture.current;

    if (
      !g.dragging &&
      inertia &&
      (Math.abs(g.velocityX) > 0.01 || Math.abs(g.velocityY) > 0.01) &&
      interactionMode === "rotate"
    ) {
      const ROTATE_FACTOR = 0.01;
      groupRef.current.rotation.y += g.velocityX * ROTATE_FACTOR;
      groupRef.current.rotation.x += g.velocityY * ROTATE_FACTOR;
      groupRef.current.rotation.x = Math.max(
        -Math.PI / 2,
        Math.min(Math.PI / 2, groupRef.current.rotation.x),
      );

      // Exponential friction decay
      const decay = friction ** (delta * 60);
      g.velocityX *= decay;
      g.velocityY *= decay;

      onChangeRotation?.({
        x: groupRef.current.rotation.x,
        y: groupRef.current.rotation.y,
      });
    } else if (
      !g.dragging &&
      interactionMode === "rotate" &&
      !reducedMotionFlag
    ) {
      // Idle auto-rotation
      groupRef.current.rotation.y += rotationSpeed * delta;
      onChangeRotation?.({
        x: groupRef.current.rotation.x,
        y: groupRef.current.rotation.y,
      });
    }

    // Selection feedback: smooth scale pulse (respect provided base scale)
    const baseScale = scale ?? 1.0;
    const targetScale = selectedRef.current ? baseScale * 1.05 : baseScale;
    const current = groupRef.current.scale.x;
    const lerped = THREE.MathUtils.lerp(
      current,
      targetScale,
      1 - Math.exp(-delta * 6),
    );
    groupRef.current.scale.setScalar(lerped);
  });

  return (
    <group
      ref={groupRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={(e) => {
        handlePointerUp(e);
        setCursor("auto");
      }}
      onPointerCancel={(e) => {
        handlePointerUp(e);
        setCursor("auto");
      }}
      onPointerOver={() => {
        // Show grab when hovering & not dragging
        if (!gesture.current.dragging) setCursor("grab");
      }}
    >
      <EarthModel paused={false} />
    </group>
  );
};

export const InteractiveEarth: React.FC<InteractiveEarthProps> = ({
  className,
  reducedMotion,
  ...rest
}) => {
  const systemReduced = useReducedMotion();
  const reduced = reducedMotion ?? systemReduced;
  return (
    <div
      className={className ?? "w-full h-[300px] md:h-[420px] relative"}
      aria-hidden={false}
    >
      <Canvas
        gl={{ antialias: true }}
        dpr={[1, 1.75]}
        camera={{ position: [0, 0, 2.9], fov: 58 }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[3, 2, 2]} intensity={1.4} />
        <directionalLight position={[-4, -1, -2]} intensity={0.4} />
        <React.Suspense
          fallback={
            <Html center>
              <div className="text-xs text-[--color-text-med]">
                Loading Interactive Earth…
              </div>
            </Html>
          }
        >
          <InteractiveEarthInner reducedMotionFlag={reduced} {...rest} />
          <Environment preset="city" />
        </React.Suspense>
      </Canvas>
    </div>
  );
};
