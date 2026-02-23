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

  return (
    <div className="panel">
      <h2>Controls</h2>

      <div className="panelRow">
        <label>Estrogen spike</label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={state.estrogen}
          onChange={(e) => setState((s) => ({ ...s, estrogen: +e.target.value }))}
        />
        <div className="kv">
          <div className="k">Level</div>
          <div className="v">{state.estrogen.toFixed(2)}</div>
        </div>
      </div>

      <div className="panelRow">
        <label>Hypoxia</label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={state.hypoxia}
          onChange={(e) => setState((s) => ({ ...s, hypoxia: +e.target.value }))}
        />
        <div className="kv">
          <div className="k">Level</div>
          <div className="v">{state.hypoxia.toFixed(2)}</div>
        </div>
      </div>

      <div className="panelRow">
        <label>Macrophage M2 shift</label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={state.m2}
          onChange={(e) => setState((s) => ({ ...s, m2: +e.target.value }))}
        />
        <div className="kv">
          <div className="k">Level</div>
          <div className="v">{state.m2.toFixed(2)}</div>
        </div>
      </div>

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

      <div className="panelRow">
        <label>Preset</label>
        <select
          value=""
          onChange={(e) => {
            const id = e.target.value;
            const p = PRESETS.find((x) => x.id === id);
            if (p) setState({ ...p.state });
            e.target.value = "";
          }}
        >
          <option value="" disabled>
            Choose…
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
        <>
          <div className="kv">
            <div className="k">Part</div>
            <div className="v">{selected.label}</div>
            <div className="k">Pathways</div>
            <div className="v">{selected.pathways.join(", ")}</div>
          </div>
        </>
      ) : (
        <div className="small">
          Click an organelle/feature in the 3D cell to see its pathway context.
        </div>
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

      <h2>Gene markers (0–100)</h2>
      <Bar label="ESR1 (ERα)" value={model.genes.ESR1} />
      <Bar label="ESR2 (ERβ)" value={model.genes.ESR2} />
      <Bar label="CYP19A1" value={model.genes.CYP19A1} />
      <Bar label="HIF1A" value={model.genes.HIF1A} />
      <Bar label="VEGFA" value={model.genes.VEGFA} />
      <Bar label="PTGS2 (COX-2)" value={model.genes.PTGS2} />
      <Bar label="IL6" value={model.genes.IL6} />
      <Bar label="TNF" value={model.genes.TNF} />
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
        <div className="small">No pathways currently “lit up” by the model.</div>
      )}

      <hr className="sep" />

      <div className="small">
        <strong>Note:</strong> This is a simplified educational rules engine. It’s
        meant to help customers visualize relationships, not to produce
        clinically valid predictions.
      </div>
    </div>
  );
}