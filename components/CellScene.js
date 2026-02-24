"use client";

import React, { useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html, OrbitControls, Stars, useCursor } from "@react-three/drei";
import * as THREE from "three";

function clamp01(x) {
  const n = Number.isFinite(x) ? x : 0;
  return Math.max(0, Math.min(1, n));
}

function Clickable({
  id,
  label,
  selected,
  onSelect,
  tooltipPos,
  children
}) {
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);

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
        {children({ hovered, selected })}
      </group>

      {(hovered || selected) && (
        <Html distanceFactor={10} position={tooltipPos ?? [0, 0, 0]} style={{ pointerEvents: "none" }}>
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

function emissiveIntensity(hovered, selected, active, base = 0.08) {
  if (selected) return 1.2;
  if (hovered) return 0.9;
  if (active) return 0.85;
  return base;
}

function ParticleCloud({ enabled, origin, targets, strength, baseColor, count = 850, bounds = 7 }) {
  const geomRef = useRef(null);
  const tRef = useRef(0);
  const spawnAcc = useRef(0);

  const data = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const life = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      life[i] = 0;
      positions[i * 3 + 0] = 999;
      positions[i * 3 + 1] = 999;
      positions[i * 3 + 2] = 999;
      colors[i * 3 + 0] = 0;
      colors[i * 3 + 1] = 0;
      colors[i * 3 + 2] = 0;
    }

    return { positions, colors, velocities, life };
  }, [count]);

  const originV = useMemo(() => new THREE.Vector3(...origin), [origin]);
  const targetVs = useMemo(() => targets.map((t) => new THREE.Vector3(...t)), [targets]);

  function spawnOne(i, s) {
    data.life[i] = 0.7 + Math.random() * 1.2;
    data.positions[i * 3 + 0] = originV.x + (Math.random() - 0.5) * 0.25;
    data.positions[i * 3 + 1] = originV.y + (Math.random() - 0.5) * 0.25;
    data.positions[i * 3 + 2] = originV.z + (Math.random() - 0.5) * 0.25;

    const speed = 0.55 + 1.35 * s;
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

    const spawnPerSecond = 25 + 160 * s;
    spawnAcc.current += spawnPerSecond * dt;

    while (spawnAcc.current >= 1) {
      spawnAcc.current -= 1;
      let idx = -1;
      for (let i = 0; i < count; i++) {
        if (data.life[i] <= 0) { idx = i; break; }
      }
      if (idx >= 0) spawnOne(idx, s);
      else break;
    }

    const tmpPos = new THREE.Vector3();
    const tmpVel = new THREE.Vector3();
    const tmpDir = new THREE.Vector3();

    for (let i = 0; i < count; i++) {
      let L = data.life[i];
      if (L <= 0) continue;

      L -= dt;
      data.life[i] = L;

      tmpPos.set(
        data.positions[i * 3 + 0],
        data.positions[i * 3 + 1],
        data.positions[i * 3 + 2]
      );

      tmpVel.set(
        data.velocities[i * 3 + 0] || 0,
        data.velocities[i * 3 + 1] || 0,
        data.velocities[i * 3 + 2] || 0
      );

      // jitter drift
      tmpVel.x += (Math.random() - 0.5) * 0.18 * dt;
      tmpVel.y += (Math.random() - 0.5) * 0.18 * dt;
      tmpVel.z += (Math.random() - 0.5) * 0.18 * dt;

      // attraction
      if (targetVs.length) {
        let nearest = targetVs[0];
        let bestD = tmpPos.distanceToSquared(nearest);
        for (let j = 1; j < targetVs.length; j++) {
          const d = tmpPos.distanceToSquared(targetVs[j]);
          if (d < bestD) { bestD = d; nearest = targetVs[j]; }
        }
        tmpDir.copy(nearest).sub(tmpPos);
        const dist = Math.max(0.001, tmpDir.length());
        tmpDir.normalize();

        const attract = (0.55 + 1.2 * s) * dt * (1.0 / (0.6 + dist));
        tmpVel.addScaledVector(tmpDir, attract);
      }

      tmpPos.addScaledVector(tmpVel, dt);

      data.positions[i * 3 + 0] = tmpPos.x;
      data.positions[i * 3 + 1] = tmpPos.y;
      data.positions[i * 3 + 2] = tmpPos.z;

      data.velocities[i * 3 + 0] = tmpVel.x;
      data.velocities[i * 3 + 1] = tmpVel.y;
      data.velocities[i * 3 + 2] = tmpVel.z;

      const fade = clamp01(L / 1.2);
      data.colors[i * 3 + 0] = baseColor[0] * fade;
      data.colors[i * 3 + 1] = baseColor[1] * fade;
      data.colors[i * 3 + 2] = baseColor[2] * fade;

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
    <points>
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

function VesselTube({ basePos = [2.1, -0.35, 0.05], dir = [1, 1, 0], growth = 0.3, radius = 0.09, color = "#60a5fa" }) {
  const meshRef = useRef(null);

  const { geom, idxCount } = useMemo(() => {
    const a = new THREE.Vector3(...basePos);
    const d = new THREE.Vector3(...dir).normalize();

    const curve = new THREE.CatmullRomCurve3([
      a.clone(),
      a.clone().add(d.clone().multiplyScalar(0.35)).add(new THREE.Vector3(0.0, 0.1, 0.0)),
      a.clone().add(d.clone().multiplyScalar(0.75)).add(new THREE.Vector3(0.08, 0.25, -0.05)),
      a.clone().add(d.clone().multiplyScalar(1.15)).add(new THREE.Vector3(0.15, 0.55, -0.10))
    ]);

    const g = new THREE.TubeGeometry(curve, 220, radius, 12, false);
    const count = g.index ? g.index.count : g.attributes.position.count;
    return { geom: g, idxCount: count };
  }, [basePos, dir, radius]);

  useFrame(() => {
    if (!meshRef.current) return;
    const g = meshRef.current.geometry;
    const t = clamp01(growth);
    g.setDrawRange(0, Math.max(0, Math.floor(idxCount * t)));
  });

  return (
    <mesh ref={meshRef} geometry={geom}>
      <meshStandardMaterial
        color={color}
        roughness={0.35}
        emissive={"#ff2a2a"}
        emissiveIntensity={0.12}
        transparent
        opacity={0.95}
      />
    </mesh>
  );
}

function AdhesionScaffold({ amount = 0.0 }) {
  const groupRef = useRef(null);
  const seeded = useMemo(() => {
    const sticks = [];
    for (let i = 0; i < 36; i++) {
      // cluster on fibrosis side (-x)
      const x = -2.4 - Math.random() * 0.6;
      const y = (Math.random() - 0.5) * 1.6;
      const z = (Math.random() - 0.5) * 1.2;
      const len = 0.6 + Math.random() * 1.2;
      const rot = [Math.random() * 1.2, Math.random() * 1.2, Math.random() * 1.2];
      sticks.push({ p: [x, y, z], len, rot });
    }
    return sticks;
  }, []);

  useFrame((_, dt) => {
    if (!groupRef.current) return;
    const a = clamp01(amount);
    groupRef.current.scale.set(0.55 + 1.8 * a, 0.35 + 1.6 * a, 0.55 + 1.8 * a);
    groupRef.current.rotation.y += dt * (0.05 * a);
  });

  return (
    <group ref={groupRef}>
      {seeded.map((s, i) => (
        <mesh key={i} position={s.p} rotation={s.rot}>
          <cylinderGeometry args={[0.03, 0.03, s.len, 12]} />
          <meshStandardMaterial
            color="#fbbf24"
            roughness={0.8}
            emissive="#ff2a2a"
            emissiveIntensity={0.10}
            transparent
            opacity={0.9}
          />
        </mesh>
      ))}
    </group>
  );
}

function PainHalo({ strength = 0.0 }) {
  const ref = useRef(null);
  useFrame((_, dt) => {
    if (!ref.current) return;
    const s = clamp01(strength);
    ref.current.rotation.z += dt * (0.6 + 1.6 * s);
    const p = 1 + 0.08 * Math.sin(Date.now() / 180) * s;
    ref.current.scale.set(p, p, p);
  });

  return (
    <mesh ref={ref} position={[0, 0, 0]}>
      <torusGeometry args={[2.35, 0.06, 16, 80]} />
      <meshStandardMaterial
        color="#ff2a2a"
        roughness={0.2}
        emissive="#ff2a2a"
        emissiveIntensity={0.10 + 1.05 * clamp01(strength)}
        transparent
        opacity={0.35}
      />
    </mesh>
  );
}

function CellVisual({ model, highlights, selectedId, onSelect, visualFX, presetId }) {
  const tRef = useRef(0);
  useFrame((_, dt) => { tRef.current += dt; });

  const estrogenDrive = clamp01(((model?.genes?.ESR1 ?? 0) + (model?.genes?.ESR2 ?? 0)) / 200);
  const cytokineDrive = clamp01(((model?.mediators?.IL6 ?? 0) + (model?.mediators?.TNF ?? 0) + (model?.mediators?.IL1B ?? 0)) / 300);
  const prostDrive = clamp01(((model?.mediators?.PGE2 ?? 0) + (model?.mediators?.PGF2A ?? 0)) / 200);
  const angioDrive = clamp01((model?.outcomes?.angiogenesis ?? 0) / 100);
  const fibroDrive = clamp01((model?.outcomes?.fibrosis ?? 0) / 100);
  const painDrive = clamp01((model?.outcomes?.pain ?? 0) / 100);

  const pulse = 0.5 + 0.5 * Math.sin(tRef.current * (1.8 + 1.6 * estrogenDrive));

  // receptor targets for particles
  const hormoneTargets = useMemo(() => [[1.95, 0.35, 0.2], [-1.85, -0.25, 0.3]], []);
  const cytokineTargets = useMemo(
    () => [
      [0.15, 2.05, 0.25],
      [-0.25, 2.05, -0.15],
      [0.45, 1.95, -0.35],
      [-0.55, 1.85, 0.35]
    ],
    []
  );

  // extra “arteries” appear more in hypoxia preset
  const arteryBoost = presetId === "hypoxic_lesion" ? 1.0 : 0.35;

  // extra adhesions in fibrosis preset
  const adhesionBoost = presetId === "fibrotic_bias" ? 1.0 : 0.35;

  return (
    <group rotation={[0.05, 0.2, 0]}>
      {/* Cytoplasm */}
      <mesh onClick={() => onSelect(null)}>
        <sphereGeometry args={[2.18, 64, 64]} />
        <meshStandardMaterial color="#7dd3fc" transparent opacity={0.12} roughness={0.25} />
      </mesh>

      {/* Membrane */}
      <mesh>
        <sphereGeometry args={[2.21, 64, 64]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.09} roughness={0.35} />
      </mesh>

      {/* Pain halo */}
      {visualFX && <PainHalo strength={painDrive} />}

      {/* Nucleus */}
      <Clickable id="nucleus" label="Nucleus" selected={selectedId === "nucleus"} onSelect={onSelect} tooltipPos={[0.2, 0.25, 0.15]}>
        {({ hovered, selected }) => (
          <group>
            <mesh position={[0.2, 0.2, 0.1]}>
              <sphereGeometry args={[0.92, 48, 48]} />
              <meshStandardMaterial
                color="#a78bfa"
                roughness={0.35}
                emissive="#ff2a2a"
                emissiveIntensity={emissiveIntensity(hovered, selected, highlights.nucleus, 0.08)}
                transparent
                opacity={0.95}
              />
            </mesh>
            <mesh position={[0.45, 0.35, 0.25]}>
              <sphereGeometry args={[0.22, 32, 32]} />
              <meshStandardMaterial
                color="#c4b5fd"
                roughness={0.4}
                emissive="#ff2a2a"
                emissiveIntensity={emissiveIntensity(hovered, selected, highlights.nucleus, 0.06)}
              />
            </mesh>
          </group>
        )}
      </Clickable>

      {/* ER network */}
      <Clickable id="er_network" label="Protein Factory (ER)" selected={selectedId === "er_network"} onSelect={onSelect} tooltipPos={[0.0, 0.95, -0.2]}>
        {({ hovered, selected }) => {
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
            <mesh geometry={geom} rotation={[0, tRef.current * 0.25, 0]}>
              <meshStandardMaterial
                color="#fca5a5"
                roughness={0.35}
                emissive="#ff2a2a"
                emissiveIntensity={emissiveIntensity(hovered, selected, highlights.er_network, 0.08) + 0.45 * cytokineDrive}
                transparent
                opacity={0.88}
              />
            </mesh>
          );
        }}
      </Clickable>

      {/* Golgi */}
      <Clickable id="golgi" label="Shipping Center (Golgi)" selected={selectedId === "golgi"} onSelect={onSelect} tooltipPos={[-0.55, -0.35, 0.7]}>
        {({ hovered, selected }) => (
          <group position={[-0.55, -0.35, 0.65]} rotation={[0.2, 0.6, 0]}>
            {[0, 1, 2, 3].map((i) => (
              <mesh key={i} position={[0, i * 0.12, 0]}>
                <torusGeometry args={[0.38, 0.05, 16, 60, Math.PI * 1.2]} />
                <meshStandardMaterial
                  color="#fde68a"
                  roughness={0.45}
                  emissive="#ff2a2a"
                  emissiveIntensity={emissiveIntensity(hovered, selected, highlights.golgi, 0.08) + 0.35 * cytokineDrive}
                  transparent
                  opacity={0.95}
                />
              </mesh>
            ))}
          </group>
        )}
      </Clickable>

      {/* Hormone receptors */}
      <Clickable id="er_receptors" label="Hormone Receptors" selected={selectedId === "er_receptors"} onSelect={onSelect} tooltipPos={[1.85, 0.55, 0.2]}>
        {({ hovered, selected }) => (
          <group>
            {hormoneTargets.map((p, i) => (
              <mesh key={i} position={p}>
                <sphereGeometry args={[0.16, 32, 32]} />
                <meshStandardMaterial
                  color="#f472b6"
                  roughness={0.25}
                  emissive="#ff2a2a"
                  emissiveIntensity={0.2 + 1.2 * estrogenDrive * pulse + (hovered || selected ? 0.4 : 0)}
                />
              </mesh>
            ))}
            {visualFX && (
              <>
                <pointLight position={hormoneTargets[0]} intensity={0.7 * estrogenDrive * pulse} distance={2.4} color="#ff2a2a" />
                <pointLight position={hormoneTargets[1]} intensity={0.7 * estrogenDrive * (0.85 + 0.15 * pulse)} distance={2.4} color="#ff2a2a" />
              </>
            )}
          </group>
        )}
      </Clickable>

      {/* Cytokine receptors (NEW clusters) */}
      <Clickable id="cytokine_receptors" label="Immune Signal Receptors" selected={selectedId === "cytokine_receptors"} onSelect={onSelect} tooltipPos={[0.05, 2.25, 0.0]}>
        {({ hovered, selected }) => (
          <group>
            {cytokineTargets.map((p, i) => (
              <mesh key={i} position={p}>
                <sphereGeometry args={[0.11, 24, 24]} />
                <meshStandardMaterial
                  color="#93c5fd"
                  roughness={0.3}
                  emissive="#ff2a2a"
                  emissiveIntensity={0.15 + 1.25 * cytokineDrive * (0.8 + 0.2 * pulse) + (hovered || selected ? 0.35 : 0)}
                />
              </mesh>
            ))}
            {visualFX && (
              <pointLight position={[0.0, 2.05, 0.1]} intensity={0.55 * cytokineDrive * pulse} distance={2.6} color="#ff2a2a" />
            )}
          </group>
        )}
      </Clickable>

      {/* Mitochondria */}
      <Clickable id="mitochondria" label="Mitochondria" selected={selectedId === "mitochondria"} onSelect={onSelect} tooltipPos={[-0.85, 1.0, 0.7]}>
        {({ hovered, selected }) => (
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
                  emissive="#ff2a2a"
                  emissiveIntensity={emissiveIntensity(hovered, selected, highlights.mitochondria, 0.06)}
                />
              </mesh>
            ))}
          </group>
        )}
      </Clickable>

      {/* Glycolysis */}
      <Clickable id="glycolysis" label="Sugar Burn Mode" selected={selectedId === "glycolysis"} onSelect={onSelect} tooltipPos={[0.0, 1.55, -0.55]}>
        {({ hovered, selected }) => (
          <mesh position={[0.0, 1.35, -0.55]} rotation={[0.3, tRef.current * 0.6, 0]}>
            <torusGeometry args={[0.36, 0.08, 16, 60]} />
            <meshStandardMaterial
              color="#22c55e"
              roughness={0.35}
              emissive="#ff2a2a"
              emissiveIntensity={emissiveIntensity(hovered, selected, highlights.glycolysis, 0.06) + 0.55 * angioDrive}
            />
          </mesh>
        )}
      </Clickable>

      {/* COX-2 / prostaglandins */}
      <Clickable id="cox2" label="COX-2 → Prostaglandins" selected={selectedId === "cox2"} onSelect={onSelect} tooltipPos={[1.25, 1.05, 0.9]}>
        {({ hovered, selected }) => (
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
                  emissive="#ff2a2a"
                  emissiveIntensity={emissiveIntensity(hovered, selected, highlights.cox2, 0.08) + 0.95 * prostDrive * pulse}
                />
              </mesh>
            ))}
          </group>
        )}
      </Clickable>

      {/* Pain hotspots (NEW) */}
      <Clickable id="pain_hotspots" label="Pain Hotspots" selected={selectedId === "pain_hotspots"} onSelect={onSelect} tooltipPos={[1.6, 0.2, 1.0]}>
        {({ hovered, selected }) => (
          <group>
            {[
              [1.55, 0.35, 1.05],
              [1.35, 0.10, 0.95],
              [1.75, 0.05, 0.80]
            ].map((p, i) => (
              <mesh key={i} position={p}>
                <icosahedronGeometry args={[0.12, 0]} />
                <meshStandardMaterial
                  color="#ff2a2a"
                  roughness={0.2}
                  emissive="#ff2a2a"
                  emissiveIntensity={0.15 + 1.35 * painDrive * (0.7 + 0.3 * pulse) + (hovered || selected ? 0.35 : 0)}
                  transparent
                  opacity={0.95}
                />
              </mesh>
            ))}
          </group>
        )}
      </Clickable>

      {/* Angiogenesis sprout */}
      <Clickable id="angiogenesis" label="Vessel Sprouting" selected={selectedId === "angiogenesis"} onSelect={onSelect} tooltipPos={[2.65, 0.15, 0.0]}>
        {() => (
          <group>
            <VesselTube basePos={[2.05, -0.35, 0.05]} dir={[1.0, 1.0, 0.0]} growth={angioDrive} radius={0.09} color="#60a5fa" />
          </group>
        )}
      </Clickable>

      {/* Arteries nearby (NEW) */}
      <Clickable id="arteries" label="Arteries Nearby" selected={selectedId === "arteries"} onSelect={onSelect} tooltipPos={[2.0, -1.0, -0.6]}>
        {() => (
          <group>
            {/* thicker “artery” tubes appear with hypoxia/angiogenesis */}
            <VesselTube basePos={[1.85, -1.05, -0.55]} dir={[1.0, 0.6, 0.2]} growth={clamp01(angioDrive * arteryBoost)} radius={0.13} color="#ef4444" />
            <VesselTube basePos={[1.65, -1.25, 0.55]} dir={[1.0, 0.7, -0.2]} growth={clamp01(angioDrive * arteryBoost * 0.9)} radius={0.12} color="#ef4444" />
            <VesselTube basePos={[1.95, -0.85, 0.0]} dir={[1.0, 0.7, 0.0]} growth={clamp01(angioDrive * arteryBoost * 0.8)} radius={0.11} color="#ef4444" />
          </group>
        )}
      </Clickable>

      {/* Fibrosis fibers */}
      <Clickable id="fibrosis" label="Fibrosis / Collagen" selected={selectedId === "fibrosis"} onSelect={onSelect} tooltipPos={[-2.35, 0.1, 0.2]}>
        {({ hovered, selected }) => (
          <group scale={[0.8 + 2.0 * fibroDrive, 0.5 + 1.2 * fibroDrive, 0.8 + 2.0 * fibroDrive]}>
            {[
              { p: [-2.45, 0.05, -0.15], r: [0.2, 0.3, 0.4], h: 1.2 },
              { p: [-2.25, -0.2, 0.55], r: [0.1, 0.6, 0.2], h: 1.0 },
              { p: [-2.15, 0.35, 0.2], r: [0.4, 0.1, 0.5], h: 0.9 }
            ].map((f, i) => (
              <mesh key={i} position={f.p} rotation={f.r}>
                <cylinderGeometry args={[0.06, 0.06, f.h, 18]} />
                <meshStandardMaterial
                  color="#eab308"
                  roughness={0.78}
                  emissive="#ff2a2a"
                  emissiveIntensity={emissiveIntensity(hovered, selected, highlights.fibrosis, 0.06) + 0.25 * fibroDrive}
                  transparent
                  opacity={0.95}
                />
              </mesh>
            ))}
          </group>
        )}
      </Clickable>

      {/* Adhesion scaffold (NEW) */}
      <Clickable id="adhesions" label="Adhesions / Scaffolding" selected={selectedId === "adhesions"} onSelect={onSelect} tooltipPos={[-2.9, -0.6, 0.4]}>
        {() => <AdhesionScaffold amount={clamp01(fibroDrive * adhesionBoost)} />}
      </Clickable>

      {/* Lysosomes + ribosomes (extra realism) */}
      <Clickable id="lysosomes" label="Lysosomes (Recycling)" selected={selectedId === "lysosomes"} onSelect={onSelect} tooltipPos={[0.0, -0.2, -1.2]}>
        {({ hovered, selected }) => (
          <group>
            {[[0.2, -0.4, -1.1], [-0.35, -0.15, -1.05], [0.0, -0.75, -0.95]].map((p, i) => (
              <mesh key={i} position={p}>
                <sphereGeometry args={[0.12, 18, 18]} />
                <meshStandardMaterial
                  color="#a7f3d0"
                  roughness={0.5}
                  emissive="#ff2a2a"
                  emissiveIntensity={emissiveIntensity(hovered, selected, false, 0.05)}
                  transparent
                  opacity={0.9}
                />
              </mesh>
            ))}
          </group>
        )}
      </Clickable>

      <Clickable id="ribosomes" label="Ribosomes (Protein Builders)" selected={selectedId === "ribosomes"} onSelect={onSelect} tooltipPos={[-0.2, 1.2, 1.2]}>
        {({ hovered, selected }) => (
          <group>
            {new Array(26).fill(0).map((_, i) => {
              const a = i / 26 * Math.PI * 2;
              const r = 1.55 + 0.15 * Math.sin(i);
              const p = [Math.cos(a) * r, 0.6 + 0.35 * Math.sin(2 * a), Math.sin(a) * r];
              return (
                <mesh key={i} position={p} scale={[0.6, 0.6, 0.6]}>
                  <sphereGeometry args={[0.06, 12, 12]} />
                  <meshStandardMaterial
                    color="#e5e7eb"
                    roughness={0.6}
                    emissive="#ff2a2a"
                    emissiveIntensity={emissiveIntensity(hovered, selected, false, 0.03)}
                    transparent
                    opacity={0.8}
                  />
                </mesh>
              );
            })}
          </group>
        )}
      </Clickable>

      {/* Immune cell */}
      <Clickable id="immune" label="Macrophage" selected={selectedId === "immune"} onSelect={onSelect} tooltipPos={[0.0, -2.75, 0.0]}>
        {({ hovered, selected }) => (
          <group position={[0.0, -2.65, 0.0]}>
            <mesh>
              <sphereGeometry args={[0.38, 32, 32]} />
              <meshStandardMaterial
                color="#93c5fd"
                roughness={0.35}
                emissive="#ff2a2a"
                emissiveIntensity={emissiveIntensity(hovered, selected, highlights.immune, 0.06) + 0.95 * cytokineDrive * (0.7 + 0.3 * pulse)}
              />
            </mesh>
            {[[0.35, 0.05, 0.0], [-0.32, -0.08, 0.15], [0.05, 0.28, -0.18]].map((p, i) => (
              <mesh key={i} position={p} scale={[0.6, 0.6, 0.6]}>
                <icosahedronGeometry args={[0.18, 0]} />
                <meshStandardMaterial
                  color="#93c5fd"
                  roughness={0.35}
                  emissive="#ff2a2a"
                  emissiveIntensity={0.10 + 0.55 * cytokineDrive * pulse}
                />
              </mesh>
            ))}
          </group>
        )}
      </Clickable>

      {/* Particle clouds */}
      {visualFX && (
        <>
          {/* cytokines go to cytokine receptors */}
          <ParticleCloud
            enabled={true}
            origin={[0.0, -2.65, 0.0]}
            targets={cytokineTargets}
            strength={cytokineDrive}
            baseColor={[0.65, 0.85, 1.0]}
            count={900}
          />
          {/* prostaglandins go to pain hotspots + hormone receptors */}
          <ParticleCloud
            enabled={true}
            origin={[1.18, 0.88, 0.75]}
            targets={[...hormoneTargets, [1.55, 0.35, 1.05], [1.35, 0.10, 0.95]]}
            strength={prostDrive}
            baseColor={[1.0, 0.55, 0.65]}
            count={700}
          />
        </>
      )}
    </group>
  );
}

export default function CellScene({ model, highlights, selectedId, onSelect, visualFX = true, presetId = "baseline" }) {
  return (
    <Canvas camera={{ position: [0, 0, 6.6], fov: 45 }} style={{ width: "100%", height: "100%" }}>
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
        presetId={presetId}
      />

      <OrbitControls enablePan={false} minDistance={4.2} maxDistance={10} />
    </Canvas>
  );
}
