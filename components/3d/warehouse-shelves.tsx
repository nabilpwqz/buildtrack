"use client";

import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";

interface CategoryStock {
  categoryId: string;
  categoryName: string;
  itemCount: number;
  totalQty: number;
  hasLowStock: boolean;
}

interface WarehouseShelvesProps {
  categories: CategoryStock[];
  isLight?: boolean;
}

function ShelfBay({
  category,
  index,
  total,
  isLight = false,
}: {
  category: CategoryStock;
  index: number;
  total: number;
  isLight?: boolean;
}) {
  const x = (index - (total - 1) / 2) * 4.5;
  const glowRef = useRef<THREE.MeshStandardMaterial>(null!);

  useFrame(({ clock }) => {
    if (category.hasLowStock && glowRef.current) {
      glowRef.current.emissiveIntensity =
        0.5 + Math.sin(clock.getElapsedTime() * 4) * 0.4;
    }
  });

  // Calculate number of visible crates on shelf (1 to 6)
  const crateCount = Math.min(6, Math.max(1, Math.round(category.itemCount)));

  const uprightColor = isLight ? "#6E6862" : "#8C8782";
  const beamColor = isLight ? "#D99300" : "#FFB000";
  const crateColor = isLight ? "#9E4E20" : "#B8602E";
  const hazardColor = isLight ? "#D94F05" : "#FF6A13";

  return (
    <group position={[x, 0, 0]}>
      {/* Heavy Industrial Steel Shelf Rack */}
      {/* Upright Posts */}
      {[-1.5, 1.5].map((px) =>
        [-0.8, 0.8].map((pz) => (
          <mesh key={`post-${px}-${pz}`} position={[px, 3, pz]}>
            <boxGeometry args={[0.15, 6, 0.15]} />
            <meshStandardMaterial color={uprightColor} metalness={0.8} roughness={0.3} />
          </mesh>
        ))
      )}

      {/* Cross Beams (3 tiers) */}
      {[0.5, 2.5, 4.5].map((y) => (
        <mesh key={`tier-${y}`} position={[0, y, 0]}>
          <boxGeometry args={[3.2, 0.12, 1.8]} />
          <meshStandardMaterial color={beamColor} metalness={0.6} roughness={0.4} />
        </mesh>
      ))}

      {/* Storage Crates Stacked on shelves */}
      {Array.from({ length: crateCount }).map((_, cIdx) => {
        const tier = cIdx < 2 ? 0.9 : cIdx < 4 ? 2.9 : 4.9;
        const xOffset = (cIdx % 2 === 0 ? -0.7 : 0.7);
        const zOffset = 0;

        return (
          <mesh key={`crate-${cIdx}`} position={[xOffset, tier, zOffset]}>
            <boxGeometry args={[0.9, 0.7, 0.9]} />
            <meshStandardMaterial
              ref={cIdx === 0 && category.hasLowStock ? glowRef : undefined}
              color={category.hasLowStock && cIdx === 0 ? hazardColor : crateColor}
              emissive={category.hasLowStock && cIdx === 0 ? hazardColor : "#000000"}
              emissiveIntensity={category.hasLowStock && cIdx === 0 ? 0.6 : 0}
              metalness={0.4}
              roughness={0.7}
            />
          </mesh>
        );
      })}

      {/* Label */}
      <Html position={[0, -0.6, 1.2]} center distanceFactor={18}>
        <div className="text-[10px] font-mono text-center uppercase tracking-wider text-concrete select-none pointer-events-none whitespace-nowrap">
          <div className="font-bold text-foreground">{category.categoryName.substring(0, 15)}</div>
          <div className={category.hasLowStock ? (isLight ? "text-[#D94F05] font-bold" : "text-[#FF6A13] font-bold") : (isLight ? "text-[#D99300]" : "text-[#FFB000]")}>
            {category.hasLowStock ? "⚠ LOW STOCK" : `${category.totalQty} Units`}
          </div>
        </div>
      </Html>
    </group>
  );
}

export default function WarehouseShelvesScene({
  categories,
  isLight = false,
}: WarehouseShelvesProps) {
  const displayCategories =
    categories.length > 0
      ? categories
      : [
          { categoryId: "1", categoryName: "Cement & Binders", itemCount: 6, totalQty: 2900, hasLowStock: true },
          { categoryId: "2", categoryName: "Steel & Rebar", itemCount: 5, totalQty: 320, hasLowStock: true },
          { categoryId: "3", categoryName: "Aggregates & Sands", itemCount: 4, totalQty: 48000, hasLowStock: false },
          { categoryId: "4", categoryName: "Electrical & Piping", itemCount: 3, totalQty: 890, hasLowStock: false },
          { categoryId: "5", categoryName: "Heavy Machinery", itemCount: 2, totalQty: 620, hasLowStock: true },
          { categoryId: "6", categoryName: "Finishing Additives", itemCount: 4, totalQty: 440, hasLowStock: false },
        ];

  const gridPrimary = isLight ? "#D99300" : "#FFB000";
  const gridSecondary = isLight ? "#D3CCC0" : "#2F2A25";

  return (
    <>
      <ambientLight
        intensity={isLight ? 0.95 : 0.7}
        color={isLight ? "#FFFFFF" : "#FFB000"}
      />
      <directionalLight
        position={[15, 25, 20]}
        intensity={isLight ? 2.0 : 1.8}
        color={isLight ? "#D99300" : "#F4EFE6"}
      />
      <pointLight
        position={[-15, 15, -10]}
        intensity={1.5}
        color={isLight ? "#D94F05" : "#FF6A13"}
      />

      {/* Concrete Warehouse Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
        <planeGeometry args={[35, 20]} />
        <meshStandardMaterial
          color={isLight ? "#DFD8CC" : "#171513"}
          roughness={0.9}
        />
      </mesh>
      <gridHelper args={[34, 17, gridPrimary, gridSecondary]} position={[0, 0.01, 0]} />

      {displayCategories.map((cat, idx) => (
        <ShelfBay
          key={cat.categoryId || idx}
          category={cat}
          index={idx}
          total={displayCategories.length}
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
