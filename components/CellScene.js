"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html, OrbitControls, Stars, useCursor } from "@react-three/drei";
import * as THREE from "three";

/* -------------------- helpers -------------------- */
const clamp01 = (x) => Math.max(0, Math.min(1, Number.isFinite(x) ? x : 0));
const lerp = (a, b, t) => a + (b - a) * t;

function Clickable({ id, label, selected, onSelect, tooltipPos, children }) {
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

function setEmissive(mesh, intensity) {
  if (!mesh?.material) return;
  mesh.material.emissive = new THREE.Color("#ff2a2a");
  mesh.material.emissiveIntensity = intensity;
}

function setScale(mesh, s) {
  if (!mesh) return;
  mesh.scale.set(s, s, s);
}

/* -------------------- Particle Cloud (high impact) -------------------- */
function ParticleCloud({
  enabled,
  origin,
  targets,
  strength,
  baseColor,
  count = 1600,
  bounds = 7,
  size = 0.075
}) {
  const geomRef = useRef(null);
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
      velocities[i * 3 + 0] = 0;
      velocities[i * 3 + 1] = 0;
      velocities[i * 3 + 2] = 0;
    }

    return { positions, colors, velocities, life };
  }, [count]);

  const originV = useMemo(() => new THREE.Vector3(...origin), [origin]);
  const targetVs = useMemo(() => targets.map((t) => new THREE.Vector3(...t)), [targets]);

  function spawnOne(i, s) {
    data.life[i] = 0.9 + Math.random() * 1.6; // longer life = denser cloud
    data.positions[i * 3 + 0] = originV.x + (Math.random() - 0.5) * 0.35;
    data.positions[i * 3 + 1] = originV.y + (Math.random() - 0.5) * 0.35;
    data.positions[i * 3 + 2] = originV.z + (Math.random() - 0.5) * 0.35;

    const speed = 0.55 + 2.2 * s;
    data.velocities[i * 3 + 0] = (Math.random() - 0.5) * speed;
    data.velocities[i * 3 + 1] = (Math.random() - 0.5) * speed;
    data.velocities[i * 3 + 2] = (Math.random() - 0.5) * speed;

    data.colors[i * 3 + 0] = baseColor[0];
    data.colors[i * 3 + 1] = baseColor[1];
    data.colors[i * 3 + 2] = baseColor[2];
  }

  useFrame((_, dt) => {
    if (!enabled || !geomRef.current) return;

    const s = clamp01(strength);

    // MUCH more obvious emission
    const spawnPerSecond = 60 + 520 * s; // heavy
    spawnAcc.current += spawnPerSecond * dt;

    while (spawnAcc.current >= 1) {
      spawnAcc.current -= 1;

      // find dead particle
      let idx = -1;
      for (let i = 0; i < count; i++) {
        if (data.life[i] <= 0) {
          idx = i;
          break;
        }
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
        data.velocities[i * 3 + 0],
        data.velocities[i * 3 + 1],
        data.velocities[i * 3 + 2]
      );

      // swirl around cell for visible motion
      const swirl = 0.65 + 1.2 * s;
      const swirlDir = new THREE.Vector3(-tmpPos.z, 0.0, tmpPos.x).normalize();
      tmpVel.addScaledVector(swirlDir, swirl * dt);

      // Brownian
      tmpVel.x += (Math.random() - 0.5) * 0.35 * dt;
      tmpVel.y += (Math.random() - 0.5) * 0.35 * dt;
      tmpVel.z += (Math.random() - 0.5) * 0.35 * dt;

      // attraction to nearest target
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

        const attract = (1.35 + 2.8 * s) * dt * (1.0 / (0.5 + dist));
        tmpVel.addScaledVector(tmpDir, attract);
      }

      tmpPos.addScaledVector(tmpVel, dt);

      data.positions[i * 3 + 0] = tmpPos.x;
      data.positions[i * 3 + 1] = tmpPos.y;
      data.positions[i * 3 + 2] = tmpPos.z;

      data.velocities[i * 3 + 0] = tmpVel.x;
      data.velocities[i * 3 + 1] = tmpVel.y;
      data.velocities[i * 3 + 2] = tmpVel.z;

      // fade
      const fade = clamp01(L / 1.8);
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
        size={size}
        sizeAttenuation
        vertexColors
        transparent
        opacity={0.95}
        depthWrite={false}
      />
    </points>
  );
}

/* -------------------- Vessels (long, obvious) -------------------- */
function VesselTube({ basePos, dir, growth, radius, color }) {
  const meshRef = useRef(null);

  const { geom, idxCount } = useMemo(() => {
    const a = new THREE.Vector3(...basePos);
    const d = new THREE.Vector3(...dir).normalize();

    const curve = new THREE.CatmullRomCurve3([
      a.clone(),
      a.clone().add(d.clone().multiplyScalar(0.9)).add(new THREE.Vector3(0.08, 0.20, 0.0)),
      a.clone().add(d.clone().multiplyScalar(1.85)).add(new THREE.Vector3(0.18, 0.55, -0.12)),
      a.clone().add(d.clone().multiplyScalar(3.0)).add(new THREE.Vector3(0.28, 1.05, -0.35))
    ]);

    const g = new THREE.TubeGeometry(curve, 340, radius, 16, false);
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
      <meshStandardMaterial color={color} roughness={0.28} metalness={0.0} transparent opacity={0.98} />
    </mesh>
  );
}

/* -------------------- Adhesions (VERY visible net) -------------------- */
function AdhesionNet({ amount = 0.0 }) {
  const groupRef = useRef(null);

  const sticks = useMemo(() => {
    // A LOT more sticks; visibility controlled by amount
    const out = [];
    for (let i = 0; i < 120; i++) {
      const x = -2.2 - Math.random() * 1.2;
      const y = (Math.random() - 0.5) * 2.4;
      const z = (Math.random() - 0.5) * 1.8;
      const len = 0.6 + Math.random() * 2.2;
      const rot = [Math.random() * 1.6, Math.random() * 1.6, Math.random() * 1.6];
      out.push({ p: [x, y, z], len, rot });
    }
    return out;
  }, []);

  useFrame((_, dt) => {
    if (!groupRef.current) return;
    const a = clamp01(amount);
    groupRef.current.scale.set(0.4 + 2.8 * a, 0.25 + 2.2 * a, 0.4 + 2.8 * a);
    groupRef.current.rotation.y += dt * (0.10 * a);
  });

  return (
    <group ref={groupRef}>
      {sticks.map((s, i) => (
        <mesh key={i} position={s.p} rotation={s.rot}>
          <cylinderGeometry args={[0.05, 0.05, s.len, 14]} />
          <meshStandardMaterial
            color="#fbbf24"
            roughness={0.85}
            emissive="#ffb000"
            emissiveIntensity={0.18}
            transparent
            opacity={0.92}
          />
        </mesh>
      ))}
    </group>
  );
}

/* -------------------- ER geometry (no hooks inside callbacks) -------------------- */
function useERGeometry() {
  return useMemo(() => {
    const pts = [];
    for (let i = 0; i < 22; i++) {
      const a = (i / 22) * Math.PI * 2;
      pts.push(
        new THREE.Vector3(
          Math.cos(a) * (1.15 + 0.10 * Math.sin(3 * a)),
          0.22 * Math.sin(2 * a),
          Math.sin(a) * (1.05 + 0.14 * Math.cos(2 * a))
        )
      );
    }
    pts.push(pts[0].clone());
    const curve = new THREE.CatmullRomCurve3(pts, true);
    return new THREE.TubeGeometry(curve, 220, 0.075, 14, true);
  }, []);
}

/* -------------------- MAIN VISUAL -------------------- */
function CellVisual({ model, highlights, selectedId, onSelect, visualFX, presetId }) {
  const tRef = useRef(0);

  // material refs for big “whole cell” tint changes
  const cytoMat = useRef(null);
  const memMat = useRef(null);

  // mesh refs for glow/pulse updates
  const receptorRefs = useRef([]);
  const cytokineRecRefs = useRef([]);
  const coxRefs = useRef([]);
  const painRefs = useRef([]);

  // smooth drives (to make changes obvious with animated transitions)
  const drives = useRef({
    estrogen: 0,
    cytokines: 0,
    prost: 0,
    angio: 0,
    fibro: 0,
    pain: 0
  });

  const erGeom = useERGeometry();

  // target drives derived from model
  const targets = useMemo(() => {
    const estrogen = clamp01(((model?.genes?.ESR1 ?? 0) + (model?.genes?.ESR2 ?? 0)) / 200);
    const cytokines = clamp01(((model?.mediators?.IL6 ?? 0) + (model?.mediators?.TNF ?? 0) + (model?.mediators?.IL1B ?? 0)) / 300);
    const prost = clamp01(((model?.mediators?.PGE2 ?? 0) + (model?.mediators?.PGF2A ?? 0)) / 200);
    const angio = clamp01((model?.outcomes?.angiogenesis ?? 0) / 100);
    const fibro = clamp01((model?.outcomes?.fibrosis ?? 0) / 100);
    const pain = clamp01((model?.outcomes?.pain ?? 0) / 100);

    // preset “BOOST” so presets look very different
    let e = estrogen;
    let c = cytokines;
    let p = prost;
    let a = angio;
    let f = fibro;
    let pn = pain;

    if (presetId === "cytokine_flare") {
      c = clamp01(c * 1.6);
      pn = clamp01(pn * 1.35);
    } else if (presetId === "estrogen_spike") {
      e = clamp01(e * 1.7);
      p = clamp01(p * 1.5);
      pn = clamp01(pn * 1.25);
    } else if (presetId === "hypoxic_lesion") {
      a = clamp01(a * 1.85);
    } else if (presetId === "fibrotic_bias") {
      f = clamp01(f * 1.9);
    }

    return { estrogen: e, cytokines: c, prost: p, angio: a, fibro: f, pain: pn };
  }, [model, presetId]);

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

  useFrame((_, dt) => {
    tRef.current += dt;
    const t = tRef.current;

    // smooth transitions (makes preset changes “feel” dramatic)
    const smooth = 1 - Math.pow(0.001, dt); // ~fast smoothing
    drives.current.estrogen = lerp(drives.current.estrogen, targets.estrogen, smooth);
    drives.current.cytokines = lerp(drives.current.cytokines, targets.cytokines, smooth);
    drives.current.prost = lerp(drives.current.prost, targets.prost, smooth);
    drives.current.angio = lerp(drives.current.angio, targets.angio, smooth);
    drives.current.fibro = lerp(drives.current.fibro, targets.fibro, smooth);
    drives.current.pain = lerp(drives.current.pain, targets.pain, smooth);

    const e = drives.current.estrogen;
    const c = drives.current.cytokines;
    const p = drives.current.prost;
    const a = drives.current.angio;
    const f = drives.current.fibro;
    const pn = drives.current.pain;

    // noticeable pulsing
    const pulseE = 0.65 + 0.35 * Math.sin(t * (2.2 + 3.0 * e));
    const pulseC = 0.65 + 0.35 * Math.sin(t * (2.0 + 2.5 * c));
    const pulseP = 0.65 + 0.35 * Math.sin(t * (2.0 + 2.5 * p));
    const pulsePain = 0.65 + 0.35 * Math.sin(t * (2.2 + 2.8 * pn));

    // Whole-cell tint: inflammation -> warmer, hypoxia -> purple-ish
    if (cytoMat.current && memMat.current) {
      const warm = clamp01(0.25 * c + 0.35 * p + 0.25 * pn);
      const hyp = clamp01(0.45 * a); // using angio as proxy here
      const base = new THREE.Color("#7dd3fc");
      const warmC = new THREE.Color("#ff7a7a");
      const hypC = new THREE.Color("#b18cff");

      const mix1 = base.clone().lerp(hypC, hyp);
      const mix2 = mix1.clone().lerp(warmC, warm);

      cytoMat.current.color.copy(mix2);
      cytoMat.current.opacity = 0.10 + 0.18 * warm + 0.10 * hyp;

      const memBase = new THREE.Color("#ffffff");
      const memWarm = new THREE.Color("#ffd1d1");
      memMat.current.color.copy(memBase.clone().lerp(memWarm, warm));
      memMat.current.opacity = 0.08 + 0.08 * warm;
    }

    // Receptors glow + scale
    receptorRefs.current.forEach((msh) => {
      const I = 0.15 + 3.8 * e * pulseE; // HUGE glow
      setEmissive(msh, I);
      setScale(msh, 1 + 0.55 * e * (pulseE - 0.65));
    });

    // Cytokine receptors
    cytokineRecRefs.current.forEach((msh) => {
      const I = 0.10 + 3.4 * c * pulseC;
      setEmissive(msh, I);
      setScale(msh, 1 + 0.45 * c * (pulseC - 0.65));
    });

    // COX/prostaglandin cluster
    coxRefs.current.forEach((msh) => {
      const I = 0.10 + 3.6 * p * pulseP;
      setEmissive(msh, I);
      setScale(msh, 1 + 0.40 * p * (pulseP - 0.65));
    });

    // Pain hotspots (very obvious on flares)
    painRefs.current.forEach((msh) => {
      const I = 0.10 + 4.2 * pn * pulsePain;
      setEmissive(msh, I);
      setScale(msh, 1 + 0.65 * pn * (pulsePain - 0.65));
      if (msh.material) msh.material.opacity = 0.25 + 0.70 * pn;
    });
  });

  // clear ref arrays on re-render
  receptorRefs.current = [];
  cytokineRecRefs.current = [];
  coxRefs.current = [];
  painRefs.current = [];

  const arteryBoost = presetId === "hypoxic_lesion" ? 1.0 : 0.15;
  const adhesionBoost = presetId === "fibrotic_bias" ? 1.0 : 0.12;

  return (
    <group rotation={[0.05, 0.2, 0]}>
      {/* Cytoplasm */}
      <mesh onClick={() => onSelect(null)}>
        <sphereGeometry args={[2.18, 64, 64]} />
        <meshStandardMaterial ref={cytoMat} color="#7dd3fc" transparent opacity={0.12} roughness={0.25} />
      </mesh>

      {/* Membrane */}
      <mesh>
        <sphereGeometry args={[2.21, 64, 64]} />
        <meshStandardMaterial ref={memMat} color="#ffffff" transparent opacity={0.09} roughness={0.35} />
      </mesh>

      {/* Nucleus */}
      <Clickable id="nucleus" label="Nucleus (Control Center)" selected={selectedId === "nucleus"} onSelect={onSelect} tooltipPos={[0.2, 0.25, 0.15]}>
        {({ hovered, selected }) => (
          <group>
            <mesh position={[0.2, 0.2, 0.1]}>
              <sphereGeometry args={[0.92, 48, 48]} />
              <meshStandardMaterial
                color="#a78bfa"
                roughness={0.35}
                emissive="#ff2a2a"
                emissiveIntensity={selected ? 1.2 : hovered ? 0.9 : highlights?.nucleus ? 0.7 : 0.08}
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
                emissiveIntensity={selected ? 1.0 : hovered ? 0.8 : highlights?.nucleus ? 0.55 : 0.06}
              />
            </mesh>
          </group>
        )}
      </Clickable>

      {/* ER */}
      <Clickable id="er_network" label="Protein Factory (ER)" selected={selectedId === "er_network"} onSelect={onSelect} tooltipPos={[0.0, 0.95, -0.2]}>
        {({ hovered, selected }) => (
          <mesh geometry={erGeom} rotation={[0, tRef.current * 0.18, 0]}>
            <meshStandardMaterial
              color="#fca5a5"
              roughness={0.35}
              emissive="#ff2a2a"
              emissiveIntensity={selected ? 1.2 : hovered ? 0.9 : highlights?.er_network ? 0.8 : 0.08}
              transparent
              opacity={0.90}
            />
          </mesh>
        )}
      </Clickable>

      {/* Hormone receptors */}
      <Clickable id="er_receptors" label="Hormone Receptors (ERα/ERβ)" selected={selectedId === "er_receptors"} onSelect={onSelect} tooltipPos={[1.85, 0.55, 0.2]}>
        {() => (
          <group>
            {hormoneTargets.map((p, i) => (
              <mesh
                key={i}
                position={p}
                ref={(r) => r && receptorRefs.current.push(r)}
              >
                <sphereGeometry args={[0.17, 32, 32]} />
                <meshStandardMaterial
                  color="#f472b6"
                  roughness={0.22}
                  emissive="#ff2a2a"
                  emissiveIntensity={0.2}
                />
              </mesh>
            ))}
          </group>
        )}
      </Clickable>

      {/* Cytokine receptor clusters */}
      <Clickable id="cytokine_receptors" label="Immune Signal Receptors" selected={selectedId === "cytokine_receptors"} onSelect={onSelect} tooltipPos={[0.05, 2.25, 0.0]}>
        {() => (
          <group>
            {cytokineTargets.map((p, i) => (
              <mesh
                key={i}
                position={p}
                ref={(r) => r && cytokineRecRefs.current.push(r)}
              >
                <sphereGeometry args={[0.13, 24, 24]} />
                <meshStandardMaterial
                  color="#93c5fd"
                  roughness={0.28}
                  emissive="#ff2a2a"
                  emissiveIntensity={0.2}
                />
              </mesh>
            ))}
          </group>
        )}
      </Clickable>

      {/* COX-2 / prostaglandins */}
      <Clickable id="cox2" label="COX-2 → Prostaglandins" selected={selectedId === "cox2"} onSelect={onSelect} tooltipPos={[1.25, 1.05, 0.9]}>
        {() => (
          <group>
            {[
              [1.05, 0.95, 0.9],
              [1.28, 0.78, 0.75],
              [1.38, 0.98, 0.62],
              [0.92, 0.78, 0.72]
            ].map((p, i) => (
              <mesh
                key={i}
                position={p}
                ref={(r) => r && coxRefs.current.push(r)}
              >
                <dodecahedronGeometry args={[0.20 + (i % 2) * 0.04, 0]} />
                <meshStandardMaterial
                  color="#fb7185"
                  roughness={0.18}
                  emissive="#ff2a2a"
                  emissiveIntensity={0.2}
                />
              </mesh>
            ))}
          </group>
        )}
      </Clickable>

      {/* Pain hotspots (super obvious on flare) */}
      <Clickable id="pain_hotspots" label="Pain Hotspots" selected={selectedId === "pain_hotspots"} onSelect={onSelect} tooltipPos={[1.65, 0.25, 1.0]}>
        {() => (
          <group>
            {[
              [1.55, 0.35, 1.05],
              [1.35, 0.10, 0.95],
              [1.75, 0.05, 0.80],
              [1.60, -0.15, 0.92]
            ].map((p, i) => (
              <mesh
                key={i}
                position={p}
                ref={(r) => r && painRefs.current.push(r)}
              >
                <icosahedronGeometry args={[0.16, 0]} />
                <meshStandardMaterial
                  color="#ff2a2a"
                  roughness={0.15}
                  emissive="#ff2a2a"
                  emissiveIntensity={0.2}
                  transparent
                  opacity={0.2}
                />
              </mesh>
            ))}
          </group>
        )}
      </Clickable>

      {/* Vessels */}
      <Clickable id="angiogenesis" label="Blood Vessels (Sprouting)" selected={selectedId === "angiogenesis"} onSelect={onSelect} tooltipPos={[2.75, 0.35, 0.0]}>
        {() => (
          <group>
            {/* main sprout (always tied to angio) */}
            <VesselTube basePos={[2.0, -0.35, 0.05]} dir={[1.0, 1.0, 0.0]} growth={targets.angio} radius={0.10} color="#60a5fa" />
            <VesselTube basePos={[2.05, -0.55, -0.25]} dir={[1.0, 0.9, 0.25]} growth={targets.angio * 0.85} radius={0.08} color="#60a5fa" />
            <VesselTube basePos={[1.9, -0.25, 0.28]} dir={[1.0, 0.85, -0.15]} growth={targets.angio * 0.70} radius={0.07} color="#60a5fa" />

            {/* hypoxia “vascular density” (VERY visible) */}
            <VesselTube basePos={[1.55, -1.45, 0.60]} dir={[1.0, 0.65, -0.15]} growth={targets.angio * arteryBoost} radius={0.16} color="#ef4444" />
            <VesselTube basePos={[1.75, -1.25, -0.70]} dir={[1.0, 0.55, 0.18]} growth={targets.angio * arteryBoost * 0.95} radius={0.15} color="#ef4444" />
            <VesselTube basePos={[1.85, -1.05, 0.05]} dir={[1.0, 0.60, 0.0]} growth={targets.angio * arteryBoost * 0.90} radius={0.14} color="#ef4444" />
            <VesselTube basePos={[1.40, -1.65, -0.10]} dir={[1.0, 0.70, 0.10]} growth={targets.angio * arteryBoost * 0.85} radius={0.13} color="#ef4444" />
          </group>
        )}
      </Clickable>

      {/* Adhesions / fibrosis */}
      <Clickable id="adhesions" label="Adhesions / Scaffolding" selected={selectedId === "adhesions"} onSelect={onSelect} tooltipPos={[-2.9, -0.6, 0.4]}>
        {() => <AdhesionNet amount={targets.fibro * adhesionBoost} />}
      </Clickable>

      {/* Clouds (VERY obvious) */}
      {visualFX && (
        <>
          <ParticleCloud
            enabled={true}
            origin={[0.0, -2.65, 0.0]}
            targets={cytokineTargets}
            strength={targets.cytokines}
            baseColor={[0.65, 0.85, 1.0]}
            count={1800}
            size={0.08}
          />
          <ParticleCloud
            enabled={true}
            origin={[1.18, 0.88, 0.75]}
            targets={[...hormoneTargets, ...cytokineTargets]}
            strength={targets.prost}
            baseColor={[1.0, 0.45, 0.55]}
            count={1600}
            size={0.08}
          />
        </>
      )}
    </group>
  );
}

export default function CellScene({
  model,
  highlights,
  selectedId,
  onSelect,
  visualFX = true,
  presetId = "baseline"
}) {
  return (
    <Canvas camera={{ position: [0, 0, 6.6], fov: 45 }} style={{ width: "100%", height: "100%" }}>
      <ambientLight intensity={0.75} />
      <directionalLight position={[6, 8, 8]} intensity={1.25} />
      <pointLight position={[-6, -2, 6]} intensity={0.95} />
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
