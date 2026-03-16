"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, PresentationControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { ProductFallback } from "./ProductFallback";

interface Product3DViewerProps {
  modelPath: string;
  theme: "light" | "dark";
  className?: string;
  onClick?: () => void;
}

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  const modelRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((_, delta) => {
    if (!modelRef.current) return;

    if (!hovered) {
      modelRef.current.rotation.y += delta * 0.22;
    }
  });

  return (
    <primitive
      ref={modelRef}
      object={scene}
      scale={[0.78, 0.78, 0.78]}
      position={[0, -0.12, 0]}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    />
  );
}

useGLTF.preload("/models/products/protein_chocolate.glb");
useGLTF.preload("/models/products/soy_powder.glb");

export function Product3DViewer({
  modelPath,
  theme,
  className,
  onClick,
}: Product3DViewerProps) {
  const [isWebGLSupported, setIsWebGLSupported] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl") || canvas.getContext("experimental-webgl");

    setIsWebGLSupported(!!gl);
  }, []);

  const lightingConfig =
    theme === "dark"
      ? {
          ambient: 0.5,
          directional: 0.95,
          directionalPosition: [4, 5, 4] as [number, number, number],
          environment: "city" as const,
        }
      : {
          ambient: 0.7,
          directional: 1.2,
          directionalPosition: [-4, 5, 4] as [number, number, number],
          environment: "studio" as const,
        };

  if (!isWebGLSupported || hasError) {
    const fallbackImagePath = modelPath
      .replace("/models/products/", "/images/products/")
      .replace(".glb", ".png");

    return (
      <ProductFallback
        imagePath={fallbackImagePath}
        className={className}
        onClick={onClick}
      />
    );
  }

  return (
    <div className={`relative ${className ?? ""}`} onClick={onClick}>
      <Canvas
        camera={{ position: [0, 0.75, 4.15], fov: 32 }}
        className="h-full w-full rounded-[2rem]"
        gl={{
          antialias: true,
          alpha: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
        dpr={[1, 1.75]}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
        }}
      >
        <ambientLight intensity={lightingConfig.ambient} />

        <directionalLight
          position={lightingConfig.directionalPosition}
          intensity={lightingConfig.directional}
        />

        <Suspense fallback={null}>
          <Environment preset={lightingConfig.environment} />

          <PresentationControls
            global
            cursor={false}
            speed={1.2}
            rotation={[0, -0.08, 0]}
            polar={[-0.12, 0.18]}
            azimuth={[-0.28, 0.28]}
            config={{ mass: 2, tension: 220 }}
            snap={{ mass: 4, tension: 260 }}
          >
            <Model url={modelPath} />
          </PresentationControls>
        </Suspense>
      </Canvas>
    </div>
  );
}