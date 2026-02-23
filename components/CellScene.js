"use client";

import React, { useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html, OrbitControls, Stars, useCursor } from "@react-three/drei";
import * as THREE from "three";

function clamp01(x) {
  const n = Number.isFinite(x) ? x : 0;
  return Math.max(0, Math.min(1, n));
}

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

function ParticleCloud({
  enabled,
  origin = [0, 0, 0],
  targets = [],
  strength = 0.5,
  baseColor = [0.6, 0.8, 1.0],
  count = 800,
  bounds = 6
}) {
  const geomRef = useRef(null);
  const pointsRef = useRef(null);
  const tRef = useRef(0);
  const spawnAcc = useRef(0);

  const data = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const life = new Float32Array(count);

    // initialize all particles as "dead"
    for (let i = 0; i < count; i++) {
      life[i] = 0;
      positions[i * 3 + 0] = 999;
      positions[i * 3 + 1] = 999;
      positions[i * 3 + 2] = 999;
      colors[i * 3 + 0] = 0;
      colors[i * 3 + 1] = 0;
      colors[i * 3 + 2] = 0;
      velocities[i * 3 + 0] = 0;
      velocities[i * 3 + 1] = 0;
      velocities[i * 3 + 2] = 0;
    }

    return { positions, colors, velocities, life };
  }, [count]);

  const originV = useMemo(() => new THREE.Vector3(...origin), [origin]);
  const targetVs = useMemo(
    () => targets.map((t) => new THREE.Vector3(...t)),
    [targets]
  );

  function spawnOne(i, s) {
    data.life[i] = 0.7 + Math.random() * 1.2; // seconds
    data.positions[i * 3 + 0] = originV.x + (Math.random() - 0.5) * 0.25;
    data.positions[i * 3 + 1] = originV.y + (Math.random() - 0.5) * 0.25;
    data.positions[i * 3 + 2] = originV.z + (Math.random() - 0.5) * 0.25;

    const speed = 0.55 + 1.4 * s;
    data.velocities[i * 3 + 0] = (Math.random() - 0.5) * speed;
    data.velocities[i * 3 + 1] = (Math.random() - 0.5) * speed;
    data.velocities[i * 3 + 2] = (Math.random() - 0.5) * speed;

    data.colors[i * 3 + 0] = baseColor[0];
    data.colors[i * 3 + 1] = baseColor[1];
    data.colors[i * 3 + 2] = baseColor[2];
  }

  useFrame((_, dt) => {
    if (!enabled || !geomRef.current) return;

    tRef.current += dt;
    const s = clamp01(strength);

    // spawn rate scales with strength
    const spawnPerSecond = 30 + 140 * s; // up to ~170/s
    spawnAcc.current += spawnPerSecond * dt;

    // spawn particles into dead slots
    while (spawnAcc.current >= 1) {
      spawnAcc.current -= 1;

      // find a dead particle
      let idx = -1;
      // quick scan, ok at this size
      for (let i = 0; i < count; i++) {
        if (data.life[i] <= 0) {
          idx = i;
          break;
        }
      }
      if (idx >= 0) spawnOne(idx, s);
      else break; // none available
    }

    const tmpPos = new THREE.Vector3();
    const tmpVel = new THREE.Vector3();
    const tmpDir = new THREE.Vector3();

    for (let i = 0; i < count; i++) {
      let L = data.life[i];
      if (L <= 0) continue;

      L -= dt;
      data.life[i] = L;

      const px = data.positions[i * 3 + 0];
      const py = data.positions[i * 3 + 1];
      const pz = data.positions[i * 3 + 2];

      tmpPos.set(px, py, pz);

      tmpVel.set(
        data.velocities[i * 3 + 0],
        data.velocities[i * 3 + 1],
        data.velocities[i * 3 + 2]
      );

      // Brownian drift
      tmpVel.x += (Math.random() - 0.5) * 0.18 * dt;
      tmpVel.y += (Math.random() - 0.5) * 0.18 * dt;
      tmpVel.z += (Math.random() - 0.5) * 0.18 * dt;

      // Attraction toward nearest target (receptors)
      if (targetVs.length) {
        let nearest = targetVs[0];
        let bestD = tmpPos.distanceToSquared(nearest);
        for (let j = 1; j < targetVs.length; j++) {
          const d = tmpPos.distanceToSquared(targetVs[j]);
          if (d < bestD) {
            bestD = d;
            nearest = targetVs[j];
          }
        }

        tmpDir.copy(nearest).sub(tmpPos);
        const dist = Math.max(0.001, tmpDir.length());
        tmpDir.normalize();

        const attract = (0.45 + 1.2 * s) * dt * (1.0 / (0.6 + dist));
        tmpVel.addScaledVector(tmpDir, attract);
      }

      // integrate
      tmpPos.addScaledVector(tmpVel, dt);

      data.positions[i * 3 + 0] = tmpPos.x;
      data.positions[i * 3 + 1] = tmpPos.y;
      data.positions[i * 3 + 2] = tmpPos.z;

      data.velocities[i * 3 + 0] = tmpVel.x;
      data.velocities[i * 3 + 1] = tmpVel.y;
      data.velocities[i * 3 + 2] = tmpVel.z;

      // Fade brightness with life
      const fade = clamp01(L / 1.2);
      data.colors[i * 3 + 0] = baseColor[0] * fade;
      data.colors[i * 3 + 1] = baseColor[1] * fade;
      data.colors[i * 3 + 2] = baseColor[2] * fade;

      // Kill if out of bounds
      if (
        Math.abs(tmpPos.x) > bounds ||
        Math.abs(tmpPos.y) > bounds ||
        Math.abs(tmpPos.z) > bounds ||
        L <= 0
      ) {
        data.life[i] = 0;
        data.positions[i * 3 + 0] = 999;
        data.positions[i * 3 + 1] = 999;
        data.positions[i * 3 + 2] = 999;
        data.colors[i * 3 + 0] = 0;
        data.colors[i * 3 + 1] = 0;
        data.colors[i * 3 + 2] = 0;
      }
    }

    geomRef.current.attributes.position.needsUpdate = true;
    geomRef.current.attributes.color.needsUpdate = true;
  });

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(data.positions, 3));
    g.setAttribute("color", new THREE.BufferAttribute(data.colors, 3));
    return g;
  }, [data]);

  return (
    <points ref={pointsRef}>
      <primitive object={geometry} ref={geomRef} attach="geometry" />
      <pointsMaterial
        size={0.05}
        sizeAttenuation
        vertexColors
        transparent
        opacity={0.95}
        depthWrite={false}
      />
    </points>
  );
}

function VesselSprout({ growth = 0.2, pulse = 0.0 }) {
  const meshRef = useRef(null);

  const { geom, idxCount } = useMemo(() => {
    // curve from cell edge outward
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(2.1, -0.35, 0.05),
      new THREE.Vector3(2.35, -0.15, 0.05),
      new THREE.Vector3(2.65, 0.15, 0.00),
      new THREE.Vector3(2.95, 0.55, -0.10)
    ]);

    const g = new THREE.TubeGeometry(curve, 220, 0.09, 12, false);
    const count = g.index ? g.index.count : g.attributes.position.count;
    return { geom: g, idxCount: count };
  }, []);

  useFrame((_, dt) => {
    if (!meshRef.current) return;
    const g = meshRef.current.geometry;
    const t = clamp01(growth);

    // reveal tube by draw range
    const draw = Math.max(0, Math.floor(idxCount * t));
    g.setDrawRange(0, draw);

    // subtle pulsing (feels “alive”)
    const p = 1 + 0.04 * pulse;
    meshRef.current.scale.set(p, p, p);
  });

  return (
    <mesh ref={meshRef} geometry={geom} position={[0, 0, 0]}>
      <meshStandardMaterial
        color="#60a5fa"
        roughness={0.35}
        emissive="#ffffff"
        emissiveIntensity={0.28}
        transparent
        opacity={0.95}
      />
    </mesh>
  );
}

function FibrosisBundle({ thickness = 0.3, growth = 0.3, pulse = 0.0 }) {
  const groupRef = useRef(null);

  const fibers = useMemo(
    () => [
      { p: [-2.45, 0.05, -0.15], r: [0.2, 0.3, 0.4], h: 1.2 },
      { p: [-2.25, -0.2, 0.55], r: [0.1, 0.6, 0.2], h: 1.0 },
      { p: [-2.15, 0.35, 0.2], r: [0.4, 0.1, 0.5], h: 0.9 },
      { p: [-2.55, -0.15, 0.05], r: [0.3, 0.2, 0.2], h: 1.1 }
    ],
    []
  );

  useFrame(() => {
    if (!groupRef.current) return;
    const t = clamp01(thickness);
    const g = clamp01(growth);
    const p = 1 + 0.04 * pulse;

    // thickness affects XZ scale, growth affects Y scale
    groupRef.current.scale.set(0.7 + 2.2 * t, (0.35 + 0.95 * g) * p, 0.7 + 2.2 * t);
  });

  return (
    <group ref={groupRef}>
      {fibers.map((f, i) => (
        <mesh key={i} position={f.p} rotation={f.r}>
          <cylinderGeometry args={[0.06, 0.06, f.h, 18]} />
          <meshStandardMaterial
            color="#eab308"
            roughness={0.78}
            emissive="#ffffff"
            emissiveIntensity={0.22}
            transparent
            opacity={0.95}
          />
        </mesh>
      ))}
    </group>
  );
}

function ERWeb({ emissiveIntensity = 0.2, spin = 0 }) {
  const geom = useMemo(() => {
    const pts = [];
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      pts.push(
        new THREE.Vector3(
          Math.cos(a) * (1.15 + 0.08 * Math.sin(3 * a)),
          0.25 * Math.sin(2 * a),
          Math.sin(a) * (1.05 + 0.10 * Math.cos(2 * a))
        )
      );
    }
    pts.push(pts[0].clone());
    const curve = new THREE.CatmullRomCurve3(pts, true);
    return new THREE.TubeGeometry(curve, 160, 0.06, 10, true);
  }, []);

  return (
    <mesh geometry={geom} rotation={[0, spin, 0]}>
      <meshStandardMaterial
        color="#fca5a5"
        roughness={0.35}
        emissive="#ffffff"
        emissiveIntensity={emissiveIntensity}
        transparent
        opacity={0.88}
      />
    </mesh>
  );
}

function CellVisual({ model, highlights, selectedId, onSelect, visualFX = true }) {
  const tRef = useRef(0);

  // derive “drives” from current model outputs
  const receptorDrive = useMemo(() => {
    const v = ((model?.genes?.ESR1 ?? 0) + (model?.genes?.ESR2 ?? 0)) / 200;
    return clamp01(v);
  }, [model]);

  const cytokineDrive = useMemo(() => {
    const v =
      ((model?.mediators?.IL6 ?? 0) +
        (model?.mediators?.TNF ?? 0) +
        (model?.mediators?.IL1B ?? 0)) /
      300;
    return clamp01(v);
  }, [model]);

  const prostDrive = useMemo(() => {
    const v =
      ((model?.mediators?.PGE2 ?? 0) + (model?.mediators?.PGF2A ?? 0)) / 200;
    return clamp01(v);
  }, [model]);

  const angioDrive = useMemo(() => clamp01((model?.outcomes?.angiogenesis ?? 0) / 100), [model]);
  const fibroDrive = useMemo(() => clamp01((model?.outcomes?.fibrosis ?? 0) / 100), [model]);

  // receptor positions for particle attraction
  const receptorTargets = useMemo(
    () => [
      [1.95, 0.35, 0.2],
      [-1.85, -0.25, 0.3]
    ],
    []
  );

  useFrame((_, dt) => {
    tRef.current += dt;
  });

  // pulsing lights
  const pulse = 0.5 + 0.5 * Math.sin(tRef.current * (1.8 + 1.6 * receptorDrive));

  // how “hot” receptors should feel
  const receptorGlow = clamp01(0.25 + 0.85 * receptorDrive + 0.35 * cytokineDrive);

  // vessel pulse tied to angiogenesis + pulse
  const vesselPulse = (0.3 + 1.0 * angioDrive) * pulse;

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
            <mesh position={[0.45, 0.35, 0.25]}>
              <sphereGeometry args={[0.22, 32, 32]} />
              <meshStandardMaterial
                color="#c4b5fd"
                roughness={0.4}
                emissive="#ffffff"
                emissiveIntensity={emissiveIntensity * 0.65}
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
          <ERWeb
            emissiveIntensity={Math.max(emissiveIntensity, 0.15 + 0.45 * cytokineDrive)}
            spin={tRef.current * 0.25}
          />
        )}
      </ClickableMesh>

      {/* Golgi */}
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
                  emissiveIntensity={Math.max(emissiveIntensity, 0.15 + 0.55 * cytokineDrive)}
                  transparent
                  opacity={0.95}
                />
              </mesh>
            ))}
          </group>
        )}
      </ClickableMesh>

      {/* Receptors (lighting up) */}
      <ClickableMesh
        id="er_receptors"
        label="ERα / ERβ (Receptors)"
        highlighted={highlights.er_receptors}
        selected={selectedId === "er_receptors"}
        onSelect={onSelect}
        tooltipPos={[1.85, 0.55, 0.2]}
      >
        {() => (
          <group>
            {/* receptor spheres */}
            <mesh position={[1.95, 0.35, 0.2]}>
              <sphereGeometry args={[0.16, 32, 32]} />
              <meshStandardMaterial
                color="#f472b6"
                roughness={0.25}
                emissive="#ffffff"
                emissiveIntensity={0.2 + 1.1 * receptorGlow * pulse}
              />
            </mesh>
            <mesh position={[-1.85, -0.25, 0.3]}>
              <sphereGeometry args={[0.16, 32, 32]} />
              <meshStandardMaterial
                color="#f472b6"
                roughness={0.25}
                emissive="#ffffff"
                emissiveIntensity={0.2 + 1.1 * receptorGlow * (1 - 0.15 + 0.15 * pulse)}
              />
            </mesh>

            {/* extra local lights (feel like “activation”) */}
            {visualFX && (
              <>
                <pointLight
                  position={[1.95, 0.35, 0.2]}
                  intensity={0.6 * receptorGlow * pulse}
                  distance={2.2}
                />
                <pointLight
                  position={[-1.85, -0.25, 0.3]}
                  intensity={0.6 * receptorGlow * (0.9 + 0.1 * pulse)}
                  distance={2.2}
                />
              </>
            )}
          </group>
        )}
      </ClickableMesh>

      {/* Mitochondria */}
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

      {/* Glycolysis */}
      <ClickableMesh
        id="glycolysis"
        label="Glycolysis / Lactate shift"
        highlighted={highlights.glycolysis}
        selected={selectedId === "glycolysis"}
        onSelect={onSelect}
        tooltipPos={[0.0, 1.55, -0.55]}
      >
        {({ emissiveIntensity }) => (
          <mesh position={[0.0, 1.35, -0.55]} rotation={[0.3, tRef.current * 0.6, 0]}>
            <torusGeometry args={[0.36, 0.08, 16, 60]} />
            <meshStandardMaterial
              color="#22c55e"
              roughness={0.35}
              emissive="#ffffff"
              emissiveIntensity={Math.max(emissiveIntensity, 0.12 + 0.75 * angioDrive)}
            />
          </mesh>
        )}
      </ClickableMesh>

      {/* COX-2 / Prostaglandins */}
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
                  emissiveIntensity={Math.max(emissiveIntensity, 0.2 + 0.9 * prostDrive * pulse)}
                />
              </mesh>
            ))}
          </group>
        )}
      </ClickableMesh>

      {/* Angiogenesis: animated sprout */}
      <ClickableMesh
        id="angiogenesis"
        label="Angiogenesis (Sprouting)"
        highlighted={highlights.angiogenesis}
        selected={selectedId === "angiogenesis"}
        onSelect={onSelect}
        tooltipPos={[2.65, 0.15, 0.0]}
      >
        {() => (
          <group>
            <VesselSprout growth={angioDrive} pulse={vesselPulse} />
          </group>
        )}
      </ClickableMesh>

      {/* Fibrosis: thickening fibers */}
      <ClickableMesh
        id="fibrosis"
        label="Fibrosis / ECM (Thickening)"
        highlighted={highlights.fibrosis}
        selected={selectedId === "fibrosis"}
        onSelect={onSelect}
        tooltipPos={[-2.35, 0.1, 0.2]}
      >
        {() => (
          <FibrosisBundle
            thickness={fibroDrive}
            growth={fibroDrive}
            pulse={0.25 * pulse}
          />
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
                emissiveIntensity={Math.max(emissiveIntensity, 0.15 + 0.75 * cytokineDrive * pulse)}
              />
            </mesh>

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
                  emissiveIntensity={0.12 + 0.55 * cytokineDrive * pulse}
                />
              </mesh>
            ))}
          </group>
        )}
      </ClickableMesh>

      {/* Particle clouds (visual realism) */}
      {visualFX && (
        <>
          {/* cytokines from macrophage toward receptors */}
          <ParticleCloud
            enabled={true}
            origin={[0.0, -2.65, 0.0]}
            targets={receptorTargets}
            strength={cytokineDrive}
            baseColor={[0.65, 0.85, 1.0]}
            count={900}
            bounds={7}
          />

          {/* prostaglandin-ish cloud from COX cluster (warmer) */}
          <ParticleCloud
            enabled={true}
            origin={[1.18, 0.88, 0.75]}
            targets={receptorTargets}
            strength={prostDrive}
            baseColor={[1.0, 0.55, 0.65]}
            count={650}
            bounds={7}
          />
        </>
      )}
    </group>
  );
}

export default function CellScene({ model, highlights, selectedId, onSelect, visualFX = true }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 6.6], fov: 45 }}
      style={{ width: "100%", height: "100%" }}
    >
      <ambientLight intensity={0.7} />
      <directionalLight position={[6, 8, 8]} intensity={1.2} />
      <pointLight position={[-6, -2, 6]} intensity={0.9} />

      <Stars radius={60} depth={30} count={700} factor={2} fade />

      <CellVisual
        model={model}
        highlights={highlights}
        selectedId={selectedId}
        onSelect={onSelect}
        visualFX={visualFX}
      />

      <OrbitControls enablePan={false} minDistance={4.2} maxDistance={10} />
    </Canvas>
  );
}
