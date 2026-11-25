"use client";

import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";

interface CompletionGaugeProps {
  rate: number; // 0 to 100
  label?: string;
  isLight?: boolean;
}

export default function CompletionGaugeScene({
  rate = 68,
  label = "Overall Project Delivery",
  isLight = false,
}: CompletionGaugeProps) {
  const torusRef = useRef<THREE.Group>(null!);

  useFrame(({ clock }) => {
    if (torusRef.current) {
      // Gentle orbital bobbing
      torusRef.current.rotation.z = Math.sin(clock.getElapsedTime() * 0.5) * 0.08;
    }
  });

  // Calculate arc angle in radians for progress: rate % of 2*PI
  const progressAngle = (rate / 100) * Math.PI * 2;
  const trackColor = isLight ? "#D3CCC0" : "#211E1B";
  const arcColor = isLight ? "#D99300" : "#FFB000";

  return (
    <>
      <ambientLight
        intensity={isLight ? 0.95 : 0.7}
        color={isLight ? "#FFFFFF" : "#FFB000"}
      />
      <directionalLight
        position={[10, 15, 10]}
        intensity={isLight ? 2.0 : 1.8}
        color={isLight ? "#D99300" : "#F4EFE6"}
      />
      <pointLight
        position={[-10, 10, -5]}
        intensity={1.5}
        color={isLight ? "#D94F05" : "#FF6A13"}
      />

      <group ref={torusRef} position={[0, 0, 0]}>
        {/* Background Track Donut */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[3, 0.35, 32, 100]} />
          <meshStandardMaterial color={trackColor} roughness={0.8} />
        </mesh>

        {/* Active Progress Donut Arc */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[3.02, 0.4, 32, 100, progressAngle]} />
          <meshStandardMaterial
            color={arcColor}
            metalness={0.7}
            roughness={0.2}
          />
        </mesh>

        {/* Center Display */}
        <Html position={[0, 0, 0]} center>
          <div className="flex flex-col items-center justify-center text-center font-mono pointer-events-none select-none">
            <div className="text-3xl font-extrabold text-amber tracking-wider drop-shadow-md">
              {Math.round(rate)}%
            </div>
            <div className="text-[10px] text-steel uppercase tracking-widest mt-0.5">
              COMPLETION RATE
            </div>
            <div className="text-[9px] text-concrete font-medium mt-1 max-w-[120px] truncate">
              {label}
            </div>
          </div>
        </Html>
      </group>

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        maxPolarAngle={Math.PI / 2.2}
        minPolarAngle={Math.PI / 4}
      />
    </>
  );
}
