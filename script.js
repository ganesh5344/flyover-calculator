const formulas = {
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

const historyStorageKey = "spanlab-calculation-history";
const themeStorageKey = "spanlab-theme";
const maxHistoryItems = 8;

const formulaSelect = document.getElementById("formulaSelect");
const inputArea = document.getElementById("inputArea");
const formulaText = document.getElementById("formulaText");
const calculationForm = document.getElementById("calculationForm");
const formMessage = document.getElementById("formMessage");
const resultCard = document.getElementById("result");
const resultName = document.getElementById("resultName");
const resultValue = document.getElementById("resultValue");
const resultUnit = document.getElementById("resultUnit");
const resultDetail = document.getElementById("resultDetail");
const historyList = document.getElementById("historyList");
const historyEmpty = document.getElementById("historyEmpty");
const historyCount = document.getElementById("historyCount");
const historyMessage = document.getElementById("historyMessage");
const exportCalculationsButton = document.getElementById("exportCalculationsButton");
const clearHistoryButton = document.getElementById("clearHistoryButton");
const themeToggle = document.getElementById("themeToggle");
const themeLabel = document.getElementById("themeLabel");

let historyItems = loadHistory();
let latestResult = "";

function showFormula() {
    const formula = formulas[formulaSelect.value];
    inputArea.replaceChildren();
    resultCard.hidden = true;
    clearMessage();

    if (!formula) {
        formulaText.innerHTML = `
            <span class="formula-icon" aria-hidden="true">ƒx</span>
            <div>
                <p class="formula-title">Your formula will appear here</p>
                <p class="formula-equation">Choose a calculation to get started</p>
            </div>`;
        return;
    }

    formulaText.innerHTML = `
        <span class="formula-icon" aria-hidden="true">ƒx</span>
        <div>
            <p class="formula-title">${formula.note}</p>
            <p class="formula-equation">${formula.equation}</p>
        </div>`;

    formula.inputs.forEach((field) => {
        const wrapper = document.createElement("div");
        wrapper.className = "field-group";

        const label = document.createElement("label");
        label.htmlFor = field.id;
        label.textContent = field.label;

        const inputWrap = document.createElement("div");
        inputWrap.className = "input-wrap";

        const input = document.createElement("input");
        input.id = field.id;
        input.name = field.id;
        input.type = "number";
        input.step = "any";
        input.min = "0";
        input.required = true;
        input.inputMode = "decimal";
        input.placeholder = "0.00";
        input.setAttribute("aria-describedby", "formMessage");

        const unit = document.createElement("span");
        unit.className = "input-unit";
        unit.textContent = field.unit;

        inputWrap.append(input, unit);
        wrapper.append(label, inputWrap);
        inputArea.append(wrapper);
    });
}

function calculate(event) {
    event.preventDefault();
    const formulaId = formulaSelect.value;
    const formula = formulas[formulaId];

    if (!formula) {
        showMessage("Choose a formula before calculating.");
        return;
    }

    const values = {};
    for (const field of formula.inputs) {
        const input = document.getElementById(field.id);
        const value = input.value.trim() === "" ? NaN : Number(input.value);

        if (!Number.isFinite(value) || value < 0) {
            showMessage(`Enter a valid, non-negative value for ${field.label.toLowerCase()}.`);
            input.focus();
            return;
        }
        if (formula.positive && formula.positive.includes(field.id) && value === 0) {
            showMessage(`${field.label} must be greater than zero.`);
            input.focus();
            return;
        }
        values[field.id] = value;
    }

    const value = formula.calculate(values);
    if (!Number.isFinite(value)) {
        showMessage("These values are outside the range this calculator can process.");
        return;
    }

    const formattedValue = formatNumber(value, formula.precision);
    latestResult = `${formula.output}: ${formattedValue} ${formula.unit}`;
    resultName.textContent = formula.output;
    resultValue.textContent = formattedValue;
    resultUnit.textContent = formula.unit;
    resultDetail.textContent = `${formula.equation} · ${formula.name}`;
    resultCard.hidden = false;
    clearMessage();

    historyItems.unshift({
        formulaId,
        output: formula.output,
        value: formattedValue,
        unit: formula.unit,
        timestamp: new Date().toISOString(),
        inputs: formula.inputs.map((field) => ({
            label: field.label,
            value: values[field.id],
            unit: field.unit
        }))
    });
    saveHistory();
    renderHistory();
}

function formatNumber(value, precision) {
    return value.toFixed(precision).replace(/\.?0+$/, "");
}

function showMessage(message) {
    formMessage.textContent = message;
    formMessage.hidden = false;
}

function clearMessage() {
    formMessage.textContent = "";
    formMessage.hidden = true;
}

function loadHistory() {
    try {
        const saved = localStorage.getItem(historyStorageKey);
        const parsed = saved ? JSON.parse(saved) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.warn("Calculation history could not be loaded.", error);
        return [];
    }
}

function saveHistory() {
    try {
        localStorage.setItem(historyStorageKey, JSON.stringify(historyItems));
    } catch (error) {
        console.warn("Calculation history could not be saved.", error);
        showMessage("Calculation completed, but this browser could not save your history.");
    }
}

function renderHistory() {
    historyList.replaceChildren();
    historyItems.slice(0, maxHistoryItems).forEach((item) => {
        const formula = formulas[item.formulaId];
        if (!formula) {
            return;
        }

        const entry = document.createElement("article");
        entry.className = "history-item";

        const meta = document.createElement("div");
        meta.className = "history-meta";

        const title = document.createElement("span");
        title.textContent = formula.name;

        const date = document.createElement("time");
        date.dateTime = item.timestamp;
        const parsedDate = new Date(item.timestamp);
        date.textContent = Number.isNaN(parsedDate.getTime())
            ? ""
            : parsedDate.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });

        const value = document.createElement("p");
        value.className = "history-value";
        value.textContent = `${item.value} ${item.unit}`;

        meta.append(title, date);
        entry.append(meta, value);
        historyList.append(entry);
    });

    historyCount.textContent = String(historyItems.length);
    historyEmpty.hidden = historyItems.length > 0;
    exportCalculationsButton.disabled = historyItems.length === 0;
    clearHistoryButton.hidden = historyItems.length === 0;
    historyMessage.textContent = "";
}

function csvCell(value) {
    const text = value === null || value === undefined ? "" : String(value);
    return `"${text.replace(/"/g, '""')}"`;
}

function exportCalculations() {
    const records = historyItems.filter((item) => item && formulas[item.formulaId]);
    if (records.length === 0) {
        historyMessage.textContent = "Complete a calculation before exporting.";
        return;
    }

    const rows = [
        ["Calculated at", "Calculation", "Formula", "Inputs", "Result", "Unit"],
        ...records.map((item) => {
            const formula = formulas[item.formulaId];
            const inputs = Array.isArray(item.inputs)
                ? item.inputs.map((input) => `${input.label}: ${input.value} ${input.unit}`).join("; ")
                : "";
            return [
                item.timestamp,
                item.output || formula.output,
                formula.equation,
                inputs,
                item.value,
                item.unit
            ];
        })
    ];
    const csv = `\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}`;
    const filename = `flyover-calculations-${new Date().toISOString().slice(0, 10)}.csv`;

    try {
        const file = new Blob([csv], { type: "text/csv;charset=utf-8" });
        const downloadUrl = URL.createObjectURL(file);
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = filename;
        document.body.append(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
        historyMessage.textContent = `Exported ${records.length} calculation${records.length === 1 ? "" : "s"} to CSV.`;
    } catch (error) {
        console.error("Calculation export failed.", error);
        historyMessage.textContent = "Could not export calculations. Try a different browser.";
    }
}

function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    const dark = theme === "dark";
    themeLabel.textContent = dark ? "Light mode" : "Dark mode";
    themeToggle.setAttribute("aria-label", dark ? "Switch to light theme" : "Switch to dark theme");
}

document.getElementById("calculationForm").addEventListener("submit", calculate);
formulaSelect.addEventListener("change", showFormula);
exportCalculationsButton.addEventListener("click", exportCalculations);

document.getElementById("resetButton").addEventListener("click", () => {
    calculationForm.reset();
    resultCard.hidden = true;
    clearMessage();
    const firstInput = inputArea.querySelector("input");
    if (firstInput) {
        firstInput.focus();
    }
});

document.getElementById("copyButton").addEventListener("click", async () => {
    if (!navigator.clipboard) {
        showMessage("Clipboard access is unavailable here. You can select and copy the result.");
        return;
    }

    try {
        await navigator.clipboard.writeText(latestResult);
        document.getElementById("copyButton").textContent = "Copied!";
        window.setTimeout(() => {
            document.getElementById("copyButton").textContent = "Copy result";
        }, 1600);
    } catch (error) {
        console.warn("The result could not be copied.", error);
        showMessage("The result could not be copied. Please select and copy it instead.");
    }
});

clearHistoryButton.addEventListener("click", () => {
    historyItems = [];
    try {
        localStorage.removeItem(historyStorageKey);
    } catch (error) {
        console.warn("Saved calculation history could not be cleared.", error);
        showMessage("History could not be cleared from this browser.");
    }
    renderHistory();
});

themeToggle.addEventListener("click", () => {
    const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
    try {
        localStorage.setItem(themeStorageKey, nextTheme);
    } catch (error) {
        console.warn("The selected theme could not be saved.", error);
    }
});

try {
    applyTheme(localStorage.getItem(themeStorageKey) === "dark" ? "dark" : "light");
} catch (error) {
    console.warn("The saved theme could not be loaded.", error);
    applyTheme("light");
}
renderHistory();
