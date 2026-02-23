// Simple mapping: parts → pathways → “gene markers” to highlight in the UI.
// You can extend this easily without touching the renderer.

export const PARTS = [
  {
    id: "nucleus",
    label: "Nucleus",
    pathways: ["Gene Regulation", "Progesterone Resistance", "ARID1A / Chromatin"],
    genes: ["ESR1", "ESR2", "ARID1A"]
  },
  {
    id: "er_receptors",
    label: "ERα / ERβ (Membrane)",
    pathways: ["Estrogen Signaling"],
    genes: ["ESR1", "ESR2", "CYP19A1"]
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
    label: "COX-2 / PGE2",
    pathways: ["Inflammation Loop", "Pain Signaling"],
    genes: ["PTGS2", "TNF", "IL6"]
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
    pathways: ["Immune Polarization", "Cytokines"],
    genes: ["IL6", "TNF", "TGFB1"]
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
      arid1aLoss: false
    }
  },
  {
    id: "flare_estrogen",
    name: "Estrogen Spike (Flare)",
    state: {
      estrogen: 0.9,
      hypoxia: 0.2,
      m2: 0.35,
      progesteroneResistance: true,
      arid1aLoss: false
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
      arid1aLoss: false
    }
  },
  {
    id: "fibrotic_bias",
    name: "Fibrotic Bias (M2/TGFβ)",
    state: {
      estrogen: 0.35,
      hypoxia: 0.35,
      m2: 0.85,
      progesteroneResistance: true,
      arid1aLoss: false
    }
  },
  {
    id: "arid1a_model",
    name: "ARID1A Loss (Model)",
    state: {
      estrogen: 0.5,
      hypoxia: 0.35,
      m2: 0.5,
      progesteroneResistance: true,
      arid1aLoss: true
    }
  }
];
