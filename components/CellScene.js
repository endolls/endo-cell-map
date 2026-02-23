"use client";

import React, { useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Html, OrbitControls, Stars, useCursor } from "@react-three/drei";

function Part({
  id,
  label,
  position,
  geometry,
  materialProps,
  highlighted,
  selected,
  onSelect
}) {
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);

  const mat = useMemo(() => {
    // emissive glow when highlighted/selected
    const emissiveIntensity = selected ? 0.9 : highlighted ? 0.55 : 0.12;
    return {
      ...materialProps,
      emissive: materialProps.emissive ?? "#ffffff",
      emissiveIntensity
    };
  }, [materialProps, highlighted, selected]);

  return (
    <mesh
      position={position}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(id);
      }}
    >
      {geometry}
      <meshStandardMaterial {...mat} />
      {(hovered || selected) && (
        <Html distanceFactor={10} style={{ pointerEvents: "none" }}>
          <div
            style={{
              padding: "6px 8px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.18)",
              background: "rgba(0,0,0,0.35)",
              color: "rgba(230,233,242,0.95)",
              fontSize: 12,
              backdropFilter: "blur(8px)",
              whiteSpace: "nowrap"
            }}
          >
            {label}
          </div>
        </Html>
      )}
    </mesh>
  );
}

function CellVisual({ highlights, selectedId, onSelect }) {
  // Big “cell body”
  return (
    <group>
      {/* Cytoplasm */}
      <mesh onClick={() => onSelect(null)}>
        <sphereGeometry args={[2.15, 64, 64]} />
        <meshStandardMaterial
          color="#7dd3fc"
          transparent
          opacity={0.12}
          roughness={0.25}
          metalness={0.0}
        />
      </mesh>

      {/* Membrane rim */}
      <mesh>
        <sphereGeometry args={[2.17, 64, 64]} />
        <meshStandardMaterial
          color="#ffffff"
          transparent
          opacity={0.08}
          roughness={0.35}
          metalness={0.0}
        />
      </mesh>

      {/* Nucleus */}
      <Part
        id="nucleus"
        label="Nucleus"
        position={[0.2, 0.2, 0.1]}
        geometry={<sphereGeometry args={[0.9, 48, 48]} />}
        materialProps={{ color: "#a78bfa", roughness: 0.35 }}
        highlighted={highlights.nucleus}
        selected={selectedId === "nucleus"}
        onSelect={onSelect}
      />

      {/* ER receptors on membrane: ERα + ERβ */}
      <Part
        id="er_receptors"
        label="ERα / ERβ"
        position={[1.95, 0.35, 0.2]}
        geometry={<sphereGeometry args={[0.16, 32, 32]} />}
        materialProps={{ color: "#f472b6", roughness: 0.25 }}
        highlighted={highlights.er_receptors}
        selected={selectedId === "er_receptors"}
        onSelect={onSelect}
      />
      <Part
        id="er_receptors"
        label="ERα / ERβ"
        position={[-1.85, -0.25, 0.3]}
        geometry={<sphereGeometry args={[0.16, 32, 32]} />}
        materialProps={{ color: "#f472b6", roughness: 0.25 }}
        highlighted={highlights.er_receptors}
        selected={selectedId === "er_receptors"}
        onSelect={onSelect}
      />

      {/* Mitochondria (a few ellipsoids) */}
      <Part
        id="mitochondria"
        label="Mitochondria"
        position={[-0.7, 0.85, 0.6]}
        geometry={<sphereGeometry args={[0.26, 32, 32]} />}
        materialProps={{ color: "#f59e0b", roughness: 0.45 }}
        highlighted={highlights.mitochondria}
        selected={selectedId === "mitochondria"}
        onSelect={onSelect}
      />
      <Part
        id="mitochondria"
        label="Mitochondria"
        position={[0.9, -0.8, -0.3]}
        geometry={<sphereGeometry args={[0.24, 32, 32]} />}
        materialProps={{ color: "#f59e0b", roughness: 0.45 }}
        highlighted={highlights.mitochondria}
        selected={selectedId === "mitochondria"}
        onSelect={onSelect}
      />
      <Part
        id="mitochondria"
        label="Mitochondria"
        position={[0.25, -1.2, 0.75]}
        geometry={<sphereGeometry args={[0.22, 32, 32]} />}
        materialProps={{ color: "#f59e0b", roughness: 0.45 }}
        highlighted={highlights.mitochondria}
        selected={selectedId === "mitochondria"}
        onSelect={onSelect}
      />

      {/* Glycolysis ring */}
      <Part
        id="glycolysis"
        label="Glycolysis"
        position={[0.0, 1.35, -0.55]}
        geometry={<torusGeometry args={[0.36, 0.08, 16, 60]} />}
        materialProps={{ color: "#22c55e", roughness: 0.35 }}
        highlighted={highlights.glycolysis}
        selected={selectedId === "glycolysis"}
        onSelect={onSelect}
      />

      {/* COX-2 / PGE2 cluster */}
      <Part
        id="cox2"
        label="COX-2 / PGE2"
        position={[1.05, 0.95, 0.9]}
        geometry={<dodecahedronGeometry args={[0.22, 0]} />}
        materialProps={{ color: "#fb7185", roughness: 0.25 }}
        highlighted={highlights.cox2}
        selected={selectedId === "cox2"}
        onSelect={onSelect}
      />
      <Part
        id="cox2"
        label="COX-2 / PGE2"
        position={[1.28, 0.78, 0.75]}
        geometry={<dodecahedronGeometry args={[0.18, 0]} />}
        materialProps={{ color: "#fb7185", roughness: 0.25 }}
        highlighted={highlights.cox2}
        selected={selectedId === "cox2"}
        onSelect={onSelect}
      />

      {/* Angiogenesis sprout outside */}
      <Part
        id="angiogenesis"
        label="Angiogenesis"
        position={[2.55, -0.25, 0.0]}
        geometry={<coneGeometry args={[0.22, 0.75, 24]} />}
        materialProps={{ color: "#60a5fa", roughness: 0.25 }}
        highlighted={highlights.angiogenesis}
        selected={selectedId === "angiogenesis"}
        onSelect={onSelect}
      />

      {/* Fibrosis / ECM fibers */}
      <Part
        id="fibrosis"
        label="Fibrosis / ECM"
        position={[-2.45, 0.05, -0.15]}
        geometry={<cylinderGeometry args={[0.06, 0.06, 1.05, 20]} />}
        materialProps={{ color: "#eab308", roughness: 0.6 }}
        highlighted={highlights.fibrosis}
        selected={selectedId === "fibrosis"}
        onSelect={onSelect}
      />
      <Part
        id="fibrosis"
        label="Fibrosis / ECM"
        position={[-2.25, -0.2, 0.55]}
        geometry={<cylinderGeometry args={[0.06, 0.06, 0.95, 20]} />}
        materialProps={{ color: "#eab308", roughness: 0.6 }}
        highlighted={highlights.fibrosis}
        selected={selectedId === "fibrosis"}
        onSelect={onSelect}
      />

      {/* Immune cell (macrophage) */}
      <Part
        id="immune"
        label="Macrophage"
        position={[0.0, -2.65, 0.0]}
        geometry={<sphereGeometry args={[0.38, 32, 32]} />}
        materialProps={{ color: "#93c5fd", roughness: 0.35 }}
        highlighted={highlights.immune}
        selected={selectedId === "immune"}
        onSelect={onSelect}
      />
    </group>
  );
}

export default function CellScene({ highlights, selectedId, onSelect }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 6.4], fov: 45 }}
      style={{ width: "100%", height: "100%" }}
    >
      <ambientLight intensity={0.7} />
      <directionalLight position={[5, 7, 8]} intensity={1.2} />
      <pointLight position={[-6, -2, 6]} intensity={0.9} />

      <Stars radius={60} depth={30} count={800} factor={2} fade />

      <CellVisual
        highlights={highlights}
        selectedId={selectedId}
        onSelect={onSelect}
      />

      <OrbitControls enablePan={false} minDistance={4.2} maxDistance={10} />
    </Canvas>
  );
}