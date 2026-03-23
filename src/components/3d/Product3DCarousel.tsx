"use client";

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, PerspectiveCamera, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { Box } from "lucide-react";
import { useMarketingContent } from "@/components/providers/MarketingContentProvider";
import { ProductFallback } from "./ProductFallback";
import { SceneEnvironment } from "./SceneEnvironment";
import { cn } from "@/lib/utils";
import type { ProductId } from "@/lib/marketing/types";

interface Product3DCarouselProps {
  activeId: ProductId;
  onChange: (id: ProductId) => void;
  isDark?: boolean;
}

interface StageModelProps {
  modelPath: string;
  index: number;
  activeIndex: number;
  totalProducts: number;
  onSelect: (index: number) => void;
}

function getRelativeIndex(index: number, activeIndex: number, total: number) {
  let relative = index - activeIndex;
  if (relative > total / 2) relative -= total;
  if (relative < -total / 2) relative += total;
  return relative;
}

function StageModel({
  modelPath,
  index,
  activeIndex,
  totalProducts,
  onSelect,
}: StageModelProps) {
  const { scene } = useGLTF(modelPath);
  const clonedScene = useMemo(() => scene.clone(), [scene]);
  const groupRef = useRef<THREE.Group>(null);
  const hoverRef = useRef(false);
  const activeMotionTimeRef = useRef((index + 1) * Math.PI * 0.5);

  const { size } = useThree();
  const relativeIndex = getRelativeIndex(index, activeIndex, totalProducts);

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;

    const isActive = relativeIndex === 0;
    const absRelative = Math.abs(relativeIndex);
    const aspect = size.width / Math.max(size.height, 1);

    // Seedance spans for 5-model panoramic view
    const sideX1 = THREE.MathUtils.clamp(1.3 + aspect * 0.1, 1.35, 1.7);
    const sideX2 = sideX1 + 1.25;
    const sideZ = -0.7;
    const sideZFar = -1.6;

    let tx = 0;
    let ty = 0;
    let tz = 0;
    let ry = 0;
    let rx = 0;
    let rz = 0;
    let targetScale = 1;
    let targetOpacity = 1;

    if (isActive) {
      activeMotionTimeRef.current += delta;
      const idleYaw = hoverRef.current ? 0 : Math.sin(activeMotionTimeRef.current * 0.9) * 0.05;
      const idleLift = Math.sin(activeMotionTimeRef.current * 1.2) * 0.02;
      const idleTiltX = Math.sin(activeMotionTimeRef.current * 0.8) * 0.015;

      tx = 0;
      ty = idleLift;
      tz = 0.6; // Progressive reveal push
      ry = idleYaw;
      rx = idleTiltX;
      targetScale = hoverRef.current ? 1.05 : 1.0;
      targetOpacity = 1;
    } else if (absRelative === 1) {
      const side = relativeIndex < 0 ? -1 : 1;
      tx = sideX1 * side;
      ty = -0.05;
      tz = sideZ;
      ry = -0.35 * side; // High-end Seedance Tilt
      targetScale = 0.52;
      targetOpacity = 0.6;
    } else if (absRelative === 2) {
      const side = relativeIndex < 0 ? -1 : 1;
      tx = sideX2 * side;
      ty = -0.15;
      tz = sideZFar;
      ry = -0.5 * side; // Heavier tilt for edges
      targetScale = 0.38;
      targetOpacity = 0.25; // Muted outer models
    } else {
      const side = relativeIndex < 0 ? -1 : 1;
      tx = 8 * side;
      tz = -4;
      targetScale = 0.2;
      targetOpacity = 0;
    }

    group.position.x = THREE.MathUtils.damp(group.position.x, tx, 6.5, delta);
    group.position.y = THREE.MathUtils.damp(group.position.y, ty, 6.5, delta);
    group.position.z = THREE.MathUtils.damp(group.position.z, tz, 6.5, delta);

    group.rotation.x = THREE.MathUtils.damp(group.rotation.x, rx, 6.5, delta);
    group.rotation.y = THREE.MathUtils.damp(group.rotation.y, ry, 6.5, delta);
    group.rotation.z = THREE.MathUtils.damp(group.rotation.z, rz, 6.5, delta);

    const nextScale = THREE.MathUtils.damp(group.scale.x, targetScale, 6.5, delta);
    group.scale.setScalar(nextScale);

    group.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!("material" in mesh) || !mesh.material) return;
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      materials.forEach((material) => {
        if (!material) return;
        material.transparent = true;
        material.opacity = THREE.MathUtils.damp(material.opacity ?? 1, targetOpacity, 8, delta);
        material.depthWrite = targetOpacity > 0.9;
      });
    });
  });

  return (
    <group
      ref={groupRef}
      onClick={() => onSelect(index)}
      onPointerOver={() => {
        hoverRef.current = true;
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        hoverRef.current = false;
        document.body.style.cursor = "auto";
      }}
    >
      <primitive object={clonedScene} />
    </group>
  );
}

function ResponsiveCamera() {
  const { size } = useThree();
  const aspect = size.width / Math.max(size.height, 1);
  const fov = aspect < 1 ? 26 : aspect < 1.35 ? 25 : 24;
  const z = aspect < 1 ? 6.15 : 5.95;

  return <PerspectiveCamera makeDefault position={[0, 0.15, z]} fov={fov} />;
}

export function Product3DCarousel({
  activeId,
  onChange,
  isDark = true,
}: Product3DCarouselProps) {
  const { productIds, productsById } = useMarketingContent();
  const activeIndex = productIds.indexOf(activeId);
  const interactionRef = useRef<HTMLDivElement | null>(null);
  const cooldownRef = useRef(false);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const [shouldRender, setShouldRender] = useState(false);
  const [hasWebGLError, setHasWebGLError] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const stageYOffset = 0.14;
  const activeProduct = productsById[activeId];

  // Delay rendering to prevent WebGL context conflicts
  useEffect(() => {
    const timer = setTimeout(() => {
      setShouldRender(true);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const handleWebGLError = useCallback(() => {
    setHasWebGLError(true);
  }, []);

  const step = useCallback(
    (direction: 1 | -1) => {
      const nextIndex =
        (activeIndex + direction + productIds.length) % productIds.length;
      onChange(productIds[nextIndex]);
    },
    [activeIndex, onChange, productIds]
  );

  const lockStep = useCallback(
    (direction: 1 | -1) => {
      if (cooldownRef.current) return;
      cooldownRef.current = true;
      step(direction);

      window.setTimeout(() => {
        cooldownRef.current = false;
      }, 260);
    },
    [step]
  );

  useEffect(() => {
    const el = interactionRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      // Direct horizontal interaction only - prevents Accidental switching during page scroll
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && Math.abs(e.deltaX) > 10) {
        e.preventDefault();
        lockStep(e.deltaX > 0 ? 1 : -1);
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;
      touchStartXRef.current = touch.clientX;
      touchStartYRef.current = touch.clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (touchStartXRef.current == null || touchStartYRef.current == null) return;

      const touch = e.touches[0];
      if (!touch) return;

      const dx = touch.clientX - touchStartXRef.current;
      const dy = touch.clientY - touchStartYRef.current;

      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 24) {
        e.preventDefault();
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (touchStartXRef.current == null || touchStartYRef.current == null) return;

      const touch = e.changedTouches[0];
      if (!touch) return;

      const dx = touch.clientX - touchStartXRef.current;
      const dy = touch.clientY - touchStartYRef.current;

      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 36) {
        lockStep(dx < 0 ? 1 : -1);
      }

      touchStartXRef.current = null;
      touchStartYRef.current = null;
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchmove", handleTouchMove, { passive: false });
    el.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("wheel", handleWheel);
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchmove", handleTouchMove);
      el.removeEventListener("touchend", handleTouchEnd);
    };
  }, [lockStep]);

  return (
    <div
      ref={interactionRef}
      className="relative w-full h-full"
    >
      {/* Fallback Layer: Always show product image as background */}
      <div className={cn(
        "absolute inset-0 transition-all duration-1000",
        isReady ? "opacity-0 scale-95" : "opacity-100 scale-100"
      )}>
        {activeProduct?.image ? (
          <ProductFallback
            imagePath={activeProduct.image}
            className="w-full h-full"
            priority
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-system-fill/72 text-label/72 dark:bg-white/[0.06] dark:text-white/72">
              <Box className="h-10 w-10" strokeWidth={1.6} />
            </div>
          </div>
        )}
      </div>

      {/* 3D Canvas Layer: Only render when ready */}
      {shouldRender && !hasWebGLError && (
        <Canvas
          dpr={[1, 1.5]}
          camera={{ position: [0, 0.15, 6], fov: 24 }}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
            toneMapping: THREE.ACESFilmicToneMapping,
            outputColorSpace: THREE.SRGBColorSpace,
          }}
          onError={handleWebGLError}
          onCreated={() => {
            setTimeout(() => {
              setIsReady(true);
            }, 200);
          }}
        >
          <ResponsiveCamera />

          <ambientLight intensity={isDark ? 0.8 : 0.95} />

          <directionalLight
            position={[0, 3.5, 5]}
            intensity={isDark ? 2.2 : 2.7}
          />

          <spotLight
            position={[0, 4.5, 5.6]}
            angle={0.3}
            penumbra={1}
            intensity={isDark ? 3.2 : 3.6}
            distance={12}
          />

          <pointLight position={[-2.6, 1.2, 2]} intensity={0.45} />
          <pointLight position={[2.6, 1.2, 2]} intensity={0.45} />
          <pointLight position={[0, -0.4, 2.4]} intensity={0.22} />

          <Suspense fallback={null}>
            <SceneEnvironment isDark={isDark} />

            <group position={[0, stageYOffset, 0]}>
              {productIds.map((key, index) => {
                const relativeIndex = getRelativeIndex(index, activeIndex, productIds.length);
                const modelPath = productsById[key].model;
                // Only render active model and 2 immediate neighbors on each side
                if (Math.abs(relativeIndex) > 2 || !modelPath) return null;

                return (
                  <StageModel
                    key={key}
                    modelPath={modelPath}
                    index={index}
                    activeIndex={activeIndex}
                    totalProducts={productIds.length}
                    onSelect={(idx) => onChange(productIds[idx])}
                  />
                );
              })}
            </group>

            <ContactShadows
              position={[0, -0.81, 0]}
              opacity={isDark ? 0.38 : 0.28}
              scale={5.5}
              blur={1.4}
              far={1.6}
              resolution={1024}
            />
            <ContactShadows
              position={[0, -0.91, 0]}
              opacity={isDark ? 0.18 : 0.12}
              scale={7.5}
              blur={2.4}
              far={1.6}
              resolution={512}
            />
          </Suspense>
        </Canvas>
      )}
    </div>
  );
}
