"use client";

import { useEffect, useMemo, useState } from "react";
import WebGLGuard from "./WebGLGuard";
import CellScene from "./CellScene";
import SidePanel from "./SidePanel";
import LegendOverlay from "./LegendOverlay";
import { computeModel } from "../lib/rules";
import { PRESETS } from "../lib/model";

const STORAGE_KEY = "endo_cell_map_state_customer_v1";

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

export default function SimulatorApp() {
  const [state, setState] = useState(DEFAULT_STATE);
  const [selectedPartId, setSelectedPartId] = useState(null);
  const [legendOpen, setLegendOpen] = useState(true);

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

  const reset = () => {
    setState(DEFAULT_STATE);
    setSelectedPartId(null);
    setLegendOpen(true);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  };

  return (
    <div className="simLayout">
      <div className="canvasCard">
        <div className="canvasTopHint">
          <div className="hintPill">Click a part to learn what it does.</div>
          <div className="hintPill">Use presets for “stories,” not numbers.</div>
        </div>

        <LegendOverlay
          open={legendOpen}
          setOpen={setLegendOpen}
          model={model}
          preset={preset}
        />

        <WebGLGuard>
          <CellScene
            model={model}
            highlights={model.highlights}
            selectedId={selectedPartId}
            onSelect={(id) => setSelectedPartId(id)}
            visualFX={!!state.visualFX}
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
