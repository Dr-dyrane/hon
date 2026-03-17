"use client";

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { PRODUCTS } from "@/lib/data";

interface Product3DCarouselProps {
  activeId: keyof typeof PRODUCTS;
  onChange: (id: keyof typeof PRODUCTS) => void;
  isDark?: boolean;
}

interface StageModelProps {
  modelPath: string;
  index: number;
  activeIndex: number;
  totalProducts: number;
  onSelect: (index: number) => void;
}

const PRODUCT_KEYS = Object.keys(PRODUCTS) as (keyof typeof PRODUCTS)[];

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
  const activeMotionTimeRef = useRef(Math.random() * Math.PI * 2);

  const { size } = useThree();
  const relativeIndex = getRelativeIndex(index, activeIndex, totalProducts);

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;

    const isActive = relativeIndex === 0;
    const isImmediateSide = Math.abs(relativeIndex) === 1;
    const aspect = size.width / Math.max(size.height, 1);

    // Side products closer for small-width layouts
    const sideX = THREE.MathUtils.clamp(1.05 + aspect * 0.18, 1.1, 1.45);
    const sideZ = THREE.MathUtils.clamp(
      -0.22 - (1.7 - Math.min(aspect, 1.7)) * 0.12,
      -0.42,
      -0.2
    );

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

      const idleYaw = hoverRef.current
        ? 0
        : Math.sin(activeMotionTimeRef.current * 0.9) * 0.06;

      const idleLift = Math.sin(activeMotionTimeRef.current * 1.2) * 0.025;

      const idleTiltX = Math.sin(activeMotionTimeRef.current * 0.8) * 0.015;
      const idleTiltZ = Math.cos(activeMotionTimeRef.current * 0.7) * 0.01;

      tx = 0;
      ty = 0.02 + idleLift;
      tz = 0;
      ry = idleYaw;
      rx = idleTiltX;
      rz = idleTiltZ;
      targetScale = hoverRef.current ? 1.225 : 1.2;
      targetOpacity = 1;
    } else if (relativeIndex === -1) {
      tx = -sideX;
      ty = 0;
      tz = sideZ;
      ry = 0.12;
      rx = 0;
      rz = 0;
      targetScale = hoverRef.current && isImmediateSide ? 0.41 : 0.4;
      targetOpacity = 0.5;
    } else if (relativeIndex === 1) {
      tx = sideX;
      ty = 0;
      tz = sideZ;
      ry = -0.12;
      rx = 0;
      rz = 0;
      targetScale = hoverRef.current && isImmediateSide ? 0.41 : 0.4;
      targetOpacity = 0.5;
    } else {
      const side = relativeIndex < 0 ? -1 : 1;
      tx = 4 * side;
      ty = 0;
      tz = -2.4;
      ry = side * 0.2;
      rx = 0;
      rz = 0;
      targetScale = 0.38;
      targetOpacity = 0;
    }

    group.position.x = THREE.MathUtils.damp(group.position.x, tx, 7, delta);
    group.position.y = THREE.MathUtils.damp(group.position.y, ty, 7, delta);
    group.position.z = THREE.MathUtils.damp(group.position.z, tz, 7, delta);

    group.rotation.x = THREE.MathUtils.damp(group.rotation.x, rx, 7, delta);
    group.rotation.y = THREE.MathUtils.damp(group.rotation.y, ry, 7, delta);
    group.rotation.z = THREE.MathUtils.damp(group.rotation.z, rz, 7, delta);

    const nextScale = THREE.MathUtils.damp(group.scale.x, targetScale, 7, delta);
    group.scale.setScalar(nextScale);

    group.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!("material" in mesh) || !mesh.material) return;

      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];

      materials.forEach((material: any) => {
        if (!material) return;
        material.transparent = true;
        material.opacity = THREE.MathUtils.damp(
          material.opacity ?? 1,
          targetOpacity,
          8,
          delta
        );
        material.depthWrite = targetOpacity > 0.95;
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
  const { camera, size } = useThree();

  useEffect(() => {
    const perspectiveCamera = camera as THREE.PerspectiveCamera;
    const aspect = size.width / Math.max(size.height, 1);

    perspectiveCamera.fov = aspect < 1 ? 26 : aspect < 1.35 ? 25 : 24;
    perspectiveCamera.position.set(0, 0.15, aspect < 1 ? 6.15 : 5.95);
    perspectiveCamera.updateProjectionMatrix();
  }, [camera, size]);

  return null;
}

export function Product3DCarousel({
  activeId,
  onChange,
  isDark = true,
}: Product3DCarouselProps) {
  const activeIndex = PRODUCT_KEYS.indexOf(activeId);
  const interactionRef = useRef<HTMLDivElement | null>(null);
  const cooldownRef = useRef(false);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const [shouldRender, setShouldRender] = useState(false);
  const [hasWebGLError, setHasWebGLError] = useState(false);

  // Delay rendering to prevent WebGL context conflicts
  useEffect(() => {
    const timer = setTimeout(() => {
      setShouldRender(true);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const handleWebGLError = useCallback(() => {
    console.warn('WebGL context lost in Product3DCarousel, falling back');
    setHasWebGLError(true);
  }, []);

  const step = useCallback(
    (direction: 1 | -1) => {
      const nextIndex =
        (activeIndex + direction + PRODUCT_KEYS.length) % PRODUCT_KEYS.length;
      onChange(PRODUCT_KEYS[nextIndex]);
    },
    [activeIndex, onChange]
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
      if (Math.abs(e.deltaY) < 18) return;
      e.preventDefault();
      lockStep(e.deltaY > 0 ? 1 : -1);
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
      className="relative h-full w-full overflow-hidden touch-pan-y"
    >
      {shouldRender && !hasWebGLError ? (
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
          <Environment preset={isDark ? "city" : "studio"} />

          {/* Only render active model and immediate neighbors to prevent WebGL context overload */}
          <group position={[0, -0.02, 0]}>
            {PRODUCT_KEYS.map((key, index) => {
              const relativeIndex = getRelativeIndex(index, activeIndex, PRODUCT_KEYS.length);
              // Only render active model and immediate neighbors
              if (Math.abs(relativeIndex) > 1) return null;
              
              return (
                <StageModel
                  key={key}
                  modelPath={PRODUCTS[key].model}
                  index={index}
                  activeIndex={activeIndex}
                  totalProducts={PRODUCT_KEYS.length}
                  onSelect={(idx) => onChange(PRODUCT_KEYS[idx])}
                />
              );
            })}
          </group>

          <ContactShadows
            position={[0, -1.02, 0]}
            opacity={isDark ? 0.22 : 0.14}
            scale={8}
            blur={2.2}
            far={2}
            resolution={512}
          />
        </Suspense>
      </Canvas>
      ) : hasWebGLError ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="text-foreground/60 text-sm">
              3D showcase unavailable
            </div>
            <div className="text-foreground/40 text-xs mt-2">
              {PRODUCTS[activeId].name}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-full">
          <div className="animate-pulse text-foreground/40">Loading...</div>
        </div>
      )}
    </div>
  );
}

PRODUCT_KEYS.forEach((key) => {
  useGLTF.preload(PRODUCTS[key].model);
});
