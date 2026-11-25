"use client";

import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";

interface MilestoneFloor {
  id: string;
  title: string;
  order: number;
  status: string; // PENDING, IN_PROGRESS, COMPLETED
}

interface BuildingFloorsProps {
  milestones: MilestoneFloor[];
  progress: number;
  isLight?: boolean;
}

function Floor({
  milestone,
  index,
  total,
  progress,
  isLight = false,
}: {
  milestone: MilestoneFloor;
  index: number;
  total: number;
  progress: number;
  isLight?: boolean;
}) {
  const pulseRef = useRef<THREE.MeshStandardMaterial>(null!);

  const floorThreshold = ((index + 1) / total) * 100;
  const prevFloorThreshold = (index / total) * 100;

  const isCompleted = milestone.status === "COMPLETED" || progress >= floorThreshold;
  const isInProgress =
    milestone.status === "IN_PROGRESS" ||
    (progress > prevFloorThreshold && progress < floorThreshold);

  useFrame(({ clock }) => {
    if (isInProgress && pulseRef.current) {
      pulseRef.current.opacity = 0.4 + Math.sin(clock.getElapsedTime() * 3) * 0.35;
    }
  });

  const yPos = index * 2.2 + 1.1;

  const completedColor = isLight ? "#D99300" : "#FFB000";
  const activeColor = isLight ? "#D94F05" : "#FF6A13";
  const pendingColor = isLight ? "#D3CCC0" : "#211E1B";
  const outlineColor = isCompleted
    ? isLight
      ? "#171513"
      : "#F4EFE6"
    : isLight
    ? "#D3CCC0"
    : "#2F2A25";

  return (
    <group position={[0, yPos, 0]}>
      {isCompleted ? (
        // Completed: Solid Amber with steel trim
        <mesh>
          <boxGeometry args={[4.5, 1.8, 4.5]} />
          <meshStandardMaterial
            color={completedColor}
            metalness={0.7}
            roughness={0.3}
          />
          <lineSegments>
            <edgesGeometry args={[new THREE.BoxGeometry(4.55, 1.85, 4.55)]} />
            <lineBasicMaterial color={outlineColor} />
          </lineSegments>
        </mesh>
      ) : isInProgress ? (
        // In Progress: Pulsing Wireframe with Molten Amber tint
        <mesh>
          <boxGeometry args={[4.5, 1.8, 4.5]} />
          <meshStandardMaterial
            ref={pulseRef}
            color={activeColor}
            wireframe={true}
            transparent={true}
            opacity={0.6}
          />
        </mesh>
      ) : (
        // Pending: Dark/Subtle Blueprint Outline
        <mesh>
          <boxGeometry args={[4.5, 1.8, 4.5]} />
          <meshStandardMaterial
            color={pendingColor}
            wireframe={true}
            transparent={true}
            opacity={0.25}
          />
        </mesh>
      )}

      {/* Level Tag HUD */}
      <Html position={[2.6, 0, 2.6]} distanceFactor={14}>
        <div className="text-[9px] font-mono px-2 py-0.5 bg-bg-1/90 border border-border rounded-xs text-foreground whitespace-nowrap shadow-plate">
          <span className="text-amber font-bold">L{index + 1}: </span>
          <span>{milestone.title.substring(0, 16)}</span>
        </div>
      </Html>
    </group>
  );
}

export default function BuildingFloorsScene({
  milestones,
  progress,
  isLight = false,
}: BuildingFloorsProps) {
  const displayMilestones =
    milestones.length > 0
      ? milestones
      : [
          { id: "1", title: "Substructure & Foundation", order: 1, status: "COMPLETED" },
          { id: "2", title: "Framing & Structural Slab", order: 2, status: "IN_PROGRESS" },
          { id: "3", title: "Enclosure & Facades", order: 3, status: "PENDING" },
          { id: "4", title: "MEP Services Rigging", order: 4, status: "PENDING" },
          { id: "5", title: "Interior Fitout & Handover", order: 5, status: "PENDING" },
        ];

  return (
    <>
      <ambientLight
        intensity={isLight ? 0.95 : 0.8}
        color={isLight ? "#FFFFFF" : "#FFB000"}
      />
      <directionalLight
        position={[15, 25, 15]}
        intensity={isLight ? 2.0 : 1.8}
        color={isLight ? "#D99300" : "#F4EFE6"}
      />
      <pointLight
        position={[-10, 15, -10]}
        intensity={1.5}
        color={isLight ? "#D94F05" : "#FF6A13"}
      />

      {/* Ground Foundation Base */}
      <mesh position={[0, -0.2, 0]}>
        <boxGeometry args={[7, 0.4, 7]} />
        <meshStandardMaterial
          color={isLight ? "#DFD8CC" : "#0E0D0C"}
          roughness={0.9}
        />
      </mesh>

      {displayMilestones.map((m, idx) => (
        <Floor
          key={m.id}
          milestone={m}
          index={idx}
          total={displayMilestones.length}
          progress={progress}
          isLight={isLight}
        />
      ))}

      <OrbitControls
        enableZoom={true}
        maxPolarAngle={Math.PI / 2.2}
        minPolarAngle={Math.PI / 6}
      />
    </>
  );
}
