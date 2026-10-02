"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

/** Deterministic PRNG so scenes are stable across renders (no Math.random in render). */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function useCapability() {
  const [cap, setCap] = useState({ reduceMotion: false, lowEnd: false, ready: false });
  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const smallScreen = Math.min(window.innerWidth, window.innerHeight) < 640;
    const cores = typeof navigator !== "undefined" ? navigator.hardwareConcurrency ?? 8 : 8;
    const mem =
      typeof navigator !== "undefined" && "deviceMemory" in navigator
        ? (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8
        : 8;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCap({ reduceMotion, lowEnd: smallScreen || cores <= 4 || mem <= 4, ready: true });
  }, []);
  return cap;
}

function useTabVisible() {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const onVis = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);
  return visible;
}

function rand(min: number, max: number, rnd: () => number = Math.random) {
  return min + rnd() * (max - min);
}

function Particles({ count }: { count: number }) {
  const ref = useRef<THREE.Points>(null);
  const { positions, colors } = useMemo(() => {
    const rnd = mulberry32(1337);
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const cyan = new THREE.Color("#22d3ee");
    const blue = new THREE.Color("#3b82f6");
    const violet = new THREE.Color("#818cf8");
    for (let i = 0; i < count; i++) {
      const r = rand(3.4, 8.5, rnd);
      const theta = rnd() * Math.PI * 2;
      const phi = Math.acos(rand(-1, 1, rnd));
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.7;
      positions[i * 3 + 2] = r * Math.cos(phi) * 0.6 - 1;
      const pick = rnd();
      const c = pick < 0.55 ? cyan : pick < 0.85 ? blue : violet;
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    return { positions, colors };
  }, [count]);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.02;
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.045}
        vertexColors
        transparent
        opacity={0.85}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function Network({ nodes, linkDist }: { nodes: number; linkDist: number }) {
  const group = useRef<THREE.Group>(null);
  const mouse = useRef({ x: 0, y: 0 });
  const pts = useMemo(() => {
    const rnd = mulberry32(4242);
    const arr: THREE.Vector3[] = [];
    for (let i = 0; i < nodes; i++) {
      arr.push(
        new THREE.Vector3(rand(-3, 3, rnd), rand(-1.8, 1.8, rnd), rand(-1.5, 1.5, rnd))
      );
    }
    return arr;
  }, [nodes]);
  const lineGeom = useMemo(() => {
    const verts: number[] = [];
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        if (pts[i].distanceTo(pts[j]) < linkDist) {
          verts.push(pts[i].x, pts[i].y, pts[i].z, pts[j].x, pts[j].y, pts[j].z);
        }
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
    return g;
  }, [pts, linkDist]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    g.rotation.y += delta * 0.05;
    const t = state.clock.elapsedTime * 0.15;
    g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, mouse.current.y * 0.18 + Math.sin(t) * 0.04, 0.04);
    g.rotation.z = THREE.MathUtils.lerp(g.rotation.z, mouse.current.x * -0.06, 0.04);
  });

  return (
    <group ref={group}>
      {pts.map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[i % 4 === 0 ? 0.09 : 0.055, 16, 16]} />
          <meshBasicMaterial color={i % 4 === 0 ? "#a5f3fc" : "#22d3ee"} transparent opacity={0.95} />
        </mesh>
      ))}
      <lineSegments geometry={lineGeom}>
        <lineBasicMaterial color="#3b82f6" transparent opacity={0.32} depthWrite={false} />
      </lineSegments>
      {/* abstract "reach" core: wireframe shell + soft inner glow */}
      <mesh>
        <icosahedronGeometry args={[1.35, 1]} />
        <meshBasicMaterial color="#22d3ee" wireframe transparent opacity={0.35} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.9, 32, 32]} />
        <meshBasicMaterial color="#0ea5e9" transparent opacity={0.07} depthWrite={false} />
      </mesh>
    </group>
  );
}

function Scene({ lowEnd }: { lowEnd: boolean }) {
  const visible = useTabVisible();
  return (
    <Canvas
      dpr={[1, lowEnd ? 1.25 : 1.75]}
      camera={{ position: [0, 0, 9], fov: 55 }}
      gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
      frameloop={visible ? "always" : "never"}
      style={{ position: "absolute", inset: 0 }}
      aria-hidden
    >
      <Particles count={lowEnd ? 130 : 340} />
      <Network nodes={lowEnd ? 9 : 14} linkDist={lowEnd ? 2.4 : 2.1} />
    </Canvas>
  );
}

/**
 * Lightweight interactive 3D hero backdrop (lazy-loaded, client-only).
 * Static gradient fallback for reduced-motion / pre-hydration.
 */
export default function HeroScene() {
  const { reduceMotion, lowEnd, ready } = useCapability();
  if (!ready || reduceMotion) {
    return <div className="hero-scene-fallback" aria-hidden />;
  }
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden>
      <Scene lowEnd={lowEnd} />
      <div className="pointer-events-none absolute inset-0 hero-vignette" />
    </div>
  );
}
