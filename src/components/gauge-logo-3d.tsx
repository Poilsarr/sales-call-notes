"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

/**
 * Procedural 3D Gauge logo rendered large + centered as a spinning,
 * weightless object (no text). Extruded hexagon "coin" with organic
 * interior blobs, matte dark material, slow Y-spin + gentle float.
 */
function HexagonMesh() {
  const group = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (group.current) {
      // slow premium coin-spin — weighty, not frantic
      group.current.rotation.y = t * 0.4;
      group.current.rotation.x = 0.25;
      // gentle weightless float
      group.current.position.y = Math.sin(t * 1.1) * 0.15;
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
    <group ref={group} rotation={[0.25, 0, 0]}>
      {/* Hexagon extruded "coin" — deeper so the spin shows real thickness */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[1.1, 1.1, 0.6, 6]} />
        <meshStandardMaterial
          color="#1a1a1f"
          metalness={0.4}
          roughness={0.5}
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

      {/* Brand-tinted edge ring for depth */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.1, 0.05, 16, 6]} />
        <meshStandardMaterial
          color="#F26522"
          emissive="#F26522"
          emissiveIntensity={0.3}
          metalness={0.2}
          roughness={0.4}
        />
      </mesh>
    </group>
  );
}

export default function GaugeLogo3D({ size = 320 }: { size?: number }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 4.5], fov: 45 }}
      style={{ width: size, height: size }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={0.65} />
      <directionalLight position={[3, 5, 4]} intensity={1.5} />
      <directionalLight position={[-4, -2, -3]} intensity={0.5} color="#F26522" />
      <HexagonMesh />
    </Canvas>
  );
}
