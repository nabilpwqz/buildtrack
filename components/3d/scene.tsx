"use client";

import React, { Suspense, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { useTheme } from "@/components/theme-provider";

interface SceneProps {
  children: React.ReactNode;
  className?: string;
  fallback?: React.ReactNode;
  camera?: any;
}

export function Scene({
  children,
  className = "w-full h-full",
  fallback,
  camera = { position: [10, 10, 10], fov: 45 },
}: SceneProps) {
  const [hasWebGL, setHasWebGL] = useState<boolean | null>(null);
  const { theme } = useTheme();
  const isLight = theme === "light";

  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      const gl =
        canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      setHasWebGL(Boolean(gl));
    } catch (e) {
      setHasWebGL(false);
    }
  }, []);

  if (hasWebGL === false) {
    return (
      <div className={`flex items-center justify-center bg-bg-1 border border-border p-6 text-center ${className}`}>
        {fallback || (
          <div className="font-mono text-xs text-steel space-y-1">
            <div className="text-amber font-bold">HARDWARE ACCELERATION UNAVAILABLE</div>
            <div>Rendering 2D industrial telemetry fallback</div>
          </div>
        )}
      </div>
    );
  }

  if (hasWebGL === null) {
    return (
      <div className={`flex items-center justify-center bg-bg-1 animate-pulse ${className}`}>
        <div className="w-8 h-8 rounded-full border-2 border-amber border-t-transparent animate-spin" />
      </div>
    );
  }

  // Pass theme state to children if they accept isLight prop
  const themedChildren = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, { isLight } as any);
    }
    return child;
  });

  return (
    <div className={`relative overflow-hidden bg-bg-0 transition-colors duration-200 ${className}`}>
      <Canvas
        camera={camera}
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
      >
        <Suspense fallback={null}>{themedChildren}</Suspense>
      </Canvas>
    </div>
  );
}
