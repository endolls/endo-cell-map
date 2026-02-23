"use client";

import { useEffect, useMemo, useState } from "react";
import WebGLGuard from "./WebGLGuard";
import CellScene from "./CellScene";
import SidePanel from "./SidePanel";
import { computeModel } from "../lib/rules";

const STORAGE_KEY = "endo_cell_map_state_v1";

const DEFAULT_STATE = {
  estrogen: 0.25,
  hypoxia: 0.15,
  m2: 0.25,
  progesteroneResistance: false,
  arid1aLoss: false
};

export default function SimulatorApp() {
  const [state, setState] = useState(DEFAULT_STATE);
  const [selectedPartId, setSelectedPartId] = useState(null);

  // Load from localStorage (optional)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setState({ ...DEFAULT_STATE, ...JSON.parse(raw) });
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save to localStorage (optional)
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }, [state]);

  const model = useMemo(() => computeModel(state), [state]);

  const reset = () => {
    setState(DEFAULT_STATE);
    setSelectedPartId(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  };

  return (
    <div className="simLayout">
      <div className="canvasCard">
        <div className="canvasTopHint">
          <div className="hintPill">
            Click an organelle to explore. Drag to rotate. Scroll to zoom.
          </div>
          <div className="hintPill">
            “Lit” parts reflect the current sliders/toggles (educational rules engine).
          </div>
        </div>

        <WebGLGuard>
          <CellScene
            highlights={model.highlights}
            selectedId={selectedPartId}
            onSelect={(id) => setSelectedPartId(id)}
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