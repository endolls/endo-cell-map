"use client";

import { useEffect, useMemo, useState } from "react";
import WebGLGuard from "./WebGLGuard";
import CellScene from "./CellScene";
import SidePanel from "./SidePanel";
import LegendOverlay from "./LegendOverlay";
import ScenarioChat from "./ScenarioChat";
import { computeModel } from "../lib/rules";
import { PRESETS } from "../lib/model";

const STORAGE_KEY = "endo_cell_map_customer_v2";

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

function id() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export default function SimulatorApp() {
  const [state, setState] = useState(DEFAULT_STATE);
  const [selectedPartId, setSelectedPartId] = useState(null);
  const [legendOpen, setLegendOpen] = useState(true);
  const [chatOpen, setChatOpen] = useState(true);
  const [messages, setMessages] = useState([
    {
      id: id(),
      kind: "system",
      text:
        "Welcome. Pick a preset to see a guided explanation + watch the cell visuals react (glow, particles, vessels, adhesions)."
    }
  ]);

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

  // Chat narrator: explain every time preset changes
  useEffect(() => {
    const p = preset;
    if (!p) return;

    setSelectedPartId(null);

    const pain = Math.round(model?.outcomes?.pain ?? 0);
    const infl = Math.round(model?.outcomes?.inflammation ?? 0);
    const fibro = Math.round(model?.outcomes?.fibrosis ?? 0);
    const angio = Math.round(model?.outcomes?.angiogenesis ?? 0);

    setMessages((prev) => [
      ...prev,
      {
        id: id(),
        kind: "preset",
        text: `Preset selected: ${p.name}\n\n${p.story}\n\nWhat to watch:\n• ${p.watch.join("\n• ")}`
      },
      {
        id: id(),
        kind: "tip",
        text: `Live readouts right now:\n• Pain: ${pain}/100\n• Inflammation: ${infl}/100\n• Fibrosis: ${fibro}/100\n• Angiogenesis: ${angio}/100`,
        meta: "Tip: click any glowing red area to see what it represents."
      }
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.presetId]);

  const reset = () => {
    setState(DEFAULT_STATE);
    setSelectedPartId(null);
    setLegendOpen(true);
    setChatOpen(true);
    setMessages([
      {
        id: id(),
        kind: "system",
        text:
          "Reset complete. Pick a preset and I’ll explain what you’re seeing."
      }
    ]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  };

  return (
    <div className="simLayout">
      <div className="canvasCard">
        <div className="canvasTopHint">
          <div className="hintPill">Pick a preset → watch the cell react.</div>
          <div className="hintPill">Red glow = “affected / active” areas.</div>
        </div>

        <LegendOverlay open={legendOpen} setOpen={setLegendOpen} model={model} preset={preset} />

        <ScenarioChat open={chatOpen} setOpen={setChatOpen} messages={messages} />

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
