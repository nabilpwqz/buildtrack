"use client";

import React, { useRef, useState } from "react";
import { OrbitControls, Html } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

export interface BudgetCategoryData {
  category: string;
  code?: string;
  categoryCode?: string;
  allocated: number;
  spent: number;
  remaining?: number;
  utilizationPct?: number;
  isOverrun: boolean;
}

export type CameraPreset = "isometric" | "front" | "aerial";

interface BudgetTowersProps {
  categories: BudgetCategoryData[];
  isLight?: boolean;
  autoRotate?: boolean;
  cameraPreset?: CameraPreset;
  selectedCategoryCode?: string | null;
  onSelectCategory?: (item: BudgetCategoryData) => void;
}

function CameraController({ preset }: { preset: CameraPreset }) {
  const { camera } = useThree();
  const targetPos = useRef(new THREE.Vector3(0, 10, 18));

  React.useEffect(() => {
    if (preset === "isometric") targetPos.current.set(0, 10, 18);
    else if (preset === "front") targetPos.current.set(0, 4.5, 20);
    else if (preset === "aerial") targetPos.current.set(0, 21, 7);
  }, [preset]);

  useFrame((_, delta) => {
    camera.position.lerp(targetPos.current, Math.min(1, delta * 3.5));
  });

  return null;
}

function TowerPair({
  item,
  index,
  total,
  maxAmount,
  isLight = false,
  isSelected = false,
  onSelect,
}: {
  item: BudgetCategoryData;
  index: number;
  total: number;
  maxAmount: number;
  isLight?: boolean;
  isSelected?: boolean;
  onSelect?: (item: BudgetCategoryData) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const allocRef = useRef<THREE.Mesh>(null);
  const spentRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const progressRef = useRef(0);

  const spacing = Math.min(3.8, Math.max(2.6, 26 / Math.max(1, total)));
  const x = (index - (total - 1) / 2) * spacing;

  const scale = 8.5 / Math.max(1, maxAmount);
  const allocHeight = Math.max(0.7, item.allocated * scale);
  const spentHeight = Math.max(0.7, item.spent * scale);

  const utilization =
    item.utilizationPct ??
    (item.allocated > 0 ? Math.round((item.spent / item.allocated) * 100) : item.spent > 0 ? 100 : 0);

  const codeLabel = item.categoryCode || item.code || item.category.substring(0, 10);

  const spentColor = item.isOverrun
    ? isLight
      ? "#C92A2A"
      : "#E03131"
    : isLight
    ? "#D97706"
    : "#F59E0B";
  const allocColor = isLight ? "#6E6862" : "#78716C";
  const platformColor = isSelected
    ? "#D97706"
    : hovered
    ? "#44403C"
    : isLight
    ? "#D3CCC0"
    : "#1C1917";

  useFrame((state, delta) => {
    progressRef.current = Math.min(1, progressRef.current + delta * 2.2);
    const ease = 1 - Math.pow(1 - progressRef.current, 3);

    if (allocRef.current) {
      allocRef.current.scale.y = Math.max(0.01, ease);
      allocRef.current.position.y = (allocHeight * ease) / 2;
    }
    if (spentRef.current) {
      spentRef.current.scale.y = Math.max(0.01, ease);
      spentRef.current.position.y = (spentHeight * ease) / 2;
    }
    if (ringRef.current && item.isOverrun) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 4) * 0.08;
      ringRef.current.scale.set(pulse, 1, pulse);
    }
  });

  return (
    <group
      position={[x, 0, 0]}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = "auto";
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.(item);
      }}
    >
      {/* Allocated Tower (Forged Steel Cylinder) */}
      <mesh ref={allocRef} position={[-0.62, allocHeight / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.46, 0.5, allocHeight, 32]} />
        <meshStandardMaterial
          color={allocColor}
          metalness={0.85}
          roughness={0.28}
          emissive={hovered || isSelected ? "#44403C" : "#000000"}
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* Steel Top Cap Ring */}
      <mesh position={[-0.62, allocHeight + 0.03, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.47, 0.03, 12, 32]} />
        <meshStandardMaterial color="#A8A29E" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Spent Tower (Molten Amber or Crimson Overrun Cylinder) */}
      <mesh ref={spentRef} position={[0.62, spentHeight / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.46, 0.5, spentHeight, 32]} />
        <meshStandardMaterial
          color={spentColor}
          metalness={0.75}
          roughness={0.2}
          emissive={item.isOverrun ? "#991B1B" : "#B45309"}
          emissiveIntensity={hovered || isSelected ? 0.65 : 0.35}
        />
      </mesh>

      {/* 100% Allocation Threshold Ring around Spent Tower when Overrun */}
      {item.isOverrun && (
        <mesh ref={ringRef} position={[0.62, allocHeight, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.62, 0.045, 16, 32]} />
          <meshStandardMaterial
            color="#EF4444"
            emissive="#EF4444"
            emissiveIntensity={1.2}
          />
        </mesh>
      )}

      {/* Base Platform */}
      <mesh position={[0, -0.1, 0]} receiveShadow>
        <boxGeometry args={[2.7, 0.2, 2.0]} />
        <meshStandardMaterial
          color={platformColor}
          metalness={0.6}
          roughness={0.5}
        />
      </mesh>

      {/* Selection / Hover Rim */}
      {(hovered || isSelected) && (
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.15, 1.25, 32]} />
          <meshBasicMaterial color={item.isOverrun ? "#EF4444" : "#F59E0B"} />
        </mesh>
      )}

      {/* Floating Telemetry Label */}
      <Html position={[0, -0.65, 1.05]} center distanceFactor={17}>
        <div
          className={`px-2 py-1 rounded-xs text-[10px] font-mono text-center uppercase tracking-wider whitespace-nowrap select-none pointer-events-none border transition ${
            isSelected
              ? "bg-bg-0/95 border-amber text-foreground shadow-lg"
              : hovered
              ? "bg-bg-0/90 border-amber/60 text-foreground"
              : "bg-bg-0/75 border-border/60 text-concrete"
          }`}
        >
          <div className="font-bold text-foreground flex items-center justify-center gap-1.5">
            <span>{codeLabel}</span>
            <span className={item.isOverrun ? "text-crimson" : "text-amber"}>
              {utilization}%
            </span>
          </div>
          <div className={item.isOverrun ? "text-crimson font-bold" : "text-amber"}>
            ${Math.round(item.spent / 1000)}k / ${Math.round(item.allocated / 1000)}k
          </div>
        </div>
      </Html>
    </group>
  );
}

export default function BudgetTowersScene({
  categories,
  isLight = false,
  autoRotate = false,
  cameraPreset = "isometric",
  selectedCategoryCode = null,
  onSelectCategory,
}: BudgetTowersProps) {
  const maxAmount = Math.max(
    ...categories.map((c) => Math.max(c.allocated, c.spent)),
    100000
  );

  return (
    <>
      <CameraController preset={cameraPreset} />

      <ambientLight
        intensity={isLight ? 0.95 : 0.65}
        color={isLight ? "#FFFFFF" : "#F59E0B"}
      />
      <directionalLight
        position={[15, 22, 15]}
        intensity={isLight ? 2.0 : 1.9}
        color={isLight ? "#D99300" : "#F4EFE6"}
        castShadow
      />
      <pointLight
        position={[-12, 14, -10]}
        intensity={1.5}
        color={isLight ? "#D97706" : "#FF6A13"}
      />

      {/* Base Industrial Grid & Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.22, 0]} receiveShadow>
        <planeGeometry args={[42, 22]} />
        <meshStandardMaterial
          color={isLight ? "#DFD8CC" : "#0C0A09"}
          roughness={0.85}
          metalness={0.2}
        />
      </mesh>
      <gridHelper args={[42, 28, "#D97706", "#292524"]} position={[0, -0.21, 0]} />

      {categories.map((item, idx) => {
        const code = item.categoryCode || item.code || item.category;
        return (
          <TowerPair
            key={code || idx}
            item={item}
            index={idx}
            total={categories.length}
            maxAmount={maxAmount}
            isLight={isLight}
            isSelected={selectedCategoryCode === code}
            onSelect={onSelectCategory}
          />
        );
      })}

      <OrbitControls
        enableZoom={true}
        autoRotate={autoRotate}
        autoRotateSpeed={0.9}
        maxPolarAngle={Math.PI / 2.1}
        minPolarAngle={Math.PI / 8}
      />
    </>
  );
}
