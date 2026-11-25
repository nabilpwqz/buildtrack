"use client";

import React, { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { useTheme } from "@/components/theme-provider";

function AtmosphericDust({ count = 80, isLight = false }: { count?: number; isLight?: boolean }) {
  const pointsRef = useRef<THREE.Points>(null!);

  const [positions] = useState(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 35;
      pos[i * 3 + 1] = Math.random() * 22;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 35;
    }
    return pos;
  });

  useFrame((state, delta) => {
    if (!pointsRef.current) return;
    const pos = pointsRef.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 1] -= delta * 0.45;
      if (pos[i * 3 + 1] < 0) pos[i * 3 + 1] = 22;
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.16}
        color={isLight ? "#D99300" : "#FFB000"}
        transparent
        opacity={isLight ? 0.45 : 0.65}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function HighRiseStructuralTwin({ wireframe = false, isLight = false }: { wireframe?: boolean; isLight?: boolean }) {
  const buildingGroup = useRef<THREE.Group>(null!);
  const craneJib = useRef<THREE.Group>(null!);
  const hookGroup = useRef<THREE.Group>(null!);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (craneJib.current) {
      craneJib.current.rotation.y = Math.sin(t * 0.4) * 0.85 + 0.3;
    }
    if (hookGroup.current) {
      hookGroup.current.position.y = 13.5 + Math.sin(t * 0.8) * 1.5;
    }
  });

  const floors = 7;
  const floorHeight = 1.6;

  // Themed palettes
  const groundColor = isLight ? "#DFD8CC" : "#171513";
  const gridPrimary = isLight ? "#D99300" : "#FFB000";
  const gridSecondary = isLight ? "#D3CCC0" : "#2F2A25";
  const completedSlabColor = isLight ? "#DFD8CC" : "#211E1B";
  const currentSlabColor = isLight ? "#D99300" : "#FFB000";
  const pendingSlabColor = isLight ? "#EBE5DB" : "#171513";
  const completedColumnColor = isLight ? "#6E6862" : "#8C8782";
  const activeColumnColor = isLight ? "#D94F05" : "#FF6A13";
  const coreColor = isLight ? "#D3CCC0" : "#211E1B";
  const craneColor = isLight ? "#D99300" : "#FFB000";
  const cabColor = isLight ? "#3D3935" : "#0E0D0C";
  const counterweightColor = isLight ? "#6E6862" : "#8C8782";
  const aframeColor = isLight ? "#D94F05" : "#FF6A13";
  const cableColor = isLight ? "#B8920C" : "#E8C547";

  return (
    <group ref={buildingGroup} position={[0, -5, 0]}>
      {/* Heavy Concrete Foundation Ground Plate */}
      <mesh position={[0, -0.4, 0]} receiveShadow>
        <boxGeometry args={[20, 0.8, 20]} />
        <meshStandardMaterial color={groundColor} roughness={0.9} metalness={0.2} />
      </mesh>

      {/* Ground Grid Lines */}
      <gridHelper args={[20, 20, gridPrimary, gridSecondary]} position={[0, 0.01, 0]} />

      {/* Structural Slabs & Columns (Floors 1 through 7) */}
      {Array.from({ length: floors }).map((_, i) => {
        const y = i * floorHeight + 0.8;
        const isCompleted = i < 4;
        const isCurrent = i === 4;

        return (
          <group key={i} position={[0, y, 0]}>
            {/* Concrete Slab Floor */}
            <mesh position={[0, 0, 0]} castShadow receiveShadow>
              <boxGeometry args={[7, 0.22, 7]} />
              <meshStandardMaterial
                color={isCompleted ? completedSlabColor : isCurrent ? currentSlabColor : pendingSlabColor}
                metalness={0.5}
                roughness={0.4}
                wireframe={wireframe}
                transparent={!isCompleted}
                opacity={isCompleted ? 1 : isCurrent ? 0.85 : 0.4}
              />
            </mesh>

            {/* Perimeter Steel Columns (4 corners) */}
            {i < floors - 1 && (
              <>
                <mesh position={[3.1, floorHeight / 2, 3.1]} castShadow>
                  <boxGeometry args={[0.3, floorHeight, 0.3]} />
                  <meshStandardMaterial
                    color={isCompleted ? completedColumnColor : activeColumnColor}
                    metalness={0.7}
                    roughness={0.3}
                    wireframe={wireframe}
                  />
                </mesh>
                <mesh position={[-3.1, floorHeight / 2, 3.1]} castShadow>
                  <boxGeometry args={[0.3, floorHeight, 0.3]} />
                  <meshStandardMaterial
                    color={isCompleted ? completedColumnColor : activeColumnColor}
                    metalness={0.7}
                    roughness={0.3}
                    wireframe={wireframe}
                  />
                </mesh>
                <mesh position={[3.1, floorHeight / 2, -3.1]} castShadow>
                  <boxGeometry args={[0.3, floorHeight, 0.3]} />
                  <meshStandardMaterial
                    color={isCompleted ? completedColumnColor : activeColumnColor}
                    metalness={0.7}
                    roughness={0.3}
                    wireframe={wireframe}
                  />
                </mesh>
                <mesh position={[-3.1, floorHeight / 2, -3.1]} castShadow>
                  <boxGeometry args={[0.3, floorHeight, 0.3]} />
                  <meshStandardMaterial
                    color={isCompleted ? completedColumnColor : activeColumnColor}
                    metalness={0.7}
                    roughness={0.3}
                    wireframe={wireframe}
                  />
                </mesh>

                {/* Internal Structural Core Shear Wall */}
                <mesh position={[0, floorHeight / 2, 0]}>
                  <boxGeometry args={[2.2, floorHeight, 2.2]} />
                  <meshStandardMaterial
                    color={coreColor}
                    metalness={0.3}
                    roughness={0.8}
                    wireframe={wireframe}
                  />
                </mesh>
              </>
            )}
          </group>
        );
      })}

      {/* Summit Tower Crane Structure */}
      <group position={[2.5, floors * floorHeight, -2.5]}>
        {/* Tower Crane Vertical Mast */}
        <mesh position={[0, 2.8, 0]}>
          <boxGeometry args={[0.4, 5.6, 0.4]} />
          <meshStandardMaterial color={craneColor} metalness={0.6} roughness={0.4} />
        </mesh>

        {/* Articulated Rotating Jib & Operator Cab */}
        <group ref={craneJib} position={[0, 5.6, 0]}>
          {/* Operator Cab */}
          <mesh position={[0.4, 0.2, 0.2]}>
            <boxGeometry args={[0.6, 0.7, 0.5]} />
            <meshStandardMaterial color={cabColor} />
          </mesh>

          {/* Main Working Jib */}
          <mesh position={[-4, 0.2, 0]}>
            <boxGeometry args={[8, 0.25, 0.25]} />
            <meshStandardMaterial color={craneColor} metalness={0.6} roughness={0.4} />
          </mesh>

          {/* Counter-Jib & Concrete Counterweight */}
          <mesh position={[2, 0.2, 0]}>
            <boxGeometry args={[4, 0.25, 0.25]} />
            <meshStandardMaterial color={craneColor} metalness={0.6} roughness={0.4} />
          </mesh>
          <mesh position={[3.6, 0, 0]}>
            <boxGeometry args={[1, 0.8, 0.6]} />
            <meshStandardMaterial color={counterweightColor} metalness={0.2} roughness={0.9} />
          </mesh>

          {/* Crane A-Frame Apex */}
          <mesh position={[0, 1.1, 0]}>
            <coneGeometry args={[0.4, 1.8, 4]} />
            <meshStandardMaterial color={aframeColor} metalness={0.6} roughness={0.4} />
          </mesh>

          {/* Hoist Trolley & Cable */}
          <group ref={hookGroup} position={[-4.5, 0, 0]}>
            {/* Cable */}
            <mesh position={[0, 1.2, 0]}>
              <cylinderGeometry args={[0.015, 0.015, 2.4, 8]} />
              <meshBasicMaterial color={cableColor} />
            </mesh>
            {/* Hook Block */}
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[0.3, 0.35, 0.2]} />
              <meshStandardMaterial color={aframeColor} metalness={0.8} roughness={0.2} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
}

export function HeroTwinScene() {
  const [wireframe, setWireframe] = useState(false);
  const { theme } = useTheme();
  const isLight = theme === "light";

  return (
    <div className="relative w-full h-[300px] xs:h-[340px] sm:h-[420px] md:h-[500px] lg:h-[600px] rounded-sm bg-bg-0 border border-border overflow-hidden select-none transition-colors duration-200">
      {/* 3D WebGL Canvas */}
      <Canvas
        camera={{ position: [14, 11, 16], fov: 42 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
      >
        <color attach="background" args={[isLight ? "#F4EFE6" : "#0E0D0C"]} />
        <ambientLight intensity={isLight ? 0.95 : 0.65} color={isLight ? "#FFFFFF" : "#F4EFE6"} />
        <directionalLight
          position={[18, 25, 12]}
          intensity={isLight ? 1.9 : 1.8}
          color={isLight ? "#D99300" : "#FFB000"}
          castShadow
        />
        <directionalLight
          position={[-15, 10, -15]}
          intensity={0.4}
          color={isLight ? "#6E6862" : "#8C8782"}
        />
        <pointLight
          position={[0, 6, 0]}
          intensity={1.2}
          color={isLight ? "#D94F05" : "#FF6A13"}
          distance={15}
        />

        <HighRiseStructuralTwin wireframe={wireframe} isLight={isLight} />
        <AtmosphericDust count={70} isLight={isLight} />

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          maxPolarAngle={Math.PI / 2 - 0.05}
          minPolarAngle={Math.PI / 6}
          autoRotate
          autoRotateSpeed={0.6}
        />
      </Canvas>

      {/* Precision Engineering Telemetry HUD Overlays */}
      <div className="absolute top-2.5 left-2.5 sm:top-4 sm:left-4 max-w-[calc(100%-1.5rem)] pointer-events-none font-mono text-[10px] sm:text-[11px] space-y-1">
        <div className="flex items-center gap-1.5 sm:gap-2 px-2 py-0.5 sm:px-2.5 sm:py-1 bg-bg-1/90 border border-border rounded-xs text-foreground backdrop-blur-sm shadow-plate truncate">
          <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-amber animate-pulse shrink-0" />
          <span className="truncate">DIGITAL TWIN: ACTIVE (1:1 CAD)</span>
        </div>
        <div className="text-[9px] sm:text-[10px] text-steel px-0.5 truncate hidden xs:block">
          PROCEDURAL INSTANCING · 7 STOREYS · SUMMIT CRANE
        </div>
      </div>

      {/* Wireframe Inspection Toggle Control */}
      <div className="absolute bottom-2.5 right-2.5 sm:bottom-4 sm:right-4 z-10 flex items-center gap-2">
        <button
          onClick={() => setWireframe(!wireframe)}
          className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xs font-mono text-[10px] sm:text-xs uppercase tracking-wider border transition flex items-center gap-1.5 sm:gap-2 shadow-plate ${
            wireframe
              ? "bg-amber text-bg-0 border-amber font-bold"
              : "bg-bg-1/90 text-foreground border-border hover:border-amber"
          }`}
        >
          <span>{wireframe ? "WIREFRAME" : "SOLID GEOMETRY"}</span>
        </button>
      </div>

      {/* Bottom Scale Indicator */}
      <div className="absolute bottom-4 left-4 pointer-events-none font-mono text-[10px] text-steel bg-bg-1/80 px-2.5 py-1 border border-border rounded-xs backdrop-blur-sm">
        ROTATION: ORBITAL AUTO-TRACK // DRAG TO INSPECT
      </div>
    </div>
  );
}
