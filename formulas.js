window.FlyoverFormulas = {
    wind: {
        name: "Wind load",
        equation: "P = 0.6 × V²",
        note: "Approximate pressure based on wind speed.",
        output: "Wind pressure",
        unit: "N/m²",
        precision: 2,
        inputs: [
            { id: "windSpeed", label: "Wind speed (V)", unit: "m/s" }
        ],
        calculate: ({ windSpeed }) => 0.6 * windSpeed ** 2
    },
    cable: {
        name: "Cable tension",
        equation: "H = (w × L²) / (8 × d)",
        note: "Uses a parabolic cable approximation under uniform load.",
        output: "Horizontal cable force",
        unit: "kN",
        precision: 2,
        positive: ["sag"],
        inputs: [
            { id: "load", label: "Uniform load (w)", unit: "kN/m" },
            { id: "span", label: "Span length (L)", unit: "m" },
            { id: "sag", label: "Sag depth (d)", unit: "m" }
        ],
        calculate: ({ load, span, sag }) => (load * span ** 2) / (8 * sag)
    },
    bending: {
        name: "Bending moment",
        equation: "M = (w × L²) / 8",
        note: "Simply supported beam with a uniformly distributed load.",
        output: "Maximum bending moment",
        unit: "kN·m",
        precision: 2,
        inputs: [
            { id: "load", label: "Uniform load (w)", unit: "kN/m" },
            { id: "span", label: "Span length (L)", unit: "m" }
        ],
        calculate: ({ load, span }) => (load * span ** 2) / 8
    },
    shear: {
        name: "Shear force",
        equation: "V = (w × L) / 2",
        note: "Support reaction for a simply supported beam under uniform load.",
        output: "Maximum shear force",
        unit: "kN",
        precision: 2,
        inputs: [
            { id: "load", label: "Uniform load (w)", unit: "kN/m" },
            { id: "span", label: "Span length (L)", unit: "m" }
        ],
        calculate: ({ load, span }) => (load * span) / 2
    },
    stress: {
        name: "Normal stress",
        equation: "σ = P / A",
        note: "Average normal stress over a uniform cross-sectional area.",
        output: "Normal stress",
        unit: "kN/m²",
        precision: 2,
        positive: ["area"],
        inputs: [
            { id: "force", label: "Axial load (P)", unit: "kN" },
            { id: "area", label: "Cross-sectional area (A)", unit: "m²" }
        ],
        calculate: ({ force, area }) => force / area
    },
    deadload: {
        name: "Dead load",
        equation: "DL = γ × V",
        note: "Self-weight calculated from unit weight and volume.",
        output: "Dead load",
        unit: "kN",
        precision: 2,
        inputs: [
            { id: "unitWeight", label: "Unit weight (γ)", unit: "kN/m³" },
            { id: "volume", label: "Volume (V)", unit: "m³" }
        ],
        calculate: ({ unitWeight, volume }) => unitWeight * volume
    },
    deflection: {
        name: "Beam deflection",
        equation: "δ = (5 × w × L⁴) / (384 × E × I)",
        note: "Simply supported beam with a uniformly distributed load.",
        output: "Maximum deflection",
        unit: "m",
        precision: 5,
        positive: ["elasticity", "inertia"],
        inputs: [
            { id: "load", label: "Uniform load (w)", unit: "kN/m" },
            { id: "span", label: "Span length (L)", unit: "m" },
            { id: "elasticity", label: "Young's modulus (E)", unit: "kN/m²" },
            { id: "inertia", label: "Second moment of area (I)", unit: "m⁴" }
        ],
        calculate: ({ load, span, elasticity, inertia }) =>
            (5 * load * span ** 4) / (384 * elasticity * inertia)
    }
};
