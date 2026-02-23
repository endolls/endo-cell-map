"use client";

import { Bar } from "./MiniBars";
import { PRESETS, PARTS } from "../lib/model";

export default function SidePanel({
  state,
  setState,
  model,
  selectedPartId,
  setSelectedPartId,
  reset
}) {
  const selected = PARTS.find((p) => p.id === selectedPartId) || null;

  const slider = (key, label) => (
    <div className="panelRow">
      <label>{label}</label>
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={state[key]}
        onChange={(e) => setState((s) => ({ ...s, [key]: +e.target.value }))}
      />
      <div className="kv">
        <div className="k">Level</div>
        <div className="v">{Number(state[key]).toFixed(2)}</div>
      </div>
    </div>
  );

  return (
    <div className="panel">
      <h2>Core Drivers</h2>
      {slider("estrogen", "Estrogen spike")}
      {slider("hypoxia", "Hypoxia")}
      {slider("m2", "Macrophage M2 shift")}

      <div className="panelRow">
        <div className="toggle">
          <input
            type="checkbox"
            checked={state.progesteroneResistance}
            onChange={(e) =>
              setState((s) => ({ ...s, progesteroneResistance: e.target.checked }))
            }
          />
          <label>Progesterone resistance</label>
        </div>

        <div className="toggle">
          <input
            type="checkbox"
            checked={state.arid1aLoss}
            onChange={(e) => setState((s) => ({ ...s, arid1aLoss: e.target.checked }))}
          />
          <label>ARID1A loss</label>
        </div>
      </div>

      <hr className="sep" />

      <h2>Inflammatory Inputs</h2>
      <div className="small">
        These sliders are “user pushes” to explore how cytokines and prostaglandins
        shift the educational model (not a clinical prediction).
      </div>
      {slider("il6Drive", "IL-6 drive")}
      {slider("tnfDrive", "TNF-α drive")}
      {slider("il1bDrive", "IL-1β drive")}
      {slider("pge2Input", "PGE2 input")}
      {slider("pgf2aInput", "PGF2α input")}

      <div className="panelRow">
        <div className="toggle">
          <input
            type="checkbox"
            checked={state.nsaid}
            onChange={(e) => {
  const id = e.target.value;
  const p = PRESETS.find((x) => x.id === id);
  if (p) setState((s) => ({ ...s, presetId: id, ...p.state }));
  e.target.value = "";
}}
          />
          <label>NSAID on (dampen prostaglandins)</label>
        </div>
      </div>
<div className="panelRow">
  <div className="toggle">
    <input
      type="checkbox"
      checked={state.visualFX}
      onChange={(e) => setState((s) => ({ ...s, visualFX: e.target.checked }))}
    />
    <label>Visual FX (particles / glow / animations)</label>
  </div>
</div>
      <hr className="sep" />

      <h2>Preset</h2>
      <div className="panelRow">
        <label>Choose…</label>
        <select
          value=""
          onChange={(e) => {
            const id = e.target.value;
            const p = PRESETS.find((x) => x.id === id);
            if (p) setState((s) => ({ ...s, ...p.state }));
            e.target.value = "";
          }}
        >
          <option value="" disabled>
            Select…
          </option>
          {PRESETS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <div className="btnRow">
          <button onClick={reset}>Reset</button>
          <button onClick={() => setSelectedPartId(null)}>Clear selection</button>
        </div>
      </div>

      <hr className="sep" />

      <h2>Selection</h2>
      {selected ? (
        <div className="kv">
          <div className="k">Part</div>
          <div className="v">{selected.label}</div>
          <div className="k">Pathways</div>
          <div className="v">{selected.pathways.join(", ")}</div>
        </div>
      ) : (
        <div className="small">Click an organelle in the 3D cell.</div>
      )}

      <hr className="sep" />

      <h2>Outcomes (0–100)</h2>
      <Bar label="Pain" value={model.outcomes.pain} />
      <Bar label="Inflammation" value={model.outcomes.inflammation} />
      <Bar label="Fibrosis" value={model.outcomes.fibrosis} />
      <Bar label="Angiogenesis" value={model.outcomes.angiogenesis} />
      <Bar label="Growth potential" value={model.outcomes.growthPotential} />
      <Bar label="Progesterone response" value={model.outcomes.progesteroneResponse} />

      <hr className="sep" />

      <h2>Mediators (0–100)</h2>
      <Bar label="IL-6" value={model.mediators.IL6} />
      <Bar label="TNF-α" value={model.mediators.TNF} />
      <Bar label="IL-1β" value={model.mediators.IL1B} />
      <Bar label="PGE2" value={model.mediators.PGE2} />
      <Bar label="PGF2α" value={model.mediators.PGF2A} />

      <hr className="sep" />

      <h2>Gene markers (0–100)</h2>
      <Bar label="ESR1 (ERα)" value={model.genes.ESR1} />
      <Bar label="ESR2 (ERβ)" value={model.genes.ESR2} />
      <Bar label="CYP19A1" value={model.genes.CYP19A1} />
      <Bar label="HIF1A" value={model.genes.HIF1A} />
      <Bar label="VEGFA" value={model.genes.VEGFA} />
      <Bar label="PTGS2 (COX-2)" value={model.genes.PTGS2} />
      <Bar label="TGFB1" value={model.genes.TGFB1} />
      <Bar label="COL1A1" value={model.genes.COL1A1} />
      <Bar label="NGF" value={model.genes.NGF} />
      <Bar label="TRPV1" value={model.genes.TRPV1} />
      <Bar label="ARID1A (function)" value={model.genes.ARID1A} />

      <hr className="sep" />

      <h2>Active pathways</h2>
      {model.activePathways.length ? (
        <div className="chipRow">
          {model.activePathways.map((p) => (
            <span className="chip" key={p}>
              {p}
            </span>
          ))}
        </div>
      ) : (
        <div className="small">No pathways currently “lit up.”</div>
      )}
    </div>
  );
}
