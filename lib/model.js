export const PARTS = [
  {
    id: "nucleus",
    label: "Nucleus (Control Center)",
    pathways: ["Gene Regulation", "Progesterone Resistance", "ARID1A / Chromatin"],
    genes: ["ESR1", "ESR2", "ARID1A"]
  },
  {
    id: "er_network",
    label: "Protein Factory (ER)",
    pathways: ["Protein Handling", "Stress Signaling", "Hormone Response"],
    genes: ["ESR1", "ESR2", "IL6"]
  },
  {
    id: "er_receptors",
    label: "Receptors (ERα / ERβ)",
    pathways: ["Estrogen Signaling"],
    genes: ["ESR1", "ESR2", "CYP19A1"]
  },
  {
    id: "golgi",
    label: "Shipping Center (Golgi)",
    pathways: ["Secretion / Trafficking"],
    genes: ["IL6", "TNF", "IL1B"]
  },
  {
    id: "mitochondria",
    label: "Powerhouses (Mitochondria)",
    pathways: ["Metabolism", "Oxidative Stress"],
    genes: ["HIF1A", "IL6"]
  },
  {
    id: "glycolysis",
    label: "Sugar Burn Mode (Glycolysis)",
    pathways: ["Metabolism", "Hypoxia Response"],
    genes: ["HIF1A"]
  },
  {
    id: "cox2",
    label: "Inflammation Messengers (COX-2 → Prostaglandins)",
    pathways: ["Inflammation Loop", "Pain Signaling"],
    genes: ["PTGS2", "IL6", "TNF", "IL1B"]
  },
  {
    id: "angiogenesis",
    label: "New Blood Vessels (Angiogenesis)",
    pathways: ["Vascular Growth"],
    genes: ["VEGFA"]
  },
  {
    id: "fibrosis",
    label: "Scar Tissue (Fibrosis / Collagen)",
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
    name: "Baseline (Calm Day)",
    story:
      "This is the “quiet” setting. Low immune signaling and lower prostaglandins. Use it to learn what each part does.",
    watch: [
      "Receptors are calmer (less glow).",
      "Blue/pink particles are lighter.",
      "Vessel growth and fibrosis stay smaller."
    ],
    state: {
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
      nsaid: false
    }
  },
  {
    id: "cytokine_flare",
    name: "Immune Flare (Cytokines Up)",
    story:
      "An immune-driven inflammatory day: IL-6 / TNF-α / IL-1β are high. This often “turns up the volume” on pain sensitivity.",
    watch: [
      "Blue cytokine cloud thickens and streams toward receptors.",
      "Receptors pulse more.",
      "Inflammation + pain meters climb."
    ],
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
    name: "Hormone Spike + Prostaglandins",
    story:
      "A “spike” scenario: estrogen signaling is high and prostaglandins (PGE2/PGF2α) are pushed up — this tends to amplify cramping-style signaling.",
    watch: [
      "Receptors glow strongly.",
      "Pink/red prostaglandin cloud intensifies.",
      "Pain sensitivity rises faster."
    ],
    state: {
      estrogen: 0.9,
      hypoxia: 0.25,
      m2: 0.35,
      progesteroneResistance: true,
      arid1aLoss: false,
      il6Drive: 0.35,
      tnfDrive: 0.25,
      il1bDrive: 0.25,
      pge2Input: 0.7,
      pgf2aInput: 0.55,
      nsaid: false
    }
  },
  {
    id: "hypoxic_lesion",
    name: "Low Oxygen Zone (Hypoxia)",
    story:
      "This simulates a low-oxygen micro-environment. Cells often shift metabolism and push signals that encourage new blood vessels.",
    watch: [
      "Vessel sprout grows outward more.",
      "Glycolysis/sugar-burn indicator becomes more active.",
      "Angiogenesis meter rises."
    ],
    state: {
      estrogen: 0.35,
      hypoxia: 0.85,
      m2: 0.35,
      progesteroneResistance: true,
      arid1aLoss: false,
      il6Drive: 0.4,
      tnfDrive: 0.25,
      il1bDrive: 0.25,
      pge2Input: 0.35,
      pgf2aInput: 0.25,
      nsaid: false
    }
  },
  {
    id: "fibrotic_bias",
    name: "Scar Tissue Bias (Fibrosis Up)",
    story:
      "A scenario biased toward fibrosis/scar tissue (often linked to certain immune signaling patterns). Great for showing the collagen thickening effect.",
    watch: [
      "Yellow fibers thicken and look “denser.”",
      "Fibrosis meter rises.",
      "Inflammation may or may not be the highest driver here."
    ],
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
      pgf2aInput: 0.2,
      nsaid: false
    }
  }
];
