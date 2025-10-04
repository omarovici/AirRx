"use client";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";

type Props = {
  url?: string;
  rotationSpeed?: number; // radians per second
  scale?: number;
  paused?: boolean;
};

export function EarthModel({
  url = "/models/earth_rotation.glb",
  rotationSpeed = 0.15,
  scale = 1,
  paused = false,
}: Props) {
  const group = useRef<Group | null>(null);
  // Load GLB model (expects /public/models/earth_rotation.glb)
  const { scene } = useGLTF(url) as unknown as { scene: Group };

  useFrame((_, delta) => {
    if (!paused && group.current) {
      group.current.rotation.y += rotationSpeed * delta;
    }
  });

  return (
    <group ref={group} scale={scale}>
      {/* Center the imported scene if necessary */}
      <primitive object={scene} />
    </group>
  );
}

// Ensure the glTF is cached by drei
useGLTF.preload("/models/earth_rotation.glb");
