export const PARTS = [
  { id: "nucleus", label: "Nucleus (Control Center)", pathways: ["Gene control"], genes: ["ESR1", "ESR2", "ARID1A"] },
  { id: "er_network", label: "Protein Factory (ER)", pathways: ["Protein handling", "Stress response"], genes: ["IL6"] },
  { id: "golgi", label: "Shipping Center (Golgi)", pathways: ["Secretion / packaging"], genes: ["IL6", "TNF", "IL1B"] },

  { id: "er_receptors", label: "Hormone Receptors (ERα/ERβ)", pathways: ["Estrogen signaling"], genes: ["ESR1", "ESR2"] },
  { id: "cytokine_receptors", label: "Immune Signal Receptors", pathways: ["IL-6 / TNF / IL-1 signaling"], genes: ["IL6", "TNF", "IL1B"] },

  { id: "mitochondria", label: "Powerhouses (Mitochondria)", pathways: ["Energy / stress"], genes: ["HIF1A"] },
  { id: "glycolysis", label: "Sugar Burn Mode (Glycolysis)", pathways: ["Warburg-like shift"], genes: ["HIF1A"] },

  { id: "cox2", label: "Pain Messengers (COX-2 → Prostaglandins)", pathways: ["PGE2 / PGF2α"], genes: ["PTGS2"] },
  { id: "pain_hotspots", label: "Pain Hotspots (Nerve Sensitization)", pathways: ["NGF / TRPV1"], genes: ["NGF", "TRPV1"] },

  { id: "angiogenesis", label: "New Blood Vessels (Angiogenesis)", pathways: ["VEGF"], genes: ["VEGFA"] },
  { id: "arteries", label: "Arteries Nearby (Increased Vascularity)", pathways: ["Vessel density"], genes: ["VEGFA"] },

  { id: "fibrosis", label: "Scar Tissue (Fibrosis / Collagen)", pathways: ["TGFβ / collagen"], genes: ["TGFB1", "COL1A1"] },
  { id: "adhesions", label: "Adhesions (Fibrin Scaffolding)", pathways: ["Adhesion formation"], genes: ["TGFB1", "COL1A1"] },

  { id: "lysosomes", label: "Recycling Bins (Lysosomes)", pathways: ["Cleanup / recycling"], genes: [] },
  { id: "ribosomes", label: "Ribosomes (Protein Builders)", pathways: ["Protein synthesis"], genes: [] },

  { id: "immune", label: "Immune Cell (Macrophage)", pathways: ["Cytokines"], genes: ["IL6", "TNF", "IL1B"] }
];

export const PRESETS = [
  {
    id: "baseline",
    name: "Baseline (Calm Day)",
    story: "Low immune signals + lower prostaglandins. Use this to learn what each part does.",
    watch: [
      "Less red glow overall.",
      "Light blue/pink particles.",
      "Vessel/adhesion effects stay small."
    ],
    state: {
      estrogen: 0.25, hypoxia: 0.15, m2: 0.25,
      progesteroneResistance: false, arid1aLoss: false,
      il6Drive: 0.15, tnfDrive: 0.10, il1bDrive: 0.10,
      pge2Input: 0.10, pgf2aInput: 0.10,
      nsaid: false
    }
  },
  {
    id: "cytokine_flare",
    name: "Immune Flare (Cytokines Up)",
    story: "IL-6 / TNF-α / IL-1β are pushed up. Expect stronger pain/inflammation visuals.",
    watch: [
      "Blue cytokine cloud thickens and targets immune receptors.",
      "Pain halo pulses stronger.",
      "More red glow on immune + receptors + COX area."
    ],
    state: {
      estrogen: 0.35, hypoxia: 0.25, m2: 0.35,
      progesteroneResistance: true, arid1aLoss: false,
      il6Drive: 0.85, tnfDrive: 0.75, il1bDrive: 0.75,
      pge2Input: 0.35, pgf2aInput: 0.25,
      nsaid: false
    }
  },
  {
    id: "estrogen_spike",
    name: "Hormone Spike + Prostaglandins",
    story: "Estrogen signaling is high and prostaglandins (PGE2/PGF2α) are pushed up — strong cramp/pain messaging visuals.",
    watch: [
      "Hormone receptors glow bright red and pulse.",
      "Pink/red prostaglandin cloud intensifies.",
      "Pain meter climbs fast."
    ],
    state: {
      estrogen: 0.90, hypoxia: 0.25, m2: 0.35,
      progesteroneResistance: true, arid1aLoss: false,
      il6Drive: 0.35, tnfDrive: 0.25, il1bDrive: 0.25,
      pge2Input: 0.70, pgf2aInput: 0.55,
      nsaid: false
    }
  },
  {
    id: "hypoxic_lesion",
    name: "Low Oxygen Zone (Hypoxia)",
    story: "Low oxygen pushes hypoxia signaling and increased blood-vessel growth to compensate.",
    watch: [
      "More arteries appear near the cell.",
      "Vessel sprout grows outward more.",
      "Glycolysis ring gets more active."
    ],
    state: {
      estrogen: 0.35, hypoxia: 0.85, m2: 0.35,
      progesteroneResistance: true, arid1aLoss: false,
      il6Drive: 0.40, tnfDrive: 0.25, il1bDrive: 0.25,
      pge2Input: 0.35, pgf2aInput: 0.25,
      nsaid: false
    }
  },
  {
    id: "fibrotic_bias",
    name: "Scar Tissue + Adhesions (Fibrosis Up)",
    story: "Fibrosis rises and adhesions/scaffolding begin to form — watch the outside structure build up.",
    watch: [
      "Yellow fibers thicken.",
      "Adhesion scaffolding appears and grows (bridges).",
      "Cell looks more “tethered” outside."
    ],
    state: {
      estrogen: 0.35, hypoxia: 0.35, m2: 0.85,
      progesteroneResistance: true, arid1aLoss: false,
      il6Drive: 0.25, tnfDrive: 0.15, il1bDrive: 0.15,
      pge2Input: 0.25, pgf2aInput: 0.20,
      nsaid: false
    }
  }
];
