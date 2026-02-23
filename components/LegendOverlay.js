"use client";

import { useMemo } from "react";

function levelWord(x) {
  const v = Number(x);
  if (!Number.isFinite(v)) return "low";
  if (v < 0.34) return "low";
  if (v < 0.67) return "medium";
  return "high";
}

export default function LegendOverlay({ open, setOpen, model, preset }) {
  const outcomes = model?.outcomes || {};
  const mediators = model?.mediators || {};

  const headline = useMemo(() => {
    // Simple friendly headline using outcomes
    const pain = outcomes?.pain ?? 0;
    const infl = outcomes?.inflammation ?? 0;
    const fibro = outcomes?.fibrosis ?? 0;
    const angio = outcomes?.angiogenesis ?? 0;

    const top = [
      { k: "Pain sensitivity", v: pain },
      { k: "Inflammation", v: infl },
      { k: "Fibrosis / scar tissue", v: fibro },
      { k: "New blood vessel growth", v: angio }
    ].sort((a, b) => b.v - a.v)[0];

    return top?.v > 55
      ? `Right now the model is mostly driven by: ${top.k}`
      : "Right now the model is in a lower-activity / baseline state";
  }, [outcomes]);

  return (
    <div className="legendWrap">
      <button className="legendBtn" onClick={() => setOpen(!open)}>
        {open ? "Hide legend" : "What am I looking at?"}
      </button>

      {open && (
        <div className="legendCard">
          <div className="legendTitle">Quick Legend (plain English)</div>
          <div className="legendSub">{headline}</div>

          {preset?.name && (
            <div className="scenarioCard">
              <div className="scenarioTitle">{preset.name}</div>
              <div className="scenarioText">{preset.story}</div>
              {preset.watch?.length ? (
                <ul className="scenarioList">
                  {preset.watch.map((x, i) => (
                    <li key={i}>{x}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          )}

          <div className="legendGrid">
            <div className="legendItem">
              <div className="legendKey">Receptors glowing</div>
              <div className="legendVal">
                “Hormone / signal receivers.” Glow rises when estrogen + signals are higher.
              </div>
            </div>

            <div className="legendItem">
              <div className="legendKey">Blue particle cloud</div>
              <div className="legendVal">
                Cytokines (immune signals) — IL-6 / TNF-α / IL-1β. Current:{" "}
                <strong>
                  IL-6 {levelWord((mediators?.IL6 ?? 0) / 100)}, TNF {levelWord((mediators?.TNF ?? 0) / 100)}, IL-1β{" "}
                  {levelWord((mediators?.IL1B ?? 0) / 100)}
                </strong>
              </div>
            </div>

            <div className="legendItem">
              <div className="legendKey">Pink/red particle cloud</div>
              <div className="legendVal">
                Prostaglandins (inflammation/pain messengers) — PGE2 / PGF2α. Current:{" "}
                <strong>
                  PGE2 {levelWord((mediators?.PGE2 ?? 0) / 100)}, PGF2α {levelWord((mediators?.PGF2A ?? 0) / 100)}
                </strong>
              </div>
            </div>

            <div className="legendItem">
              <div className="legendKey">Vessel “sprout” growing</div>
              <div className="legendVal">
                Angiogenesis — new blood vessel growth. It grows outward when angiogenesis is higher.
              </div>
            </div>

            <div className="legendItem">
              <div className="legendKey">Yellow fibers thickening</div>
              <div className="legendVal">
                Fibrosis / scar tissue (collagen). Thickens when fibrosis score rises.
              </div>
            </div>

            <div className="legendItem">
              <div className="legendKey">“Protein Factory (ER)”</div>
              <div className="legendVal">
                Endoplasmic reticulum — a real organelle that helps build/handle proteins and responds to cell stress.
              </div>
            </div>
          </div>

          <div className="legendNote">
            This is an educational visualization — not a diagnosis or prediction. It’s built to help “see the idea.”
          </div>
        </div>
      )}
    </div>
  );
}
