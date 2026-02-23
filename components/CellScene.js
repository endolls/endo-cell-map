"use client";

import React, { useMemo, useState, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html, OrbitControls, Stars, useCursor } from "@react-three/drei";
import * as THREE from "three";

function ClickableMesh({
  id,
  label,
  highlighted,
  selected,
  onSelect,
  children,
  tooltipPos
}) {
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);

  const showTip = hovered || selected;

  return (
    <group>
      <group
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
        {children({
          emissiveIntensity: selected ? 0.95 : highlighted ? 0.55 : 0.10
        })}
      </group>

      {showTip && (
        <Html
          distanceFactor={10}
          position={tooltipPos ?? [0, 0, 0]}
          style={{ pointerEvents: "none" }}
        >
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
    </group>
  );
}

function ERWeb({ emissiveIntensity }) {
  // A tube-like ER “web” around the nucleus.
  const curve = useMemo(() => {
    const pts = [];
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      pts.push(
        new THREE.Vector3(
          Math.cos(a) * (1.15 + 0.08 * Math.sin(3 * a)),
          0.25 * Math.sin(2 * a),
          Math.sin(a) * (1.05 + 0.10 * Math.cos(2 * a))
        )
      );
    }
    pts.push(pts[0].clone());
    return new THREE.CatmullRomCurve3(pts, true);
  }, []);

  const geom = useMemo(() => new THREE.TubeGeometry(curve, 140, 0.06, 10, true), [curve]);

  return (
    <mesh geometry={geom}>
      <meshStandardMaterial
        color="#fca5a5"
        roughness={0.35}
        metalness={0.0}
        emissive="#ffffff"
        emissiveIntensity={emissiveIntensity}
        transparent
        opacity={0.85}
      />
    </mesh>
  );
}

function CellVisual({ highlights, selectedId, onSelect }) {
  const slow = useRef(0);

  useFrame((_, dt) => {
    slow.current += dt * 0.25;
  });

  return (
    <group rotation={[0.05, 0.2, 0]}>
      {/* Cytoplasm */}
      <mesh onClick={() => onSelect(null)}>
        <sphereGeometry args={[2.18, 64, 64]} />
        <meshStandardMaterial
          color="#7dd3fc"
          transparent
          opacity={0.12}
          roughness={0.25}
          metalness={0.0}
        />
      </mesh>

      {/* Membrane */}
      <mesh>
        <sphereGeometry args={[2.21, 64, 64]} />
        <meshStandardMaterial
          color="#ffffff"
          transparent
          opacity={0.09}
          roughness={0.35}
          metalness={0.0}
        />
      </mesh>

      {/* Nucleus */}
      <ClickableMesh
        id="nucleus"
        label="Nucleus"
        highlighted={highlights.nucleus}
        selected={selectedId === "nucleus"}
        onSelect={onSelect}
        tooltipPos={[0.2, 0.25, 0.15]}
      >
        {({ emissiveIntensity }) => (
          <group>
            <mesh position={[0.2, 0.2, 0.1]}>
              <sphereGeometry args={[0.92, 48, 48]} />
              <meshStandardMaterial
                color="#a78bfa"
                roughness={0.35}
                emissive="#ffffff"
                emissiveIntensity={emissiveIntensity}
                transparent
                opacity={0.95}
              />
            </mesh>

            {/* nucleolus */}
            <mesh position={[0.45, 0.35, 0.25]}>
              <sphereGeometry args={[0.22, 32, 32]} />
              <meshStandardMaterial
                color="#c4b5fd"
                roughness={0.4}
                emissive="#ffffff"
                emissiveIntensity={emissiveIntensity * 0.6}
              />
            </mesh>
          </group>
        )}
      </ClickableMesh>

      {/* ER Network */}
      <ClickableMesh
        id="er_network"
        label="ER Network"
        highlighted={highlights.er_network}
        selected={selectedId === "er_network"}
        onSelect={onSelect}
        tooltipPos={[0.0, 0.95, -0.2]}
      >
        {({ emissiveIntensity }) => (
          <group rotation={[0, slow.current, 0]}>
            <ERWeb emissiveIntensity={emissiveIntensity} />
          </group>
        )}
      </ClickableMesh>

      {/* Golgi (stacked arcs) */}
      <ClickableMesh
        id="golgi"
        label="Golgi Apparatus"
        highlighted={highlights.golgi}
        selected={selectedId === "golgi"}
        onSelect={onSelect}
        tooltipPos={[-0.55, -0.35, 0.7]}
      >
        {({ emissiveIntensity }) => (
          <group position={[-0.55, -0.35, 0.65]} rotation={[0.2, 0.6, 0]}>
            {[0, 1, 2, 3].map((i) => (
              <mesh key={i} position={[0, i * 0.12, 0]}>
                <torusGeometry args={[0.38, 0.05, 16, 60, Math.PI * 1.2]} />
                <meshStandardMaterial
                  color="#fde68a"
                  roughness={0.45}
                  emissive="#ffffff"
                  emissiveIntensity={emissiveIntensity}
                  transparent
                  opacity={0.95}
                />
              </mesh>
            ))}
          </group>
        )}
      </ClickableMesh>

      {/* ER receptors on membrane */}
      <ClickableMesh
        id="er_receptors"
        label="ERα / ERβ"
        highlighted={highlights.er_receptors}
        selected={selectedId === "er_receptors"}
        onSelect={onSelect}
        tooltipPos={[1.85, 0.55, 0.2]}
      >
        {({ emissiveIntensity }) => (
          <group>
            <mesh position={[1.95, 0.35, 0.2]}>
              <sphereGeometry args={[0.16, 32, 32]} />
              <meshStandardMaterial
                color="#f472b6"
                roughness={0.25}
                emissive="#ffffff"
                emissiveIntensity={emissiveIntensity}
              />
            </mesh>
            <mesh position={[-1.85, -0.25, 0.3]}>
              <sphereGeometry args={[0.16, 32, 32]} />
              <meshStandardMaterial
                color="#f472b6"
                roughness={0.25}
                emissive="#ffffff"
                emissiveIntensity={emissiveIntensity}
              />
            </mesh>
          </group>
        )}
      </ClickableMesh>

      {/* Mitochondria (bean-like ellipsoids) */}
      <ClickableMesh
        id="mitochondria"
        label="Mitochondria"
        highlighted={highlights.mitochondria}
        selected={selectedId === "mitochondria"}
        onSelect={onSelect}
        tooltipPos={[-0.85, 1.0, 0.7]}
      >
        {({ emissiveIntensity }) => (
          <group>
            {[
              { p: [-0.7, 0.85, 0.6], r: [0.2, 0.8, 0.1], s: [1.6, 0.9, 0.9] },
              { p: [0.9, -0.8, -0.3], r: [0.4, 0.2, 0.3], s: [1.7, 0.95, 0.85] },
              { p: [0.25, -1.2, 0.75], r: [0.2, 0.3, 0.2], s: [1.55, 0.95, 0.9] }
            ].map((m, idx) => (
              <mesh key={idx} position={m.p} rotation={m.r} scale={m.s}>
                <sphereGeometry args={[0.22, 32, 32]} />
                <meshStandardMaterial
                  color="#f59e0b"
                  roughness={0.55}
                  emissive="#ffffff"
                  emissiveIntensity={emissiveIntensity}
                />
              </mesh>
            ))}
          </group>
        )}
      </ClickableMesh>

      {/* Glycolysis indicator */}
      <ClickableMesh
        id="glycolysis"
        label="Glycolysis / Lactate shift"
        highlighted={highlights.glycolysis}
        selected={selectedId === "glycolysis"}
        onSelect={onSelect}
        tooltipPos={[0.0, 1.55, -0.55]}
      >
        {({ emissiveIntensity }) => (
          <mesh position={[0.0, 1.35, -0.55]} rotation={[0.3, slow.current * 0.6, 0]}>
            <torusGeometry args={[0.36, 0.08, 16, 60]} />
            <meshStandardMaterial
              color="#22c55e"
              roughness={0.35}
              emissive="#ffffff"
              emissiveIntensity={emissiveIntensity}
            />
          </mesh>
        )}
      </ClickableMesh>

      {/* COX-2 / Prostaglandin “granules” */}
      <ClickableMesh
        id="cox2"
        label="COX-2 → PGE2 / PGF2α"
        highlighted={highlights.cox2}
        selected={selectedId === "cox2"}
        onSelect={onSelect}
        tooltipPos={[1.25, 1.05, 0.9]}
      >
        {({ emissiveIntensity }) => (
          <group>
            {[
              [1.05, 0.95, 0.9],
              [1.28, 0.78, 0.75],
              [1.38, 0.98, 0.62],
              [0.92, 0.78, 0.72]
            ].map((p, i) => (
              <mesh key={i} position={p}>
                <dodecahedronGeometry args={[0.17 + (i % 2) * 0.03, 0]} />
                <meshStandardMaterial
                  color="#fb7185"
                  roughness={0.25}
                  emissive="#ffffff"
                  emissiveIntensity={emissiveIntensity}
                />
              </mesh>
            ))}
          </group>
        )}
      </ClickableMesh>

      {/* Angiogenesis sprout */}
      <ClickableMesh
        id="angiogenesis"
        label="Angiogenesis"
        highlighted={highlights.angiogenesis}
        selected={selectedId === "angiogenesis"}
        onSelect={onSelect}
        tooltipPos={[2.6, -0.2, 0.0]}
      >
        {({ emissiveIntensity }) => (
          <group position={[2.45, -0.25, 0.0]}>
            <mesh rotation={[0, 0, -0.4]}>
              <cylinderGeometry args={[0.08, 0.12, 1.0, 16]} />
              <meshStandardMaterial
                color="#60a5fa"
                roughness={0.35}
                emissive="#ffffff"
                emissiveIntensity={emissiveIntensity}
              />
            </mesh>
            <mesh position={[0.25, 0.4, 0]} rotation={[0, 0, -0.9]}>
              <cylinderGeometry args={[0.05, 0.08, 0.6, 16]} />
              <meshStandardMaterial
                color="#60a5fa"
                roughness={0.35}
                emissive="#ffffff"
                emissiveIntensity={emissiveIntensity}
              />
            </mesh>
          </group>
        )}
      </ClickableMesh>

      {/* Fibrosis / collagen fibers outside */}
      <ClickableMesh
        id="fibrosis"
        label="Fibrosis / ECM"
        highlighted={highlights.fibrosis}
        selected={selectedId === "fibrosis"}
        onSelect={onSelect}
        tooltipPos={[-2.35, 0.1, 0.2]}
      >
        {({ emissiveIntensity }) => (
          <group>
            {[
              { p: [-2.45, 0.05, -0.15], r: [0.2, 0.3, 0.4], h: 1.2 },
              { p: [-2.25, -0.2, 0.55], r: [0.1, 0.6, 0.2], h: 1.0 },
              { p: [-2.15, 0.35, 0.2], r: [0.4, 0.1, 0.5], h: 0.9 }
            ].map((f, i) => (
              <mesh key={i} position={f.p} rotation={f.r}>
                <cylinderGeometry args={[0.06, 0.06, f.h, 18]} />
                <meshStandardMaterial
                  color="#eab308"
                  roughness={0.75}
                  emissive="#ffffff"
                  emissiveIntensity={emissiveIntensity}
                />
              </mesh>
            ))}
          </group>
        )}
      </ClickableMesh>

      {/* Immune cell */}
      <ClickableMesh
        id="immune"
        label="Macrophage"
        highlighted={highlights.immune}
        selected={selectedId === "immune"}
        onSelect={onSelect}
        tooltipPos={[0.0, -2.75, 0.0]}
      >
        {({ emissiveIntensity }) => (
          <group position={[0.0, -2.65, 0.0]}>
            <mesh>
              <sphereGeometry args={[0.38, 32, 32]} />
              <meshStandardMaterial
                color="#93c5fd"
                roughness={0.35}
                emissive="#ffffff"
                emissiveIntensity={emissiveIntensity}
              />
            </mesh>
            {/* little “pseudopods” */}
            {[
              [0.35, 0.05, 0.0],
              [-0.32, -0.08, 0.15],
              [0.05, 0.28, -0.18]
            ].map((p, i) => (
              <mesh key={i} position={p} scale={[0.6, 0.6, 0.6]}>
                <icosahedronGeometry args={[0.18, 0]} />
                <meshStandardMaterial
                  color="#93c5fd"
                  roughness={0.35}
                  emissive="#ffffff"
                  emissiveIntensity={emissiveIntensity * 0.7}
                />
              </mesh>
            ))}
          </group>
        )}
      </ClickableMesh>
    </group>
  );
}

export default function CellScene({ highlights, selectedId, onSelect }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 6.6], fov: 45 }}
      style={{ width: "100%", height: "100%" }}
    >
      <ambientLight intensity={0.7} />
      <directionalLight position={[6, 8, 8]} intensity={1.2} />
      <pointLight position={[-6, -2, 6]} intensity={0.9} />

      <Stars radius={60} depth={30} count={700} factor={2} fade />

      <CellVisual highlights={highlights} selectedId={selectedId} onSelect={onSelect} />

      <OrbitControls enablePan={false} minDistance={4.2} maxDistance={10} />
    </Canvas>
  );
}
