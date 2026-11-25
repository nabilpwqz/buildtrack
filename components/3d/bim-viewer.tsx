"use client";

import React, { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";

export interface BIMLayerConfig {
  structure: boolean;
  mep: boolean;
  facade: boolean;
  scaffolding: boolean;
  sensors: boolean;
  exploded: boolean;
}

export interface IoTSensor {
  id: string;
  name: string;
  code: string;
  type: "TEMPERATURE" | "STRAIN" | "WIND" | "HUMIDITY";
  value: string;
  status: "NOMINAL" | "WARNING" | "CRITICAL";
  floor: number;
  position: [number, number, number];
}

const DEFAULT_SENSORS: IoTSensor[] = [
  {
    id: "s-1",
    name: "Concrete Hydration Core",
    code: "S-TMP-01",
    type: "TEMPERATURE",
    value: "38.4°C (Optimal Curing)",
    status: "NOMINAL",
    floor: 3,
    position: [1.8, 5.2, 1.8],
  },
  {
    id: "s-2",
    name: "Cantilever Beam Strain Gauge",
    code: "S-STR-02",
    type: "STRAIN",
    value: "0.082 mm (Within Spec)",
    status: "NOMINAL",
    floor: 5,
    position: [-2.2, 9.6, 2.2],
  },
  {
    id: "s-3",
    name: "Tower Crane Anemometer",
    code: "S-WND-03",
    type: "WIND",
    value: "14.2 knots (Safe Jib Ops)",
    status: "NOMINAL",
    floor: 7,
    position: [0, 16.5, 0],
  },
  {
    id: "s-4",
    name: "Level 4 Slab Moisture Matrix",
    code: "S-HUM-04",
    type: "HUMIDITY",
    value: "76% RH (Ready for Screed)",
    status: "NOMINAL",
    floor: 4,
    position: [0, 7.4, -2.0],
  },
];

export interface BIMViewerProps {
  layers: BIMLayerConfig;
  progress?: number;
  onSelectSensor?: (sensor: IoTSensor) => void;
  isLight?: boolean;
}

export default function BIMViewerScene({
  layers,
  progress = 75,
  onSelectSensor,
  isLight = false,
}: BIMViewerProps) {
  const [selectedSensor, setSelectedSensor] = useState<IoTSensor | null>(null);
  const [hoveredFloor, setHoveredFloor] = useState<number | null>(null);
  const craneJib = useRef<THREE.Group>(null!);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (craneJib.current) {
      craneJib.current.rotation.y = Math.sin(t * 0.3) * 0.7 + 0.4;
    }
  });

  const totalFloors = 6;
  const baseFloorHeight = 2.4;
  const explosionOffset = layers.exploded ? 1.6 : 0;

  // Themed palettes
  const groundColor = isLight ? "#DFD8CC" : "#171513";
  const gridPrimary = isLight ? "#D99300" : "#FFB000";
  const gridSecondary = isLight ? "#D3CCC0" : "#2F2A25";
  const completedSlabColor = isLight ? "#DFD8CC" : "#211E1B";
  const inProgressSlabColor = isLight ? "#D99300" : "#FFB000";
  const coreColor = isLight ? "#D3CCC0" : "#171513";
  const columnColor = isLight ? "#6E6862" : "#8C8782";
  const craneColor = isLight ? "#D99300" : "#FFB000";
  const cabColor = isLight ? "#3D3935" : "#171513";
  const scaffoldPoles = isLight ? "#6E6862" : "#8C8782";
  const scaffoldPlanks = isLight ? "#9E4E20" : "#B8602E";
  const hvacDuctColor = isLight ? "#B8602E" : "#B8602E";
  const pipeColor = isLight ? "#B8920C" : "#E8C547";
  const facadeGlassColor = isLight ? "#DFD8CC" : "#8C8782";

  return (
    <>
      {/* Lighting strictly warm amber & ivory */}
      <ambientLight
        intensity={isLight ? 0.95 : 0.7}
        color={isLight ? "#FFFFFF" : "#FFB000"}
      />
      <directionalLight
        position={[15, 24, 15]}
        intensity={isLight ? 2.2 : 2.0}
        color={isLight ? "#D99300" : "#F4EFE6"}
        castShadow
      />
      <pointLight
        position={[-12, 16, -12]}
        intensity={1.4}
        color={isLight ? "#D94F05" : "#FF6A13"}
      />

      {/* Heavy Steel-Concrete Foundation Ground Plate */}
      <mesh position={[0, -0.4, 0]} receiveShadow>
        <boxGeometry args={[18, 0.8, 18]} />
        <meshStandardMaterial color={groundColor} metalness={0.6} roughness={0.7} />
      </mesh>
      <gridHelper args={[18, 18, gridPrimary, gridSecondary]} position={[0, 0.02, 0]} />

      {/* BIM Floors 1 through 6 */}
      {Array.from({ length: totalFloors }).map((_, fIdx) => {
        const floorNum = fIdx + 1;
        const y = fIdx * (baseFloorHeight + explosionOffset) + 1.2;
        const isCompleted = (floorNum / totalFloors) * 100 <= progress;
        const isHovered = hoveredFloor === floorNum;

        return (
          <group
            key={`floor-${floorNum}`}
            position={[0, y, 0]}
            onPointerOver={(e) => {
              e.stopPropagation();
              setHoveredFloor(floorNum);
            }}
            onPointerOut={() => setHoveredFloor(null)}
          >
            {/* STRUCTURE LAYER: Slabs and 4 Columns */}
            {layers.structure && (
              <group>
                {/* Floor Slab */}
                <mesh position={[0, 0, 0]}>
                  <boxGeometry args={[6.4, 0.25, 6.4]} />
                  <meshStandardMaterial
                    color={isCompleted ? completedSlabColor : inProgressSlabColor}
                    metalness={0.7}
                    roughness={0.3}
                    wireframe={!isCompleted && !layers.facade}
                  />
                  <lineSegments>
                    <edgesGeometry args={[new THREE.BoxGeometry(6.42, 0.27, 6.42)]} />
                    <lineBasicMaterial
                      color={
                        isHovered
                          ? gridPrimary
                          : isLight
                            ? "#D3CCC0"
                            : "#2F2A25"
                      }
                    />
                  </lineSegments>
                </mesh>

                {/* 4 Reinforced Heavy Corner Columns */}
                {[
                  [-2.8, 1.1, -2.8],
                  [2.8, 1.1, -2.8],
                  [-2.8, 1.1, 2.8],
                  [2.8, 1.1, 2.8],
                ].map(([cx, cy, cz], cIdx) => (
                  <mesh key={cIdx} position={[cx, cy, cz]}>
                    <boxGeometry args={[0.45, 2.0, 0.45]} />
                    <meshStandardMaterial
                      color={columnColor}
                      metalness={0.8}
                      roughness={0.3}
                    />
                  </mesh>
                ))}

                {/* Central Concrete Core Shear Wall */}
                <mesh position={[0, 1.1, 0]}>
                  <boxGeometry args={[1.8, 2.0, 1.8]} />
                  <meshStandardMaterial
                    color={coreColor}
                    metalness={0.5}
                    roughness={0.8}
                  />
                </mesh>
              </group>
            )}

            {/* MEP LAYER: Mechanical Ducts, Electrical Trays, Piping */}
            {layers.mep && (
              <group position={[0, 1.6, 0]}>
                {/* Main HVAC Supply Duct */}
                <mesh position={[-1.2, 0, 0]}>
                  <boxGeometry args={[0.6, 0.35, 5.8]} />
                  <meshStandardMaterial
                    color={hvacDuctColor}
                    metalness={0.8}
                    roughness={0.3}
                  />
                </mesh>
                {/* Secondary Cross-Branch Duct */}
                <mesh position={[1.2, 0, 0]}>
                  <boxGeometry args={[0.45, 0.28, 5.6]} />
                  <meshStandardMaterial
                    color={hvacDuctColor}
                    metalness={0.8}
                    roughness={0.3}
                  />
                </mesh>
                {/* Sprinkler & Utility Run */}
                <mesh position={[0, 0.22, 1.5]} rotation={[0, 0, Math.PI / 2]}>
                  <cylinderGeometry args={[0.06, 0.06, 5.8, 12]} />
                  <meshStandardMaterial
                    color={pipeColor}
                    metalness={0.9}
                    roughness={0.2}
                  />
                </mesh>
                <mesh position={[0, 0.22, -1.5]} rotation={[0, 0, Math.PI / 2]}>
                  <cylinderGeometry args={[0.06, 0.06, 5.8, 12]} />
                  <meshStandardMaterial
                    color={pipeColor}
                    metalness={0.9}
                    roughness={0.2}
                  />
                </mesh>
              </group>
            )}

            {/* FACADE LAYER: Glazed Curtain Wall Glass Enclosure */}
            {layers.facade && isCompleted && (
              <group position={[0, 1.0, 0]}>
                <mesh position={[0, 0, 3.1]}>
                  <boxGeometry args={[6.2, 1.9, 0.08]} />
                  <meshStandardMaterial
                    color={facadeGlassColor}
                    transparent
                    opacity={isLight ? 0.35 : 0.45}
                    roughness={0.1}
                    metalness={0.9}
                  />
                </mesh>
                <mesh position={[0, 0, -3.1]}>
                  <boxGeometry args={[6.2, 1.9, 0.08]} />
                  <meshStandardMaterial
                    color={facadeGlassColor}
                    transparent
                    opacity={isLight ? 0.35 : 0.45}
                    roughness={0.1}
                    metalness={0.9}
                  />
                </mesh>
                <mesh position={[3.1, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
                  <boxGeometry args={[6.2, 1.9, 0.08]} />
                  <meshStandardMaterial
                    color={facadeGlassColor}
                    transparent
                    opacity={isLight ? 0.35 : 0.45}
                    roughness={0.1}
                    metalness={0.9}
                  />
                </mesh>
                <mesh position={[-3.1, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
                  <boxGeometry args={[6.2, 1.9, 0.08]} />
                  <meshStandardMaterial
                    color={facadeGlassColor}
                    transparent
                    opacity={isLight ? 0.35 : 0.45}
                    roughness={0.1}
                    metalness={0.9}
                  />
                </mesh>
              </group>
            )}

            {/* SCAFFOLDING LAYER: Perimeter Modular Staging Tube Grid */}
            {layers.scaffolding && !isCompleted && (
              <group position={[0, 1.0, 0]}>
                {/* Outer Safety Tube Scaffold */}
                {[-3.5, 3.5].map((sx) => (
                  <mesh key={`scaffold-v-${sx}`} position={[sx, 0, 0]}>
                    <boxGeometry args={[0.08, 2.2, 7.2]} />
                    <meshStandardMaterial
                      color={scaffoldPoles}
                      wireframe
                    />
                  </mesh>
                ))}
                {/* Horizontal Working Planks */}
                <mesh position={[3.45, 0.2, 0]}>
                  <boxGeometry args={[0.5, 0.08, 7.0]} />
                  <meshStandardMaterial color={scaffoldPlanks} />
                </mesh>
              </group>
            )}
          </group>
        );
      })}

      {/* SUMMIT LEVEL: Heavy Tower Crane Rigging */}
      <group position={[1.8, totalFloors * (baseFloorHeight + explosionOffset) + 0.8, -1.8]}>
        {/* Tower Mast */}
        <mesh position={[0, 2.5, 0]}>
          <boxGeometry args={[0.4, 5.0, 0.4]} />
          <meshStandardMaterial color={craneColor} metalness={0.6} roughness={0.3} />
        </mesh>

        {/* Rotating Jib Unit */}
        <group ref={craneJib} position={[0, 5.0, 0]}>
          {/* Cab */}
          <mesh position={[0.4, 0, 0.2]}>
            <boxGeometry args={[0.6, 0.6, 0.5]} />
            <meshStandardMaterial color={cabColor} />
          </mesh>
          {/* Main Jib */}
          <mesh position={[-3.5, 0.1, 0]}>
            <boxGeometry args={[7.0, 0.2, 0.2]} />
            <meshStandardMaterial color={craneColor} metalness={0.7} />
          </mesh>
          {/* Counter Jib */}
          <mesh position={[1.8, 0.1, 0]}>
            <boxGeometry args={[3.6, 0.2, 0.2]} />
            <meshStandardMaterial color={craneColor} metalness={0.7} />
          </mesh>
          {/* Counterweight Block */}
          <mesh position={[3.2, 0, 0]}>
            <boxGeometry args={[0.8, 0.6, 0.5]} />
            <meshStandardMaterial color={columnColor} roughness={0.9} />
          </mesh>
          {/* Hoist Trolley Cable */}
          <mesh position={[-3.8, -1.2, 0]}>
            <cylinderGeometry args={[0.015, 0.015, 2.4, 6]} />
            <meshBasicMaterial color={pipeColor} />
          </mesh>
        </group>
      </group>

      {/* SENSORS LAYER: 3D Spatial IoT Beacons */}
      {layers.sensors &&
        DEFAULT_SENSORS.map((sensor) => {
          const isSelected = selectedSensor?.id === sensor.id;
          const yPos = sensor.floor * (baseFloorHeight + explosionOffset) + 0.4;

          return (
            <group
              key={sensor.id}
              position={[sensor.position[0], yPos, sensor.position[2]]}
            >
              {/* Pulsing Beacon Orb */}
              <mesh position={[0, 0, 0]}>
                <sphereGeometry args={[isSelected ? 0.32 : 0.22, 16, 16]} />
                <meshStandardMaterial
                  color={gridPrimary}
                  emissive={gridPrimary}
                  emissiveIntensity={isSelected ? 1.0 : 0.6}
                />
              </mesh>

              {/* Sensor Pin Ring */}
              <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.35, 0.5, 16]} />
                <meshBasicMaterial
                  color={isLight ? "#D94F05" : "#FF6A13"}
                  side={THREE.DoubleSide}
                  transparent
                  opacity={0.8}
                />
              </mesh>

              {/* In-Scene Sensor Popover */}
              <Html position={[0, 0.6, 0]} center distanceFactor={20}>
                <div
                  onClick={() => {
                    setSelectedSensor(sensor);
                    if (onSelectSensor) onSelectSensor(sensor);
                  }}
                  className={`cursor-pointer px-2 py-1 rounded-xs font-mono text-[9px] border whitespace-nowrap shadow-plate transition-all backdrop-blur-sm ${isSelected
                      ? "bg-bg-0 border-amber text-amber scale-110"
                      : "bg-bg-1/95 border-border text-concrete hover:border-amber"
                    }`}
                >
                  <div className="font-bold text-foreground">{sensor.code}</div>
                  <div className="text-[8px] text-concrete">{sensor.value}</div>
                </div>
              </Html>
            </group>
          );
        })}

      {/* OrbitControls */}
      <OrbitControls
        makeDefault
        minDistance={8}
        maxDistance={35}
        maxPolarAngle={Math.PI / 2 - 0.05}
        enableDamping
        dampingFactor={0.06}
      />
    </>
  );
}
