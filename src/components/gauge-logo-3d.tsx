"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

/**
 * Procedural 3D Gauge logo — an extruded hexagon with organic "cell" blobs
 * inside, matte dark material, gently rotating on Y + floating on a sine wave.
 * Built procedurally (no external .glb) to match the 2D brand mark.
 */
function HexagonMesh() {
  const group = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (group.current) {
      // slow premium spin — ~0.5 rad/s, never frantic
      group.current.rotation.y = t * 0.5;
      // gentle weightless float
      group.current.position.y = Math.sin(t * 1.2) * 0.12;
    }
  });

  // Cell blobs positioned to echo the 2D logo's interior
  const blobs: [number, number, number, number][] = [
    [-0.35, 0.3, 0.06, 0.32],
    [0.3, 0.45, 0.06, 0.24],
    [0.45, -0.05, 0.06, 0.22],
    [0.0, -0.05, 0.06, 0.34],
    [-0.4, -0.25, 0.06, 0.26],
    [0.1, -0.45, 0.06, 0.3],
    [0.4, -0.4, 0.06, 0.22],
    [0.0, 0.35, 0.06, 0.18],
  ];

  return (
    <group ref={group} rotation={[0.35, 0, 0]}>
      {/* Hexagon extruded slab */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[1, 1, 0.35, 6]} />
        <meshStandardMaterial
          color="#1a1a1f"
          metalness={0.35}
          roughness={0.55}
        />
      </mesh>

      {/* Organic interior blobs */}
      {blobs.map(([x, y, z, r], i) => (
        <mesh key={i} position={[x, y, z]}>
          <sphereGeometry args={[r, 32, 32]} />
          <meshStandardMaterial
            color="#0d0d12"
            metalness={0.3}
            roughness={0.6}
          />
        </mesh>
      ))}

      {/* Subtle brand-tinted edge ring for depth */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <torusGeometry args={[1, 0.04, 16, 6]} />
        <meshStandardMaterial
          color="#F26522"
          emissive="#F26522"
          emissiveIntensity={0.25}
          metalness={0.2}
          roughness={0.4}
        />
      </mesh>
    </group>
  );
}

export default function GaugeLogo3D({ size = 160 }: { size?: number }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 4], fov: 45 }}
      style={{ width: size, height: size }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 5, 4]} intensity={1.4} />
      <directionalLight position={[-4, -2, -3]} intensity={0.5} color="#F26522" />
      <HexagonMesh />
    </Canvas>
  );
}
