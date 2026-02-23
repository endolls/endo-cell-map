// lib/model.js
export const PARTS = [
  {
    id: "nucleus",
    label: "Nucleus",
    pathways: ["Gene Regulation", "Progesterone Resistance", "ARID1A / Chromatin"],
    genes: ["ESR1", "ESR2", "ARID1A"]
  },
  {
    id: "er_network",
    label: "Endoplasmic Reticulum (ER)",
    pathways: ["Protein Signaling", "Hormone Response", "Stress Signaling"],
    genes: ["ESR1", "ESR2", "IL6"]
  },
  {
    id: "er_receptors",
    label: "ERα / ERβ (Membrane)",
    pathways: ["Estrogen Signaling"],
    genes: ["ESR1", "ESR2", "CYP19A1"]
  },
  {
    id: "golgi",
    label: "Golgi Apparatus",
    pathways: ["Secretion / Trafficking"],
    genes: ["IL6", "TNF", "IL1B"]
  },
  {
    id: "mitochondria",
    label: "Mitochondria",
    pathways: ["Oxidative Stress", "Metabolism"],
    genes: ["HIF1A", "IL6"]
  },
  {
    id: "glycolysis",
    label: "Glycolysis (Warburg-like shift)",
    pathways: ["Metabolism", "Hypoxia Response"],
    genes: ["HIF1A"]
  },
  {
    id: "cox2",
    label: "COX-2 → Prostaglandins",
    pathways: ["Inflammation Loop", "Pain Signaling"],
    genes: ["PTGS2", "IL6", "TNF", "IL1B"]
  },
  {
    id: "angiogenesis",
    label: "Angiogenesis",
    pathways: ["Vascular Growth"],
    genes: ["VEGFA"]
  },
  {
    id: "fibrosis",
    label: "Fibrosis / ECM Remodeling",
    pathways: ["Fibrosis", "TGFβ Axis"],
    genes: ["TGFB1", "COL1A1"]
  },
  {
    id: "immune",
    label: "Immune Cell (Macrophage)",
    pathways: ["Cytokines", "Immune Polarization"],
    genes: ["IL6", "TNF", "IL1B", "TGFB1"]
  }
];

export const PRESETS = [
  {
    id: "baseline",
    name: "Baseline",
    state: {
      estrogen: 0.25,
      hypoxia: 0.15,
      m2: 0.25,
      progesteroneResistance: false,
      arid1aLoss: false,
      il6Drive: 0.15,
      tnfDrive: 0.10,
      il1bDrive: 0.10,
      pge2Input: 0.10,
      pgf2aInput: 0.10,
      nsaid: false
    }
  },
  {
    id: "cytokine_flare",
    name: "Cytokine Flare (IL-6/TNF/IL-1β)",
    state: {
      estrogen: 0.35,
      hypoxia: 0.25,
      m2: 0.35,
      progesteroneResistance: true,
      arid1aLoss: false,
      il6Drive: 0.85,
      tnfDrive: 0.75,
      il1bDrive: 0.75,
      pge2Input: 0.35,
      pgf2aInput: 0.25,
      nsaid: false
    }
  },
  {
    id: "estrogen_spike",
    name: "Estrogen Spike + Prostaglandins",
    state: {
      estrogen: 0.90,
      hypoxia: 0.25,
      m2: 0.35,
      progesteroneResistance: true,
      arid1aLoss: false,
      il6Drive: 0.35,
      tnfDrive: 0.25,
      il1bDrive: 0.25,
      pge2Input: 0.70,
      pgf2aInput: 0.55,
      nsaid: false
    }
  },
  {
    id: "hypoxic_lesion",
    name: "Hypoxic Microenvironment",
    state: {
      estrogen: 0.35,
      hypoxia: 0.85,
      m2: 0.35,
      progesteroneResistance: true,
      arid1aLoss: false,
      il6Drive: 0.40,
      tnfDrive: 0.25,
      il1bDrive: 0.25,
      pge2Input: 0.35,
      pgf2aInput: 0.25,
      nsaid: false
    }
  },
  {
    id: "fibrotic_bias",
    name: "M2/TGFβ Fibrotic Bias",
    state: {
      estrogen: 0.35,
      hypoxia: 0.35,
      m2: 0.85,
      progesteroneResistance: true,
      arid1aLoss: false,
      il6Drive: 0.25,
      tnfDrive: 0.15,
      il1bDrive: 0.15,
      pge2Input: 0.25,
      pgf2aInput: 0.20,
      nsaid: false
    }
  }
];
