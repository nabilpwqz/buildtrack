"use client";

import React, { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useFrame } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";

interface SkylineProject {
  id: string;
  name: string;
  progress: number;
  status: string;
  totalBudget: number;
  location: string;
}

interface SkylineProps {
  projects: SkylineProject[];
  isLight?: boolean;
}

function Building({
  project,
  position,
  isLight = false,
}: {
  project: SkylineProject;
  position: [number, number, number];
  isLight?: boolean;
}) {
  const router = useRouter();
  const [hovered, setHovered] = useState(false);
  const meshRef = useRef<THREE.Mesh>(null!);

  // Height proportional to progress (min height 1.5, max height 10)
  const height = Math.max(1.5, (project.progress / 100) * 10);

  // Color mapping strictly to Forged Steel & Molten Amber
  let color = isLight ? "#6E6862" : "#8C8782";
  if (project.status === "IN_PROGRESS") color = isLight ? "#D99300" : "#FFB000";
  else if (project.status === "COMPLETED") color = isLight ? "#B8920C" : "#E8C547";
  else if (project.status === "DELAYED") color = isLight ? "#C92A2A" : "#E03131";

  useFrame(() => {
    if (meshRef.current) {
      const targetScale = hovered ? 1.08 : 1.0;
      meshRef.current.scale.lerp(new THREE.Vector3(targetScale, 1, targetScale), 0.1);
    }
  });

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        position={[0, height / 2, 0]}
        onClick={() => router.push(`/projects/${project.id}`)}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[2.2, height, 2.2]} />
        <meshStandardMaterial
          color={color}
          metalness={0.7}
          roughness={0.3}
          wireframe={hovered}
        />

        {/* Windows / horizontal grooves */}
        <lineSegments position={[0, 0, 0]}>
          <edgesGeometry args={[new THREE.BoxGeometry(2.22, height, 2.22)]} />
          <lineBasicMaterial
            color={
              hovered
                ? isLight
                  ? "#171513"
                  : "#F4EFE6"
                : isLight
                ? "#D3CCC0"
                : "#171513"
            }
          />
        </lineSegments>
      </mesh>

      {/* Interactive Tooltip on hover */}
      {hovered && (
        <Html position={[0, height + 1.2, 0]} center distanceFactor={22}>
          <div className="pointer-events-none px-3 py-2 bg-bg-1/95 border border-amber rounded-xs shadow-plate text-left font-mono whitespace-nowrap z-50 backdrop-blur-sm">
            <div className="text-xs font-bold text-foreground">{project.name}</div>
            <div className="text-[10px] text-steel flex items-center justify-between gap-3 mt-1">
              <span>{project.location}</span>
              <span className="text-amber font-bold">{project.progress}% Complete</span>
            </div>
            <div className="text-[9px] text-concrete mt-0.5 uppercase tracking-wider">
              Status: <span style={{ color }}>{project.status.replace("_", " ")}</span>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

export default function SkylineScene({ projects, isLight = false }: SkylineProps) {
  // Dynamically calculate grid columns and plate dimensions to cleanly layout any number of projects
  const count = Math.max(projects.length, 1);
  const cols = Math.max(4, Math.ceil(Math.sqrt(count * 1.25)));
  const rows = Math.ceil(count / cols);
  const spacing = 5.2;
  const plateWidth = Math.max(36, cols * spacing + 6);
  const plateDepth = Math.max(32, rows * spacing + 6);

  return (
    <>
      <ambientLight
        intensity={isLight ? 0.95 : 0.7}
        color={isLight ? "#FFFFFF" : "#FFB000"}
      />
      <directionalLight
        position={[20, 30, 20]}
        intensity={isLight ? 1.8 : 1.6}
        color={isLight ? "#D99300" : "#F4EFE6"}
      />
      <pointLight
        position={[-15, 20, -15]}
        intensity={1.8}
        color={isLight ? "#D94F05" : "#FF6A13"}
      />

      {/* City Base Plate */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
        <planeGeometry args={[plateWidth, plateDepth]} />
        <meshStandardMaterial
          color={isLight ? "#DFD8CC" : "#171513"}
          roughness={0.9}
        />
      </mesh>
      <gridHelper
        args={[Math.max(plateWidth, plateDepth), Math.max(cols, rows) * 4, isLight ? "#D99300" : "#FFB000", isLight ? "#D3CCC0" : "#2F2A25"]}
        position={[0, 0.01, 0]}
      />

      {/* Buildings */}
      {projects.map((proj, idx) => {
        const row = Math.floor(idx / cols);
        const col = idx % cols;
        const x = (col - (cols - 1) / 2) * spacing;
        const z = (row - (rows - 1) / 2) * spacing;

        return (
          <Building
            key={proj.id}
            project={proj}
            position={[x, 0, z]}
            isLight={isLight}
          />
        );
      })}

      <OrbitControls
        enableZoom={true}
        maxPolarAngle={Math.PI / 2.2}
        minPolarAngle={Math.PI / 6}
        autoRotate={true}
        autoRotateSpeed={0.5}
      />
    </>
  );
}
