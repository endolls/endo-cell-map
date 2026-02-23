// lib/rules.js
// Educational rules engine (semi-mechanistic).
// Adds explicit user inputs for IL-6, TNF-α, IL-1β and prostaglandins (PGE2/PGF2α)
// + NSAID toggle to reduce prostaglandin “effect”.

const clamp01 = (x) => Math.max(0, Math.min(1, Number.isFinite(x) ? x : 0));
const clamp100 = (x) => Math.max(0, Math.min(100, Number.isFinite(x) ? x : 0));

function scoreFrom(...vals) {
  const avg = vals.reduce((a, b) => a + b, 0) / Math.max(1, vals.length);
  return clamp100(avg);
}

export function computeModel(state) {
  const estrogen = clamp01(state.estrogen);
  const hypoxia = clamp01(state.hypoxia);
  const m2 = clamp01(state.m2);
  const pr = !!state.progesteroneResistance;
  const arid = !!state.arid1aLoss;

  // NEW: explicit inflammatory + prostaglandin inputs
  const il6Drive = clamp01(state.il6Drive);
  const tnfDrive = clamp01(state.tnfDrive);
  const il1bDrive = clamp01(state.il1bDrive);
  const pge2Input = clamp01(state.pge2Input);
  const pgf2aInput = clamp01(state.pgf2aInput);
  const nsaid = !!state.nsaid;

  // Baseline “gene marker” levels (0..100)
  const genes = {
    ESR1: 35,
    ESR2: 35,
    CYP19A1: 25,
    HIF1A: 25,
    VEGFA: 25,
    PTGS2: 25, // COX-2 marker
    IL6: 25,
    TNF: 25,
    IL1B: 25,
    TGFB1: 25,
    COL1A1: 25,
    NGF: 20,
    TRPV1: 20,
    ARID1A: 60 // higher = “more function”
  };

  // Estrogen effects (simplified)
  genes.ESR1 += 45 * estrogen;
  genes.ESR2 += 35 * estrogen;
  genes.CYP19A1 += 30 * estrogen; // aromatase axis (simplified)
  genes.PTGS2 += 18 * estrogen;   // estrogen can amplify COX-2 tone
  genes.NGF += 14 * estrogen;

  // Hypoxia effects
  genes.HIF1A += 60 * hypoxia;
  genes.VEGFA += 45 * hypoxia;
  genes.IL6 += 18 * hypoxia;

  // M2 shift (pro-repair/pro-fibrotic bias)
  genes.TGFB1 += 55 * m2;
  genes.COL1A1 += 45 * m2;
  genes.IL6 += 10 * m2;
  genes.TNF -= 10 * m2; // simplistic
  genes.NGF += 10 * m2;

  // User-driven cytokine inputs (these are your new controls)
  genes.IL6 += 65 * il6Drive;
  genes.TNF += 65 * tnfDrive;
  genes.IL1B += 65 * il1bDrive;

  // Cytokines feed COX-2 (simplified inflammatory loop)
  const cytokineTone = clamp01((il6Drive + tnfDrive + il1bDrive) / 3);
  genes.PTGS2 += 35 * cytokineTone;

  // Progesterone resistance (simplified)
  let progesteroneResponse = 70;
  if (pr) {
    progesteroneResponse -= 35;
    genes.PTGS2 += 14;
    genes.IL6 += 10;
    genes.TNF += 8;
    genes.IL1B += 8;
    genes.ESR1 += 8;
  }

  // ARID1A loss (simplified)
  let growthPotential = 40;
  if (arid) {
    genes.ARID1A -= 45;
    growthPotential += 25;
    genes.IL6 += 10;
    genes.TNF += 8;
    genes.IL1B += 8;
  }

  // Clamp genes
  for (const k of Object.keys(genes)) genes[k] = clamp100(genes[k]);

  // Prostaglandin production “tone” from COX-2 + cytokines + estrogen
  const endogenousPG = clamp100(
    0.60 * genes.PTGS2 + 0.25 * genes.IL1B + 0.15 * ((genes.ESR1 + genes.ESR2) / 2)
  );

  // User can directly “push” prostaglandins (ex: flare days, lesion microenvironment, etc.)
  // NSAID reduces effective prostaglandin impact (educational simplification).
  const nsaidFactor = nsaid ? 0.55 : 1.0;

  const PGE2 = clamp100(nsaidFactor * (0.65 * endogenousPG + 35 * pge2Input));
  const PGF2A = clamp100(nsaidFactor * (0.50 * endogenousPG + 35 * pgf2aInput));

  // Inflammation outcome
  const inflammation = scoreFrom(genes.IL6, genes.TNF, genes.IL1B, genes.PTGS2);

  // Angiogenesis outcome
  const angiogenesis = scoreFrom(genes.VEGFA, genes.HIF1A);

  // Fibrosis outcome
  const fibrosis = scoreFrom(genes.TGFB1, genes.COL1A1);

  // Pain outcome: prostaglandins + NGF/TRPV1 + inflammation
  const pain = scoreFrom(PGE2, PGF2A, genes.NGF, genes.TRPV1, inflammation);

  // Growth potential: estrogen + adaptation + inflammation
  growthPotential = clamp100(
    growthPotential +
      20 * estrogen +
      12 * hypoxia +
      0.18 * inflammation
  );

  // Active pathways (UI)
  const activePathways = new Set();
  if (estrogen > 0.55) activePathways.add("Estrogen Signaling");
  if (hypoxia > 0.55) activePathways.add("Hypoxia Response");
  if (cytokineTone > 0.45) activePathways.add("Cytokines");
  if (endogenousPG > 55 || PGE2 > 55 || PGF2A > 55) activePathways.add("COX-2 → Prostaglandins");
  if (angiogenesis > 55) activePathways.add("Vascular Growth");
  if (fibrosis > 55) activePathways.add("Fibrosis");
  if (m2 > 0.55) activePathways.add("Immune Polarization");
  if (pr) activePathways.add("Progesterone Resistance");
  if (arid) activePathways.add("ARID1A / Chromatin");
  if (nsaid) activePathways.add("NSAID (PG dampening)");

  // What glows in 3D
  const highlights = {
    nucleus: pr || arid || estrogen > 0.6,
    er_network: pr || estrogen > 0.55 || cytokineTone > 0.45,
    er_receptors: estrogen > 0.45,
    golgi: cytokineTone > 0.45,
    mitochondria: hypoxia > 0.45,
    glycolysis: hypoxia > 0.45,
    cox2: endogenousPG > 50 || PGE2 > 50 || PGF2A > 50,
    angiogenesis: angiogenesis > 50,
    fibrosis: fibrosis > 50,
    immune: inflammation > 40 || m2 > 0.45 || cytokineTone > 0.35
  };

  return {
    genes,
    mediators: {
      IL6: genes.IL6,
      TNF: genes.TNF,
      IL1B: genes.IL1B,
      PGE2,
      PGF2A
    },
    outcomes: {
      pain,
      inflammation,
      fibrosis,
      angiogenesis,
      growthPotential,
      progesteroneResponse: clamp100(progesteroneResponse)
    },
    activePathways: Array.from(activePathways),
    highlights
  };
}
