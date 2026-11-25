"use client";

import React, { useRef, useState, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";

export interface SurveyWaypoint {
  id: string;
  name: string;
  code: string;
  altitude: number;
  progress: number;
  status: "SURVEYED" | "IN_PROGRESS" | "PENDING";
  position: [number, number, number];
  photoCount: number;
  notes: string;
}

const DEFAULT_WAYPOINTS: SurveyWaypoint[] = [
  {
    id: "wp-1",
    name: "Foundation & Piling Zone",
    code: "WP-01",
    altitude: 14.5,
    progress: 100,
    status: "SURVEYED",
    position: [-8, 2.5, -6],
    photoCount: 42,
    notes: "Deep pile caps certified. No ground settlement detected.",
  },
  {
    id: "wp-2",
    name: "Core Structural Tower",
    code: "WP-02",
    altitude: 28.0,
    progress: 88,
    status: "IN_PROGRESS",
    position: [0, 8.5, 0],
    photoCount: 68,
    notes: "Level 7 slipform rebar inspection in progress.",
  },
  {
    id: "wp-3",
    name: "Tower Crane Mast & Jib",
    code: "WP-03",
    altitude: 35.0,
    progress: 95,
    status: "SURVEYED",
    position: [6, 12.0, -4],
    photoCount: 24,
    notes: "Guy-wire tension nominal. Wind speed safe at 14 knots.",
  },
  {
    id: "wp-4",
    name: "Material Staging Yard",
    code: "WP-04",
    altitude: 12.0,
    progress: 72,
    status: "PENDING",
    position: [8, 1.8, 7],
    photoCount: 19,
    notes: "Structural steel girder delivery inventory verified.",
  },
  {
    id: "wp-5",
    name: "South Retention Embankment",
    code: "WP-05",
    altitude: 16.0,
    progress: 60,
    status: "PENDING",
    position: [-7, 2.0, 7],
    photoCount: 15,
    notes: "Drainage runoff channel reinforcement pending certification.",
  },
];

// Drone Model with 4 rotating rotors and scanning spotlight
function Drone({
  position,
  rotation,
  isLight = false,
}: {
  position: [number, number, number];
  rotation: number;
  isLight?: boolean;
}) {
  const rotor1 = useRef<THREE.Mesh>(null!);
  const rotor2 = useRef<THREE.Mesh>(null!);
  const rotor3 = useRef<THREE.Mesh>(null!);
  const rotor4 = useRef<THREE.Mesh>(null!);
  const lightRef = useRef<THREE.SpotLight>(null!);

  const fuselageColor = isLight ? "#3D3935" : "#171513";
  const armColor = isLight ? "#6E6862" : "#8C8782";
  const motorColor = isLight ? "#6E6862" : "#211E1B";
  const accentAmber = isLight ? "#D99300" : "#FFB000";

  useFrame((_, delta) => {
    const speed = delta * 45;
    if (rotor1.current) rotor1.current.rotation.y += speed;
    if (rotor2.current) rotor2.current.rotation.y -= speed;
    if (rotor3.current) rotor3.current.rotation.y += speed;
    if (rotor4.current) rotor4.current.rotation.y -= speed;
  });

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Central Drone Fuselage */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.9, 0.22, 0.9]} />
        <meshStandardMaterial color={fuselageColor} metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Amber LiDAR Dome on Top */}
      <mesh position={[0, 0.18, 0]}>
        <cylinderGeometry args={[0.2, 0.25, 0.15, 16]} />
        <meshStandardMaterial
          color={accentAmber}
          emissive={accentAmber}
          emissiveIntensity={0.8}
          metalness={0.6}
        />
      </mesh>

      {/* 4 Carbon Arms */}
      {[
        [-0.7, 0, -0.7],
        [0.7, 0, -0.7],
        [-0.7, 0, 0.7],
        [0.7, 0, 0.7],
      ].map(([x, y, z], idx) => (
        <group key={idx} position={[x, y, z]}>
          <mesh>
            <cylinderGeometry args={[0.04, 0.04, 1.0, 8]} />
            <meshStandardMaterial color={armColor} metalness={0.8} />
          </mesh>
          {/* Motor Pod */}
          <mesh position={[0, 0.08, 0]}>
            <cylinderGeometry args={[0.12, 0.12, 0.16, 12]} />
            <meshStandardMaterial color={motorColor} metalness={0.7} />
          </mesh>
        </group>
      ))}

      {/* 4 Propellers */}
      <mesh ref={rotor1} position={[-0.7, 0.18, -0.7]}>
        <boxGeometry args={[0.7, 0.015, 0.08]} />
        <meshStandardMaterial color={accentAmber} transparent opacity={0.8} />
      </mesh>
      <mesh ref={rotor2} position={[0.7, 0.18, -0.7]}>
        <boxGeometry args={[0.7, 0.015, 0.08]} />
        <meshStandardMaterial color={accentAmber} transparent opacity={0.8} />
      </mesh>
      <mesh ref={rotor3} position={[-0.7, 0.18, 0.7]}>
        <boxGeometry args={[0.7, 0.015, 0.08]} />
        <meshStandardMaterial color={accentAmber} transparent opacity={0.8} />
      </mesh>
      <mesh ref={rotor4} position={[0.7, 0.18, 0.7]}>
        <boxGeometry args={[0.7, 0.015, 0.08]} />
        <meshStandardMaterial color={accentAmber} transparent opacity={0.8} />
      </mesh>

      {/* Downward LiDAR Scan Cone */}
      <mesh position={[0, -2.5, 0]}>
        <coneGeometry args={[2.8, 5.0, 24, 1, true]} />
        <meshBasicMaterial
          color={accentAmber}
          transparent
          opacity={0.12}
          side={THREE.DoubleSide}
          wireframe
        />
      </mesh>

      {/* Downward Spotlight */}
      <spotLight
        ref={lightRef}
        position={[0, -0.1, 0]}
        angle={0.5}
        penumbra={0.6}
        intensity={3.5}
        color={accentAmber}
        distance={25}
      />
    </group>
  );
}

// LiDAR Point Cloud Particles over the site
function LidarPointCloud({ count = 280, isLight = false }: { count?: number; isLight?: boolean }) {
  const pointsRef = useRef<THREE.Points>(null!);

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const colorAmber = new THREE.Color(isLight ? "#D99300" : "#FFB000");
    const colorMolten = new THREE.Color(isLight ? "#D94F05" : "#FF6A13");
    const colorSteel = new THREE.Color(isLight ? "#6E6862" : "#8C8782");

    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 26;
      const z = (Math.random() - 0.5) * 26;
      const distFromCenter = Math.sqrt(x * x + z * z);
      const y = Math.max(0.2, (1 - distFromCenter / 18) * 8 * Math.random() + 0.4);

      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;

      const chosenColor = y > 4 ? colorMolten : y > 1.5 ? colorAmber : colorSteel;
      col[i * 3] = chosenColor.r;
      col[i * 3 + 1] = chosenColor.g;
      col[i * 3 + 2] = chosenColor.b;
    }
    return [pos, col];
  }, [count, isLight]);

  useFrame((state) => {
    if (!pointsRef.current) return;
    const t = state.clock.getElapsedTime();
    pointsRef.current.rotation.y = t * 0.03;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.16}
        vertexColors
        transparent
        opacity={isLight ? 0.6 : 0.75}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// Terrain Mesh with contour lines
function TerrainMesh({ isLight = false }: { isLight?: boolean }) {
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(32, 32, 28, 28);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const r = Math.sqrt(x * x + y * y);
      let z = Math.sin(x * 0.25) * Math.cos(y * 0.25) * 1.4;
      if (r < 6) {
        z -= (6 - r) * 0.45;
      }
      pos.setZ(i, z);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  return (
    <group rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
      {/* Solid Terrain Surface */}
      <mesh geometry={geometry} receiveShadow>
        <meshStandardMaterial
          color={isLight ? "#DFD8CC" : "#171513"}
          roughness={0.95}
          metalness={0.15}
          wireframe={false}
        />
      </mesh>

      {/* Topographic Contour Wireframe Overlay */}
      <mesh geometry={geometry} position={[0, 0, 0.02]}>
        <meshBasicMaterial
          color={isLight ? "#D99300" : "#FFB000"}
          wireframe
          transparent
          opacity={isLight ? 0.35 : 0.22}
        />
      </mesh>
    </group>
  );
}

export interface DroneSurveyProps {
  waypoints?: SurveyWaypoint[];
  onWaypointSelect?: (wp: SurveyWaypoint) => void;
  isLight?: boolean;
}

export default function DroneSurveyScene({
  waypoints = DEFAULT_WAYPOINTS,
  onWaypointSelect,
  isLight = false,
}: DroneSurveyProps) {
  const [selectedWp, setSelectedWp] = useState<SurveyWaypoint | null>(waypoints[1] || null);
  const [hoveredWp, setHoveredWp] = useState<string | null>(null);

  // Drone position along flight path
  const [dronePos, setDronePos] = useState<[number, number, number]>([0, 9, 0]);
  const [droneRotation, setDroneRotation] = useState(0);

  // Flight circuit animation
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * 0.35;
    const n = waypoints.length;
    if (n === 0) return;

    const curIdx = Math.floor(t) % n;
    const nextIdx = (curIdx + 1) % n;
    const fraction = t - Math.floor(t);

    const wpA = waypoints[curIdx];
    const wpB = waypoints[nextIdx];

    const x = wpA.position[0] + (wpB.position[0] - wpA.position[0]) * fraction;
    const y = Math.max(wpA.position[1], wpB.position[1]) + 4 + Math.sin(fraction * Math.PI) * 1.5;
    const z = wpA.position[2] + (wpB.position[2] - wpA.position[2]) * fraction;

    const angle = Math.atan2(
      wpB.position[0] - wpA.position[0],
      wpB.position[2] - wpA.position[2]
    );

    setDronePos([x, y, z]);
    setDroneRotation(angle);
  });

  const handleSelect = (wp: SurveyWaypoint) => {
    setSelectedWp(wp);
    if (onWaypointSelect) onWaypointSelect(wp);
  };

  const gridPrimary = isLight ? "#D99300" : "#FFB000";
  const gridSecondary = isLight ? "#D3CCC0" : "#2F2A25";
  const pillarColor = isLight ? "#6E6862" : "#8C8782";

  return (
    <>
      <ambientLight
        intensity={isLight ? 0.95 : 0.65}
        color={isLight ? "#FFFFFF" : "#FFB000"}
      />
      <directionalLight
        position={[18, 26, 18]}
        intensity={isLight ? 2.2 : 2.0}
        color={isLight ? "#D99300" : "#F4EFE6"}
        castShadow
      />
      <pointLight
        position={[-14, 18, -14]}
        intensity={1.5}
        color={isLight ? "#D94F05" : "#FF6A13"}
      />

      {/* Grid Reference Floor */}
      <gridHelper args={[34, 34, gridPrimary, gridSecondary]} position={[0, -0.48, 0]} />

      {/* Digital Elevation Model (DEM) Terrain */}
      <TerrainMesh isLight={isLight} />

      {/* Live LiDAR Point Cloud */}
      <LidarPointCloud count={320} isLight={isLight} />

      {/* Flight Path Line connecting waypoints */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[
              new Float32Array(
                waypoints.flatMap((w) => [w.position[0], w.position[1] + 3.5, w.position[2]])
              ),
              3,
            ]}
          />
        </bufferGeometry>
        <lineDashedMaterial
          color={gridPrimary}
          dashSize={0.6}
          gapSize={0.3}
          linewidth={2}
          transparent
          opacity={0.7}
        />
      </line>

      {/* Waypoint Markers */}
      {waypoints.map((wp) => {
        const isSelected = selectedWp?.id === wp.id;
        const isHovered = hoveredWp === wp.id;
        const markerColor =
          wp.status === "SURVEYED"
            ? isLight
              ? "#B8920C"
              : "#E8C547"
            : wp.status === "IN_PROGRESS"
            ? isLight
              ? "#D99300"
              : "#FFB000"
            : isLight
            ? "#6E6862"
            : "#8C8782";

        return (
          <group
            key={wp.id}
            position={wp.position}
            onClick={(e) => {
              e.stopPropagation();
              handleSelect(wp);
            }}
            onPointerOver={(e) => {
              e.stopPropagation();
              setHoveredWp(wp.id);
            }}
            onPointerOut={() => setHoveredWp(null)}
          >
            {/* Ground Anchor Pillar */}
            <mesh position={[0, 1.0, 0]}>
              <cylinderGeometry args={[0.08, 0.08, 2.0, 8]} />
              <meshStandardMaterial color={pillarColor} />
            </mesh>

            {/* Glowing Waypoint Orb */}
            <mesh position={[0, 2.2, 0]}>
              <sphereGeometry args={[isSelected || isHovered ? 0.45 : 0.32, 16, 16]} />
              <meshStandardMaterial
                color={markerColor}
                emissive={markerColor}
                emissiveIntensity={isSelected ? 0.9 : 0.5}
                wireframe={wp.status === "IN_PROGRESS"}
              />
            </mesh>

            {/* Pulsing Target Ring */}
            <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.8, 1.1, 24]} />
              <meshBasicMaterial
                color={markerColor}
                transparent
                opacity={isSelected ? 0.8 : 0.35}
                side={THREE.DoubleSide}
              />
            </mesh>

            {/* In-Scene Waypoint Telemetry Label */}
            <Html position={[0, 3.2, 0]} center distanceFactor={24}>
              <div
                onClick={() => handleSelect(wp)}
                className={`cursor-pointer px-2.5 py-1.5 rounded-xs font-mono text-[10px] whitespace-nowrap border transition-all backdrop-blur-sm ${
                  isSelected
                    ? "bg-bg-0 border-amber text-amber shadow-plate scale-105"
                    : "bg-bg-1/95 border-border text-concrete hover:border-amber/60"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-foreground">{wp.code}</span>
                  <span className="text-[9px] text-steel">{wp.altitude}m ALT</span>
                </div>
                <div className="text-[9px] uppercase tracking-wider mt-0.5 text-concrete">
                  {wp.name.substring(0, 18)}
                </div>
              </div>
            </Html>
          </group>
        );
      })}

      {/* Autonomous Survey Drone */}
      <Drone position={dronePos} rotation={droneRotation} isLight={isLight} />

      {/* Controls */}
      <OrbitControls
        makeDefault
        minDistance={8}
        maxDistance={45}
        maxPolarAngle={Math.PI / 2 - 0.05}
        enableDamping
        dampingFactor={0.06}
      />
    </>
  );
}
