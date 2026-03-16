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
  sectionId?: string;
  scrollActive?: boolean;
}

function Model({ url, isReady, scrollActive }: { url: string; isReady: boolean; scrollActive?: boolean }) {
  const { scene } = useGLTF(url);
  const modelRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const rotationSpeed = useRef(0.22);
  const targetScale = useRef(0.78);
  const lastFrameTime = useRef(0);

  useFrame((_, delta) => {
    if (!modelRef.current) return;

    // Limit frame rate for performance
    const now = performance.now();
    if (now - lastFrameTime.current < 16) return; // Cap at ~60fps
    lastFrameTime.current = now;

    // Adjust rotation speed based on scroll activity
    if (!hovered) {
      if (scrollActive) {
        // Faster rotation when scrolling into section
        rotationSpeed.current = Math.min(rotationSpeed.current + 0.01, 0.4);
      } else {
        // Slower rotation when not scrolling
        rotationSpeed.current = Math.max(rotationSpeed.current - 0.005, 0.22);
      }
      modelRef.current.rotation.y += delta * rotationSpeed.current;
    }

    // Smooth scale animation on load
    if (modelRef.current.scale.x < targetScale.current && isReady) {
      const currentScale = modelRef.current.scale.x;
      const newScale = currentScale + (targetScale.current - currentScale) * 0.05;
      modelRef.current.scale.set(newScale, newScale, newScale);
    }

    // Subtle scale pulse when scrolling into section (reduced frequency)
    if (scrollActive && isReady) {
      const pulseScale = 0.78 + Math.sin(now * 0.001) * 0.015; // Reduced frequency and amplitude
      modelRef.current.scale.set(pulseScale, pulseScale, pulseScale);
    }
  });

  return (
    <primitive
      ref={modelRef}
      object={scene}
      scale={[isReady ? 0.78 : 0.65, isReady ? 0.78 : 0.65, isReady ? 0.78 : 0.65]}
      position={[0, -0.12, 0]}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    />
  );
}

useGLTF.preload("/models/products/protein_chocolate.glb");
useGLTF.preload("/models/products/soy_powder.glb");
useGLTF.preload("/models/products/shot_glow.glb");
useGLTF.preload("/models/products/shot_immunity.glb");
useGLTF.preload("/models/products/shot_metabolism.glb");

export function Product3DViewer({
  modelPath,
  theme,
  className,
  onClick,
  sectionId,
  scrollActive,
}: Product3DViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isWebGLSupported, setIsWebGLSupported] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl") || canvas.getContext("experimental-webgl");

    setIsWebGLSupported(!!gl);
  }, []);

  // Cleanup WebGL context on unmount
  useEffect(() => {
    return () => {
      if (canvasRef.current) {
        const gl = canvasRef.current.getContext("webgl");
        if (gl) {
          gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        }
      }
    };
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

  // Fallback to 2D if WebGL is not supported or there's an error
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
      {/* Show 2D image while 3D model loads */}
      <div 
        className={`absolute inset-0 transition-all duration-1000 ease-[var(--ease-apple)] ${
          isReady ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
        }`}
      >
        <ProductFallback
          imagePath={modelPath
            .replace("/models/products/", "/images/products/")
            .replace(".glb", ".png")}
          className="w-full h-full"
        />
      </div>
      
      <Canvas
        ref={canvasRef}
        camera={{ position: [0, 0.75, 4.15], fov: 32 }}
        className={`h-full w-full rounded-[2rem] transition-all duration-1000 ease-[var(--ease-apple)] ${
          isReady ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
        }`}
        gl={{
          antialias: true,
          alpha: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          outputColorSpace: THREE.SRGBColorSpace,
          powerPreference: "high-performance",
          preserveDrawingBuffer: false,
          failIfMajorPerformanceCaveat: false,
        }}
        dpr={[1, 1.5]} // Reduced DPR for performance
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
          setIsLoading(false);
          // Small delay for smooth transition
          setTimeout(() => setIsReady(true), 100);
        }}
        onError={(error) => {
          console.warn('WebGL Error:', error);
          setHasError(true);
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
            snap={true}
          >
            <Model url={modelPath} isReady={isReady} scrollActive={scrollActive} />
          </PresentationControls>
        </Suspense>
      </Canvas>
    </div>
  );
}