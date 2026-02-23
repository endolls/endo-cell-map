// A small “rules engine” (educational, semi-mechanistic).
// Inputs: estrogen (0..1), hypoxia (0..1), m2 (0..1), progesteroneResistance, arid1aLoss
// Outputs: genes (0..100), outcomes (0..100), activePathways (strings)

const clamp01 = (x) => Math.max(0, Math.min(1, x));
const clamp100 = (x) => Math.max(0, Math.min(100, x));

function scoreFrom(...vals) {
  // vals are 0..100
  const avg = vals.reduce((a, b) => a + b, 0) / Math.max(1, vals.length);
  return clamp100(avg);
}

export function computeModel(state) {
  const estrogen = clamp01(state.estrogen);
  const hypoxia = clamp01(state.hypoxia);
  const m2 = clamp01(state.m2);
  const pr = !!state.progesteroneResistance;
  const arid = !!state.arid1aLoss;

  // Baselines
  const genes = {
    ESR1: 35,
    ESR2: 35,
    CYP19A1: 25,
    HIF1A: 25,
    VEGFA: 25,
    PTGS2: 25,
    IL6: 25,
    TNF: 25,
    TGFB1: 25,
    COL1A1: 25,
    NGF: 20,
    TRPV1: 20,
    ARID1A: 60 // higher = “normal function”; loss will reduce
  };

  // Estrogen effects
  genes.ESR1 += 45 * estrogen;
  genes.ESR2 += 35 * estrogen;
  genes.CYP19A1 += 30 * estrogen;      // simplified: aromatase axis
  genes.PTGS2 += 20 * estrogen;        // simplified: inflammatory amplification
  genes.NGF += 18 * estrogen;

  // Hypoxia effects
  genes.HIF1A += 60 * hypoxia;
  genes.VEGFA += 45 * hypoxia;
  genes.IL6 += 20 * hypoxia;

  // Macrophage M2 shift (pro-repair / pro-fibrotic bias)
  genes.TGFB1 += 55 * m2;
  genes.COL1A1 += 45 * m2;
  genes.IL6 += 12 * m2;                // can still support inflammatory milieu
  genes.TNF -= 8 * m2;                 // simplistic “less TNF, more TGFβ”
  genes.NGF += 10 * m2;

  // Progesterone resistance: “lower progesterone response” + inflammatory drift
  let progesteroneResponse = 70;
  if (pr) {
    progesteroneResponse -= 35;
    genes.PTGS2 += 18;
    genes.IL6 += 12;
    genes.TNF += 10;
    genes.ESR1 += 8; // simplified estrogen dominance
  }

  // ARID1A loss: reduce ARID1A function + bump growth/inflammatory signals
  let growthPotential = 40;
  if (arid) {
    genes.ARID1A -= 45;
    growthPotential += 25;
    genes.IL6 += 10;
    genes.TNF += 8;
  }

  // Clamp gene values
  for (const k of Object.keys(genes)) genes[k] = clamp100(genes[k]);

  // Derived “PGE2 tone” from PTGS2 (COX-2) + estrogen + cytokines
  const pge2Tone = clamp100(
    0.55 * genes.PTGS2 + 0.25 * genes.IL6 + 0.20 * (genes.ESR1 + genes.ESR2) / 2
  );

  // Outcomes (0..100)
  const inflammation = scoreFrom(genes.IL6, genes.TNF, genes.PTGS2);
  const angiogenesis = scoreFrom(genes.VEGFA, genes.HIF1A);
  const fibrosis = scoreFrom(genes.TGFB1, genes.COL1A1);
  const pain = scoreFrom(pge2Tone, genes.NGF, genes.TRPV1, inflammation);

  // Growth potential: estrogen + hypoxia adaptations + arid + inflammation
  growthPotential = clamp100(
    growthPotential +
      20 * estrogen +
      12 * hypoxia +
      0.15 * inflammation
  );

  // Active pathways (for UI highlighting)
  const activePathways = new Set();

  if (estrogen > 0.55) activePathways.add("Estrogen Signaling");
  if (hypoxia > 0.55) activePathways.add("Hypoxia Response");
  if (pge2Tone > 55) activePathways.add("Inflammation Loop");
  if (inflammation > 55) activePathways.add("Cytokines");
  if (angiogenesis > 55) activePathways.add("Vascular Growth");
  if (fibrosis > 55) activePathways.add("Fibrosis");
  if (m2 > 0.55) activePathways.add("Immune Polarization");
  if (pr) activePathways.add("Progesterone Resistance");
  if (arid) activePathways.add("ARID1A / Chromatin");

  // Part highlighting triggers (what glows in 3D)
  const highlights = {
    nucleus: pr || arid || estrogen > 0.6,
    er_receptors: estrogen > 0.45,
    mitochondria: hypoxia > 0.5,
    glycolysis: hypoxia > 0.45,
    cox2: pge2Tone > 50,
    angiogenesis: angiogenesis > 50,
    fibrosis: fibrosis > 50,
    immune: inflammation > 45 || m2 > 0.45
  };

  return {
    genes,
    outcomes: {
      pain,
      inflammation,
      fibrosis,
      angiogenesis,
      growthPotential,
      progesteroneResponse: clamp100(progesteroneResponse)
    },
    pge2Tone,
    activePathways: Array.from(activePathways),
    highlights
  };
}
