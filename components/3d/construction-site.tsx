"use client";

import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { OrbitControls } from "@react-three/drei";

function AmberParticles({ count = 120, isLight = false }: { count?: number; isLight?: boolean }) {
  const pointsRef = useRef<THREE.Points>(null!);

  const { positions, speeds } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const spd = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 40;
      pos[i * 3 + 1] = Math.random() * 25;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 40;
      spd[i] = 0.02 + Math.random() * 0.03;
    }
    return { positions: pos, speeds: spd };
  }, [count]);

  useFrame(() => {
    if (!pointsRef.current) return;
    const pos = pointsRef.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 1] += speeds[i];
      if (pos[i * 3 + 1] > 25) {
        pos[i * 3 + 1] = 0;
      }
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
        size={0.25}
        color={isLight ? "#D99300" : "#FFB000"}
        transparent
        opacity={isLight ? 0.45 : 0.65}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function TowerCrane({ isLight = false }: { isLight?: boolean }) {
  const jibRef = useRef<THREE.Group>(null!);
  const hookRef = useRef<THREE.Mesh>(null!);

  const craneColor = isLight ? "#D99300" : "#FFB000";
  const cabColor = isLight ? "#3D3935" : "#171513";
  const counterweightColor = isLight ? "#6E6862" : "#211E1B";
  const hookColor = isLight ? "#D94F05" : "#FF6A13";

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (jibRef.current) {
      jibRef.current.rotation.y = Math.sin(t * 0.3) * 0.8 + 0.5;
    }
    if (hookRef.current) {
      hookRef.current.position.y = -3 + Math.sin(t * 0.8) * 1.2;
    }
  });

  return (
    <group position={[4, 0, -3]}>
      {/* Tower Mast */}
      <mesh position={[0, 9, 0]}>
        <boxGeometry args={[0.8, 18, 0.8]} />
        <meshStandardMaterial color={craneColor} metalness={0.6} roughness={0.3} />
      </mesh>

      {/* Rotating Jib & Operator Cab */}
      <group ref={jibRef} position={[0, 18, 0]}>
        {/* Cab */}
        <mesh position={[0.6, -0.6, 0]}>
          <boxGeometry args={[1, 1.2, 0.8]} />
          <meshStandardMaterial color={cabColor} metalness={0.8} roughness={0.2} />
        </mesh>

        {/* Long Horizontal Jib Arm */}
        <mesh position={[6, 0.6, 0]}>
          <boxGeometry args={[14, 0.5, 0.6]} />
          <meshStandardMaterial color={craneColor} metalness={0.6} roughness={0.3} />
        </mesh>

        {/* Counter Jib & Weights */}
        <mesh position={[-3, 0.6, 0]}>
          <boxGeometry args={[6, 0.5, 0.6]} />
          <meshStandardMaterial color={craneColor} metalness={0.6} roughness={0.3} />
        </mesh>
        <mesh position={[-5.2, 0.2, 0]}>
          <boxGeometry args={[1.5, 1.2, 1]} />
          <meshStandardMaterial color={counterweightColor} metalness={0.9} roughness={0.5} />
        </mesh>

        {/* Trolley and Cable */}
        <group position={[8, 0.2, 0]}>
          <mesh position={[0, -0.2, 0]}>
            <boxGeometry args={[0.8, 0.4, 0.7]} />
            <meshStandardMaterial color={hookColor} />
          </mesh>
          <mesh ref={hookRef} position={[0, -3, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 6, 8]} />
            <meshBasicMaterial color={isLight ? "#B8920C" : "#E8C547"} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

function BuildingFraming({ isLight = false }: { isLight?: boolean }) {
  const columnColor = isLight ? "#6E6862" : "#8C8782";
  const slabColor = isLight ? "#D3CCC0" : "#171513";
  const accentAmber = isLight ? "#D99300" : "#FFB000";

  return (
    <group position={[-3, 0, 0]}>
      {/* Concrete Foundation Slabs */}
      <mesh position={[0, 0.2, 0]}>
        <boxGeometry args={[10, 0.4, 10]} />
        <meshStandardMaterial color={slabColor} roughness={0.9} />
      </mesh>
      <mesh position={[0, 3.5, 0]}>
        <boxGeometry args={[10, 0.3, 10]} />
        <meshStandardMaterial color={slabColor} roughness={0.9} />
      </mesh>
      <mesh position={[0, 6.8, 0]}>
        <boxGeometry args={[10, 0.3, 10]} />
        <meshStandardMaterial color={slabColor} roughness={0.9} />
      </mesh>

      {/* Structural Steel Columns */}
      {[-4, 0, 4].map((x) =>
        [-4, 0, 4].map((z) => (
          <group key={`${x}-${z}`} position={[x, 5, z]}>
            <mesh>
              <boxGeometry args={[0.3, 10, 0.3]} />
              <meshStandardMaterial color={columnColor} metalness={0.8} roughness={0.2} />
            </mesh>
            {/* Rebar extension highlights */}
            <mesh position={[0, 5.5, 0]}>
              <cylinderGeometry args={[0.03, 0.03, 1.2, 6]} />
              <meshStandardMaterial color={accentAmber} />
            </mesh>
          </group>
        ))
      )}

      {/* Scaffold Walkway Cladding */}
      <mesh position={[5.2, 4.5, 0]}>
        <boxGeometry args={[0.1, 7, 10]} />
        <meshStandardMaterial
          color={accentAmber}
          wireframe={true}
          transparent={true}
          opacity={0.35}
        />
      </mesh>
    </group>
  );
}

function GroundGrid({ isLight = false }: { isLight?: boolean }) {
  const baseColor = isLight ? "#DFD8CC" : "#0E0D0C";
  const gridPrimary = isLight ? "#D99300" : "#FFB000";
  const gridSecondary = isLight ? "#D3CCC0" : "#2F2A25";

  return (
    <group position={[0, -0.01, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color={baseColor} roughness={0.95} />
      </mesh>
      <gridHelper
        args={[60, 30, gridPrimary, gridSecondary]}
        position={[0, 0.01, 0]}
      />
    </group>
  );
}

export default function ConstructionSiteScene({ isLight = false }: { isLight?: boolean }) {
  const groupRef = useRef<THREE.Group>(null!);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = clock.getElapsedTime() * 0.04;
    }
  });

  return (
    <>
      <ambientLight
        intensity={isLight ? 0.95 : 0.6}
        color={isLight ? "#FFFFFF" : "#FFB000"}
      />
      <directionalLight
        position={[25, 30, 20]}
        intensity={isLight ? 2.0 : 1.8}
        color={isLight ? "#D99300" : "#F4EFE6"}
        castShadow
      />
      <pointLight
        position={[-10, 15, -10]}
        intensity={isLight ? 2.0 : 2.5}
        color={isLight ? "#D94F05" : "#FF6A13"}
      />

      <group ref={groupRef}>
        <GroundGrid isLight={isLight} />
        <BuildingFraming isLight={isLight} />
        <TowerCrane isLight={isLight} />
        <AmberParticles count={150} isLight={isLight} />
      </group>

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        maxPolarAngle={Math.PI / 2.3}
        minPolarAngle={Math.PI / 4}
        autoRotate={false}
      />
    </>
  );
}
