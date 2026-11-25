"use client";

import React from "react";

interface ThemedProjectImageProps {
  src: string;
  alt: string;
  className?: string;
}

export function ThemedProjectImage({
  src,
  alt,
  className = "w-full h-auto rounded-xs object-cover",
}: ThemedProjectImageProps) {
  const lightSrc = src.endsWith("-light.svg")
    ? src
    : src.replace(".svg", "-light.svg");
  const darkSrc = src.replace("-light.svg", ".svg");

  return (
    <div className="relative w-full overflow-hidden rounded-xs">
      {/* Light Mode SVG Illustration */}
      <img
        src={lightSrc}
        alt={`${alt} (Light Mode)`}
        className={`${className} block dark:hidden`}
        loading="lazy"
      />
      {/* Dark Mode SVG Illustration */}
      <img
        src={darkSrc}
        alt={`${alt} (Dark Mode)`}
        className={`${className} hidden dark:block`}
        loading="lazy"
      />
    </div>
  );
}

