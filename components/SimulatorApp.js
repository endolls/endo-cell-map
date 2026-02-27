"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import WebGLGuard from "./WebGLGuard";
import CellScene from "./CellScene";
import SidePanel from "./SidePanel";
import ScenarioChat from "./ScenarioChat";
import { computeModel } from "../lib/rules";
import { PRESETS } from "../lib/model";

const STORAGE_KEY = "endo_cell_map_customer_v3";

const DEFAULT_STATE = {
  presetId: "baseline",

  estrogen: 0.25,
  hypoxia: 0.15,
  m2: 0.25,
  progesteroneResistance: false,
  arid1aLoss: false,

  il6Drive: 0.15,
  tnfDrive: 0.1,
  il1bDrive: 0.1,
  pge2Input: 0.1,
  pgf2aInput: 0.1,
  nsaid: false,

  visualFX: true
};

const LABELS = {
  estrogen: "Estrogen spike",
  hypoxia: "Low oxygen (hypoxia)",
  m2: "Macrophage M2 shift",
  progesteroneResistance: "Progesterone resistance",
  arid1aLoss: "ARID1A loss",
  il6Drive: "IL-6 drive",
  tnfDrive: "TNF-α drive",
  il1bDrive: "IL-1β drive",
  pge2Input: "PGE2 input",
  pgf2aInput: "PGF2α input",
  nsaid: "NSAID on",
  visualFX: "Visual FX"
};

function clamp01(x) {
  const n = Number.isFinite(x) ? x : 0;
  return Math.max(0, Math.min(1, n));
}

function levelWord01(x) {
  const v = clamp01(x);
  if (v < 0.34) return "low";
  if (v < 0.67) return "medium";
  return "high";
}

function buildNarration({ preset, state, model, lastChange }) {
  const o = model?.outcomes || {};
  const m = model?.mediators || {};

  const pain = Math.round(o.pain ?? 0);
  const infl = Math.round(o.inflammation ?? 0);
  const fibro = Math.round(o.fibrosis ?? 0);
  const angio = Math.round(o.angiogenesis ?? 0);

  const il6 = (m.IL6 ?? 0) / 100;
  const tnf = (m.TNF ?? 0) / 100;
  const il1 = (m.IL1B ?? 0) / 100;
  const pge2 = (m.PGE2 ?? 0) / 100;
  const pgf2 = (m.PGF2A ?? 0) / 100;

  const story = preset?.story ? preset.story : "Preset story not found.";
  const watch = preset?.watch?.length ? preset.watch.map((x) => `• ${x}`).join("\n") : "";

  const legend =
    "Legend (what you’re seeing):\n" +
    "• Red glow = parts that are most ‘active/affected’ right now\n" +
    "• Blue particles = immune cytokines (IL-6 / TNF-α / IL-1β)\n" +
    "• Pink/red particles = prostaglandins (PGE2 / PGF2α)\n" +
    "• Long tubes outside the cell = blood vessels / vascularity\n" +
    "• Golden scaffold/fibers = adhesions + scar-tissue build-up\n";

  const live =
    "Live readouts (0–100):\n" +
    `• Pain sensitivity: ${pain}\n` +
    `• Inflammation: ${infl}\n` +
    `• Fibrosis / scar tissue: ${fibro}\n` +
    `• Vascularity: ${angio}\n`;

  const drivers =
    "Right now, your ‘signal levels’ look like:\n" +
    `• Cytokines: IL-6 ${levelWord01(il6)}, TNF ${levelWord01(tnf)}, IL-1β ${levelWord01(il1)}\n` +
    `• Prostaglandins: PGE2 ${levelWord01(pge2)}, PGF2α ${levelWord01(pgf2)}\n` +
    (state.nsaid ? "• NSAID is ON → prostaglandin impact is dampened\n" : "");

  const change =
    lastChange
      ? `Your last change:\n• ${lastChange}\n`
      : "Tip: move a slider and I’ll explain what it’s causing.\n";

  return (
    `${preset?.name ?? "Preset"}\n` +
    `${story}\n\n` +
    (watch ? `What to watch:\n${watch}\n\n` : "") +
    legend +
    "\n" +
    drivers +
    "\n" +
    live +
    "\n" +
    change
  );
}

function describeChange(prev, next, model) {
  // find the biggest meaningful change
  const keys = [
    "presetId",
    "estrogen",
    "hypoxia",
    "m2",
    "il6Drive",
    "tnfDrive",
    "il1bDrive",
    "pge2Input",
    "pgf2aInput",
    "progesteroneResistance",
    "arid1aLoss",
    "nsaid"
  ];

  let best = null;

  for (const k of keys) {
    if (k === "presetId") continue;
    const a = prev[k];
    const b = next[k];

    if (typeof a === "boolean" || typeof b === "boolean") {
      if (a !== b) {
        best = { key: k, delta: b ? 1 : -1, from: a, to: b };
        break;
      }
    } else {
      const d = Math.abs((b ?? 0) - (a ?? 0));
      if (d >= 0.03 && (!best || d > best.deltaAbs)) {
        best = { key: k, deltaAbs: d, from: a, to: b };
      }
    }
  }

  if (!best) return null;

  const label = LABELS[best.key] || best.key;
  const to = typeof best.to === "number" ? best.to.toFixed(2) : String(best.to);

  // add a friendly “what that does”
  const o = model?.outcomes || {};
  const pain = Math.round(o.pain ?? 0);
  const infl = Math.round(o.inflammation ?? 0);
  const fibro = Math.round(o.fibrosis ?? 0);
  const angio = Math.round(o.angiogenesis ?? 0);

  let effect = "";

  switch (best.key) {
    case "estrogen":
      effect = "Hormone receptors should glow more and pulse faster.";
      break;
    case "hypoxia":
      effect = "You should see more vessel growth and the metabolism (glycolysis) marker intensify.";
      break;
    case "m2":
      effect = "Fibrosis/adhesions should thicken more (scar tissue bias).";
      break;
    case "il6Drive":
    case "tnfDrive":
    case "il1bDrive":
      effect = "Blue immune cloud should get thicker and inflammation tends to rise.";
      break;
    case "pge2Input":
    case "pgf2aInput":
      effect = "Pink/red prostaglandin cloud should intensify and pain sensitivity tends to rise.";
      break;
    case "nsaid":
      effect = best.to ? "NSAID ON → prostaglandin impact is dampened." : "NSAID OFF → prostaglandin impact returns.";
      break;
    case "progesteroneResistance":
      effect = best.to ? "Progesterone response drops → inflammation loop tends to run hotter." : "Progesterone response improves → dampens some inflammatory drive.";
      break;
    case "arid1aLoss":
      effect = best.to ? "Growth potential rises in this educational model." : "Growth potential returns toward baseline.";
      break;
    default:
      effect = "";
  }

  const summary = `(${pain}/100 pain, ${infl}/100 inflammation, ${fibro}/100 fibrosis, ${angio}/100 vascularity)`;

  return `${label} → ${to}. ${effect} ${summary}`;
}

export default function SimulatorApp() {
  const [state, setState] = useState(DEFAULT_STATE);
  const [selectedPartId, setSelectedPartId] = useState(null);
  const [guideOpen, setGuideOpen] = useState(true);

  const [lastChange, setLastChange] = useState(null);
  const [scriptText, setScriptText] = useState("");

  const prevStateRef = useRef(DEFAULT_STATE);
  const debounceRef = useRef(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setState({ ...DEFAULT_STATE, ...JSON.parse(raw) });
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }, [state]);

  const model = useMemo(() => computeModel(state), [state]);

  const preset = useMemo(
    () => PRESETS.find((p) => p.id === state.presetId) || PRESETS[0],
    [state.presetId]
  );

  // Detect meaningful changes (preset or slider/toggle) and update narration (debounced)
  useEffect(() => {
    const prev = prevStateRef.current;
    const next = state;

    // preset change: wipe selection + replace “last change”
    if (prev.presetId !== next.presetId) {
      setSelectedPartId(null);
      setLastChange(`Preset changed to: ${preset?.name ?? next.presetId}`);
    } else {
      const change = describeChange(prev, next, model);
      if (change) setLastChange(change);
    }

    prevStateRef.current = next;

    // debounce narration rebuild so it feels like a “guide” not spam
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setScriptText(buildNarration({ preset, state: next, model, lastChange }));
    }, 450);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  // Ensure script exists on first render
  useEffect(() => {
    setScriptText(buildNarration({ preset, state, model, lastChange }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reset = () => {
    setState(DEFAULT_STATE);
    setSelectedPartId(null);
    setGuideOpen(true);
    setLastChange(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  };

  return (
    <div className="simLayout">
      <div className="canvasCard">
        <div className="canvasTopHint">
          <div className="hintPill">Pick a preset → watch the cell react.</div>
          <div className="hintPill">Red glow = what’s most active/affected.</div>
        </div>

        <ScenarioChat
          open={guideOpen}
          setOpen={setGuideOpen}
          title="Cell Guide"
          scriptText={scriptText}
          typing={true}
        />

        <WebGLGuard>
          <CellScene
            model={model}
            highlights={model.highlights}
            selectedId={selectedPartId}
            onSelect={(id) => setSelectedPartId(id)}
            visualFX={!!state.visualFX}
            presetId={state.presetId}
          />
        </WebGLGuard>
      </div>

      <SidePanel
        state={state}
        setState={setState}
        model={model}
        selectedPartId={selectedPartId}
        setSelectedPartId={setSelectedPartId}
        reset={reset}
      />
    </div>
  );
}
